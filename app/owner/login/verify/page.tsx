import type { Metadata } from 'next'
import Container from '@/components/Container'
import Button from '@/components/Button'
import { verifyLogin } from '../../login-actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Log in — Kozy Hole',
  robots: { index: false, follow: false },
}

// The emailed link opens this page instead of logging in straight away: some email
// providers "pre-click" links to scan them, which would use up the one-time link.
export default async function VerifyLogin({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <main className="min-h-screen bg-canvas py-20">
      <Container size="narrow">
        <div className="mx-auto max-w-md rounded-[var(--radius-card)] border border-hairline bg-surface p-8 text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted">Kozy Hole</p>
          <h1 className="mt-2 font-display text-[1.8rem] leading-tight text-ink">Log in to your dashboard</h1>
          <p className="mt-3 text-sm text-muted">This device will stay logged in for 30 days.</p>
          <form action={verifyLogin} className="mt-6">
            <input type="hidden" name="token" value={token ?? ''} />
            <Button type="submit" variant="primary" size="lg" className="w-full">
              Log in
            </Button>
          </form>
        </div>
      </Container>
    </main>
  )
}
