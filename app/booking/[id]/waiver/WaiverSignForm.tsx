'use client'

import { useState } from 'react'
import WaiverBox from '@/components/booking/WaiverBox'
import Button from '@/components/Button'
import { signWaiver } from './actions'

export default function WaiverSignForm({
  bookingId,
  guestName,
  partySize,
}: {
  bookingId: string
  guestName: string
  partySize: number
}) {
  const [signerName, setSignerName] = useState(guestName)
  const [partyMembers, setPartyMembers] = useState<string[]>([])
  const [agreed, setAgreed] = useState(false)

  return (
    <form action={signWaiver} className="flex flex-col gap-6">
      <input type="hidden" name="bookingId" value={bookingId} />
      {partyMembers.map((m, i) => (
        <input key={i} type="hidden" name="partyMembers" value={m} />
      ))}
      {agreed && <input type="hidden" name="agreed" value="on" />}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Your full name (signer, 18+)</span>
        <input
          name="signerName"
          required
          minLength={2}
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          className="h-11 rounded-xl border border-hairline bg-surface-2 px-4 text-sm text-ink focus:border-ice/60 focus:outline-none focus:ring-1 focus:ring-ice/30"
        />
      </label>

      <WaiverBox
        partySize={partySize}
        partyMembers={partyMembers}
        onPartyMembersChange={setPartyMembers}
        agreed={agreed}
        onAgreedChange={setAgreed}
      />

      <Button type="submit" variant="primary" size="lg" disabled={!agreed || signerName.trim().length < 2}>
        Sign and continue to payment
      </Button>
    </form>
  )
}
