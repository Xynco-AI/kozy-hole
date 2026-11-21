import { describe, it, expect } from 'vitest'
import { noticeFor, NOTICES } from '@/lib/owner-notices'

// Every code the dashboard actions (app/owner/[secret]/actions.ts) and the Postgres
// functions they call can return. Each needs real wording, not the generic fallback.
const CODES = [
  // edit booking + update_booking (0008)
  'booking-updated', 'booking-updated-emailed', 'cabin_unavailable', 'not_editable', 'no_cabins', 'not_found', 'invalid_dates',
  // validateStay (lowercased StayError)
  'min_one_night', 'out_of_season', 'weekend_two_night_min',
  // undo e-transfer
  'undo-done', 'undo-done-emailed', 'cannot_undo',
  // phone booking + create_phone_booking (0009)
  'phone-booking-created', 'missing_details', 'invalid_email',
  // resend waiver
  'waiver-resent', 'waiver_not_needed',
]

describe('owner dashboard notices', () => {
  it.each(CODES)('has wording for "%s"', (code) => {
    expect(NOTICES[code]).toBeDefined()
    expect(noticeFor(code).text.length).toBeGreaterThan(10)
  })

  it('falls back to a generic error for anything unknown', () => {
    expect(noticeFor('something-new')).toEqual(NOTICES.error)
    expect(noticeFor('something-new').ok).toBe(false)
  })

  it('marks failures so they show in red', () => {
    expect(noticeFor('weekend_two_night_min').ok).toBe(false)
    expect(noticeFor('phone-booking-created').ok).toBe(true)
  })
})
