'use client'

import Button from '@/components/Button'
import { confirmEtransfer } from './actions'
import { etransferConfirmMessage } from '@/lib/owner-rules'

/** "Mark e-transfer received", with an "Are you sure?" step: it confirms the booking and emails the guest. */
export default function ConfirmEtransferForm({
  bookingId,
  guestName,
  amount,
  hasWaiver,
}: {
  bookingId: string
  guestName: string
  amount: string
  hasWaiver: boolean
}) {
  return (
    <form
      action={confirmEtransfer}
      onSubmit={(e) => {
        const ok = confirm(etransferConfirmMessage({ guestName, amount, hasWaiver }))
        if (!ok) e.preventDefault()
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" variant="secondary" size="md">
        Mark e-transfer received
      </Button>
    </form>
  )
}
