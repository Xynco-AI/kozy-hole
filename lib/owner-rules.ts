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
