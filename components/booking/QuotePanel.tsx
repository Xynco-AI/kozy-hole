"use client";

import type { Quote } from "@/lib/pricing";

type Props = {
  quote: Quote;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(n);

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
      <span className={["text-sm tabular-nums", strong ? "text-base" : ""].join(" ")}>
        {value}
      </span>
    </div>
  );
}

export default function QuotePanel({ quote: q }: Props) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ice">
        Booking estimate
      </p>

      <div className="flex flex-col gap-2.5">
        <Row label={`${q.nights} night${q.nights !== 1 ? "s" : ""}`} value={fmt(q.nightlySubtotal)} />
        <Row label="GST (5%)" value={fmt(q.gst)} muted />

        <div className="my-1 h-px bg-hairline" />

        <Row label="Total" value={fmt(q.total)} strong />

        <div className="mt-1 rounded-xl bg-amber/10 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-amber">Deposit due now (50%)</span>
            <span className="font-semibold text-amber tabular-nums">{fmt(q.deposit)}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[0.8rem] leading-relaxed text-muted">
        Card adds 3%{" "}
        <span className="tabular-nums text-faint">({fmt(q.cardCharge)})</span>
        {" · "}e-transfer no additional fee{" "}
        <span className="tabular-nums text-faint">({fmt(q.etransferCharge)})</span>
        .{" "}
        Balance, $500/cabin damage deposit, and $50/stay pet fee due on arrival.
      </p>
    </div>
  );
}
