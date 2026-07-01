import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Button from "@/components/Button";
import { policies, rates, ratesIntro } from "@/lib/content";

export default function Rates() {
  return (
    <section id="rates" className="scroll-mt-20 pt-2 pb-24 sm:pb-28">
      <Container>
        <SectionHeading
          eyebrow={ratesIntro.eyebrow}
          title={ratesIntro.title}
          body={ratesIntro.body}
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          {/* Rate cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {rates.map((rate, i) => {
              const featured = i === 1; // weekend & holiday
              return (
                <div
                  key={rate.label}
                  className={`relative flex flex-col gap-2 rounded-[var(--radius-card)] border p-7 ${
                    featured
                      ? "border-amber/30 bg-gradient-to-br from-amber/[0.08] to-transparent"
                      : "border-hairline bg-surface"
                  }`}
                >
                  <span className="text-sm font-medium text-muted">
                    {rate.label}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`font-display text-3xl sm:text-5xl tracking-tight ${
                        featured ? "text-amber" : "text-ink"
                      }`}
                    >
                      {rate.price}
                    </span>
                    <span className="text-sm text-faint">/ night · per cabin</span>
                  </div>
                  {rate.note && (
                    <span className="mt-1 text-xs leading-relaxed text-faint">
                      {rate.note}
                    </span>
                  )}
                </div>
              );
            })}
            <Button href="/book" variant="primary" size="lg" className="mt-1 w-full">
              Check dates & book
            </Button>
          </div>

          {/* Policies */}
          <dl className="overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface/50">
            {policies.map((p, i) => (
              <div
                key={p.label}
                className={`grid grid-cols-1 gap-1 px-6 py-5 sm:grid-cols-[180px_1fr] sm:gap-6 ${
                  i !== 0 ? "border-t border-hairline" : ""
                }`}
              >
                <dt className="text-sm font-semibold text-ink">{p.label}</dt>
                <dd className="text-sm leading-relaxed text-muted">{p.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}




