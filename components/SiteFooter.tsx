"use client";

import Image from "next/image";
import Container from "./Container";
import { business, contact, footer, nav } from "@/lib/content";

function scrollToSection(href: string) {
  const id = href.startsWith("#") ? href.slice(1) : null;
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export default function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-hairline bg-surface/40">
      {/* thin ice-blue seam at the very top of the footer */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ice/40 to-transparent"
      />
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand + season */}
          <div>
            <div className="flex items-center gap-3">
              <span className="relative inline-flex h-12 w-12 items-center justify-center">
                <Image
                  src={business.logo}
                  alt={`${business.name} logo`}
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl tracking-tight text-ink">
                  {business.shortName}
                </span>
                <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-faint">
                  Ice Shack Rentals
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              {footer.seasonNote}
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-faint">
              Explore
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item.href);
                    }}
                    className="text-sm text-muted transition-colors hover:text-ice"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-faint">
              Contact
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-muted transition-colors hover:text-ice"
                >
                  {contact.email}
                </a>
              </li>
              {contact.owners.map((o) => (
                <li key={o.phone} className="text-muted">
                  <span className="text-faint">{o.name}</span>{" "}
                  <a
                    href={`tel:${o.phone.replace(/-/g, "")}`}
                    className="transition-colors hover:text-ice"
                  >
                    {o.phone}
                  </a>
                </li>
              ))}
              <li className="pt-1 text-faint">{business.location}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-hairline pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>{footer.rightsLine}</p>
          <p>Season {business.season} · Pet-friendly</p>
          <p>
            Made by{" "}
            <a
              href="https://xynco.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <span className="text-ice">x</span><span className="text-white">ynco.io</span>
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
