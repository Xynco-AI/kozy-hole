import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Optional auth: if CRON_SECRET is configured, require Vercel's bearer header.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('unauthorized', { status: 401 })
  }
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const db = supabaseAdmin()
    const { data, error } = await db
      .from('bookings')
      .update({ status: 'EXPIRED' })
      .eq('status', 'APPROVED')
      .lt('approved_at', cutoff)
      .select('id')
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, expired: data?.length ?? 0 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 })
  }
}
