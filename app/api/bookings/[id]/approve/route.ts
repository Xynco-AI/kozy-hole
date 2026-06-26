import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { safeEqual } from '@/lib/tokens'
import { createDepositCheckout } from '@/lib/stripe'
import { sendGuestApproved } from '@/lib/email'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const db = supabaseAdmin()
  const { data: b } = await db.from('bookings').select('*').eq('id', id).single()
  if (!b || !safeEqual(token, b.approval_token)) {
    return new NextResponse('Invalid or expired link', { status: 403 })
  }
  if (b.status !== 'REQUESTED') {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/booking/${b.id}`)
  }
  const session = await createDepositCheckout({
    bookingId: b.id,
    amountCents: Math.round(Number(b.deposit_amount) * 1.03 * 100), // card incl 3%
    guestEmail: b.email,
    description: `${b.check_in} to ${b.check_out}, ${b.nights} nights`,
  })
  await db.from('bookings').update({
    status: 'APPROVED',
    approved_at: new Date().toISOString(),
    stripe_session_id: session.id,
  }).eq('id', b.id)
  await sendGuestApproved(b.id, session.url!)
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/booking/${b.id}?owner=approved`)
}
