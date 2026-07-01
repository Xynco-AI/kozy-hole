"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import Button from "./Button";
import { business, nav } from "@/lib/content";

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  function scrollToHash(href: string) {
    const id = href.startsWith("#") ? href.slice(1) : null;
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    const y = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: y, behavior: "smooth" });
    return true;
  }

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith("#") && scrollToHash(href)) {
      e.preventDefault();
    }
  }

  // Solidify the bar once the hero scrolls under it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-hairline bg-canvas/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <Container className="flex h-[4.5rem] items-center justify-between gap-4 py-3">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label={`${business.name} — home`}
        >
          <span className="relative inline-flex h-11 w-11 items-center justify-center">
            <Image
              src={business.logo}
              alt=""
              fill
              sizes="44px"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-lg tracking-tight text-ink">
              {business.shortName}
            </span>
            <span className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-faint">
              Ice Shack Rentals
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const href = !isHome && item.href.startsWith("#") ? `/${item.href}` : item.href;
            return (
              <Link
                key={item.href}
                href={href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-[#ffffff] transition-colors hover:text-ice"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button href="/book" variant="primary" className="hidden sm:inline-flex">
            Book now
          </Button>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-ink transition-colors hover:bg-white/[0.05] lg:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              {open ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </>
              ) : (
                <>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile sheet */}
      {open && (
        <div className="lg:hidden">
          <Container className="border-t border-hairline bg-canvas/95 py-6 backdrop-blur-xl">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => {
                const href = !isHome && item.href.startsWith("#") ? `/${item.href}` : item.href;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={(e) => {
                      if (item.href.startsWith("#")) {
                        e.preventDefault();
                        setOpen(false);
                        setTimeout(() => scrollToHash(item.href), 300);
                      }
                    }}
                    className="rounded-xl px-4 py-3 text-lg font-medium text-muted transition-colors hover:bg-white/[0.04] hover:text-ink"
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Button
                href="/book"
                variant="primary"
                size="lg"
                className="mt-3 w-full"
              >
                Book now
              </Button>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}
