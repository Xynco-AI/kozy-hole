import type { ElementType, ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  /** Render as a different element (e.g. "section", "header", "footer"). */
  as?: ElementType;
  /** Tighter reading width for prose-heavy sections. */
  size?: "default" | "narrow";
};

/**
 * Site-wide max-width wrapper with consistent gutters.
 * Used by every section so horizontal rhythm stays identical across pages.
 */
export default function Container({
  children,
  className = "",
  as,
  size = "default",
}: ContainerProps) {
  const Tag = as ?? "div";
  const max = size === "narrow" ? "max-w-3xl" : "max-w-6xl";
  return (
    <Tag className={`mx-auto w-full ${max} px-6 sm:px-8 lg:px-10 ${className}`}>
      {children}
    </Tag>
  );
}
