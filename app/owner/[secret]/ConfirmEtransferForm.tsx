'use client'

import Button from '@/components/Button'
import { confirmEtransfer } from './actions'

/** "Mark e-transfer received", with an "Are you sure?" step: it confirms the booking and emails the guest. */
export default function ConfirmEtransferForm({
  bookingId,
  secret,
  guestName,
  amount,
}: {
  bookingId: string
  secret: string
  guestName: string
  amount: string
}) {
  return (
    <form
      action={confirmEtransfer}
      onSubmit={(e) => {
        const ok = confirm(
          `Mark ${guestName}'s ${amount} deposit as received?\n\n` +
            `This confirms the booking and emails ${guestName} a confirmation. ` +
            `Only do this once the e-transfer is in your bank.`,
        )
        if (!ok) e.preventDefault()
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="secret" value={secret} />
      <Button type="submit" variant="secondary" size="md">
        Mark e-transfer received
      </Button>
    </form>
  )
}
