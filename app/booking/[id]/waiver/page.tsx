import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import Container from '@/components/Container'
import { supabaseAdmin } from '@/lib/supabase'
import { formatDate } from '@/lib/dates'
import WaiverSignForm from './WaiverSignForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Sign your waiver — Kozy Hole' }

const ACTIVE = ['REQUESTED', 'APPROVED', 'CONFIRMED']

export default async function WaiverPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const { data: b } = await supabaseAdmin()
    .from('bookings')
    .select('id, guest_name, status, check_in, check_out, party_size, waivers(id)')
    .eq('id', id)
    .single()
  if (!b) notFound()
  if ((b.waivers?.length ?? 0) > 0) redirect(`/booking/${id}`)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen py-20">
        <Container size="narrow">
          <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-8 sm:p-12">
            <span className="mb-5 inline-flex items-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-amber">
              Step 1 of 2
            </span>
            <h1 className="font-display text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
              Sign your safety waiver
            </h1>
            <p className="mt-4 leading-relaxed text-muted">
              {formatDate(b.check_in)} to {formatDate(b.check_out)}. Please read the release below,
              list everyone in your group, and sign. Next you&apos;ll pay your 50% deposit.
            </p>

            {error && (
              <p role="alert" className="mt-6 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-ink">
                {error === 'incomplete'
                  ? 'Please enter your name and tick the box to agree.'
                  : 'Something went wrong saving your waiver. Please try again.'}
              </p>
            )}

            <div className="mt-8">
              {ACTIVE.includes(b.status) ? (
                <WaiverSignForm bookingId={b.id} guestName={b.guest_name} partySize={b.party_size} />
              ) : (
                <p className="text-muted">This booking is no longer active. Please contact us if you have questions.</p>
              )}
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  )
}
