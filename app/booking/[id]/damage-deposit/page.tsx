import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { supabaseAdmin } from "@/lib/supabase";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authorize Damage Deposit — Kozy Hole",
};

export default async function DamageDepositPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const justAuthorized = sp.authorized === "1";

  const db = supabaseAdmin();
  const { data: b } = await db.from("bookings").select("*").eq("id", id).single();

  if (!b || b.status !== "CONFIRMED") notFound();

  const { count } = await db
    .from("booking_cabins")
    .select("*", { count: "exact", head: true })
    .eq("booking_id", id);

  const cabinCount = count ?? 1;
  const depositTotal = cabinCount * 500;
  const alreadyAuthorized = b.damage_deposit_status === "authorized";

  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[70vh] items-center py-16">
        <Container className="max-w-lg">
          {alreadyAuthorized || justAuthorized ? (
            <div className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="font-display text-2xl font-bold text-ink">
                Deposit authorized
              </h1>
              <p className="mt-4 text-muted">
                Your ${depositTotal} CAD hold is set. It will be released after
                checkout if the shack is left in good condition — no further
                action needed.
              </p>
              <p className="mt-2 text-sm text-faint">
                Check-in {formatDate(b.check_in)} · Check-out{" "}
                {formatDate(b.check_out)}
              </p>
              <Button href={`/booking/${id}`} variant="ghost" className="mt-8">
                Back to booking
              </Button>
            </div>
          ) : (
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">
                Authorize your damage deposit
              </h1>
              <p className="mt-2 text-sm text-faint">
                Booking for {b.guest_name} · Check-in {formatDate(b.check_in)}
              </p>

              <div className="mt-8 rounded-2xl border border-hairline bg-surface p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted">
                    Damage deposit hold
                  </span>
                  <span className="font-display text-xl font-bold text-ink">
                    ${depositTotal} CAD
                  </span>
                </div>
                {cabinCount > 1 && (
                  <p className="mt-1 text-right text-xs text-faint">
                    ${500} × {cabinCount} cabins
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3 text-sm text-muted">
                <p>
                  <strong className="text-ink">This is a hold, not a charge.</strong>{" "}
                  Your card is authorized for this amount but nothing is taken out.
                </p>
                <p>
                  After checkout, Rob or Jason will release the hold. If the shack
                  is left in good condition, you owe nothing.
                </p>
              </div>

              <Button
                href={`/api/stripe/create-damage-deposit?bookingId=${id}`}
                variant="primary"
                size="lg"
                className="mt-8 w-full"
              >
                Authorize ${depositTotal} hold →
              </Button>

              <p className="mt-4 text-center text-xs text-faint">
                Secured by Stripe. Card details handled by Stripe — Kozy Hole
                never sees your card number.
              </p>
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
