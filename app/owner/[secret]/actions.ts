'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { safeEqual } from '@/lib/tokens'
import { sendConfirmation, sendCancellation } from '@/lib/email'
import { approveBooking, declineBooking } from '@/lib/booking-approval'
import { redirect } from 'next/navigation'
import { quote } from '@/lib/pricing'
import { parseLocalDate } from '@/lib/dates'

// ─── ownerChangeCabins ────────────────────────────────────────────────────────
// Change which cabins a pending request is for (e.g. a guest who picked all 3 by
// mistake). Re-prices and re-checks availability atomically in Postgres
// (update_booking_cabins, migration 0007). Result shown via ?notice= on the dashboard.
export async function ownerChangeCabins(formData: FormData): Promise<void> {
  const secret = formData.get('secret') as string | null
  const bookingId = formData.get('bookingId') as string | null
  const cabinIds = formData.getAll('cabinIds').map(String)
  if (!secretOk(secret) || !bookingId) return

  let notice = 'error'
  try {
    const db = supabaseAdmin()
    const { data: b } = await db.from('bookings').select('check_in,check_out').eq('id', bookingId).single()
    if (b) {
      const q = quote(parseLocalDate(b.check_in), parseLocalDate(b.check_out), new Set(cabinIds).size)
      const { data, error } = await db.rpc('update_booking_cabins', {
        p_booking_id: bookingId,
        p_cabin_ids: cabinIds,
        p_nightly_subtotal: q.nightlySubtotal,
        p_gst: q.gst,
        p_total: q.total,
        p_deposit_amount: q.deposit,
        p_card_charge: q.cardCharge,
      })
      if (error) console.error('update_booking_cabins failed', error)
      else notice = data?.ok ? 'cabins-updated' : String(data?.error ?? 'error').toLowerCase()
    }
  } catch (e) {
    console.error('ownerChangeCabins failed', e)
  }

  revalidatePath('/owner/' + secret)
  redirect(`/owner/${secret}?notice=${encodeURIComponent(notice)}`) // must be outside try/catch
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
