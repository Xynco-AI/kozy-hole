import { describe, it, expect } from 'vitest'
import { ownerAllowList, isAllowedOwnerEmail, hashToken, tooManyLoginRequests } from '@/lib/owner-auth'

describe('ownerAllowList', () => {
  it('reads a comma-separated list, ignoring case and spaces', () => {
    expect(ownerAllowList({ OWNER_LOGIN_EMAILS: ' Rob@Example.com, jason@example.com ,' }))
      .toEqual(['rob@example.com', 'jason@example.com'])
  })
  it('falls back to the owner alert address when no list is set', () => {
    expect(ownerAllowList({ OWNER_EMAIL: 'KozyHole@Gmail.com' })).toEqual(['kozyhole@gmail.com'])
  })
  it('is empty when nothing is configured (nobody can log in)', () => {
    expect(ownerAllowList({})).toEqual([])
  })
})

describe('isAllowedOwnerEmail', () => {
  const list = ['rob@example.com']
  it('matches regardless of case and surrounding spaces', () => {
    expect(isAllowedOwnerEmail('  ROB@example.com ', list)).toBe(true)
  })
  it('rejects anyone not on the list', () => {
    expect(isAllowedOwnerEmail('someone@example.com', list)).toBe(false)
    expect(isAllowedOwnerEmail('', list)).toBe(false)
  })
})

describe('hashToken', () => {
  it('is stable and never equal to the token itself', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'))
    expect(hashToken('abc')).not.toContain('abc')
    expect(hashToken('abc')).not.toBe(hashToken('abd'))
  })
})

describe('tooManyLoginRequests', () => {
  it('allows a few login emails an hour, then stops', () => {
    expect(tooManyLoginRequests(4)).toBe(false)
    expect(tooManyLoginRequests(5)).toBe(true)
  })
})
