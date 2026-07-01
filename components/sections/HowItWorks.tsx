import Image from "next/image";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { howItWorksIntro, location, steps } from "@/lib/content";

export default function HowItWorks() {
  return (
    <section
      id="location"
      className="scroll-mt-20 border-y border-hairline bg-surface/30 pt-2 pb-24 sm:pb-28"
    >
      <Container>
        <SectionHeading
          eyebrow={howItWorksIntro.eyebrow}
          title={howItWorksIntro.title}
        />

        {/* Steps */}
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-canvas p-6"
            >
              <span className="font-display text-5xl leading-none text-ice/25">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{step.body}</p>
              {/* connecting arrow on wide screens */}
              {i < steps.length - 1 && (
                <svg
                  aria-hidden
                  className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-ice/30 lg:block"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </li>
          ))}
        </ol>

        {/* Location panel */}
        <div className="mt-12 grid overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-canvas lg:grid-cols-2">
          <div className="relative min-h-[280px] lg:min-h-full">
            <Image
              src={location.photo}
              alt={location.photoAlt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[center_35%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-canvas/30 lg:to-canvas/60" />
          </div>
          <div className="flex flex-col justify-center gap-5 p-8 sm:p-10">
            <span className="inline-flex w-fit items-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ice">
              {location.eyebrow}
            </span>
            <h3 className="font-display text-3xl tracking-tight text-ink">
              {location.title}
            </h3>
            <p className="max-w-md text-pretty leading-relaxed text-muted">
              {location.body}
            </p>
            <div className="mt-1 flex items-center gap-3 rounded-2xl border border-hairline bg-surface/60 px-5 py-4">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-ice"
                aria-hidden
              >
                <rect x="3" y="4.5" width="18" height="16" rx="2" />
                <path d="M3 9h18M8 2.5v4M16 2.5v4" />
              </svg>
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-faint">
                  {location.seasonLabel}
                </div>
                <div className="font-display text-lg text-ink">
                  {location.season}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}



