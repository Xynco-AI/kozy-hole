import 'server-only'
import { supabaseAdmin } from './supabase'
import { createDepositCheckout } from './stripe'
import { sendGuestApproved } from './email'

export async function approveBooking(bookingId: string): Promise<{ ok: boolean; alreadyHandled?: boolean }> {
  const db = supabaseAdmin()
  const { data: b } = await db.from('bookings').select('*').eq('id', bookingId).single()
  if (!b) return { ok: false }
  if (b.status !== 'REQUESTED') return { ok: true, alreadyHandled: true }
  // amount: prefer the stored card_charge; fall back to deposit*1.03
  const cardCents = Math.round(Number(b.card_charge ?? Number(b.deposit_amount) * 1.03) * 100)
  // DB first, then Stripe, so a DB failure doesn't leave an orphan session (review FIX 9 intent)
  const { error: updErr } = await db.from('bookings')
    .update({ status: 'APPROVED', approved_at: new Date().toISOString() })
    .eq('id', b.id).eq('status', 'REQUESTED')
  if (updErr) return { ok: false }
  const session = await createDepositCheckout({
    bookingId: b.id, amountCents: cardCents, guestEmail: b.email,
    description: `${b.check_in} to ${b.check_out}, ${b.nights} nights`,
  })
  await db.from('bookings').update({ stripe_session_id: session.id }).eq('id', b.id)
  await sendGuestApproved(b.id, session.url!)
  return { ok: true }
}

export async function declineBooking(bookingId: string): Promise<{ ok: boolean }> {
  const db = supabaseAdmin()
  await db.from('bookings').update({ status: 'DECLINED' }).eq('id', bookingId).eq('status', 'REQUESTED')
  return { ok: true }
}
