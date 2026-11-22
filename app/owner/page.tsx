import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Container from '@/components/Container'
import Button from '@/components/Button'
import { getOwnerEmail } from '@/lib/owner-session'
import { requestLogin } from './login-actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Owner login — Kozy Hole',
  robots: { index: false, follow: false },
}

const MESSAGES: Record<string, { ok: boolean; text: string }> = {
  sent: { ok: true, text: "Check your email. If that address has access, we've sent you a login link. It works once and expires in 15 minutes." },
  expired: { ok: false, text: 'That login link has expired or was already used. Enter your email to get a new one.' },
  loggedout: { ok: true, text: "You're logged out." },
}

export default async function OwnerLogin({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; expired?: string; loggedout?: string }>
}) {
  if (await getOwnerEmail()) redirect('/owner/dashboard')
  const sp = await searchParams
  const message = sp.sent ? MESSAGES.sent : sp.expired ? MESSAGES.expired : sp.loggedout ? MESSAGES.loggedout : null

  return (
    <main className="min-h-screen bg-canvas py-20">
      <Container size="narrow">
        <div className="mx-auto max-w-md rounded-[var(--radius-card)] border border-hairline bg-surface p-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted">Kozy Hole</p>
          <h1 className="mt-2 font-display text-[1.8rem] leading-tight text-ink">Owner login</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Enter your email and we&apos;ll send you a link to log in. No password needed.
          </p>

          {message && (
            <p
              role={message.ok ? 'status' : 'alert'}
              className={[
                'mt-6 rounded-lg border px-4 py-3 text-sm text-ink',
                message.ok ? 'border-success/40 bg-success/10' : 'border-danger/50 bg-danger/10',
              ].join(' ')}
            >
              {message.text}
            </p>
          )}

          <form action={requestLogin} className="mt-6 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm text-muted">
              Email
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="h-11 rounded-xl border border-hairline bg-canvas px-4 text-sm text-ink focus:border-ice/60 focus:outline-none focus:ring-1 focus:ring-ice/30"
              />
            </label>
            <Button type="submit" variant="primary" size="md">
              Email me a login link
            </Button>
          </form>
        </div>
      </Container>
    </main>
  )
}
