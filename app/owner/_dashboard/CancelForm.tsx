'use client'

import Button from '@/components/Button'
import { cancelBooking } from './actions'

export default function CancelForm({
  bookingId,
}: {
  bookingId: string
}) {
  return (
    <form
      action={cancelBooking}
      onSubmit={(e) => {
        if (!confirm('Cancel this booking and notify the guest?')) e.preventDefault()
      }}
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button
        type="submit"
        variant="ghost"
        size="md"
        className="border-danger/40 text-danger hover:border-danger/70 hover:bg-danger/5"
      >
        Cancel booking
      </Button>
    </form>
  )
}
