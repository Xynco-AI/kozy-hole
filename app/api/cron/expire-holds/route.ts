import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { planDailyJobs, holdEndsAt, type JobBooking } from '@/lib/daily-jobs'
import { sendGuestHoldExpired, sendGuestPaymentReminder, sendOwnerPendingReminder } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Daily housekeeping (vercel.json): expire lapsed holds and past-dated requests,
// remind unpaid guests once, and remind the owner about unanswered requests.
// Rules live in lib/daily-jobs.ts.
export async function GET(req: NextRequest) {
  // Fail closed: a missing/blank secret rejects. CRON_SECRET MUST be set in
  // Vercel for the cron to run (Vercel auto-sends it as the bearer token).
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('unauthorized', { status: 401 })
  }

  try {
    const db = supabaseAdmin()
    const now = new Date()
    const { data, error } = await db
      .from('bookings')
      .select('id,status,created_at,approved_at,check_in,payment_reminder_sent_at')
      .in('status', ['REQUESTED', 'APPROVED'])
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    const bookings = (data ?? []) as JobBooking[]
    const plan = planDailyJobs(bookings, now)

    // Each update is guarded on the expected status, and only rows that actually
    // changed get an email, so a payment landing mid-run can't be expired.
    let expired: string[] = []
    if (plan.expire.length) {
      const { data: rows } = await db.from('bookings')
        .update({ status: 'EXPIRED' })
        .in('id', plan.expire).in('status', ['REQUESTED', 'APPROVED'])
        .select('id')
      expired = (rows ?? []).map(r => r.id)
    }
    const notify = plan.notifyExpired.filter(id => expired.includes(id))
    for (const id of notify) await sendGuestHoldExpired(id)

    let reminded = 0
    for (const id of plan.remindGuests) {
      const { data: rows } = await db.from('bookings')
        .update({ payment_reminder_sent_at: now.toISOString() })
        .eq('id', id).eq('status', 'APPROVED').is('payment_reminder_sent_at', null)
        .select('id')
      if (rows?.length) {
        const approvedAt = bookings.find(b => b.id === id)!.approved_at!
        await sendGuestPaymentReminder(id, holdEndsAt(approvedAt))
        reminded++
      }
    }

    await sendOwnerPendingReminder(plan.ownerPending)

    return NextResponse.json({
      ok: true, expired: expired.length, notifiedExpired: notify.length,
      paymentReminders: reminded, ownerPending: plan.ownerPending.length,
    })
  } catch (e) {
    console.error('daily cron failed', e)
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 })
  }
}
