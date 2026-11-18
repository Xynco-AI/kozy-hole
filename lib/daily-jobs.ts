/**
 * Daily housekeeping rules (run by /api/cron/expire-holds). Pure: given bookings and
 * the time, decide what to do. The cron route does the database updates and emails.
 */

export const HOLD_HOURS = 48
const PAYMENT_REMINDER_AFTER_HOURS = 24
const OWNER_REMINDER_AFTER_HOURS = 24
const HOUR = 3600e3

export type JobBooking = {
  id: string
  status: string
  created_at: string
  approved_at: string | null
  check_in: string
  payment_reminder_sent_at: string | null
}

export type DailyPlan = {
  /** Set to EXPIRED. */
  expire: string[]
  /** Guests to tell their hold lapsed (subset of expire). */
  notifyExpired: string[]
  /** Approved, unpaid, half-way through the hold: one reminder each. */
  remindGuests: string[]
  /** Requests the owner hasn't answered for over a day. */
  ownerPending: string[]
}

/** Today's date in Alberta as YYYY-MM-DD (crons run in UTC). */
export function albertaToday(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Edmonton', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
}

export function holdEndsAt(approvedAt: string): Date {
  return new Date(new Date(approvedAt).getTime() + HOLD_HOURS * HOUR)
}

export function planDailyJobs(bookings: JobBooking[], now: Date): DailyPlan {
  const plan: DailyPlan = { expire: [], notifyExpired: [], remindGuests: [], ownerPending: [] }
  const today = albertaToday(now)
  const ageHours = (iso: string) => (now.getTime() - new Date(iso).getTime()) / HOUR

  for (const b of bookings) {
    const stayStarted = b.check_in < today

    if (b.status === 'REQUESTED') {
      // Never auto-decline a future stay: that's the owner's decision. Only clear out
      // requests whose check-in has already passed.
      if (stayStarted) plan.expire.push(b.id)
      else if (ageHours(b.created_at) >= OWNER_REMINDER_AFTER_HOURS) plan.ownerPending.push(b.id)
    }

    if (b.status === 'APPROVED' && b.approved_at) {
      if (ageHours(b.approved_at) >= HOLD_HOURS || stayStarted) {
        plan.expire.push(b.id)
        plan.notifyExpired.push(b.id)
      } else if (ageHours(b.approved_at) >= PAYMENT_REMINDER_AFTER_HOURS && !b.payment_reminder_sent_at) {
        plan.remindGuests.push(b.id)
      }
    }
  }
  return plan
}
