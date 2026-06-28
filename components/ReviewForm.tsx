"use client";

import { useState } from "react";
import Button from "./Button";
import { reviewsIntro } from "@/lib/content";
import { submitReview } from "@/app/actions/reviews";

function Star({
  filled,
  ...props
}: { filled: boolean } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3Z" />
    </svg>
  );
}

export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const active = hover || rating;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(false);
    setSubmitting(true);
    try {
      const result = await submitReview({ guestName: name, rating, comment });
      if (result.ok) {
        setSuccess(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-hairline bg-surface p-7 sm:p-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-success/20 bg-success/10 text-success">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <div>
          <h3 className="font-display text-2xl tracking-tight text-ink">
            Thanks for the review!
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your review will appear here once it&apos;s approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-hairline bg-surface p-7 sm:p-8"
    >
      <div>
        <h3 className="font-display text-2xl tracking-tight text-ink">
          {reviewsIntro.formTitle}
        </h3>
        <p className="mt-1.5 text-sm text-muted">{reviewsIntro.formNote}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="review-name"
          className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-faint"
        >
          Your name
        </label>
        <input
          id="review-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Dave from Edmonton"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-12 rounded-xl border border-hairline bg-canvas px-4 text-ink placeholder:text-faint/70 transition-colors focus:border-ice/50 focus-visible:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-faint">
          Rating
        </span>
        <div
          className="flex items-center gap-1.5 text-amber"
          onMouseLeave={() => setHover(0)}
          role="radiogroup"
          aria-label="Star rating"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className={`rounded-md p-0.5 transition-transform hover:scale-110 ${
                n <= active ? "text-amber" : "text-faint/40"
              }`}
            >
              <Star filled={n <= active} />
            </button>
          ))}
          <input type="hidden" name="rating" value={rating} readOnly />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="review-comment"
          className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-faint"
        >
          Comment
        </label>
        <textarea
          id="review-comment"
          name="comment"
          rows={4}
          placeholder="Tell us about your day on the ice…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          className="resize-none rounded-xl border border-hairline bg-canvas px-4 py-3 text-ink placeholder:text-faint/70 transition-colors focus:border-ice/50 focus-visible:outline-none"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Please check your entries and try again.
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full sm:w-fit"
        disabled={submitting}
      >
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
      <p className="text-xs text-faint">
        Reviews are checked before they appear on the site.
      </p>
    </form>
  );
}
