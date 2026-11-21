/** Messages shown on the owner dashboard after an action. Codes come from
 * app/owner/[secret]/actions.ts and the Postgres functions it calls. */
export type Notice = { ok: boolean; text: string }

export const NOTICES: Record<string, Notice> = {
  'booking-updated': { ok: true, text: 'Booking updated and the price recalculated. Approve it when ready.' },
  'booking-updated-emailed': { ok: true, text: 'Booking updated. The guest has been emailed the new dates, price and a fresh payment link (48-hour hold restarted).' },
  cabin_unavailable: { ok: false, text: 'A cabin is already booked or blocked for those dates. Nothing was changed.' },
  not_editable: { ok: false, text: 'Only unpaid bookings can be changed. Nothing was changed.' },
  no_cabins: { ok: false, text: 'Pick at least one cabin. Nothing was changed.' },
  invalid_dates: { ok: false, text: 'Check-out must be after check-in. Nothing was changed.' },
  min_one_night: { ok: false, text: 'Check-out must be after check-in. Nothing was changed.' },
  out_of_season: { ok: false, text: 'Those dates are outside the season (Dec 15 to Mar 31). Nothing was changed.' },
  weekend_two_night_min: { ok: false, text: 'Weekend stays need at least 2 nights. Nothing was changed.' },
  'undo-done': { ok: true, text: 'Done. The booking is back to awaiting deposit with a fresh 48-hour hold. No email was sent.' },
  'undo-done-emailed': { ok: true, text: 'Done. The booking is back to awaiting deposit with a fresh 48-hour hold, and the guest was emailed a correction.' },
  cannot_undo: { ok: false, text: 'That booking can no longer be undone here (only e-transfer confirmations before the damage deposit is authorized). Nothing was changed.' },
  'phone-booking-created': { ok: true, text: 'Phone booking created. The guest has been emailed a link to sign the waiver and pay their deposit (48-hour hold started).' },
  'waiver-resent': { ok: true, text: 'Waiver email sent again.' },
  waiver_not_needed: { ok: false, text: 'That booking already has a signed waiver (or is no longer awaiting deposit). No email sent.' },
  missing_details: { ok: false, text: 'Please fill in the name, phone, party size and both dates. Nothing was saved.' },
  invalid_email: { ok: false, text: "That email address doesn't look right. The waiver and payment link are sent there. Nothing was saved." },
  not_found: { ok: false, text: 'That booking no longer exists. Refresh the page.' },
  error: { ok: false, text: 'Something went wrong. Nothing was changed. Please try again.' },
}

export function noticeFor(code: string): Notice {
  return NOTICES[code] ?? NOTICES.error
}
