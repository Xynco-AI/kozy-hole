import Image from "next/image";
import Container from "@/components/Container";
import { about, business } from "@/lib/content";

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 pt-2 pb-24 sm:pb-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-16">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ice">
              {about.eyebrow}
            </span>
            <h2 className="mt-4 max-w-xl font-display text-balance text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
              {about.title}
            </h2>
            <div className="mt-7 flex flex-col gap-5 text-pretty leading-relaxed text-muted">
              {about.paragraphs.map((p, i) => (
                <p key={i} className={i === 0 ? "text-lg text-ink/90" : ""}>
                  {p}
                </p>
              ))}
            </div>
            <p className="mt-7 font-display text-lg italic text-ice">
              Rob &amp; Jason, {business.town}
            </p>
          </div>

          {/* Photo */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] border border-hairline">
            <Image
              src="/brand/cabin-3.png"
              alt="Inside a Kozy Hole shack — four bunks with memory-foam mattresses, LED ceiling lighting, and a wall-mounted TV."
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/5" />
          </div>
        </div>
      </Container>
    </section>
  );
}



