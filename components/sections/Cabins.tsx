import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import CabinGrid from "@/components/CabinGrid";
import { cabins, cabinsIntro } from "@/lib/content";

export default function Cabins() {
  return (
    <section id="cabins" className="scroll-mt-20 pt-10 pb-24 sm:pb-28">
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

        <CabinGrid cabins={cabins} />
      </Container>
    </section>
  );
}



