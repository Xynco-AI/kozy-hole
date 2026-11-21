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

import { canPayDeposit, etransferConfirmMessage, parsePhoneBooking } from '@/lib/owner-rules'
import { ADDONS } from '@/lib/addons'

describe('canPayDeposit', () => {
  it('lets an approved guest pay once their waiver is signed', () => {
    expect(canPayDeposit({ status: 'APPROVED', hasWaiver: true })).toBe(true)
  })
  it('blocks payment until the waiver is signed (phone bookings)', () => {
    expect(canPayDeposit({ status: 'APPROVED', hasWaiver: false })).toBe(false)
  })
  it('only applies while awaiting deposit', () => {
    expect(canPayDeposit({ status: 'CONFIRMED', hasWaiver: true })).toBe(false)
    expect(canPayDeposit({ status: 'REQUESTED', hasWaiver: true })).toBe(false)
  })
})

describe('etransferConfirmMessage', () => {
  it('names the guest and amount and warns it emails them', () => {
    const m = etransferConfirmMessage({ guestName: 'Pat', amount: '$945.00', hasWaiver: true })
    expect(m).toContain("Pat's $945.00 deposit")
    expect(m).toMatch(/emails Pat/)
    expect(m).not.toMatch(/waiver/i)
  })
  it('adds a warning when the guest has not signed the waiver', () => {
    expect(etransferConfirmMessage({ guestName: 'Pat', amount: '$1.00', hasWaiver: false }))
      .toMatch(/has not signed the safety waiver/i)
  })
})

describe('parsePhoneBooking', () => {
  const cabin = '11111111-1111-4111-8111-111111111111'
  const form = (over: Record<string, string | string[]> = {}) => {
    const f = new FormData()
    const base: Record<string, string | string[]> = {
      guestName: 'Pat Guest', email: 'pat@example.com', phone: '780 555 1234', partySize: '3',
      checkIn: '2027-01-15', checkOut: '2027-01-17', cabinIds: [cabin], ...over,
    }
    for (const [k, v] of Object.entries(base)) for (const x of [v].flat()) f.append(k, x)
    return f
  }

  it('reads a complete form', () => {
    const r = parsePhoneBooking(form({ hasPet: 'on', addons: [ADDONS[0].label] }))
    expect(r).toEqual({ ok: true, data: {
      guestName: 'Pat Guest', email: 'pat@example.com', phone: '780 555 1234', partySize: 3, hasPet: true,
      checkIn: '2027-01-15', checkOut: '2027-01-17', cabinIds: [cabin], addons: [ADDONS[0].label],
    } })
  })

  it('requires a valid email (the waiver and payment link are sent there)', () => {
    expect(parsePhoneBooking(form({ email: 'nope' }))).toEqual({ ok: false, error: 'invalid_email' })
  })

  it('requires at least one cabin', () => {
    expect(parsePhoneBooking(form({ cabinIds: [] }))).toEqual({ ok: false, error: 'no_cabins' })
  })

  it('rejects missing details', () => {
    expect(parsePhoneBooking(form({ guestName: '' }))).toEqual({ ok: false, error: 'missing_details' })
    expect(parsePhoneBooking(form({ checkIn: '' }))).toEqual({ ok: false, error: 'missing_details' })
  })

  it('ignores add-ons that are not on the menu', () => {
    const r = parsePhoneBooking(form({ addons: ['Free beer'] }))
    expect(r.ok && r.data.addons).toEqual([])
  })
})
