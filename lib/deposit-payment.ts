/**
 * Deposit payment logic, kept free of Supabase/Stripe/Resend imports so it can be
 * unit-tested. Callers (routes, lib/booking-approval.ts) pass the real I/O in as deps.
 */

export type PayUrlDeps = {
  retrieveSession: (id: string) => Promise<{ status: string | null; url: string | null }>
  createSession: (p: { bookingId: string; amountCents: number; guestEmail: string; description: string }) =>
    Promise<{ id: string; url: string | null }>
  saveSessionId: (bookingId: string, sessionId: string) => Promise<void>
}

export type CheckoutCompletedDeps = {
  /** Flip APPROVED -> CONFIRMED. Must return true only if a row actually changed. */
  confirmBooking: (bookingId: string, amountCharged: number) => Promise<boolean>
  sendConfirmation: (bookingId: string) => Promise<void>
  recordDamageDeposit: (bookingId: string, paymentIntentId: string) => Promise<void>
}

type DepositAmounts = { card_charge: number | string | null; deposit_amount: number | string }

type PayableBooking = DepositAmounts & {
  id: string
  status: string
  email: string
  check_in: string
  check_out: string
  nights: number
  stripe_session_id: string | null
}

/** Card amount in cents: the card charge quoted at request time, else deposit + 3%. */
export function depositCardCents(b: DepositAmounts): number {
  const charge = b.card_charge ?? Number(b.deposit_amount) * 1.03
  return Math.round(Number(charge) * 100)
}

/**
 * URL where the guest can pay the deposit by card. Stripe Checkout sessions expire
 * after 24h but we hold dates for 48h, so an expired/missing session is replaced.
 */
export async function getDepositPayUrl(b: PayableBooking, deps: PayUrlDeps): Promise<string | null> {
  if (b.status !== 'APPROVED') return null

  if (b.stripe_session_id) {
    try {
      const existing = await deps.retrieveSession(b.stripe_session_id)
      if (existing.status === 'open' && existing.url) return existing.url
    } catch {
      // fall through and create a new session
    }
  }

  const session = await deps.createSession({
    bookingId: b.id,
    amountCents: depositCardCents(b),
    guestEmail: b.email,
    description: `${b.check_in} to ${b.check_out}, ${b.nights} nights`,
  })
  await deps.saveSessionId(b.id, session.id)
  return session.url
}

type CompletedSession = {
  metadata?: { bookingId?: string; type?: string } | null
  amount_total?: number | null
  payment_intent?: string | { id: string } | null
}

export async function handleCheckoutCompleted(session: CompletedSession, deps: CheckoutCompletedDeps): Promise<void> {
  const bookingId = session.metadata?.bookingId
  if (!bookingId) return

  if (session.metadata?.type === 'damage_deposit') {
    const pi = session.payment_intent
    const intentId = typeof pi === 'string' ? pi : pi?.id
    if (intentId) await deps.recordDamageDeposit(bookingId, intentId)
    return
  }

  const changed = await deps.confirmBooking(bookingId, (session.amount_total ?? 0) / 100)
  if (changed) await deps.sendConfirmation(bookingId)
}
