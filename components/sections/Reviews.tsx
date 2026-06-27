import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import ReviewForm from "@/components/ReviewForm";
import { reviewsIntro } from "@/lib/content";

export default function Reviews() {
  return (
    <section
      id="reviews"
      className="scroll-mt-24 border-y border-hairline bg-surface/30 py-24 sm:py-28"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Empty state */}
          <div>
            <SectionHeading
              eyebrow={reviewsIntro.eyebrow}
              title={reviewsIntro.title}
              body={reviewsIntro.body}
            />
            <div className="mt-8 flex items-center gap-4 rounded-[var(--radius-card)] border border-dashed border-hairline bg-canvas/60 px-6 py-5">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ice/20 bg-ice-soft text-ice">
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
                  <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.6A8.4 8.4 0 1 1 21 11.5Z" />
                  <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
                </svg>
              </span>
              <p className="text-sm leading-relaxed text-muted">
                No reviews just yet — <span className="text-ink">reviews coming soon</span>.
                Book a stay this season and you could be the first voice on the ice.
              </p>
            </div>
          </div>

          {/* Form */}
          <ReviewForm />
        </div>
      </Container>
    </section>
  );
}
