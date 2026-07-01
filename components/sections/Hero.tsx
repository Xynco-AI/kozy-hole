import Image from "next/image";
import Container from "@/components/Container";
import Button from "@/components/Button";
import { hero } from "@/lib/content";

export default function Hero() {
  return (
    <section className="relative -mt-[4.5rem] overflow-hidden">
      {/* — Atmosphere — */}
      {/* Breathing ice-blue radial glow behind the headline */}
      <div
        aria-hidden
        className="kh-glow pointer-events-none absolute left-1/2 top-[-12%] h-[680px] w-[920px] max-w-[140vw] -translate-x-1/2 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(closest-side, rgba(92,198,236,0.28), rgba(46,159,208,0.08) 55%, transparent 72%)",
        }}
      />
      {/* Hero background image */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/brand/hero-sky.png"
          alt=""
          fill
          priority
          className="object-cover object-top opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/30 via-canvas/60 to-canvas" />
      </div>

      <Container className="relative flex flex-col items-center pb-24 pt-[8.5rem] text-center sm:pt-[9.5rem]">
        {/* Logo badge */}
        <div className="kh-reveal" style={{ animationDelay: "0ms" }}>
          <div className="relative mx-auto h-32 w-32 sm:h-44 sm:w-44 lg:h-56 lg:w-56">
            <Image
              src="/brand/logo.png"
              alt="Kozy Hole Ice Shack Rentals"
              fill
              priority
              sizes="(min-width: 640px) 224px, 176px"
              className="object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Eyebrow */}
        <p
          className="kh-reveal mt-9 inline-flex items-center gap-2.5 rounded-full border border-hairline bg-white/[0.03] px-4 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted backdrop-blur-sm"
          style={{ animationDelay: "120ms" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {hero.eyebrow}
        </p>

        {/* Headline */}
        <h1
          className="kh-reveal mt-7 max-w-4xl font-display text-balance text-[2rem] font-medium leading-[1.02] tracking-[-0.02em] text-ink sm:text-[2.85rem] md:text-[4.25rem] lg:text-[5rem]"
          style={{ animationDelay: "200ms" }}
        >
          {hero.headline.pre}{" "}
          <span className="text-ice italic">{hero.headline.accent}</span>
        </h1>

        {/* Subhead */}
        <p
          className="kh-reveal mt-7 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg md:text-xl"
          style={{ animationDelay: "320ms" }}
        >
          {hero.subhead}
        </p>

        {/* CTAs */}
        <div
          className="kh-reveal mt-10 flex flex-col items-center gap-3 sm:flex-row"
          style={{ animationDelay: "440ms" }}
        >
          <Button href={hero.primaryCta.href} variant="primary" size="lg">
            {hero.primaryCta.label}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Button>
          <Button href={hero.secondaryCta.href} variant="secondary" size="lg">
            {hero.secondaryCta.label}
          </Button>
        </div>

        {/* Trust strip */}
        <ul
          className="kh-reveal mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 text-xs text-faint sm:gap-x-6 sm:gap-y-3 sm:text-sm"
          style={{ animationDelay: "560ms" }}
        >
          {hero.highlights.map((h, i) => (
            <li key={h} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden className="h-1 w-1 rounded-full bg-faint/60" />
              )}
              <span className="flex items-center gap-2">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-ice"
                  aria-hidden
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
                {h}
              </span>
            </li>
          ))}
        </ul>
      </Container>

      {/* bottom hairline that fades the hero into the page */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-hairline to-transparent"
      />
    </section>
  );
}



