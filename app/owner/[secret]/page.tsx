import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Container from '@/components/Container'
import Button from '@/components/Button'
import { supabaseAdmin } from '@/lib/supabase'
import { safeEqual } from '@/lib/tokens'
import { formatDate } from '@/lib/dates'
import {
  ownerApprove,
  ownerDecline,
  confirmEtransfer,
  markCompleted,
  approveReview,
  blockDates,
  ownerChangeCabins,
} from './actions'
import CancelForm from './CancelForm'

type BookedCabin = { cabin_id: string; cabins: { name: string; sort_order: number } | null }

/** A booking's cabins in display order, from the booking_cabins join. */
function bookedCabins(b: { booking_cabins?: BookedCabin[] }): { id: string; name: string }[] {
  return (b.booking_cabins ?? [])
    .filter((bc) => bc.cabins)
    .sort((x, y) => x.cabins!.sort_order - y.cabins!.sort_order)
    .map((bc) => ({ id: bc.cabin_id, name: bc.cabins!.name }))
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Owner Dashboard — Kozy Hole',
  robots: { index: false, follow: false },
}

// ─── money helper ─────────────────────────────────────────────────────────────
function money(n: number | string | null): string {
  return Number(n).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
}

function fmtDate(d: string): string {
  return formatDate(d)
}

// ─── shared UI primitives ─────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 inline-flex items-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ice">
      {children}
    </h2>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-hairline bg-surface p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-hairline bg-surface/50 px-5 py-4 text-sm text-muted">
      {message}
    </p>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

const NOTICES: Record<string, { ok: boolean; text: string }> = {
  'cabins-updated': { ok: true, text: 'Cabins updated and the price recalculated. Approve it when ready.' },
  cabin_unavailable: { ok: false, text: 'That cabin is already booked or blocked for those dates. Nothing was changed.' },
  not_pending: { ok: false, text: 'Only requests that have not been approved yet can be changed.' },
  no_cabins: { ok: false, text: 'Pick at least one cabin.' },
  error: { ok: false, text: 'Something went wrong. Nothing was changed. Please try again.' },
}

export default async function OwnerDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ secret: string }>
  searchParams: Promise<{ notice?: string }>
}) {
  const { secret } = await params
  const notice = NOTICES[(await searchParams).notice ?? '']

  // Auth gate — wrong secret → 404
  if (!process.env.OWNER_DASHBOARD_SECRET || !safeEqual(secret, process.env.OWNER_DASHBOARD_SECRET)) {
    notFound()
  }

  // ── data fetching (all wrapped so empty sections render on DB errors) ──────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pending: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let awaitingDeposit: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let upcoming: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pendingReviews: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let blockedDates: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cabins: any[] = []

  const today = new Date().toISOString().slice(0, 10)

  try {
    const db = supabaseAdmin()
    const [p, a, u, r, bl, c] = await Promise.all([
      db
        .from('bookings')
        .select('*, booking_cabins(cabin_id, cabins(name, sort_order))')
        .eq('status', 'REQUESTED')
        .order('created_at', { ascending: true }),
      db
        .from('bookings')
        .select('*')
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: true }),
      db
        .from('bookings')
        .select('*')
        .eq('status', 'CONFIRMED')
        .gte('check_out', today)
        .order('check_in', { ascending: true }),
      db
        .from('reviews')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: false }),
      db
        .from('blocked_dates')
        .select('*, cabins(name)')
        .order('start_date', { ascending: true }),
      db
        .from('cabins')
        .select('id, name')
        .order('sort_order', { ascending: true }),
    ])
    pending = p.data ?? []
    awaitingDeposit = a.data ?? []
    upcoming = u.data ?? []
    pendingReviews = r.data ?? []
    blockedDates = bl.data ?? []
    cabins = c.data ?? []
  } catch {
    // DB unavailable — all sections will render empty state
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── branded header bar ─────────────────────────────────────────────── */}
      <header className="border-b border-hairline bg-surface/60 backdrop-blur-sm">
        <Container className="flex items-center justify-between py-4">
          <div>
            <span className="font-display text-[1.25rem] font-semibold tracking-tight text-ink">
              Kozy Hole
            </span>
            <span className="ml-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted">
              Owner Dashboard
            </span>
          </div>
          <span className="rounded-full border border-ice/30 bg-ice/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-widest text-ice">
            Private
          </span>
        </Container>
      </header>

      <Container className="py-10 sm:py-14">
        {notice && (
          <p
            role="status"
            className={[
              'mb-8 rounded-xl border px-5 py-4 text-sm',
              notice.ok ? 'border-success/40 bg-success/10 text-ink' : 'border-danger/40 bg-danger/10 text-ink',
            ].join(' ')}
          >
            {notice.text}
          </p>
        )}
        <div className="flex flex-col gap-14">

          {/* ── 1. Pending requests ────────────────────────────────────────── */}
          <section>
            <SectionTitle>Pending Requests ({pending.length})</SectionTitle>
            {pending.length === 0 ? (
              <EmptyState message="No pending requests." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pending.map((b) => (
                  <Card key={b.id}>
                    <p className="mb-3 font-semibold text-ink">{b.guest_name}</p>
                    <div className="mb-3 divide-y divide-hairline rounded-lg border border-hairline bg-canvas/50 px-3">
                      <DetailRow label="Email" value={<a href={`mailto:${b.email}`} className="text-ice underline-offset-2 hover:underline">{b.email}</a>} />
                      <DetailRow label="Phone" value={<a href={`tel:${b.phone}`} className="text-ice underline-offset-2 hover:underline">{b.phone}</a>} />
                      <DetailRow label="Cabins" value={bookedCabins(b).map((c) => c.name).join(', ') || '—'} />
                      <DetailRow label="Dates" value={`${fmtDate(b.check_in)} – ${fmtDate(b.check_out)}`} />
                      <DetailRow label="Nights" value={b.nights} />
                      <DetailRow label="Party" value={`${b.party_size}${b.has_pet ? ' + pet' : ''}`} />
                      <DetailRow label="Add-ons" value={b.addons?.length ? b.addons.join(', ') : 'None'} />
                      <DetailRow label="Total" value={money(b.total)} />
                      <DetailRow label="Deposit" value={money(b.deposit_amount)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={ownerApprove}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <input type="hidden" name="secret" value={secret} />
                        <Button type="submit" variant="primary" size="md">
                          Approve
                        </Button>
                      </form>
                      <form action={ownerDecline}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <input type="hidden" name="secret" value={secret} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="md"
                          className="border-danger/40 text-danger hover:border-danger/70 hover:bg-danger/5"
                        >
                          Decline
                        </Button>
                      </form>
                    </div>
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer text-muted hover:text-ink">Change cabins</summary>
                      <form action={ownerChangeCabins} className="mt-3 flex flex-col gap-2">
                        <input type="hidden" name="bookingId" value={b.id} />
                        <input type="hidden" name="secret" value={secret} />
                        {cabins.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 text-ink">
                            <input
                              type="checkbox"
                              name="cabinIds"
                              value={c.id}
                              defaultChecked={bookedCabins(b).some((bc) => bc.id === c.id)}
                              className="h-4 w-4 accent-[var(--color-ice)]"
                            />
                            {c.name}
                          </label>
                        ))}
                        <p className="text-xs text-muted">The price is recalculated for the new number of cabins.</p>
                        <Button type="submit" variant="ghost" size="md" className="self-start">
                          Save cabins
                        </Button>
                      </form>
                    </details>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ── 2. Awaiting deposit ────────────────────────────────────────── */}
          <section>
            <SectionTitle>Awaiting Deposit ({awaitingDeposit.length})</SectionTitle>
            {awaitingDeposit.length === 0 ? (
              <EmptyState message="No bookings awaiting deposit." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {awaitingDeposit.map((b) => (
                  <Card key={b.id}>
                    <p className="mb-3 font-semibold text-ink">{b.guest_name}</p>
                    <div className="mb-3 divide-y divide-hairline rounded-lg border border-hairline bg-canvas/50 px-3">
                      <DetailRow label="Email" value={<a href={`mailto:${b.email}`} className="text-ice underline-offset-2 hover:underline">{b.email}</a>} />
                      <DetailRow label="Phone" value={<a href={`tel:${b.phone}`} className="text-ice underline-offset-2 hover:underline">{b.phone}</a>} />
                      <DetailRow label="Dates" value={`${fmtDate(b.check_in)} – ${fmtDate(b.check_out)}`} />
                      <DetailRow label="Nights" value={b.nights} />
                      <DetailRow label="Deposit owed" value={money(b.deposit_amount)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={confirmEtransfer}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <input type="hidden" name="secret" value={secret} />
                        <Button type="submit" variant="secondary" size="md">
                          Mark e-transfer received
                        </Button>
                      </form>
                      <CancelForm bookingId={b.id} secret={secret} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ── 3. Upcoming confirmed ─────────────────────────────────────── */}
          <section>
            <SectionTitle>Upcoming Confirmed ({upcoming.length})</SectionTitle>
            {upcoming.length === 0 ? (
              <EmptyState message="No upcoming confirmed bookings." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {upcoming.map((b) => (
                  <Card key={b.id}>
                    <p className="mb-3 font-semibold text-ink">{b.guest_name}</p>
                    <div className="mb-3 divide-y divide-hairline rounded-lg border border-hairline bg-canvas/50 px-3">
                      <DetailRow label="Email" value={<a href={`mailto:${b.email}`} className="text-ice underline-offset-2 hover:underline">{b.email}</a>} />
                      <DetailRow label="Phone" value={<a href={`tel:${b.phone}`} className="text-ice underline-offset-2 hover:underline">{b.phone}</a>} />
                      <DetailRow label="Dates" value={`${fmtDate(b.check_in)} – ${fmtDate(b.check_out)}`} />
                      <DetailRow label="Nights" value={b.nights} />
                      <DetailRow label="Party" value={`${b.party_size}${b.has_pet ? ' + pet' : ''}`} />
                      <DetailRow label="Add-ons" value={b.addons?.length ? b.addons.join(', ') : 'None'} />
                      <DetailRow label="Payment" value={b.payment_method ?? '—'} />
                    </div>
                    <form action={markCompleted}>
                      <input type="hidden" name="bookingId" value={b.id} />
                      <input type="hidden" name="secret" value={secret} />
                      <Button type="submit" variant="ghost" size="md">
                        Mark completed
                      </Button>
                    </form>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ── 4. Pending reviews ─────────────────────────────────────────── */}
          <section>
            <SectionTitle>Pending Reviews ({pendingReviews.length})</SectionTitle>
            {pendingReviews.length === 0 ? (
              <EmptyState message="No reviews awaiting approval." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {pendingReviews.map((r) => (
                  <Card key={r.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold text-ink">{r.guest_name}</p>
                      <span className="text-amber font-semibold">{'★'.repeat(r.rating)}</span>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-muted">{r.comment}</p>
                    <form action={approveReview}>
                      <input type="hidden" name="reviewId" value={r.id} />
                      <input type="hidden" name="secret" value={secret} />
                      <Button type="submit" variant="secondary" size="md">
                        Approve review
                      </Button>
                    </form>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ── 5. Block dates ─────────────────────────────────────────────── */}
          <section>
            <SectionTitle>Block Dates</SectionTitle>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* form */}
              <Card>
                <p className="mb-5 text-sm font-semibold text-ink">Add a block</p>
                <form action={blockDates} className="flex flex-col gap-4">
                  <input type="hidden" name="secret" value={secret} />

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
                      Cabin
                    </span>
                    <select
                      name="cabinId"
                      required
                      className="rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ice/60"
                    >
                      <option value="">Select cabin…</option>
                      {cabins.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
                        Start date
                      </span>
                      <input
                        type="date"
                        name="startDate"
                        required
                        className="rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ice/60"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
                        Last blocked day
                      </span>
                      <input
                        type="date"
                        name="endDate"
                        required
                        className="rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ice/60"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-wide text-muted">
                      Reason (optional)
                    </span>
                    <input
                      type="text"
                      name="reason"
                      placeholder="Maintenance, personal use…"
                      className="rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-ice/60"
                    />
                  </label>

                  <Button type="submit" variant="primary" size="md" className="self-start">
                    Block dates
                  </Button>
                </form>
              </Card>

              {/* existing blocks */}
              <div>
                <p className="mb-3 text-sm font-semibold text-ink">Existing blocks</p>
                {blockedDates.length === 0 ? (
                  <EmptyState message="No dates currently blocked." />
                ) : (
                  <div className="flex flex-col gap-2">
                    {blockedDates.map((bl) => (
                      <div
                        key={bl.id}
                        className="flex items-start justify-between gap-4 rounded-xl border border-hairline bg-surface px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(bl.cabins as any)?.name ?? bl.cabin_id}
                          </p>
                          <p className="text-xs text-muted">
                            {fmtDate(bl.start_date)} – {fmtDate(bl.end_date)}
                          </p>
                          {bl.reason && (
                            <p className="mt-0.5 text-xs text-muted/70">{bl.reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </Container>
    </div>
  )
}
