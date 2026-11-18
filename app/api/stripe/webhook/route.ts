import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendConfirmation } from '@/lib/email'
import { handleCheckoutCompleted } from '@/lib/deposit-payment'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  let event
  try {
    event = await getStripe().webhooks.constructEventAsync(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new NextResponse('bad signature', { status: 400 })
  }
  if (event.type === 'checkout.session.completed') {
    const db = supabaseAdmin()
    await handleCheckoutCompleted(event.data.object, {
      // Stripe retries deliveries; only the call that actually flips APPROVED -> CONFIRMED returns true.
      confirmBooking: async (bookingId, amountCharged) => {
        const { data } = await db.from('bookings').update({
          status: 'CONFIRMED',
          payment_method: 'card',
          amount_charged: amountCharged,
        }).eq('id', bookingId).eq('status', 'APPROVED').select('id')
        return (data?.length ?? 0) > 0
      },
      sendConfirmation,
      recordDamageDeposit: async (bookingId, intentId) => {
        await db.from('bookings').update({
          damage_deposit_intent_id: intentId,
          damage_deposit_status: 'authorized',
        }).eq('id', bookingId)
      },
    })
  }
  return NextResponse.json({ received: true })
}
