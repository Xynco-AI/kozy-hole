"use client";

import { useState } from "react";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { faqIntro, faqs } from "@/lib/content";

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="scroll-mt-24 py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow={faqIntro.eyebrow}
          title={faqIntro.title}
          body={faqIntro.body}
        />

        <div className="mt-12 divide-y divide-hairline">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
                aria-expanded={open === i}
              >
                <span className="font-display text-lg tracking-tight text-ink">
                  {faq.q}
                </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-ice transition-transform duration-200 ${open === i ? "rotate-45" : ""}`}
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              {open === i && (
                <p className="pb-6 leading-relaxed text-muted">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
