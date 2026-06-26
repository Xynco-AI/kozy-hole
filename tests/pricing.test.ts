import { describe, it, expect } from 'vitest'
import { nightlyRate, nightsBetween, quote, validateStay } from '@/lib/pricing'

describe('nightlyRate', () => {
  it('weekday night is 350', () => {
    expect(nightlyRate(new Date(2026, 0, 14))).toBe(350) // Wed
  })
  it('Friday and Saturday nights are 450', () => {
    expect(nightlyRate(new Date(2026, 0, 16))).toBe(450) // Fri
    expect(nightlyRate(new Date(2026, 0, 17))).toBe(450) // Sat
  })
  it('a holiday weekday night is 450', () => {
    expect(nightlyRate(new Date(2026, 0, 1))).toBe(450) // New Year (Thu)
  })
})

describe('quote', () => {
  it('2 weekday nights, 1 cabin', () => {
    const q = quote(new Date(2026, 0, 14), new Date(2026, 0, 16), 1)
    expect(q.nights).toBe(2)
    expect(q.nightlySubtotal).toBe(700)
    expect(q.gst).toBe(35)
    expect(q.total).toBe(735)
    expect(q.deposit).toBe(367.5)
    expect(q.cardCharge).toBe(378.53)      // 367.5 * 1.03
    expect(q.etransferCharge).toBe(367.5)
  })
  it('multiplies by cabin count', () => {
    const q = quote(new Date(2026, 0, 14), new Date(2026, 0, 16), 3)
    expect(q.nightlySubtotal).toBe(2100)
  })
})

describe('validateStay', () => {
  it('rejects a single Friday night (weekend 2-night min)', () => {
    expect(validateStay(new Date(2026, 0, 16), new Date(2026, 0, 17)))
      .toBe('WEEKEND_TWO_NIGHT_MIN')
  })
  it('allows a single weekday night', () => {
    expect(validateStay(new Date(2026, 0, 14), new Date(2026, 0, 15))).toBeNull()
  })
  it('rejects out of season', () => {
    expect(validateStay(new Date(2026, 5, 1), new Date(2026, 5, 2))).toBe('OUT_OF_SEASON')
  })
})
