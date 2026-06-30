"use client";

import { useEffect } from "react";

export default function ScrollReveal() {
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("section[id]")
    );

    sections.forEach((el) => {
      el.setAttribute("data-reveal", "");
      // Immediately reveal anything already in the viewport so there's no flash
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95) {
        el.classList.add("is-visible");
      }
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07, rootMargin: "0px 0px -48px 0px" }
    );

    sections.forEach((el) => {
      if (!el.classList.contains("is-visible")) io.observe(el);
    });

    return () => io.disconnect();
  }, []);

  return null;
}
