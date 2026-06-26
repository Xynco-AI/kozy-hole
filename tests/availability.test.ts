import { describe, it, expect } from 'vitest'
import { rangesOverlap, isCabinAvailable } from '@/lib/availability'

const r = (a: string, b: string) => ({ checkIn: new Date(a), checkOut: new Date(b) })

describe('availability', () => {
  it('overlapping ranges conflict', () => {
    expect(rangesOverlap(r('2026-01-10','2026-01-13'), r('2026-01-12','2026-01-15'))).toBe(true)
  })
  it('back-to-back ranges do NOT conflict (checkout == checkin)', () => {
    expect(rangesOverlap(r('2026-01-10','2026-01-13'), r('2026-01-13','2026-01-15'))).toBe(false)
  })
  it('cabin unavailable when any existing range overlaps', () => {
    expect(isCabinAvailable(r('2026-01-12','2026-01-14'), [r('2026-01-13','2026-01-16')])).toBe(false)
  })
  it('cabin available when no overlaps', () => {
    expect(isCabinAvailable(r('2026-01-12','2026-01-14'), [r('2026-01-20','2026-01-22')])).toBe(true)
  })
})
