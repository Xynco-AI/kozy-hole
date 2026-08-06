import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendDamageDepositRequest } from '@/lib/email'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('unauthorized', { status: 401 })
  }

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
    const { count } = await db
      .from('booking_cabins')
      .select('*', { count: 'exact', head: true })
      .eq('booking_id', booking.id)
    await sendDamageDepositRequest(booking.id, count ?? 1)
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}
