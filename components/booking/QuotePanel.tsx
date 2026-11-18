"use client";

import type { Quote } from "@/lib/pricing";
import { arrivalItems } from "@/lib/addons";
import { money } from "@/lib/format";

type Props = {
  quote: Quote;
  addons: string[];
  hasPet: boolean;
  cabinCount: number;
};

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-baseline justify-between gap-4",
        muted ? "text-muted" : "text-ink",
        strong ? "font-semibold" : "",
      ].join(" ")}
    >
      <span className="text-sm">{label}</span>
      <span className={["shrink-0 text-sm tabular-nums", strong ? "text-base" : ""].join(" ")}>
        {value}
      </span>
    </div>
  );
}

export default function QuotePanel({ quote: q, addons, hasPet, cabinCount }: Props) {
  const extras = arrivalItems({ addons, hasPet });

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ice">
        Booking estimate
      </p>

      <div className="flex flex-col gap-2.5">
        <Row
          label={`${q.nights} night${q.nights !== 1 ? "s" : ""}${
            cabinCount > 1 ? ` × ${cabinCount} cabins` : ""
          }`}
          value={money(q.nightlySubtotal)}
        />
        <Row label="GST (5%)" value={money(q.gst)} muted />

        <div className="my-1 h-px bg-hairline" />

        <Row label="Total" value={money(q.total)} strong />

        <div className="mt-1 rounded-xl bg-amber/10 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-amber">Deposit (50%), due after approval</span>
            <span className="font-semibold text-amber tabular-nums">{money(q.deposit)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {money(q.cardCharge)} by card (incl. 3% fee) or {money(q.etransferCharge)} by e-transfer
          </p>
        </div>
      </div>

      <p className="mb-2 mt-5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-faint">
        Paid on arrival
      </p>
      <div className="flex flex-col gap-2">
        <Row label="Remaining balance" value={money(q.balanceOnArrival)} muted />
        {extras.map((item) => (
          <Row
            key={item.label}
            label={item.label}
            value={item.price === null ? "Price on arrival" : money(item.price)}
            muted
          />
        ))}
      </div>

      <p className="mt-4 text-[0.8rem] leading-relaxed text-muted">
        $500/cabin damage deposit: a card hold (not a charge) you authorize online 3 days
        before your stay, released after checkout.
      </p>
    </div>
  );
}
