import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Icon from "@/components/Icon";
import { amenities, amenitiesFootnote, amenitiesIntro } from "@/lib/content";

export default function Amenities() {
  return (
    <section
      id="amenities"
      className="scroll-mt-20 border-y border-hairline bg-surface/30 pt-2 pb-24 sm:pb-28"
    >
      <Container>
        <SectionHeading
          eyebrow={amenitiesIntro.eyebrow}
          title={amenitiesIntro.title}
          body={amenitiesIntro.body}
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3">
          {amenities.map((group) => (
            <div
              key={group.title}
              className="group flex flex-col gap-4 p-3 sm:p-4 lg:p-7"
            >
              <div className="flex items-center gap-3.5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-ice/20 bg-ice-soft text-ice transition-colors duration-300 group-hover:border-ice/40">
                  <Icon name={group.icon} className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg tracking-tight text-ink">
                  {group.title}
                </h3>
              </div>
              <ul className="flex flex-col gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-snug text-muted"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ice/60"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 flex items-start gap-2.5 text-sm text-faint">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0 text-amber"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8h.01M11 12h1v4h1" />
          </svg>
          {amenitiesFootnote}
        </p>
      </Container>
    </section>
  );
}



