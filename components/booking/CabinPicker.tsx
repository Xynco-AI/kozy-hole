"use client";

import Image from "next/image";

export type CabinOption = {
  id: string;
  slug: string;
  name: string;
  photos: string[] | null;
  sleeps: number;
  max_with_cot: number;
};

type Props = {
  cabins: CabinOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
};

export default function CabinPicker({ cabins, selected, onChange }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < 3) {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cabins.map((cabin) => {
        const isSelected = selected.includes(cabin.id);
        const photo =
          cabin.photos && cabin.photos.length > 0
            ? cabin.photos[0]
            : "/brand/shack-exterior-1.png";

        return (
          <button
            key={cabin.id}
            type="button"
            onClick={() => toggle(cabin.id)}
            aria-pressed={isSelected}
            className={[
              "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border text-left transition-all duration-200",
              isSelected
                ? "border-ice bg-ice-soft shadow-[0_0_0_1px_var(--color-ice)]"
                : "border-[var(--color-hairline)] bg-surface hover:border-ice/40 hover:bg-surface-2",
            ].join(" ")}
          >
            {/* Photo */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={photo}
                alt={`${cabin.name} cabin`}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Selection overlay */}
              {isSelected && (
                <div
                  aria-hidden
                  className="absolute inset-0 bg-ice/10"
                />
              )}
              {/* Checkmark badge */}
              <div
                className={[
                  "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200",
                  isSelected
                    ? "border-ice bg-ice text-[#04121b]"
                    : "border-white/30 bg-black/40",
                ].join(" ")}
              >
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12l5 5L19 7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1 p-4">
              <span
                className={[
                  "font-display text-lg font-semibold tracking-tight transition-colors",
                  isSelected ? "text-ice" : "text-ink",
                ].join(" ")}
              >
                {cabin.name}
              </span>
              <span className="text-sm text-muted">
                Sleeps {cabin.sleeps} / {cabin.max_with_cot} with cot
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
