import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import { whatToBring, whatToBringIntro } from "@/lib/content";

export default function WhatToBring() {
  return (
    <section className="pt-2 pb-24 sm:pb-28">
      <Container>
        <SectionHeading
          eyebrow={whatToBringIntro.eyebrow}
          title={whatToBringIntro.title}
          body={whatToBringIntro.body}
        />

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whatToBring.map((item, i) => (
            <li
              key={item.title}
              className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-hairline bg-surface p-6"
            >
              <span className="font-display text-2xl text-ice/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg tracking-tight text-ink">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{item.detail}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}




