import { ADDONS } from './addons'

/** Rules for what the owner dashboard allows. Pure, so they can be unit-tested. */

/**
 * "Undo: not paid yet" is for an e-transfer the owner marked received by mistake.
 * Card payments are real Stripe charges (undoing one means a refund in Stripe), and once
 * the guest has authorized the damage-deposit hold the booking has moved on, so neither
 * can be undone here.
 */
export function canUndoEtransfer(b: {
  status: string
  payment_method: string | null
  damage_deposit_status: string | null
}): boolean {
  return b.status === 'CONFIRMED' && b.payment_method === 'etransfer' && !b.damage_deposit_status
}

/** Card or e-transfer deposit is only offered once approved AND the guest has signed the waiver. */
export function canPayDeposit(b: { status: string; hasWaiver: boolean }): boolean {
  return b.status === 'APPROVED' && b.hasWaiver
}

/** Text of the "Are you sure?" pop-up on "Mark e-transfer received". */
export function etransferConfirmMessage(p: { guestName: string; amount: string; hasWaiver: boolean }): string {
  const lines = [
    `Mark ${p.guestName}'s ${p.amount} deposit as received?`,
    '',
    `This confirms the booking and emails ${p.guestName} a confirmation. Only do this once the e-transfer is in your bank.`,
  ]
  if (!p.hasWaiver) {
    lines.push('', `Warning: ${p.guestName} has not signed the safety waiver yet. You can resend the waiver email from the dashboard.`)
  }
  return lines.join('\n')
}

export type PhoneBooking = {
  guestName: string
  email: string
  phone: string
  partySize: number
  hasPet: boolean
  checkIn: string
  checkOut: string
  cabinIds: string[]
  addons: string[]
}

const DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Read and validate the dashboard's "New phone booking" form. */
export function parsePhoneBooking(f: FormData):
  { ok: true; data: PhoneBooking } | { ok: false; error: 'missing_details' | 'invalid_email' | 'no_cabins' } {
  const str = (k: string) => String(f.get(k) ?? '').trim()
  const guestName = str('guestName')
  const email = str('email')
  const phone = str('phone')
  const partySize = Number(str('partySize'))
  const checkIn = str('checkIn')
  const checkOut = str('checkOut')
  const cabinIds = [...new Set(f.getAll('cabinIds').map(String).filter(Boolean))]
  const menu = new Set(ADDONS.map(a => a.label))
  const addons = f.getAll('addons').map(String).filter(a => menu.has(a))

  if (guestName.length < 2 || phone.length < 7 || !DATE.test(checkIn) || !DATE.test(checkOut)
      || !Number.isInteger(partySize) || partySize < 1 || partySize > 15) {
    return { ok: false, error: 'missing_details' }
  }
  if (!EMAIL.test(email)) return { ok: false, error: 'invalid_email' }
  if (cabinIds.length === 0) return { ok: false, error: 'no_cabins' }

  return { ok: true, data: { guestName, email, phone, partySize, hasPet: f.get('hasPet') === 'on', checkIn, checkOut, cabinIds, addons } }
}
