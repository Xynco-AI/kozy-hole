import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getStripe, createDepositCheckout } from '@/lib/stripe'
import { getDepositPayUrl } from '@/lib/deposit-payment'

export const dynamic = 'force-dynamic'

// Card-deposit link used by the approval email and the booking page. Sends the guest
// to a live Stripe Checkout session, replacing it if the previous one expired.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const site = process.env.NEXT_PUBLIC_SITE_URL
  const db = supabaseAdmin()
  const { data: b } = await db.from('bookings').select('*').eq('id', id).single()
  if (!b) return new NextResponse('Booking not found', { status: 404 })

  let url: string | null = null
  try {
    url = await getDepositPayUrl(b, {
      retrieveSession: async (sid) => {
        const s = await getStripe().checkout.sessions.retrieve(sid)
        return { status: s.status, url: s.url }
      },
      createSession: createDepositCheckout,
      saveSessionId: async (bookingId, sid) => {
        await db.from('bookings').update({ stripe_session_id: sid }).eq('id', bookingId)
      },
    })
  } catch (e) {
    console.error('pay link failed', { bookingId: id, e })
  }

  // Not payable (already paid, expired, declined) or Stripe failed: show the booking page,
  // which explains the current status and offers e-transfer.
  return NextResponse.redirect(url ?? `${site}/booking/${id}`)
}
