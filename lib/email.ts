import { Resend } from 'resend'
import { supabaseAdmin } from './supabase'
import { etransferEmail } from './settings'
import { holdEndsAt } from './daily-jobs'
import * as templates from './email-templates'
import type { Email, EmailBooking } from './email-templates'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'Kozy Hole <bookings@kozyhole.ca>'
const site = process.env.NEXT_PUBLIC_SITE_URL!

async function getBooking(id: string): Promise<EmailBooking> {
  const { data } = await supabaseAdmin()
    .from('bookings')
    .select('*, booking_cabins(cabins(name, sort_order))')
    .eq('id', id)
    .single()
  const cabins = ((data!.booking_cabins ?? []) as { cabins: { name: string; sort_order: number } | null }[])
    .map(bc => bc.cabins)
    .filter((c): c is { name: string; sort_order: number } => !!c)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(c => c.name)
  return { ...data!, cabins }
}

async function send(to: string, email: Email, label: string, bookingId: string) {
  const { error } = await resend.emails.send({ from: FROM, to, ...email })
  if (error) console.error(`${label} failed`, { bookingId, error })
}

export async function sendOwnerRequestAlert(bookingId: string) {
  const b = await getBooking(bookingId)
  const token = encodeURIComponent((b as EmailBooking & { approval_token: string }).approval_token)
  await send(process.env.OWNER_EMAIL!, templates.ownerRequestAlert(b, {
    approveUrl: `${site}/api/bookings/${b.id}/approve?token=${token}`,
    declineUrl: `${site}/api/bookings/${b.id}/decline?token=${token}`,
  }), 'sendOwnerRequestAlert', bookingId)
}

export async function sendGuestRequestReceived(bookingId: string) {
  const b = await getBooking(bookingId)
  await send(b.email, templates.guestRequestReceived(b, { statusUrl: `${site}/booking/${b.id}` }),
    'sendGuestRequestReceived', bookingId)
}

export async function sendGuestApproved(bookingId: string, payUrl: string) {
  const b = await getBooking(bookingId)
  await send(b.email, templates.guestApproved(b, { payUrl, etransferEmail: etransferEmail() }),
    'sendGuestApproved', bookingId)
}

export async function sendConfirmation(bookingId: string) {
  const b = await getBooking(bookingId)
  await send(b.email, templates.guestConfirmed(b), 'sendConfirmation (guest)', bookingId)
  await send(process.env.OWNER_EMAIL!, templates.ownerConfirmed(b), 'sendConfirmation (owner)', bookingId)
}

export async function sendDamageDepositRequest(bookingId: string) {
  const b = await getBooking(bookingId)
  await send(b.email, templates.damageDepositRequest(b, { depositUrl: `${site}/booking/${b.id}/damage-deposit` }),
    'sendDamageDepositRequest', bookingId)
}

export async function sendOwnerPendingReminder(bookingIds: string[]) {
  if (bookingIds.length === 0) return
  const bookings = await Promise.all(bookingIds.map(getBooking))
  await send(process.env.OWNER_EMAIL!, templates.ownerPendingReminder(bookings, {
    dashboardUrl: `${site}/owner`,
  }), 'sendOwnerPendingReminder', bookingIds.join(','))
}

export async function sendGuestPaymentReminder(bookingId: string, holdEndsAt: Date) {
  const b = await getBooking(bookingId)
  await send(b.email, templates.guestPaymentReminder(b, {
    payUrl: `${site}/api/bookings/${b.id}/pay`, etransferEmail: etransferEmail(), holdEndsAt,
  }), 'sendGuestPaymentReminder', bookingId)
}

export async function sendGuestBookingUpdated(bookingId: string, holdEndsAt: Date) {
  const b = await getBooking(bookingId)
  await send(b.email, templates.guestBookingUpdated(b, {
    payUrl: `${site}/api/bookings/${b.id}/pay`, etransferEmail: etransferEmail(), holdEndsAt,
  }), 'sendGuestBookingUpdated', bookingId)
}

export async function sendGuestConfirmationMistake(bookingId: string, holdEndsAt: Date) {
  const b = await getBooking(bookingId)
  await send(b.email, templates.guestConfirmationMistake(b, {
    payUrl: `${site}/api/bookings/${b.id}/pay`, etransferEmail: etransferEmail(), holdEndsAt,
  }), 'sendGuestConfirmationMistake', bookingId)
}

/** Phone booking: links to the waiver page, which leads on to payment. */
export async function sendGuestPhoneBooking(bookingId: string) {
  const b = await getBooking(bookingId)
  const approvedAt = (b as EmailBooking & { approved_at: string }).approved_at
  await send(b.email, templates.guestPhoneBooking(b, {
    waiverUrl: `${site}/booking/${b.id}/waiver`, holdEndsAt: holdEndsAt(approvedAt),
  }), 'sendGuestPhoneBooking', bookingId)
}

export async function sendGuestHoldExpired(bookingId: string) {
  const b = await getBooking(bookingId)
  await send(b.email, templates.guestHoldExpired(b, { bookUrl: `${site}/book` }), 'sendGuestHoldExpired', bookingId)
}

export async function sendCancellation(bookingId: string) {
  const b = await getBooking(bookingId)
  await send(b.email, templates.cancellation(b), 'sendCancellation', bookingId)
}

export async function sendOwnerLoginLink(email: string, loginUrl: string) {
  await send(email, templates.ownerLoginLink({ loginUrl }), 'sendOwnerLoginLink', '-')
}
