'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { safeEqual } from '@/lib/tokens'
import { sendConfirmation } from '@/lib/email'

function secretOk(secret: string | null): boolean {
  const env = process.env.OWNER_DASHBOARD_SECRET
  if (!env || !secret) return false
  return safeEqual(secret, env)
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
  } catch {
    // swallow
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
