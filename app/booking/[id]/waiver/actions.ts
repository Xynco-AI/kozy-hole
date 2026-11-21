'use server'

import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

const ACTIVE = ['REQUESTED', 'APPROVED', 'CONFIRMED']

/** Guest signs the safety waiver (phone bookings). Then they're sent on to pay. */
export async function signWaiver(formData: FormData): Promise<void> {
  const bookingId = String(formData.get('bookingId') ?? '')
  const signerName = String(formData.get('signerName') ?? '').trim()
  const partyMembers = formData.getAll('partyMembers').map(String).map(s => s.trim()).filter(Boolean)
  const agreed = formData.get('agreed') === 'on'

  if (!bookingId) redirect('/')
  if (signerName.length < 2 || !agreed) redirect(`/booking/${bookingId}/waiver?error=incomplete`)

  let ok = false
  try {
    const db = supabaseAdmin()
    const { data: b } = await db.from('bookings').select('status, waivers(id)').eq('id', bookingId).single()
    if (b && ACTIVE.includes(b.status)) {
      if ((b.waivers?.length ?? 0) > 0) {
        ok = true // already signed
      } else {
        const { error } = await db.from('waivers').insert({
          booking_id: bookingId, signer_name: signerName, party_members: partyMembers, agreed: true,
        })
        ok = !error
        if (error) console.error('signWaiver insert failed', error)
      }
    }
  } catch (e) {
    console.error('signWaiver failed', e)
  }

  redirect(ok ? `/booking/${bookingId}?waiver=signed` : `/booking/${bookingId}/waiver?error=failed`)
}
