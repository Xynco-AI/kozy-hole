import { Resend } from 'resend'
import { supabaseAdmin } from './supabase'

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
      <p><a href="${payUrl}">Pay by card</a> (3% fee) or e-transfer $${b.deposit_amount} to ${process.env.OWNER_EMAIL} (no fee, note your name + dates).</p>
      <p>We hold your dates for 48 hours.</p>`,
  })
  if (error) console.error('sendGuestApproved failed', { bookingId, error })
}

export async function sendConfirmation(bookingId: string) {
  const b = await getBooking(bookingId)
  const guestRes = await resend.emails.send({
    from: FROM, to: b.email,
    subject: 'Your Kozy Hole booking is confirmed',
    html: `<h2>Confirmed!</h2><p>${b.check_in} to ${b.check_out}. Check-in 1 PM, check-out 11 AM.
      Balance, $500/cabin damage deposit${b.has_pet ? ', and the $50 pet fee' : ''} are due on arrival.
      We'll meet you at the lake and point you to your shack.</p>`,
  })
  if (guestRes.error) console.error('sendConfirmation (guest) failed', { bookingId, error: guestRes.error })
  const ownerRes = await resend.emails.send({
    from: FROM, to: process.env.OWNER_EMAIL!,
    subject: `CONFIRMED: ${b.guest_name} ${b.check_in} to ${b.check_out}`,
    html: `<p>Deposit paid. ${b.guest_name} · ${b.phone} · ${b.email}</p>`,
  })
  if (ownerRes.error) console.error('sendConfirmation (owner) failed', { bookingId, error: ownerRes.error })
}
