import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Button from "@/components/Button";
import { contact, contactIntro } from "@/lib/content";

export default function Contact() {
  return (
    <section
      id="contact"
      className="scroll-mt-20 border-t border-hairline bg-surface/30 pt-2 pb-24 sm:pb-28"
    >
      <Container>
        <SectionHeading
          eyebrow={contactIntro.eyebrow}
          title={contactIntro.title}
          body={contactIntro.body}
          align="center"
        />

        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
          {/* Email */}
          <a
            href={`mailto:${contact.email}`}
            className="group flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-hairline bg-canvas p-4 sm:p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-ice/30"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ice/20 bg-ice-soft text-ice">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-faint">
              Email
            </span>
            <span className="text-sm text-ink transition-colors group-hover:text-ice">
              {contact.email}
            </span>
          </a>

          {/* Owners' phones */}
          {contact.owners.map((o) => (
            <a
              key={o.phone}
              href={`tel:${o.phone.replace(/-/g, "")}`}
              className="group flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-hairline bg-canvas p-4 sm:p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-ice/30"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ice/20 bg-ice-soft text-ice">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />
                </svg>
              </span>
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-faint">
                Call or text {o.name}
              </span>
              <span className="text-sm text-ink transition-colors group-hover:text-ice">
                {o.phone}
              </span>
            </a>
          ))}
        </div>

        {/* Pet-friendly + final CTA */}
        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="flex items-center gap-2.5 rounded-full border border-hairline bg-canvas px-5 py-2.5 text-sm text-muted">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-amber"
              aria-hidden
            >
              <circle cx="5.5" cy="10" r="1.8" />
              <circle cx="9.5" cy="6.5" r="1.8" />
              <circle cx="14.5" cy="6.5" r="1.8" />
              <circle cx="18.5" cy="10" r="1.8" />
              <path d="M12 11c2.5 0 4.5 2.3 4.5 4.2 0 1.6-1.3 2.3-2.6 2.3-.8 0-1.3-.3-1.9-.3s-1.1.3-1.9.3c-1.3 0-2.6-.7-2.6-2.3C7.5 13.3 9.5 11 12 11Z" />
            </svg>
            {contact.petPolicy}
          </p>
          <Button href="/book" variant="primary" size="lg">
            Book your cabin
          </Button>
        </div>
      </Container>
    </section>
  );
}




