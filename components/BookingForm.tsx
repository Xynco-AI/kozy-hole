"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import CabinPicker, { type CabinOption } from "@/components/booking/CabinPicker";
import QuotePanel from "@/components/booking/QuotePanel";
import WaiverBox from "@/components/booking/WaiverBox";
import { quote, validateStay } from "@/lib/pricing";
import { parseLocalDate } from "@/lib/dates";
import { createBookingRequest } from "@/app/book/actions";

// ---------------------------------------------------------------------------
// Season helpers
// ---------------------------------------------------------------------------

/** Returns [seasonStart, seasonEnd] for the upcoming season window (YYYY-MM-DD). */
function getSeasonWindow(): { min: string; max: string } {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-based
  const d = today.getDate();

  let startYear: number;
  let endYear: number;

  if (m === 11 && d >= 15) {
    // Dec 15 or later — current season runs through Mar 31 next year
    startYear = y;
    endYear = y + 1;
  } else if (m < 3 || (m === 2 && d <= 31)) {
    // Jan, Feb, or Mar — current season (started last Dec 15)
    startYear = y - 1;
    endYear = y;
  } else {
    // Apr–Dec 14 — next season
    startYear = y;
    endYear = y + 1;
  }

  return {
    min: `${startYear}-12-15`,
    max: `${endYear}-03-31`,
  };
}

// ---------------------------------------------------------------------------
// Add-on options
// ---------------------------------------------------------------------------

const ADDONS = [
  "Bait & tackle pack",
  "Rod & gear rental",
  "Forward-facing sonar (Livescope) rental",
  "Shuttle to the cabin (+$60 round trip, conditions permitting)",
  "Guided trip",
];

// ---------------------------------------------------------------------------
// Error message mapping
// ---------------------------------------------------------------------------

function actionErrorMessage(error: string): string {
  switch (error) {
    case "CABIN_UNAVAILABLE":
      return "Sorry, one of those cabins was just taken for those dates. Try different dates or cabins.";
    case "MIN_ONE_NIGHT":
      return "Check-out must be after check-in.";
    case "OUT_OF_SEASON":
      return "We're open Dec 15 – Mar 31.";
    case "WEEKEND_TWO_NIGHT_MIN":
      return "Weekends require a 2-night minimum (Fri/Sat).";
    default:
      return "Something went wrong — please try again or contact us.";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  cabins: CabinOption[];
  previewMode: boolean;
};

// ---------------------------------------------------------------------------
// Form component
// ---------------------------------------------------------------------------

export default function BookingForm({ cabins, previewMode }: Props) {
  const router = useRouter();
  const { min: seasonMin, max: seasonMax } = getSeasonWindow();

  // — Cabin selection —
  const [selectedCabinIds, setSelectedCabinIds] = useState<string[]>([]);

  // — Dates —
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // — Guest details —
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState<number>(1);
  const [hasPet, setHasPet] = useState(false);

  // — Add-ons —
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  // — Waiver —
  const [partyMembers, setPartyMembers] = useState<string[]>([]);
  const [waiverAgreed, setWaiverAgreed] = useState(false);

  // — Submission —
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Max party size scales with the number of selected cabins (5 per cabin).
  const maxPartySize = Math.max(5, selectedCabinIds.length * 5);
  const effectivePartySize = Math.min(partySize, maxPartySize);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const stayError = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    return validateStay(parseLocalDate(checkIn), parseLocalDate(checkOut));
  }, [checkIn, checkOut]);

  const validDates = checkIn && checkOut && !stayError;

  const liveQuote = useMemo(() => {
    if (!validDates || selectedCabinIds.length === 0) return null;
    return quote(
      parseLocalDate(checkIn),
      parseLocalDate(checkOut),
      selectedCabinIds.length,
    );
  }, [validDates, checkIn, checkOut, selectedCabinIds.length]);

  // Checkout min = day after check-in. Build the YYYY-MM-DD from local
  // components so it never shifts across a UTC boundary.
  const checkOutMin = useMemo(() => {
    if (!checkIn) return seasonMin;
    const d = parseLocalDate(checkIn);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, [checkIn, seasonMin]);

  const stayErrorMessage = useMemo(() => {
    if (!stayError) return null;
    switch (stayError) {
      case "MIN_ONE_NIGHT":
        return "Check-out must be after check-in.";
      case "OUT_OF_SEASON":
        return "We're open Dec 15 – Mar 31.";
      case "WEEKEND_TWO_NIGHT_MIN":
        return "Weekends require a 2-night minimum (Fri/Sat).";
    }
  }, [stayError]);

  const canSubmit =
    !submitting &&
    !previewMode &&
    selectedCabinIds.length >= 1 &&
    validDates &&
    guestName.trim().length >= 2 &&
    email.includes("@") &&
    phone.trim().length >= 7 &&
    waiverAgreed;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function toggleAddon(label: string) {
    setSelectedAddons((prev) =>
      prev.includes(label) ? prev.filter((a) => a !== label) : [...prev, label],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const result = await createBookingRequest({
        guestName: guestName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        partySize: effectivePartySize,
        hasPet,
        checkIn,
        checkOut,
        cabinIds: selectedCabinIds,
        addons: selectedAddons,
        waiverAgreed: true,
        partyMembers: partyMembers.map((m) => m.trim()).filter(Boolean),
      });

      if (result.ok) {
        router.push(`/booking/${result.bookingId}`);
      } else {
        setSubmitError(actionErrorMessage(result.error ?? "DB_ERROR"));
        setSubmitting(false);
      }
    } catch {
      setSubmitError(actionErrorMessage("DB_ERROR"));
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-10">
      {/* Preview mode banner */}
      {previewMode && (
        <div className="rounded-xl border border-amber/30 bg-amber/10 px-4 py-4 text-sm text-amber">
          <span className="font-semibold">Booking is coming soon.</span> The site is still being set up.
          Once live, you&apos;ll be able to book directly here. In the meantime,{" "}
          <a href="#contact" className="underline underline-offset-2">contact us</a> to reserve your dates.
        </div>
      )}

      {/* ── 1. Cabin selection ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Choose your cabin(s)
          </h2>
          <p className="mt-1 text-sm text-muted">Select 1–3 cabins for your group.</p>
        </div>
        <CabinPicker
          cabins={cabins}
          selected={selectedCabinIds}
          onChange={setSelectedCabinIds}
        />
        {selectedCabinIds.length === 0 && (
          <p className="text-sm text-faint">No cabin selected yet.</p>
        )}
      </section>

      {/* ── 2. Dates ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
          Dates
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="check-in"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
            >
              Check-in
            </label>
            <input
              id="check-in"
              type="date"
              value={checkIn}
              min={seasonMin}
              max={seasonMax}
              onChange={(e) => {
                setCheckIn(e.target.value);
                // Reset checkout if it's now before the new check-in
                if (checkOut && checkOut <= e.target.value) {
                  setCheckOut("");
                }
              }}
              className="h-11 rounded-xl border border-hairline bg-surface-2 px-4 text-sm text-ink focus:border-ice/60 focus:outline-none focus:ring-1 focus:ring-ice/30 [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="check-out"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
            >
              Check-out
            </label>
            <input
              id="check-out"
              type="date"
              value={checkOut}
              min={checkOutMin}
              max={seasonMax}
              onChange={(e) => setCheckOut(e.target.value)}
              className="h-11 rounded-xl border border-hairline bg-surface-2 px-4 text-sm text-ink focus:border-ice/60 focus:outline-none focus:ring-1 focus:ring-ice/30 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Inline stay error */}
        {stayErrorMessage && (
          <p className="text-sm font-medium text-amber">{stayErrorMessage}</p>
        )}
      </section>

      {/* ── 3. Live quote ─────────────────────────────────────────────────── */}
      {liveQuote && <QuotePanel quote={liveQuote} />}

      {/* ── 4. Guest details ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
          Your details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="guest-name"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
            >
              Full name <span className="text-ice">*</span>
            </label>
            <input
              id="guest-name"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Jane Smith"
              required
              className="h-11 rounded-xl border border-hairline bg-surface-2 px-4 text-sm text-ink placeholder:text-faint focus:border-ice/60 focus:outline-none focus:ring-1 focus:ring-ice/30"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="guest-email"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
            >
              Email <span className="text-ice">*</span>
            </label>
            <input
              id="guest-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              required
              className="h-11 rounded-xl border border-hairline bg-surface-2 px-4 text-sm text-ink placeholder:text-faint focus:border-ice/60 focus:outline-none focus:ring-1 focus:ring-ice/30"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="guest-phone"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
            >
              Phone <span className="text-ice">*</span>
            </label>
            <input
              id="guest-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="780-555-0100"
              required
              className="h-11 rounded-xl border border-hairline bg-surface-2 px-4 text-sm text-ink placeholder:text-faint focus:border-ice/60 focus:outline-none focus:ring-1 focus:ring-ice/30"
            />
          </div>

          {/* Party size */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="party-size"
              className="text-xs font-semibold uppercase tracking-[0.14em] text-faint"
            >
              Party size <span className="text-ice">*</span>
            </label>
            <select
              id="party-size"
              value={effectivePartySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className="h-11 rounded-xl border border-hairline bg-surface-2 px-4 text-sm text-ink focus:border-ice/60 focus:outline-none focus:ring-1 focus:ring-ice/30"
            >
              {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "person" : "people"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pet toggle */}
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={hasPet}
            onChange={(e) => setHasPet(e.target.checked)}
            className="h-5 w-5 shrink-0 cursor-pointer rounded border border-hairline accent-ice focus:outline-none"
          />
          <span className="text-sm text-muted">
            Bringing a dog?{" "}
            {hasPet && (
              <span className="text-faint">
                $50/stay pet fee, paid on arrival.
              </span>
            )}
          </span>
        </label>
      </section>

      {/* ── 5. Add-ons ────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Add-ons
          </h2>
          <p className="mt-1 text-sm text-muted">Paid on arrival. All optional.</p>
        </div>
        <div className="flex flex-col gap-2.5">
          {ADDONS.map((addon) => (
            <label key={addon} className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={selectedAddons.includes(addon)}
                onChange={() => toggleAddon(addon)}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border border-hairline accent-ice focus:outline-none"
              />
              <span className="text-sm text-muted">{addon}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ── 6. Payment method note ────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
            Deposit payment method
          </h2>
          <p className="mt-1 text-sm text-muted">
            We&apos;ll send you payment details after approval. Just let us know your preference.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4 text-sm text-muted">
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-ice/60" />
            <strong className="text-ink">Credit card</strong>: adds a 3% processing fee
          </p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-success/60" />
            <strong className="text-ink">Interac e-transfer</strong>: no additional fee
          </p>
          <p className="mt-1 text-xs text-faint">
            You&apos;ll choose your method after we confirm your dates.
          </p>
        </div>
      </section>

      {/* ── 7. Waiver ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
          Release of liability
        </h2>
        <WaiverBox
          partySize={effectivePartySize}
          partyMembers={partyMembers}
          onPartyMembersChange={setPartyMembers}
          agreed={waiverAgreed}
          onAgreedChange={setWaiverAgreed}
        />
      </section>

      {/* ── Submit error ──────────────────────────────────────────────────── */}
      {submitError && (
        <div className="rounded-xl border border-amber/20 bg-amber/10 px-4 py-3 text-sm text-amber">
          {submitError}
        </div>
      )}

      {/* ── Submit button ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canSubmit}
          className="w-full sm:w-auto"
        >
          {submitting ? "Sending request…" : "Send booking request"}
        </Button>
        <p className="text-xs text-faint">
          No payment yet. We confirm availability first, then collect your 50% deposit.
        </p>
      </div>
    </form>
  );
}
