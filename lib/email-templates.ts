/**
 * Email content as pure functions (no Resend/Supabase), so it can be unit-tested.
 * lib/email.ts loads the booking and sends. House style: no em dashes in emails.
 */
import { formatDate } from './dates'
import { money } from './format'
import { arrivalItems } from './addons'

export type Email = { subject: string; html: string }

export type EmailBooking = {
  id: string
  guest_name: string
  email: string
  phone: string
  party_size: number
  has_pet: boolean
  check_in: string
  check_out: string
  nights: number
  nightly_subtotal: number | string
  gst: number | string
  total: number | string
  deposit_amount: number | string
  card_charge: number | string | null
  addons: string[] | null
  cabins: string[]
}

const CARD_SURCHARGE = 0.03

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const e = escapeHtml
const dates = (b: EmailBooking) => `${formatDate(b.check_in)} to ${formatDate(b.check_out)}`
const cardCharge = (b: EmailBooking) => Number(b.card_charge ?? Number(b.deposit_amount) * (1 + CARD_SURCHARGE))
const balance = (b: EmailBooking) => Number(b.total) - Number(b.deposit_amount)

const button = (href: string, label: string, color = '#1b6') =>
  `<a href="${e(href)}" style="background:${color};color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block">${e(label)}</a>`

function table(rows: [string, string][]): string {
  return `<table cellpadding="6" style="border-collapse:collapse;margin:12px 0">${rows
    .map(([k, v]) => `<tr><td style="color:#666;padding-right:24px">${k}</td><td>${v}</td></tr>`)
    .join('')}</table>`
}

function stayDetails(b: EmailBooking): string {
  return table([
    ['Dates', e(dates(b))],
    ['Nights', String(b.nights)],
    [b.cabins.length > 1 ? 'Cabins' : 'Cabin', e(b.cabins.join(', ') || 'TBD')],
    ['Party', `${b.party_size}${b.has_pet ? ' + dog' : ''}`],
  ])
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** "2 nights", or "2 nights × 3 cabins" so a multi-cabin subtotal doesn't look like an overcharge. */
function nightsLabel(b: EmailBooking): string {
  const n = b.cabins.length
  return n > 1 ? `${plural(b.nights, 'night')} × ${plural(n, 'cabin')}` : plural(b.nights, 'night')
}

function priceBreakdown(b: EmailBooking): string {
  return table([
    [nightsLabel(b), money(b.nightly_subtotal)],
    ['GST (5%)', money(b.gst)],
    ['<b>Total</b>', `<b>${money(b.total)}</b>`],
    ['Deposit (50%)', `${money(b.deposit_amount)} by e-transfer, or ${money(cardCharge(b))} by card (3% fee)`],
    ['Balance due on arrival', money(balance(b))],
  ])
}

function arrivalExtras(b: EmailBooking, emptyText: string | null): string {
  const items = arrivalItems({ addons: b.addons, hasPet: b.has_pet })
  if (items.length === 0) return emptyText === null ? '' : `<p><b>Add-ons:</b> ${emptyText}</p>`
  const lis = items
    .map(i => `<li>${e(i.label)}: ${i.price === null ? 'price confirmed on arrival' : money(i.price)}</li>`)
    .join('')
  return `<p><b>Add-ons and fees paid on arrival:</b></p><ul>${lis}</ul>`
}

const DAMAGE_DEPOSIT_NOTE =
  'Damage deposit: 3 days before your stay you will get a separate email to authorize a $500 per cabin hold on your card. It is a hold only, not a charge, and it is released after checkout if the shack is left in good condition.'

// ─── Owner ───────────────────────────────────────────────────────────────────

export function ownerRequestAlert(b: EmailBooking, l: { approveUrl: string; declineUrl: string }): Email {
  return {
    subject: `New booking request - ${b.guest_name} (${dates(b)}${b.cabins.length > 1 ? `, ${b.cabins.length} cabins` : ''})`,
    html: `
      <h2>New booking request</h2>
      <p><b>${e(b.guest_name)}</b> · ${e(b.email)} · ${e(b.phone)}</p>
      ${stayDetails(b)}
      ${priceBreakdown(b)}
      ${arrivalExtras(b, 'None')}
      <p>${button(l.approveUrl, 'Approve')}&nbsp;&nbsp;${button(l.declineUrl, 'Decline', '#c33')}</p>`,
  }
}

export function ownerConfirmed(b: EmailBooking): Email {
  return {
    subject: `CONFIRMED: ${b.guest_name} ${dates(b)}`,
    html: `
      <p>Deposit paid. ${e(b.guest_name)} · ${e(b.phone)} · ${e(b.email)}</p>
      ${stayDetails(b)}
      ${arrivalExtras(b, 'None')}`,
  }
}

export function ownerPendingReminder(bookings: EmailBooking[], l: { dashboardUrl: string }): Email {
  const n = bookings.length
  const rows = bookings
    .map(b => `<li><b>${e(b.guest_name)}</b>: ${e(dates(b))}, ${e(b.cabins.join(', ') || 'no cabin')}, ${money(b.total)}</li>`)
    .join('')
  return {
    subject: `Reminder: ${plural(n, 'booking request')} waiting for your approval`,
    html: `
      <h2>${n === 1 ? 'A guest is' : `${n} guests are`} waiting to hear back</h2>
      <p>These requests have been waiting more than a day. Their cabins stay blocked for those dates until you approve or decline.</p>
      <ul>${rows}</ul>
      <p>${button(l.dashboardUrl, 'Open your dashboard')}</p>`,
  }
}

// ─── Guest ───────────────────────────────────────────────────────────────────

/** "Mon, Jan 11, 1:00 p.m." in Alberta time. */
function albertaDateTime(d: Date): string {
  return d.toLocaleString('en-CA', {
    timeZone: 'America/Edmonton', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function guestPaymentReminder(
  b: EmailBooking, l: { payUrl: string; etransferEmail: string; holdEndsAt: Date },
): Email {
  return {
    subject: 'Reminder: pay your deposit to keep your Kozy Hole dates',
    html: `
      <h2>Your dates are still on hold</h2>
      <p>Your stay ${e(dates(b))} is approved, but we haven't received your deposit yet.
        We're holding your dates until <b>${e(albertaDateTime(l.holdEndsAt))}</b> (Alberta time).</p>
      <p>${button(l.payUrl, `Pay ${money(cardCharge(b))} by card`)}</p>
      <p>Or e-transfer ${money(b.deposit_amount)} to ${e(l.etransferEmail)} (no additional fee, note your name + dates).</p>
      <p>Already paid by e-transfer? Thanks! We'll confirm as soon as it lands.</p>`,
  }
}

export function guestBookingUpdated(
  b: EmailBooking, l: { payUrl: string; etransferEmail: string; holdEndsAt: Date },
): Email {
  return {
    subject: 'Your Kozy Hole booking has been updated',
    html: `
      <h2>Your booking has been updated</h2>
      <p>Hi ${e(b.guest_name)}, we've changed your booking as discussed. Here are the new details:</p>
      ${stayDetails(b)}
      ${priceBreakdown(b)}
      ${arrivalExtras(b, null)}
      <p>Your dates are held until <b>${e(albertaDateTime(l.holdEndsAt))}</b> (Alberta time). Pay your 50% deposit to confirm.
        <b>Any earlier payment link no longer works</b>, so please use this one:</p>
      <p>${button(l.payUrl, `Pay ${money(cardCharge(b))} by card`)}</p>
      <p>Or e-transfer ${money(b.deposit_amount)} to ${e(l.etransferEmail)} (no additional fee, note your name + dates).</p>
      <p>Questions? Reply to this email.</p>`,
  }
}

export function guestConfirmationMistake(
  b: EmailBooking, l: { payUrl: string; etransferEmail: string; holdEndsAt: Date },
): Email {
  return {
    subject: 'Correction: your Kozy Hole deposit has not been received yet',
    html: `
      <h2>Sorry, our mistake</h2>
      <p>Hi ${e(b.guest_name)}, we sent you a "booking confirmed" email by mistake. Your deposit for ${e(dates(b))} has <b>not been received yet</b>, so your booking isn't confirmed.</p>
      <p>Your dates are held until <b>${e(albertaDateTime(l.holdEndsAt))}</b> (Alberta time). Pay your 50% deposit to confirm:</p>
      <p>${button(l.payUrl, `Pay ${money(cardCharge(b))} by card`)}</p>
      <p>Or e-transfer ${money(b.deposit_amount)} to ${e(l.etransferEmail)} (no additional fee, note your name + dates).</p>
      <p>Already sent it? Just reply to this email and we'll sort it out. Sorry for the confusion!</p>`,
  }
}

export function guestHoldExpired(b: EmailBooking, l: { bookUrl: string }): Email {
  return {
    subject: 'Your Kozy Hole hold has expired',
    html: `
      <h2>Your hold has expired</h2>
      <p>Hi ${e(b.guest_name)}, we didn't receive the deposit for ${e(dates(b))} within 48 hours, so those dates have been released.</p>
      <p>Still want to come? If the dates are free you can send a new request any time.</p>
      <p>${button(l.bookUrl, 'Book again')}</p>
      <p>If you already sent an e-transfer, just reply to this email and we'll sort it out.</p>`,
  }
}

export function guestRequestReceived(b: EmailBooking, l: { statusUrl: string }): Email {
  return {
    subject: 'We got your Kozy Hole booking request',
    html: `
      <h2>Thanks, ${e(b.guest_name)}! We got your request.</h2>
      <p>Your booking is <b>not confirmed yet</b>. We review every request (ice and weather permitting) and usually reply quickly. <b>No payment is taken until we approve it.</b></p>
      ${stayDetails(b)}
      <h3>Price breakdown</h3>
      ${priceBreakdown(b)}
      ${arrivalExtras(b, null)}
      <h3>What happens next</h3>
      <ol>
        <li>We approve your request and email you a link to pay the 50% deposit.</li>
        <li>Your dates are held for 48 hours after approval. Paying the deposit confirms your stay.</li>
        <li>${DAMAGE_DEPOSIT_NOTE}</li>
      </ol>
      <p>${button(l.statusUrl, 'View your booking')}</p>
      <p>Questions? Reply to this email.</p>`,
  }
}

export function guestApproved(b: EmailBooking, l: { payUrl: string; etransferEmail: string }): Email {
  return {
    subject: 'Your Kozy Hole booking is approved - pay your deposit',
    html: `
      <h2>You're approved!</h2>
      <p>To lock it in, pay your 50% deposit (${money(b.deposit_amount)}).</p>
      ${stayDetails(b)}
      ${priceBreakdown(b)}
      ${arrivalExtras(b, null)}
      <p><a href="${e(l.payUrl)}">Pay by card</a> (${money(cardCharge(b))} incl. 3% fee) or e-transfer ${money(b.deposit_amount)} to ${e(l.etransferEmail)} (no additional fee, note your name + dates).</p>
      <p>We hold your dates for 48 hours.</p>
      <p><strong>Heads up:</strong> 3 days before your stay you'll receive a separate email to authorize a $500/cabin damage deposit hold on your card. It is a hold only, not a charge, and it is released after checkout if the shack is left in good condition. Watch for that email closer to your trip.</p>`,
  }
}

export function guestConfirmed(b: EmailBooking): Email {
  return {
    subject: 'Your Kozy Hole booking is confirmed',
    html: `
      <h2>Confirmed!</h2>
      <p>${e(dates(b))}. Check-in 1 PM, check-out 11 AM.</p>
      ${stayDetails(b)}
      <p>Remaining balance due on arrival: <b>${money(balance(b))}</b>.</p>
      ${arrivalExtras(b, null)}
      <p>${DAMAGE_DEPOSIT_NOTE}</p>
      <p>We'll meet you at the lake and point you to your shack.</p>`,
  }
}

export function damageDepositRequest(b: EmailBooking, l: { depositUrl: string }): Email {
  const cabins = Math.max(b.cabins.length, 1)
  return {
    subject: 'Action required: Authorize your damage deposit - Kozy Hole',
    html: `
      <h2>Your stay is almost here!</h2>
      <p>Hi ${e(b.guest_name)},</p>
      <p>Your Kozy Hole stay starts on <strong>${e(formatDate(b.check_in))}</strong>.</p>
      <p>Before you arrive, please authorize a <strong>${money(cabins * 500)} CAD damage deposit hold</strong> on your card.
        This is a hold only. Your card is not charged. It will be released after checkout if the shack is left in good condition.</p>
      <p style="margin:24px 0">${button(l.depositUrl, 'Authorize damage deposit')}</p>
      <p>Questions? Reply to this email or text Rob at 780-910-7902.</p>
      <p>See you on the ice,<br>Rob &amp; Jason<br>Kozy Hole Ice Shack Rentals</p>`,
  }
}

export function cancellation(b: EmailBooking): Email {
  return {
    subject: 'Your Kozy Hole booking has been cancelled',
    html: `
      <h2>Your booking has been cancelled</h2>
      <p>Hi ${e(b.guest_name)},</p>
      <p>We're sorry to let you know that your booking for
        <strong>${e(dates(b))}</strong>
        has been cancelled and those dates have been released.</p>
      <p>If you cancelled with at least a week's notice, you may be eligible for a credit toward
        a future stay. We'll be in touch.</p>
      <p>We hope to host you another time at Kozy Hole!</p>`,
  }
}
