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
