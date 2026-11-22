/**
 * Whether guests are offered card payments (deposit by card and the $500 damage-deposit
 * card hold). Off while the site only has a Stripe TEST key, because real cards would be
 * declined; turns on by itself once a live key (sk_live_...) is set. CARD_PAYMENTS=on|off
 * overrides it (e.g. "on" to test the card flow locally with a test key).
 * When off, guests are only shown e-transfer.
 */
export function cardPaymentsEnabled(env: { STRIPE_SECRET_KEY?: string; CARD_PAYMENTS?: string }): boolean {
  if (env.CARD_PAYMENTS === 'off') return false
  if (env.CARD_PAYMENTS === 'on') return true
  return (env.STRIPE_SECRET_KEY ?? '').startsWith('sk_live_')
}

/** The current setting, from the server's environment. */
export function cardPaymentsOn(): boolean {
  return cardPaymentsEnabled({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    CARD_PAYMENTS: process.env.CARD_PAYMENTS,
  })
}
