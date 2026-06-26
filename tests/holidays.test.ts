import { describe, it, expect } from 'vitest'
import { isHoliday, familyDay } from '@/lib/holidays'

describe('holidays', () => {
  it('Family Day 2026 is Feb 16', () => {
    const d = familyDay(2026)
    expect(d.getMonth()).toBe(1)
    expect(d.getDate()).toBe(16)
  })
  it('recognizes Christmas, Boxing Day, New Year', () => {
    expect(isHoliday(new Date(2025, 11, 25))).toBe(true)
    expect(isHoliday(new Date(2025, 11, 26))).toBe(true)
    expect(isHoliday(new Date(2026, 0, 1))).toBe(true)
  })
  it('a normal weekday is not a holiday', () => {
    expect(isHoliday(new Date(2026, 0, 14))).toBe(false) // Wed
  })
})
