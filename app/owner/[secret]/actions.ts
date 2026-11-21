'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { safeEqual } from '@/lib/tokens'
import { sendConfirmation, sendCancellation, sendGuestBookingUpdated, sendGuestConfirmationMistake, sendGuestPhoneBooking } from '@/lib/email'
import { generateToken } from '@/lib/tokens'
import { canUndoEtransfer, parsePhoneBooking } from '@/lib/owner-rules'
import { noticeFor } from '@/lib/owner-notices'
import { approveBooking, declineBooking } from '@/lib/booking-approval'
import { redirect } from 'next/navigation'
import { quote, validateStay } from '@/lib/pricing'
import { expireCheckoutSession } from '@/lib/stripe'
import { holdEndsAt } from '@/lib/daily-jobs'
import { parseLocalDate } from '@/lib/dates'

// ─── ownerEditBooking ─────────────────────────────────────────────────────────
// Change the dates and/or cabins of an unpaid booking (pending or awaiting deposit).
// Same stay rules as online booking (season, weekend minimum), re-priced, and
// availability re-checked atomically in Postgres (update_booking, migration 0008).
// For an approved booking the old Stripe link is closed and the guest is emailed the
// new details with a fresh pay link. Result shown via ?notice= on the dashboard.
export async function ownerEditBooking(formData: FormData): Promise<{ notice: string }> {
  const secret = formData.get('secret') as string | null
  const bookingId = formData.get('bookingId') as string | null
  const checkIn = String(formData.get('checkIn') ?? '')
  const checkOut = String(formData.get('checkOut') ?? '')
  const cabinIds = [...new Set(formData.getAll('cabinIds').map(String))]
  if (!secretOk(secret) || !bookingId) return { notice: 'error' }

  let notice = 'error'
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) {
      notice = 'invalid_dates'
    } else {
      const inDate = parseLocalDate(checkIn)
      const outDate = parseLocalDate(checkOut)
      const stayError = validateStay(inDate, outDate)
      if (stayError) {
        notice = stayError.toLowerCase()
      } else {
        const q = quote(inDate, outDate, cabinIds.length)
        const db = supabaseAdmin()
        const { data, error } = await db.rpc('update_booking', {
          p_booking_id: bookingId,
          p_check_in: checkIn,
          p_check_out: checkOut,
          p_nights: q.nights,
          p_cabin_ids: cabinIds,
          p_nightly_subtotal: q.nightlySubtotal,
          p_gst: q.gst,
          p_total: q.total,
          p_deposit_amount: q.deposit,
          p_card_charge: q.cardCharge,
        })
        if (error) {
          console.error('update_booking failed', error)
        } else if (!data?.ok) {
          notice = String(data?.error ?? 'error').toLowerCase()
        } else if (data.previous_status === 'APPROVED') {
          if (data.old_session_id) await expireCheckoutSession(data.old_session_id)
          const { data: b } = await db.from('bookings').select('approved_at').eq('id', bookingId).single()
          try {
            await sendGuestBookingUpdated(bookingId, holdEndsAt(b!.approved_at))
          } catch (e) {
            console.error('sendGuestBookingUpdated failed', e)
          }
          notice = 'booking-updated-emailed'
        } else {
          notice = 'booking-updated'
        }
      }
    }
  } catch (e) {
    console.error('ownerEditBooking failed', e)
  }

  // Returned to the form (not a redirect) so a failed save keeps what Rob typed.
  if (!noticeFor(notice).ok) return { notice }
  revalidatePath('/owner/' + secret)
  return { notice }
}

// ─── undoEtransfer ────────────────────────────────────────────────────────────
// "Undo: not paid yet" for an e-transfer marked received by mistake. Puts the booking
// back to awaiting deposit with a fresh 48h hold. The "confirmed" email can't be unsent,
// so the owner can choose to email the guest a correction.
export async function undoEtransfer(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const bookingId = formData.get('bookingId') as string | null
  const notifyGuest = formData.get('notifyGuest') === 'on'
  if (!secretOk(secret) || !bookingId) return

  let notice = 'error'
  try {
    const db = supabaseAdmin()
    const { data: b } = await db.from('bookings')
      .select('status,payment_method,damage_deposit_status').eq('id', bookingId).single()
    if (!b || !canUndoEtransfer(b)) {
      notice = 'cannot_undo'
    } else {
      const approvedAt = new Date()
      const { data: rows } = await db.from('bookings').update({
        status: 'APPROVED',
        payment_method: null,
        amount_charged: null,
        approved_at: approvedAt.toISOString(),
        payment_reminder_sent_at: null,
        stripe_session_id: null,
      }).eq('id', bookingId).eq('status', 'CONFIRMED').eq('payment_method', 'etransfer')
        .is('damage_deposit_status', null).select('id')
      if (!rows?.length) {
        notice = 'cannot_undo'
      } else if (notifyGuest) {
        try {
          await sendGuestConfirmationMistake(bookingId, holdEndsAt(approvedAt.toISOString()))
        } catch (e) {
          console.error('sendGuestConfirmationMistake failed', e)
        }
        notice = 'undo-done-emailed'
      } else {
        notice = 'undo-done'
      }
    }
  } catch (e) {
    console.error('undoEtransfer failed', e)
  }

  revalidatePath('/owner/' + secret)
  redirect(`/owner/${secret}?notice=${encodeURIComponent(notice)}`) // must be outside try/catch
}

// ─── ownerCreatePhoneBooking ──────────────────────────────────────────────────
// Rob takes a booking by phone. It's created already approved (48h hold starts now),
// with no waiver: the guest is emailed a link to sign it, then pay (migration 0009).
export async function ownerCreatePhoneBooking(formData: FormData): Promise<{ notice: string }> {
  const secret = formData.get('secret') as string | null
  if (!secretOk(secret)) return { notice: 'error' }

  let notice = 'error'
  try {
    const parsed = parsePhoneBooking(formData)
    if (!parsed.ok) {
      notice = parsed.error
    } else {
      const d = parsed.data
      const inDate = parseLocalDate(d.checkIn)
      const outDate = parseLocalDate(d.checkOut)
      const stayError = validateStay(inDate, outDate)
      if (stayError) {
        notice = stayError.toLowerCase()
      } else {
        const q = quote(inDate, outDate, d.cabinIds.length)
        const db = supabaseAdmin()
        const { data, error } = await db.rpc('create_phone_booking', {
          p_guest_name: d.guestName,
          p_email: d.email,
          p_phone: d.phone,
          p_party_size: d.partySize,
          p_has_pet: d.hasPet,
          p_check_in: d.checkIn,
          p_check_out: d.checkOut,
          p_nights: q.nights,
          p_nightly_subtotal: q.nightlySubtotal,
          p_gst: q.gst,
          p_total: q.total,
          p_deposit_amount: q.deposit,
          p_card_charge: q.cardCharge,
          p_approval_token: generateToken(),
          p_addons: d.addons,
          p_cabin_ids: d.cabinIds,
        })
        if (error) {
          console.error('create_phone_booking failed', error)
        } else if (!data?.ok) {
          notice = String(data?.error ?? 'error').toLowerCase()
        } else {
          try {
            await sendGuestPhoneBooking(data.booking_id)
          } catch (e) {
            console.error('sendGuestPhoneBooking failed', e)
          }
          notice = 'phone-booking-created'
        }
      }
    }
  } catch (e) {
    console.error('ownerCreatePhoneBooking failed', e)
  }

  // Returned to the form (not a redirect) so a failed save keeps what Rob typed.
  if (!noticeFor(notice).ok) return { notice }
  revalidatePath('/owner/' + secret)
  return { notice }
}

// ─── resendWaiverEmail ────────────────────────────────────────────────────────
export async function resendWaiverEmail(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const bookingId = formData.get('bookingId') as string | null
  if (!secretOk(secret) || !bookingId) return

  let notice = 'error'
  try {
    const { data: b } = await supabaseAdmin().from('bookings').select('status, waivers(id)').eq('id', bookingId).single()
    if (b?.status === 'APPROVED' && (b.waivers?.length ?? 0) === 0) {
      await sendGuestPhoneBooking(bookingId)
      notice = 'waiver-resent'
    } else {
      notice = 'waiver_not_needed'
    }
  } catch (e) {
    console.error('resendWaiverEmail failed', e)
  }

  revalidatePath('/owner/' + secret)
  redirect(`/owner/${secret}?notice=${encodeURIComponent(notice)}`)
}

function secretOk(secret: string | null): boolean {
  const env = process.env.OWNER_DASHBOARD_SECRET
  if (!env || !secret) return false
  return safeEqual(secret, env)
}

// ─── ownerApprove ─────────────────────────────────────────────────────────────
export async function ownerApprove(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const bookingId = formData.get('bookingId') as string | null
  if (!secretOk(secret) || !bookingId) return

  try {
    await approveBooking(bookingId)
  } catch {
    // swallow — UI will be stale until next refresh
  }

  revalidatePath('/owner/' + secret)
}

// ─── ownerDecline ─────────────────────────────────────────────────────────────
export async function ownerDecline(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const bookingId = formData.get('bookingId') as string | null
  if (!secretOk(secret) || !bookingId) return

  try {
    await declineBooking(bookingId)
  } catch {
    // swallow
  }

  revalidatePath('/owner/' + secret)
}

// ─── confirmEtransfer ─────────────────────────────────────────────────────────
export async function confirmEtransfer(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const bookingId = formData.get('bookingId') as string | null
  if (!secretOk(secret) || !bookingId) return

  try {
    const db = supabaseAdmin()
    await db
      .from('bookings')
      .update({ status: 'CONFIRMED', payment_method: 'etransfer' })
      .eq('id', bookingId)
      .eq('status', 'APPROVED')

    try {
      await sendConfirmation(bookingId)
    } catch {
      // mail failure should not break the action
    }
  } catch {
    // DB failure — swallow, UI will be stale until next refresh
  }

  revalidatePath('/owner/' + secret)
}

// ─── markCompleted ────────────────────────────────────────────────────────────
export async function markCompleted(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const bookingId = formData.get('bookingId') as string | null
  if (!secretOk(secret) || !bookingId) return

  try {
    const db = supabaseAdmin()
    await db
      .from('bookings')
      .update({ status: 'COMPLETED' })
      .eq('id', bookingId)
      .eq('status', 'CONFIRMED')
  } catch {
    // swallow
  }

  revalidatePath('/owner/' + secret)
}

// ─── cancelBooking ────────────────────────────────────────────────────────────
export async function cancelBooking(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const bookingId = formData.get('bookingId') as string | null
  if (!secretOk(secret) || !bookingId) return

  try {
    const db = supabaseAdmin()
    await db
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('id', bookingId)
      .in('status', ['APPROVED', 'CONFIRMED'])

    try {
      await sendCancellation(bookingId)
    } catch {
      // mail failure should not break the action
    }
  } catch {
    // DB failure — swallow, UI will be stale until next refresh
  }

  revalidatePath('/owner/' + secret)
}

// ─── approveReview ────────────────────────────────────────────────────────────
export async function approveReview(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const reviewId = formData.get('reviewId') as string | null
  if (!secretOk(secret) || !reviewId) return

  try {
    const db = supabaseAdmin()
    await db
      .from('reviews')
      .update({ approved: true })
      .eq('id', reviewId)
  } catch {
    // swallow
  }

  revalidatePath('/owner/' + secret)
}

// ─── blockDates ───────────────────────────────────────────────────────────────
export async function blockDates(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const cabinId = formData.get('cabinId') as string | null
  const startDate = formData.get('startDate') as string | null
  const endDate = formData.get('endDate') as string | null
  const reason = formData.get('reason') as string | null
  if (!secretOk(secret) || !cabinId || !startDate || !endDate) return

  try {
    const db = supabaseAdmin()
    await db.from('blocked_dates').insert({
      cabin_id: cabinId,
      start_date: startDate,
      end_date: endDate,
      reason: reason ?? null,
    })
  } catch {
    // swallow
  }

  revalidatePath('/owner/' + secret)
}
