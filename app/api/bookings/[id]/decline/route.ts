import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { safeEqual } from '@/lib/tokens'
import { declineBooking } from '@/lib/booking-approval'

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
  await declineBooking(id)
  return new NextResponse('Booking declined. The dates are released.', { status: 200 })
}
