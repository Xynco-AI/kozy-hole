import { describe, it, expect } from 'vitest'
import { planDailyJobs, albertaToday, type JobBooking } from '@/lib/daily-jobs'

// 2027-01-10 09:00 UTC = 02:00 in Alberta (MST, UTC-7), same calendar day.
const NOW = new Date('2027-01-10T09:00:00Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600e3).toISOString()

function booking(over: Partial<JobBooking>): JobBooking {
  return {
    id: 'x', status: 'REQUESTED', created_at: hoursAgo(1), approved_at: null,
    check_in: '2027-02-01', payment_reminder_sent_at: null, ...over,
  }
}

describe('albertaToday', () => {
  it('uses the Alberta calendar date, not UTC', () => {
    // 03:00 UTC on Jan 10 is still Jan 9 in Alberta.
    expect(albertaToday(new Date('2027-01-10T03:00:00Z'))).toBe('2027-01-09')
  })
})

describe('planDailyJobs', () => {
  it('reminds the owner about requests waiting more than 24 hours', () => {
    const plan = planDailyJobs([
      booking({ id: 'old', created_at: hoursAgo(30) }),
      booking({ id: 'new', created_at: hoursAgo(5) }),
    ], NOW)
    expect(plan.ownerPending).toEqual(['old'])
  })

  it('never auto-declines a pending request whose stay is still ahead', () => {
    const plan = planDailyJobs([booking({ id: 'old', created_at: hoursAgo(24 * 30) })], NOW)
    expect(plan.expire).toEqual([])
  })

  it('expires pending requests whose check-in date has passed, without reminding', () => {
    const plan = planDailyJobs([booking({ id: 'stale', created_at: hoursAgo(500), check_in: '2027-01-09' })], NOW)
    expect(plan.expire).toEqual(['stale'])
    expect(plan.ownerPending).toEqual([])
    expect(plan.notifyExpired).toEqual([])
  })

  it('sends an unpaid guest one reminder once 24 hours have passed since approval', () => {
    const plan = planDailyJobs([
      booking({ id: 'due', status: 'APPROVED', approved_at: hoursAgo(26) }),
      booking({ id: 'early', status: 'APPROVED', approved_at: hoursAgo(10) }),
      booking({ id: 'sent', status: 'APPROVED', approved_at: hoursAgo(30), payment_reminder_sent_at: hoursAgo(5) }),
    ], NOW)
    expect(plan.remindGuests).toEqual(['due'])
  })

  it('expires approved bookings after the 48-hour hold and tells the guest', () => {
    const plan = planDailyJobs([
      booking({ id: 'lapsed', status: 'APPROVED', approved_at: hoursAgo(49) }),
      booking({ id: 'held', status: 'APPROVED', approved_at: hoursAgo(47) }),
    ], NOW)
    expect(plan.expire).toEqual(['lapsed'])
    expect(plan.notifyExpired).toEqual(['lapsed'])
    expect(plan.remindGuests).toEqual(['held'])
  })

  it('leaves confirmed bookings alone', () => {
    const plan = planDailyJobs([booking({ status: 'CONFIRMED', approved_at: hoursAgo(100), check_in: '2027-01-01' })], NOW)
    expect(plan).toEqual({ expire: [], notifyExpired: [], remindGuests: [], ownerPending: [] })
  })
})
