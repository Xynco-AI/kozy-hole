import type { AmenityIcon } from "@/lib/content";

type IconProps = {
  name: AmenityIcon;
  className?: string;
};

/**
 * Simple, consistent line icons for the amenities grid.
 * Inline SVG — no emoji, no icon-font dependency. 24×24, 1.5 stroke.
 */
const paths: Record<AmenityIcon, React.ReactNode> = {
  // flame — heat
  flame: (
    <path d="M12 3c.5 3-2.5 4-2.5 7a2.5 2.5 0 0 0 5 0c0-.8-.3-1.4-.6-2 .9.6 2.1 1.9 2.1 4a4 4 0 1 1-8 0c0-3.5 3-5.5 4-9Z" />
  ),
  // sun — solar power
  solar: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
    </>
  ),
  // auger / drilled hole
  auger: (
    <>
      <ellipse cx="12" cy="6" rx="6" ry="2.4" />
      <path d="M6 6c0 1.3 2.7 2.4 6 2.4S18 7.3 18 6" />
      <path d="M12 8.4V19" />
      <path d="M9 19h6" />
    </>
  ),
  // monitor — TV / electronics
  tv: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="1.8" />
      <path d="M8.5 20h7M12 16.5V20" />
    </>
  ),
  // cooktop — cook & eat
  stove: (
    <>
      <rect x="4" y="9" width="16" height="11" rx="2" />
      <path d="M4 13h16" />
      <circle cx="8" cy="16.5" r="1" />
      <circle cx="12" cy="16.5" r="1" />
      <circle cx="16" cy="16.5" r="1" />
      <path d="M8 9V6.5M12 9V5.5M16 9V6.5" />
    </>
  ),
  // spray / clean supplies
  supplies: (
    <>
      <path d="M9 8h6l1 12H8L9 8Z" />
      <path d="M10 8V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V8" />
      <path d="M11 12h2" />
    </>
  ),
  // shield — safety
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3Z" />
      <path d="m9 11.5 2 2 4-4" />
    </>
  ),
  // washroom / droplet
  washroom: (
    <path d="M12 3.5s5.5 6.1 5.5 9.8A5.5 5.5 0 0 1 12 19a5.5 5.5 0 0 1-5.5-5.7C6.5 9.6 12 3.5 12 3.5Z" />
  ),
};

export default function Icon({ name, className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
