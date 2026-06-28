import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmation } from '@/lib/email'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  let event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new NextResponse('bad signature', { status: 400 })
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const bookingId = session.metadata?.bookingId
    if (bookingId) {
      const db = supabaseAdmin()
      await db.from('bookings').update({
        status: 'CONFIRMED',
        payment_method: 'card',
        amount_charged: (session.amount_total ?? 0) / 100,
      }).eq('id', bookingId).eq('status', 'APPROVED')
      await sendConfirmation(bookingId)
    }
  }
  // TODO(phase2): handle 'checkout.session.expired' and payment-failure events
  // (e.g. async_payment_failed) to release/notify on holds that never get paid.
  return NextResponse.json({ received: true })
}
