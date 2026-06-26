import { describe, it, expect } from 'vitest'
import { isWithinSeason, rangeWithinSeason } from '@/lib/season'

describe('season Dec 15 - Mar 31', () => {
  it('includes Jan and Feb', () => {
    expect(isWithinSeason(new Date(2026, 0, 20))).toBe(true)
    expect(isWithinSeason(new Date(2026, 1, 5))).toBe(true)
  })
  it('Dec before the 15th is out, on/after is in', () => {
    expect(isWithinSeason(new Date(2025, 11, 14))).toBe(false)
    expect(isWithinSeason(new Date(2025, 11, 15))).toBe(true)
  })
  it('April is out', () => {
    expect(isWithinSeason(new Date(2026, 3, 1))).toBe(false)
  })
  it('range valid when last night is in season (Mar 30 night, Mar 31 checkout)', () => {
    expect(rangeWithinSeason(new Date(2026, 2, 30), new Date(2026, 2, 31))).toBe(true)
  })
})
