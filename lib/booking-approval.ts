import 'server-only'
import { supabaseAdmin } from './supabase'
import { sendGuestApproved } from './email'

export async function approveBooking(bookingId: string): Promise<{ ok: boolean; alreadyHandled?: boolean }> {
  const db = supabaseAdmin()
  const { data: b } = await db.from('bookings').select('*').eq('id', bookingId).single()
  if (!b) return { ok: false }
  if (b.status !== 'REQUESTED') return { ok: true, alreadyHandled: true }
  const { error: updErr } = await db.from('bookings')
    .update({ status: 'APPROVED', approved_at: new Date().toISOString() })
    .eq('id', b.id).eq('status', 'REQUESTED')
  if (updErr) return { ok: false }
  // The Stripe Checkout session is created on demand by /api/bookings/[id]/pay,
  // because sessions expire after 24h and we hold dates for 48h.
  await sendGuestApproved(b.id, `${process.env.NEXT_PUBLIC_SITE_URL}/api/bookings/${b.id}/pay`)
  return { ok: true }
}

export async function declineBooking(bookingId: string): Promise<{ ok: boolean }> {
  const db = supabaseAdmin()
  await db.from('bookings').update({ status: 'DECLINED' }).eq('id', bookingId).eq('status', 'REQUESTED')
  return { ok: true }
}
