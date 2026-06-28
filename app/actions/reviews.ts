'use server'

import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

const schema = z.object({
  guestName: z.string().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(4).max(1000),
})

export async function submitReview(input: unknown) {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'INVALID' }
  try {
    const { error } = await supabaseAdmin().from('reviews').insert({
      guest_name: parsed.data.guestName,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      approved: false,
    })
    if (error) return { ok: false, error: 'DB_ERROR' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'DB_ERROR' }
  }
}
