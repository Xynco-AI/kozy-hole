import { Resend } from 'resend'
import { supabaseAdmin } from './supabase'
import { formatDate } from './dates'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = 'Kozy Hole <bookings@kozyhole.ca>'
const site = process.env.NEXT_PUBLIC_SITE_URL!

async function getBooking(id: string) {
  const { data } = await supabaseAdmin().from('bookings').select('*').eq('id', id).single()
  return data!
}

export async function sendOwnerRequestAlert(bookingId: string) {
  const b = await getBooking(bookingId)
  const approve = `${site}/api/bookings/${b.id}/approve?token=${b.approval_token}`
  const decline = `${site}/api/bookings/${b.id}/decline?token=${b.approval_token}`
  const { error } = await resend.emails.send({
    from: FROM,
    to: process.env.OWNER_EMAIL!,
    subject: `New booking request — ${b.guest_name} (${b.check_in} to ${b.check_out})`,
    html: `
      <h2>New booking request</h2>
      <p><b>${b.guest_name}</b> · ${b.email} · ${b.phone}</p>
      <p>${b.check_in} to ${b.check_out} · ${b.nights} nights · party ${b.party_size}${b.has_pet ? ' · has pet' : ''}</p>
      <p>Total $${b.total} (incl GST $${b.gst}) · deposit $${b.deposit_amount}</p>
      <p>
        <a href="${approve}" style="background:#1b6;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Approve</a>
        &nbsp;&nbsp;
        <a href="${decline}" style="background:#c33;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Decline</a>
      </p>`,
  })
  if (error) console.error('sendOwnerRequestAlert failed', { bookingId, error })
}

export async function sendGuestApproved(bookingId: string, payUrl: string) {
  const b = await getBooking(bookingId)
  const { error } = await resend.emails.send({
    from: FROM,
    to: b.email,
    subject: 'Your Kozy Hole booking is approved — pay your deposit',
    html: `
      <h2>You're approved!</h2>
      <p>${b.check_in} to ${b.check_out}. To lock it in, pay your 50% deposit ($${b.deposit_amount}).</p>
      <p><a href="${payUrl}">Pay by card</a> (3% fee) or e-transfer $${b.deposit_amount} to ${process.env.OWNER_EMAIL} (no additional fee, note your name + dates).</p>
      <p>We hold your dates for 48 hours.</p>`,
  })
  if (error) console.error('sendGuestApproved failed', { bookingId, error })
}

export async function sendConfirmation(bookingId: string) {
  const b = await getBooking(bookingId)
  const guestRes = await resend.emails.send({
    from: FROM, to: b.email,
    subject: 'Your Kozy Hole booking is confirmed',
    html: `<h2>Confirmed!</h2><p>${b.check_in} to ${b.check_out}. Check-in 1 PM, check-out 11 AM.</p>
      <p>You'll receive a separate email 3 days before your stay with a link to authorize your $500/cabin damage deposit hold online — it's a hold only, not a charge, and it's released after checkout.</p>
      <p>Remaining balance${b.has_pet ? ' and the $50 pet fee' : ''} ${b.has_pet ? 'are' : 'is'} due on arrival. We'll meet you at the lake and point you to your shack.</p>`,
  })
  if (guestRes.error) console.error('sendConfirmation (guest) failed', { bookingId, error: guestRes.error })
  const ownerRes = await resend.emails.send({
    from: FROM, to: process.env.OWNER_EMAIL!,
    subject: `CONFIRMED: ${b.guest_name} ${b.check_in} to ${b.check_out}`,
    html: `<p>Deposit paid. ${b.guest_name} · ${b.phone} · ${b.email}</p>`,
  })
  if (ownerRes.error) console.error('sendConfirmation (owner) failed', { bookingId, error: ownerRes.error })
}

export async function sendDamageDepositRequest(bookingId: string, cabinCount: number) {
  const b = await getBooking(bookingId)
  const depositTotal = cabinCount * 500
  const depositUrl = `${site}/booking/${bookingId}/damage-deposit`
  const { error } = await resend.emails.send({
    from: FROM,
    to: b.email,
    subject: 'Action required: Authorize your damage deposit — Kozy Hole',
    html: `
      <h2>Your stay is almost here!</h2>
      <p>Hi ${b.guest_name},</p>
      <p>Your Kozy Hole stay starts on <strong>${formatDate(b.check_in)}</strong>.</p>
      <p>Before you arrive, please authorize a <strong>$${depositTotal} CAD damage deposit hold</strong> on your card.
        This is a hold only — your card is not charged. It will be released after checkout if the shack is left in good condition.</p>
      <p style="margin:24px 0">
        <a href="${depositUrl}" style="background:#1b6;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">
          Authorize damage deposit →
        </a>
      </p>
      <p>Questions? Reply to this email or text Rob at 780-910-7902.</p>
      <p>See you on the ice,<br>Rob &amp; Jason<br>Kozy Hole Ice Shack Rentals</p>`,
  })
  if (error) console.error('sendDamageDepositRequest failed', { bookingId, error })
}

export async function sendCancellation(bookingId: string) {
  const b = await getBooking(bookingId)
  const { error } = await resend.emails.send({
    from: FROM,
    to: b.email,
    subject: 'Your Kozy Hole booking has been cancelled',
    html: `
      <h2>Your booking has been cancelled</h2>
      <p>Hi ${b.guest_name},</p>
      <p>We're sorry to let you know that your booking for
        <strong>${formatDate(b.check_in)} → ${formatDate(b.check_out)}</strong>
        has been cancelled and those dates have been released.</p>
      <p>If you cancelled with at least a week's notice, you may be eligible for a credit toward
        a future stay — we'll be in touch.</p>
      <p>We hope to host you another time at Kozy Hole!</p>`,
  })
  if (error) console.error('sendCancellation failed', { bookingId, error })
}
