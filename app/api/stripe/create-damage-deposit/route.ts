import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createDamageDepositCheckout } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get('bookingId')
  if (!bookingId) return new NextResponse('missing bookingId', { status: 400 })

  const db = supabaseAdmin()
  const { data: b } = await db.from('bookings').select('*').eq('id', bookingId).single()

  if (!b || b.status !== 'CONFIRMED') {
    return new NextResponse('booking not found or not confirmed', { status: 404 })
  }

  if (b.damage_deposit_status === 'authorized') {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/booking/${bookingId}/damage-deposit?authorized=1`
    )
  }

  const { count } = await db
    .from('booking_cabins')
    .select('*', { count: 'exact', head: true })
    .eq('booking_id', bookingId)

  const cabinCount = count ?? 1
  const amountCents = cabinCount * 50000

  const session = await createDamageDepositCheckout({
    bookingId,
    amountCents,
    guestEmail: b.email,
    cabinCount,
  })

  await db.from('bookings').update({ damage_deposit_session_id: session.id }).eq('id', bookingId)

  return NextResponse.redirect(session.url!)
}
