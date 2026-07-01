import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import ReviewForm from "@/components/ReviewForm";
import { reviewsIntro } from "@/lib/content";

type ReviewData = {
  guest_name: string;
  rating: number;
  comment: string;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill={n <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          className={n <= rating ? "text-amber" : "text-faint/30"}
          aria-hidden
        >
          <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewData }) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-hairline bg-canvas/60 p-5">
      <StarRating rating={review.rating} />
      <p className="text-sm leading-relaxed text-muted">{review.comment}</p>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-faint">
        {review.guest_name}
      </p>
    </div>
  );
}

export default function Reviews({ reviews }: { reviews: ReviewData[] }) {
  return (
    <section
      id="reviews"
      className="scroll-mt-20 border-y border-hairline bg-surface/30 pt-2 pb-24 sm:pb-28"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* Left: heading + reviews or empty state */}
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow={reviewsIntro.eyebrow}
              title={reviewsIntro.title}
              body={reviewsIntro.body}
            />

            {reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {reviews.map((review, i) => (
                  <ReviewCard key={i} review={review} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-dashed border-hairline bg-canvas/60 px-6 py-5">
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
                  No reviews just yet —{" "}
                  <span className="text-ink">reviews coming soon</span>.
                  Book a stay this season and you could be the first voice on the ice.
                </p>
              </div>
            )}
          </div>

          {/* Right: form */}
          <ReviewForm />
        </div>
      </Container>
    </section>
  );
}




