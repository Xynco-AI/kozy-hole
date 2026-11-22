import { describe, it, expect } from 'vitest'
import { cardPaymentsEnabled } from '@/lib/payments-config'

describe('cardPaymentsEnabled', () => {
  it('is off while the site only has a Stripe test key', () => {
    expect(cardPaymentsEnabled({ STRIPE_SECRET_KEY: 'sk_test_abc' })).toBe(false)
  })
  it('turns on by itself once a live key is set', () => {
    expect(cardPaymentsEnabled({ STRIPE_SECRET_KEY: 'sk_live_abc' })).toBe(true)
  })
  it('is off with no key at all', () => {
    expect(cardPaymentsEnabled({})).toBe(false)
  })
  it('can be forced on (to test with a test key) or off (even with a live key)', () => {
    expect(cardPaymentsEnabled({ STRIPE_SECRET_KEY: 'sk_test_abc', CARD_PAYMENTS: 'on' })).toBe(true)
    expect(cardPaymentsEnabled({ STRIPE_SECRET_KEY: 'sk_live_abc', CARD_PAYMENTS: 'off' })).toBe(false)
  })
})
