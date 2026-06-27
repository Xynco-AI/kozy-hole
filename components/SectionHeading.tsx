import type { ReactNode } from "react";

type SectionHeadingProps = {
  /** Small label above the title. */
  eyebrow?: string;
  title: ReactNode;
  /** Optional supporting paragraph. */
  body?: ReactNode;
  /** Center the block (defaults to left-aligned). */
  align?: "left" | "center";
  className?: string;
};

/**
 * Consistent section header: ice-blue eyebrow, Fraunces display title,
 * muted supporting copy. Reused by every landing section.
 */
export default function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const alignCls = align === "center" ? "items-center text-center" : "items-start";
  return (
    <div
      className={`flex flex-col ${alignCls} ${
        align === "center" ? "mx-auto" : ""
      } max-w-2xl ${className}`}
    >
      {eyebrow && (
        <span className="mb-4 inline-flex items-center gap-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-ice">
          <span
            aria-hidden
            className="h-px w-7 bg-gradient-to-r from-ice to-transparent"
          />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-balance text-[2rem] leading-[1.08] tracking-tight text-ink sm:text-[2.6rem]">
        {title}
      </h2>
      {body && (
        <p className="mt-5 max-w-xl text-pretty text-[1.05rem] leading-relaxed text-muted">
          {body}
        </p>
      )}
    </div>
  );
}
