'use server'

import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { quote, validateStay } from '@/lib/pricing'
import { generateToken } from '@/lib/tokens'
import { parseLocalDate } from '@/lib/dates'
import { sendOwnerRequestAlert, sendGuestRequestReceived } from '@/lib/email'
import { ADDONS } from '@/lib/addons'

const schema = z.object({
  guestName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  partySize: z.number().int().min(1).max(15),
  hasPet: z.boolean(),
  checkIn: z.string(),  // 'YYYY-MM-DD'
  checkOut: z.string(),
  cabinIds: z.array(z.string().uuid()).min(1).max(3),
  // Only labels from the add-on menu (also keeps guest-typed text out of emails).
  addons: z.array(z.enum(ADDONS.map(a => a.label) as [string, ...string[]])),
  waiverAgreed: z.literal(true),
  partyMembers: z.array(z.string()),
})

export async function createBookingRequest(input: unknown) {
  const data = schema.parse(input)
  const checkIn = parseLocalDate(data.checkIn)
  const checkOut = parseLocalDate(data.checkOut)

  const stayError = validateStay(checkIn, checkOut)
  if (stayError) return { ok: false, error: stayError }

  const q = quote(checkIn, checkOut, data.cabinIds.length)

  // Availability check + inserts happen atomically in Postgres, with per-cabin locks,
  // so two simultaneous requests cannot both get the same cabin/dates.
  // See supabase/migrations/0005_create_booking_request.sql.
  const { data: result, error } = await supabaseAdmin().rpc('create_booking_request', {
    p_guest_name: data.guestName,
    p_email: data.email,
    p_phone: data.phone,
    p_party_size: data.partySize,
    p_has_pet: data.hasPet,
    p_check_in: data.checkIn,
    p_check_out: data.checkOut,
    p_nights: q.nights,
    p_nightly_subtotal: q.nightlySubtotal,
    p_gst: q.gst,
    p_total: q.total,
    p_deposit_amount: q.deposit,
    p_card_charge: q.cardCharge,
    p_approval_token: generateToken(),
    p_addons: data.addons,
    p_cabin_ids: data.cabinIds,
    p_party_members: data.partyMembers,
  })
  if (error || !result) {
    console.error('create_booking_request failed', error)
    return { ok: false, error: 'DB_ERROR' }
  }
  if (!result.ok) return { ok: false, error: result.error ?? 'DB_ERROR', cabinId: result.cabin_id }

  await sendOwnerRequestAlert(result.booking_id)
  await sendGuestRequestReceived(result.booking_id)
  return { ok: true, bookingId: result.booking_id as string }
}
