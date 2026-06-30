import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { formatDate, parseLocalDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Booking — Kozy Hole",
};

// ─── money helper ────────────────────────────────────────────────────────────
function money(n: number): string {
  return Number(n).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });
}

// ─── tiny helpers ─────────────────────────────────────────────────────────────
function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseLocalDate(checkIn);
  const b = parseLocalDate(checkOut);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtDate(d: string): string {
  return formatDate(d);
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let b: Record<string, any> | null = null;
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("bookings").select("*").eq("id", id).single();
    b = data;
  } catch {
    b = null;
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!b) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen py-20">
          <Container size="narrow">
            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-10 text-center">
              <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ice">
                Booking not found
              </p>
              <h1 className="font-display text-[2rem] leading-tight tracking-tight text-ink sm:text-[2.4rem]">
                We couldn&apos;t find that booking
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-[1.05rem] leading-relaxed text-muted">
                This link may be incorrect or the booking may have been removed.
                Double-check the URL or start a new request.
              </p>
              <div className="mt-8">
                <Button href="/book" variant="primary" size="lg">
                  Book a cabin
                </Button>
              </div>
            </div>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  // ── Shared summary block ───────────────────────────────────────────────────
  const nights = nightsBetween(b.check_in, b.check_out);

  function SummaryRow({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) {
    return (
      <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-2.5 text-sm last:border-0">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-ink">{value}</span>
      </div>
    );
  }

  function MiniSummary() {
    return (
      <div className="mt-8 rounded-xl border border-hairline bg-surface-2/60 px-5 py-1">
        <SummaryRow label="Check-in" value={fmtDate(b!.check_in)} />
        <SummaryRow label="Check-out" value={fmtDate(b!.check_out)} />
        <SummaryRow label="Nights" value={nights} />
        <SummaryRow label="Party size" value={b!.party_size ?? "—"} />
      </div>
    );
  }

  const status: string = (b.status ?? "").toUpperCase();

  // ── REQUESTED ─────────────────────────────────────────────────────────────
  if (status === "REQUESTED") {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen py-20">
          <Container size="narrow">
            <div className="kh-reveal rounded-[var(--radius-card)] border border-hairline bg-surface p-8 sm:p-12">
              <span className="mb-5 inline-flex items-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ice">
                Request received
              </span>
              <h1 className="font-display text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
                Thanks, {b.guest_name}!
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-[1.05rem] leading-relaxed text-muted">
                We&apos;ve got your request for{" "}
                <span className="text-ink">
                  {fmtDate(b.check_in)} &rarr; {fmtDate(b.check_out)}
                </span>
                . We&apos;ll review it and email you as soon as it&apos;s
                approved — usually quickly. Your dates are on hold in the
                meantime.
              </p>
              <MiniSummary />
            </div>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  // ── APPROVED ──────────────────────────────────────────────────────────────
  if (status === "APPROVED") {
    const depositAmount: number = b.deposit_amount ?? 0;

    // Try to retrieve the Stripe checkout session.
    let stripeUrl: string | null = null;
    let stripeTotal: number | null = null;
    if (b.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          b.stripe_session_id
        );
        stripeUrl = session.url ?? null;
        stripeTotal = session.amount_total ?? null;
      } catch {
        stripeUrl = null;
      }
    }

    // Card total: use Stripe's amount_total (already includes fee) or estimate +3%.
    const cardTotalDisplay =
      stripeTotal !== null
        ? money(stripeTotal / 100)
        : money(depositAmount * 1.03);

    return (
      <>
        <SiteHeader />
        <main className="min-h-screen py-20">
          <Container size="narrow">
            <div className="kh-reveal rounded-[var(--radius-card)] border border-hairline bg-surface p-8 sm:p-12">
              {/* Heading */}
              <span className="mb-5 inline-flex items-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-amber">
                Approved
              </span>
              <h1 className="font-display text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
                You&apos;re approved — lock it in
              </h1>
              <p className="mt-4 text-[1.05rem] leading-relaxed text-muted">
                Pay your 50% deposit (
                <span className="font-semibold text-ink">
                  {money(depositAmount)}
                </span>
                ) to confirm your stay. Choose either option below.
              </p>

              {/* Payment options */}
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {/* Card */}
                <div className="rounded-xl border border-hairline bg-surface-2/60 p-6">
                  <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-faint">
                    Option 1
                  </p>
                  <p className="mb-4 text-base font-semibold text-ink">
                    Pay by card
                  </p>
                  {stripeUrl ? (
                    <>
                      <Button
                        href={stripeUrl}
                        variant="primary"
                        size="lg"
                        external
                        className="w-full"
                      >
                        Pay by card
                      </Button>
                      <p className="mt-3 text-xs text-muted">
                        Card total {cardTotalDisplay} (incl. 3% processing fee)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted">
                      Card link unavailable — please use e-transfer or{" "}
                      <a
                        href="mailto:kozyhole@gmail.com"
                        className="text-ice underline-offset-2 hover:underline"
                      >
                        contact us
                      </a>
                      .
                    </p>
                  )}
                </div>

                {/* E-transfer */}
                <div className="rounded-xl border border-hairline bg-surface-2/60 p-6">
                  <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-faint">
                    Option 2
                  </p>
                  <p className="mb-4 text-base font-semibold text-ink">
                    Pay by e-transfer
                  </p>
                  <p className="text-sm leading-relaxed text-muted">
                    Send{" "}
                    <span className="font-semibold text-ink">
                      {money(depositAmount)}
                    </span>{" "}
                    by Interac e-transfer to{" "}
                    <a
                      href="mailto:kozyhole@gmail.com"
                      className="text-ice underline-offset-2 hover:underline"
                    >
                      kozyhole@gmail.com
                    </a>{" "}
                    (no additional fee). Include your name and dates in the note. We&apos;ll
                    confirm once it lands.
                  </p>
                </div>
              </div>

              {/* Hold notice */}
              <p className="mt-6 text-center text-xs text-faint">
                We hold your dates for 48 hours.
              </p>

              <MiniSummary />
            </div>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  // ── CONFIRMED ─────────────────────────────────────────────────────────────
  if (status === "CONFIRMED") {
    const paid = sp.paid === "1";

    return (
      <>
        <SiteHeader />
        <main className="min-h-screen py-20">
          <Container size="narrow">
            {paid && (
              <div className="mb-6 rounded-xl border border-success/30 bg-success-soft px-6 py-4">
                <p className="text-sm font-semibold text-success">
                  Payment received — thank you!
                </p>
              </div>
            )}

            <div className="kh-reveal rounded-[var(--radius-card)] border border-success/25 bg-surface p-8 sm:p-12">
              {/* Heading */}
              <span className="mb-5 inline-flex items-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-success">
                Confirmed
              </span>
              <h1 className="font-display text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
                Booking confirmed!
              </h1>

              {/* Dates + logistics */}
              <div className="mt-8 rounded-xl border border-hairline bg-surface-2/60 px-5 py-1">
                <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-2.5 text-sm last:border-0">
                  <span className="text-muted">Dates</span>
                  <span className="font-medium text-ink">
                    {fmtDate(b.check_in)} &rarr; {fmtDate(b.check_out)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-2.5 text-sm last:border-0">
                  <span className="text-muted">Nights</span>
                  <span className="font-medium text-ink">{nights}</span>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                  <span className="text-muted">Check-in / Check-out</span>
                  <span className="font-medium text-ink">1 PM · 11 AM</span>
                </div>
              </div>

              {/* Due on arrival */}
              <p className="mt-8 leading-relaxed text-muted">
                <span className="font-semibold text-ink">Due on arrival:</span>{" "}
                the remaining balance, a $500 damage deposit per cabin
                {b.has_pet ? ", and the $50 pet fee" : ""} (cash or
                e-transfer).
              </p>

              {/* Meeting note */}
              <p className="mt-5 text-sm leading-relaxed text-muted">
                We&apos;ll meet you at the lake and point you to your shack —
                exact location depends on ice conditions and we&apos;ll be in
                touch closer to your stay.
              </p>
            </div>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  // ── DECLINED ──────────────────────────────────────────────────────────────
  if (status === "DECLINED") {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen py-20">
          <Container size="narrow">
            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-8 text-center sm:p-12">
              <span className="mb-5 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted">
                Request update
              </span>
              <h1 className="font-display text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
                This request wasn&apos;t able to be confirmed
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-[1.05rem] leading-relaxed text-muted">
                The dates have been released. Feel free to try other dates —
                we&apos;d love to have you out on the ice.
              </p>
              <div className="mt-8">
                <Button href="/book" variant="primary" size="lg">
                  Try other dates
                </Button>
              </div>
            </div>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  // ── CANCELLED ─────────────────────────────────────────────────────────────
  if (status === "CANCELLED") {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen py-20">
          <Container size="narrow">
            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-8 text-center sm:p-12">
              <span className="mb-5 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted">
                Booking cancelled
              </span>
              <h1 className="font-display text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
                This booking has been cancelled
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-[1.05rem] leading-relaxed text-muted">
                If you cancelled with at least a week&apos;s notice, you may be
                eligible for a credit toward a future stay — we&apos;ll be in touch.
                We hope to see you on the ice another time.
              </p>
              <div className="mt-8">
                <Button href="/book" variant="primary" size="lg">
                  Book again
                </Button>
              </div>
            </div>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  // ── EXPIRED ───────────────────────────────────────────────────────────────
  if (status === "EXPIRED") {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen py-20">
          <Container size="narrow">
            <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-8 text-center sm:p-12">
              <span className="mb-5 inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-muted">
                Hold expired
              </span>
              <h1 className="font-display text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
                This hold expired
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-[1.05rem] leading-relaxed text-muted">
                The 50% deposit wasn&apos;t received in time, so the dates were
                released. You&apos;re welcome to submit a fresh request.
              </p>
              <div className="mt-8">
                <Button href="/book" variant="primary" size="lg">
                  Book again
                </Button>
              </div>
            </div>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  // ── Fallback (unknown status) ──────────────────────────────────────────────
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen py-20">
        <Container size="narrow">
          <div className="rounded-[var(--radius-card)] border border-hairline bg-surface p-8 sm:p-12">
            <span className="mb-5 inline-flex items-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ice">
              <span
                aria-hidden
                className="h-px w-7 bg-gradient-to-r from-ice to-transparent"
              />
              Booking summary
            </span>
            <h1 className="font-display text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
              Your booking
            </h1>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-muted">
              Status:{" "}
              <span className="font-semibold text-ink">
                {b.status ?? "Unknown"}
              </span>
            </p>
            <MiniSummary />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
