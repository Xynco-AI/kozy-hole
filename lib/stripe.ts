import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-06-24.dahlia',
    })
  }
  return _stripe
}

export async function createDamageDepositCheckout(params: {
  bookingId: string
  amountCents: number
  guestEmail: string
  cabinCount: number
}) {
  return getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: params.guestEmail,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'cad',
        unit_amount: params.amountCents,
        product_data: {
          name: `Damage deposit hold — ${params.cabinCount} cabin${params.cabinCount > 1 ? 's' : ''}`,
          description: 'A hold only — not a charge. Released after checkout if the shack is left in good condition.',
        },
      },
    }],
    payment_intent_data: {
      capture_method: 'manual',
      metadata: { bookingId: params.bookingId, type: 'damage_deposit' },
    },
    metadata: { bookingId: params.bookingId, type: 'damage_deposit' },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/${params.bookingId}/damage-deposit?authorized=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/${params.bookingId}/damage-deposit`,
  })
}

export async function createDepositCheckout(params: {
  bookingId: string
  amountCents: number
  guestEmail: string
  description: string
}) {
  return getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: params.guestEmail,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'cad',
        unit_amount: params.amountCents,
        product_data: { name: 'Kozy Hole deposit', description: params.description },
      },
    }],
    metadata: { bookingId: params.bookingId },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/${params.bookingId}?paid=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/${params.bookingId}`,
  })
}
