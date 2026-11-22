'use client'

import Button from '@/components/Button'
import { undoEtransfer } from './actions'

/** "Undo: not paid yet" for an e-transfer marked received by mistake. */
export default function UndoEtransferForm({
  bookingId,
  guestName,
}: {
  bookingId: string
  guestName: string
}) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-muted hover:text-ink">Marked paid by mistake?</summary>
      <form
        action={undoEtransfer}
        className="mt-3 flex flex-col gap-3"
        onSubmit={(e) => {
          const ok = confirm(
            `Move ${guestName}'s booking back to "awaiting deposit"?\n\n` +
              `Their dates stay held for another 48 hours.`,
          )
          if (!ok) e.preventDefault()
        }}
      >
        <input type="hidden" name="bookingId" value={bookingId} />
        <label className="flex items-start gap-2 text-ink">
          <input type="checkbox" name="notifyGuest" defaultChecked className="mt-0.5 h-4 w-4 accent-[var(--color-ice)]" />
          <span>
            Email {guestName} a correction (&quot;that confirmation was sent by mistake, your deposit
            hasn&apos;t been received yet&quot;) with their payment link
          </span>
        </label>
        <Button type="submit" variant="ghost" size="md" className="self-start">
          Undo: not paid yet
        </Button>
      </form>
    </details>
  )
}
