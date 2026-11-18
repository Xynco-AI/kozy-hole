import { describe, it, expect, vi } from 'vitest'
import {
  depositCardCents,
  getDepositPayUrl,
  handleCheckoutCompleted,
  type PayUrlDeps,
  type CheckoutCompletedDeps,
} from '@/lib/deposit-payment'

const approved = {
  id: 'b1',
  status: 'APPROVED',
  email: 'guest@example.com',
  check_in: '2027-01-15',
  check_out: '2027-01-17',
  nights: 2,
  deposit_amount: 472.5,
  card_charge: 486.68,
  stripe_session_id: 'cs_old' as string | null,
}

function payDeps(overrides: Partial<PayUrlDeps> = {}): PayUrlDeps {
  return {
    retrieveSession: vi.fn(async () => ({ status: 'open', url: 'https://stripe.test/old' })),
    createSession: vi.fn(async () => ({ id: 'cs_new', url: 'https://stripe.test/new' })),
    saveSessionId: vi.fn(async () => {}),
    ...overrides,
  }
}

describe('depositCardCents', () => {
  it('uses the card charge stored when the guest requested', () => {
    expect(depositCardCents({ card_charge: 486.68, deposit_amount: 472.5 })).toBe(48668)
  })
  it('falls back to deposit + 3% when no card charge was stored', () => {
    expect(depositCardCents({ card_charge: null, deposit_amount: 100 })).toBe(10300)
  })
})

describe('getDepositPayUrl', () => {
  it('returns null for a booking that is not awaiting payment', async () => {
    const deps = payDeps()
    expect(await getDepositPayUrl({ ...approved, status: 'CONFIRMED' }, deps)).toBeNull()
    expect(deps.createSession).not.toHaveBeenCalled()
  })

  it('reuses the existing checkout session while it is still open', async () => {
    const deps = payDeps()
    expect(await getDepositPayUrl(approved, deps)).toBe('https://stripe.test/old')
    expect(deps.createSession).not.toHaveBeenCalled()
  })

  it('creates a fresh session when the old one expired (Stripe sessions last 24h, hold is 48h)', async () => {
    const deps = payDeps({
      retrieveSession: vi.fn(async () => ({ status: 'expired', url: null })),
    })
    expect(await getDepositPayUrl(approved, deps)).toBe('https://stripe.test/new')
    expect(deps.createSession).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: 'b1', amountCents: 48668, guestEmail: 'guest@example.com',
    }))
    expect(deps.saveSessionId).toHaveBeenCalledWith('b1', 'cs_new')
  })

  it('creates a session when the booking has none yet', async () => {
    const deps = payDeps()
    expect(await getDepositPayUrl({ ...approved, stripe_session_id: null }, deps)).toBe('https://stripe.test/new')
    expect(deps.retrieveSession).not.toHaveBeenCalled()
  })

  describe('closing the card page when the 48h hold ends', () => {
    const NOW = new Date('2027-01-10T12:00:00Z')
    const approvedHoursAgo = (h: number) => ({
      ...approved, stripe_session_id: null, approved_at: new Date(NOW.getTime() - h * 3600e3).toISOString(),
    })

    it('makes the payment page expire when the hold ends', async () => {
      const deps = { ...payDeps(), now: () => NOW }
      await getDepositPayUrl(approvedHoursAgo(40), deps) // 8h of hold left
      expect(deps.createSession).toHaveBeenCalledWith(expect.objectContaining({
        expiresAt: Math.floor(NOW.getTime() / 1000) + 8 * 3600,
      }))
    })

    it('never asks Stripe for more than its 24h maximum', async () => {
      const deps = { ...payDeps(), now: () => NOW }
      await getDepositPayUrl(approvedHoursAgo(1), deps) // 47h of hold left
      const { expiresAt } = (deps.createSession as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(expiresAt).toBeLessThanOrEqual(Math.floor(NOW.getTime() / 1000) + 24 * 3600)
    })

    it('offers no card payment once less than 30 minutes of hold remain', async () => {
      const deps = { ...payDeps(), now: () => NOW }
      expect(await getDepositPayUrl(approvedHoursAgo(47.75), deps)).toBeNull()
      expect(deps.createSession).not.toHaveBeenCalled()
    })

    it('does not reuse an open session after the hold has ended', async () => {
      const deps = { ...payDeps(), now: () => NOW }
      expect(await getDepositPayUrl({ ...approvedHoursAgo(50), stripe_session_id: 'cs_old' }, deps)).toBeNull()
    })
  })

  it('creates a fresh session when the old one cannot be retrieved', async () => {
    const deps = payDeps({
      retrieveSession: vi.fn(async () => { throw new Error('No such checkout.session') }),
    })
    expect(await getDepositPayUrl(approved, deps)).toBe('https://stripe.test/new')
  })
})

describe('handleCheckoutCompleted', () => {
  function webhookDeps(confirmed: boolean): CheckoutCompletedDeps {
    return {
      confirmBooking: vi.fn(async () => confirmed),
      sendConfirmation: vi.fn(async () => {}),
      recordDamageDeposit: vi.fn(async () => {}),
    }
  }

  it('confirms the booking and emails once on first delivery', async () => {
    const deps = webhookDeps(true)
    await handleCheckoutCompleted({ metadata: { bookingId: 'b1' }, amount_total: 48668 }, deps)
    expect(deps.confirmBooking).toHaveBeenCalledWith('b1', 486.68)
    expect(deps.sendConfirmation).toHaveBeenCalledWith('b1')
  })

  it('does not re-send the confirmation email when Stripe retries the webhook', async () => {
    const deps = webhookDeps(false) // booking was already CONFIRMED, no row changed
    await handleCheckoutCompleted({ metadata: { bookingId: 'b1' }, amount_total: 48668 }, deps)
    expect(deps.sendConfirmation).not.toHaveBeenCalled()
  })

  it('records a damage deposit hold without confirming or emailing', async () => {
    const deps = webhookDeps(true)
    await handleCheckoutCompleted(
      { metadata: { bookingId: 'b1', type: 'damage_deposit' }, payment_intent: 'pi_1' }, deps)
    expect(deps.recordDamageDeposit).toHaveBeenCalledWith('b1', 'pi_1')
    expect(deps.confirmBooking).not.toHaveBeenCalled()
    expect(deps.sendConfirmation).not.toHaveBeenCalled()
  })

  it('ignores sessions without a booking id', async () => {
    const deps = webhookDeps(true)
    await handleCheckoutCompleted({ metadata: {} }, deps)
    expect(deps.confirmBooking).not.toHaveBeenCalled()
    expect(deps.recordDamageDeposit).not.toHaveBeenCalled()
  })
})
