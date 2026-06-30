'use server'

import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { quote, validateStay } from '@/lib/pricing'
import { isCabinAvailable, DateRange } from '@/lib/availability'
import { generateToken } from '@/lib/tokens'
import { parseLocalDate } from '@/lib/dates'
import { sendOwnerRequestAlert } from '@/lib/email'

const schema = z.object({
  guestName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  partySize: z.number().int().min(1).max(15),
  hasPet: z.boolean(),
  checkIn: z.string(),  // 'YYYY-MM-DD'
  checkOut: z.string(),
  cabinIds: z.array(z.string().uuid()).min(1).max(3),
  addons: z.array(z.string()),
  waiverAgreed: z.literal(true),
  partyMembers: z.array(z.string()),
})

export async function createBookingRequest(input: unknown) {
  const data = schema.parse(input)
  const checkIn = parseLocalDate(data.checkIn)
  const checkOut = parseLocalDate(data.checkOut)

  const stayError = validateStay(checkIn, checkOut)
  if (stayError) return { ok: false, error: stayError }

  // TODO(phase2): the availability check below is not transactional — two
  // simultaneous requests for the same cabin/dates can both pass. Known v1
  // limitation; wrap in an advisory lock / serializable transaction in phase 2.

  const db = supabaseAdmin()
  const requested: DateRange = { checkIn, checkOut }

  // availability: gather active bookings + blocked dates for each selected cabin
  for (const cabinId of data.cabinIds) {
    const { data: rows } = await db
      .from('booking_cabins')
      .select('bookings!inner(check_in,check_out,status)')
      .eq('cabin_id', cabinId)
    const active = (rows ?? [])
      .map((r: any) => r.bookings)
      .filter((b: any) => ['REQUESTED', 'APPROVED', 'CONFIRMED'].includes(b.status))
      .map((b: any) => ({ checkIn: parseLocalDate(b.check_in), checkOut: parseLocalDate(b.check_out) }))

    const { data: blocks } = await db
      .from('blocked_dates').select('start_date,end_date').eq('cabin_id', cabinId)
    const blocked = (blocks ?? []).map((b: any) =>
      ({ checkIn: parseLocalDate(b.start_date), checkOut: parseLocalDate(b.end_date) }))

    if (!isCabinAvailable(requested, [...active, ...blocked])) {
      return { ok: false, error: 'CABIN_UNAVAILABLE', cabinId }
    }
  }

  const q = quote(checkIn, checkOut, data.cabinIds.length)
  const approvalToken = generateToken()

  const { data: booking, error } = await db.from('bookings').insert({
    guest_name: data.guestName,
    email: data.email,
    phone: data.phone,
    party_size: data.partySize,
    has_pet: data.hasPet,
    check_in: data.checkIn,
    check_out: data.checkOut,
    nights: q.nights,
    nightly_subtotal: q.nightlySubtotal,
    gst: q.gst,
    total: q.total,
    deposit_amount: q.deposit,
    card_charge: q.cardCharge,
    status: 'REQUESTED',
    approval_token: approvalToken,
    addons: data.addons,
  }).select().single()
  if (error || !booking) return { ok: false, error: 'DB_ERROR' }

  await db.from('booking_cabins').insert(
    data.cabinIds.map(id => ({ booking_id: booking.id, cabin_id: id })))
  await db.from('waivers').insert({
    booking_id: booking.id,
    signer_name: data.guestName,
    party_members: data.partyMembers,
    agreed: true,
  })

  await sendOwnerRequestAlert(booking.id)
  return { ok: true, bookingId: booking.id }
}
