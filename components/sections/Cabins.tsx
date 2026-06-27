import Image from "next/image";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { cabins, cabinsIntro } from "@/lib/content";

export default function Cabins() {
  return (
    <section id="cabins" className="scroll-mt-24 py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow={cabinsIntro.eyebrow}
          title={cabinsIntro.title}
          body={cabinsIntro.body}
        />

        {/* names-TBD note */}
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface/60 px-3.5 py-1.5 text-xs text-faint">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ice"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01M11 12h1v4h1" />
          </svg>
          {cabinsIntro.namesNote}
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cabins.map((cabin, i) => (
            <article
              key={cabin.slug}
              className="group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-ice/30 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)]"
            >
              {/* Photo */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={cabin.photo}
                  alt={cabin.photoAlt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
                />
                {/* darken the bottom so the label reads, brighten slightly on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-80" />
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink backdrop-blur-md">
                  {cabin.sleeps}
                </div>
                <h3 className="absolute bottom-4 left-5 right-5 font-display text-2xl tracking-tight text-ink">
                  {cabin.name}
                  <span className="ml-2 align-middle text-xs font-normal not-italic text-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </h3>
              </div>

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
      </Container>
    </section>
  );
}
