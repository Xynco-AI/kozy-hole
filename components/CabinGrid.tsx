"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { Cabin } from "@/lib/content";

export default function CabinGrid({ cabins }: { cabins: Cabin[] }) {
  const [open, setOpen] = useState<Cabin | null>(null);
  const [mounted, setMounted] = useState(false);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cabins.map((cabin, i) => (
          <article
            key={cabin.slug}
            className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-ice/30 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]"
          >
            {/* Photo — clickable */}
            <button
              type="button"
              onClick={() => setOpen(cabin)}
              className="relative aspect-[4/5] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ice"
              aria-label={`View ${cabin.name} photos`}
            >
              <Image
                src={cabin.photo}
                alt={cabin.photoAlt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-80" />

              {/* Expand hint on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                  Expand
                </span>
              </div>

              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink backdrop-blur-md">
                {cabin.sleeps}
              </div>
              <h3 className="absolute bottom-4 left-5 right-5 text-left font-display text-2xl tracking-tight text-ink">
                {cabin.name}
                <span className="ml-2 align-middle text-xs font-normal not-italic text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </h3>
            </button>

            {/* Features */}
            <ul className="flex flex-1 flex-col gap-3 p-6">
              {cabin.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-muted">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0 text-ice"
                    aria-hidden
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span className="leading-snug">{f}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {mounted && open && createPortal(
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          className="bg-black/90 backdrop-blur-md"
          onClick={close}
          role="dialog"
          aria-modal
          aria-label={open.name}
        >
          <button
            type="button"
            onClick={close}
            style={{ position: "fixed", top: 20, right: 20, zIndex: 10000 }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col items-center p-8 pt-16" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.photo}
              alt={open.photoAlt}
              className="block h-auto w-auto max-h-[90vh] max-w-[92vw] rounded-2xl"
            />
            <p className="mt-4 text-center font-display text-xl text-ink">
              {open.name}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
