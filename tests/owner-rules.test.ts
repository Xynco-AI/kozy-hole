import { describe, it, expect } from 'vitest'
import { canUndoEtransfer } from '@/lib/owner-rules'

const confirmedByEtransfer = { status: 'CONFIRMED', payment_method: 'etransfer', damage_deposit_status: null }

describe('canUndoEtransfer', () => {
  it('allows undoing an e-transfer confirmation', () => {
    expect(canUndoEtransfer(confirmedByEtransfer)).toBe(true)
  })

  it('never undoes a card payment (real money went through Stripe)', () => {
    expect(canUndoEtransfer({ ...confirmedByEtransfer, payment_method: 'card' })).toBe(false)
  })

  it('only applies to confirmed bookings', () => {
    for (const status of ['APPROVED', 'COMPLETED', 'CANCELLED']) {
      expect(canUndoEtransfer({ ...confirmedByEtransfer, status })).toBe(false)
    }
  })

  it('is not offered once the guest has authorized the damage deposit hold', () => {
    expect(canUndoEtransfer({ ...confirmedByEtransfer, damage_deposit_status: 'authorized' })).toBe(false)
  })
})
