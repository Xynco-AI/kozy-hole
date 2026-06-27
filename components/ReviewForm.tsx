"use client";

import { useState } from "react";
import Button from "./Button";
import { reviewsIntro } from "@/lib/content";

// TODO: Wire submission in a later task. This <form> is a styled placeholder —
// it captures a name, a 1–5 star rating, and a comment, but does not yet POST
// anywhere (submission + Supabase persistence is a separate, later task).

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
  const active = hover || rating;

  return (
    <form
      // Placeholder: no submit handler yet (wired in a later task).
      onSubmit={(e) => e.preventDefault()}
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
          {/* keep the selected value available to a future submit handler */}
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
          className="resize-none rounded-xl border border-hairline bg-canvas px-4 py-3 text-ink placeholder:text-faint/70 transition-colors focus:border-ice/50 focus-visible:outline-none"
        />
      </div>

      <Button type="submit" variant="primary" size="lg" className="w-full sm:w-fit">
        Submit review
      </Button>
      <p className="text-xs text-faint">
        Reviews are checked before they appear on the site.
      </p>
    </form>
  );
}
