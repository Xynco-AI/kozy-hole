import { describe, it, expect } from 'vitest'
import { ADDONS, PET_FEE, arrivalItems, arrivalKnownTotal } from '@/lib/addons'
import { money } from '@/lib/format'

const SHUTTLE = ADDONS.find(a => a.price === 60)!.label

describe('money', () => {
  it('always shows cents', () => {
    expect(money(367.5)).toBe('$367.50')
    expect(money(1234)).toBe('$1,234.00')
  })
  it('accepts numeric strings from the database', () => {
    expect(money('378.53')).toBe('$378.53')
  })
})

describe('arrivalItems', () => {
  it('lists the pet fee first, then add-ons in menu order', () => {
    const items = arrivalItems({ addons: ['Guided trip', SHUTTLE], hasPet: true })
    expect(items.map(i => i.label)).toEqual([
      'Dog (pet fee)', 'Shuttle to the cabin (round trip, conditions permitting)', 'Guided trip'])
  })

  it('prices the pet fee and shuttle, and leaves unpriced add-ons as null', () => {
    const items = arrivalItems({ addons: [SHUTTLE, 'Guided trip'], hasPet: true })
    expect(items.map(i => i.price)).toEqual([PET_FEE, 60, null])
  })

  it('does not repeat the price inside the name in price lists', () => {
    const [shuttle] = arrivalItems({ addons: [SHUTTLE], hasPet: false })
    expect(shuttle).toEqual({ label: 'Shuttle to the cabin (round trip, conditions permitting)', price: 60 })
  })

  it('keeps add-ons it does not recognise (older bookings), unpriced', () => {
    expect(arrivalItems({ addons: ['Old add-on'], hasPet: false }))
      .toEqual([{ label: 'Old add-on', price: null }])
  })

  it('is empty with no pet and no add-ons', () => {
    expect(arrivalItems({ addons: [], hasPet: false })).toEqual([])
    expect(arrivalItems({ addons: null, hasPet: false })).toEqual([])
  })
})

describe('arrivalKnownTotal', () => {
  it('adds up only the priced items', () => {
    expect(arrivalKnownTotal(arrivalItems({ addons: [SHUTTLE, 'Guided trip'], hasPet: true }))).toBe(110)
  })
})
