import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendDamageDepositRequest } from '@/lib/email'
import { cardPaymentsOn } from '@/lib/payments-config'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Fail closed: if CRON_SECRET is unset, "Bearer undefined" must not get in.
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  // The damage deposit is a Stripe card hold; skip while card payments are off.
  if (!cardPaymentsOn()) return NextResponse.json({ ok: true, sent: 0, skipped: 'card payments off' })

  const db = supabaseAdmin()

  // Target bookings checking in 3 days from now
  const target = new Date()
  target.setDate(target.getDate() + 3)
  const targetDate = target.toISOString().split('T')[0]

  const { data: bookings } = await db
    .from('bookings')
    .select('id')
    .eq('status', 'CONFIRMED')
    .eq('check_in', targetDate)
    .is('damage_deposit_status', null)
    .is('damage_deposit_session_id', null)

  if (!bookings?.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let sent = 0
  for (const booking of bookings) {
    await sendDamageDepositRequest(booking.id)
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
