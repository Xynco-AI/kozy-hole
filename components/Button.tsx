import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold tracking-tight " +
  "transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-ice disabled:cursor-not-allowed disabled:opacity-50 select-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  // Sunset amber — the headline action. Warm glow on hover.
  primary:
    "bg-amber text-[#1a0e02] shadow-[0_8px_30px_-12px_rgba(232,133,43,0.7)] " +
    "hover:bg-amber-deep hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-12px_rgba(232,133,43,0.85)] active:translate-y-0",
  // Ice-blue outline — secondary action.
  secondary:
    "border border-ice/40 text-ice bg-ice-soft/40 backdrop-blur-sm " +
    "hover:border-ice/70 hover:bg-ice-soft hover:-translate-y-0.5 active:translate-y-0",
  // Quiet text-only action.
  ghost:
    "text-muted hover:text-ink hover:bg-white/[0.04] border border-transparent",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-[3.25rem] px-7 text-base",
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

type AnchorProps = CommonProps & {
  href: string;
  /** Open in a new tab (external links). */
  external?: boolean;
};

type NativeButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonProps = AnchorProps | NativeButtonProps;

/**
 * The one button in the system. Renders a Next <Link> when `href` is set
 * (internal anchors + routes get prefetching), or a native <button> otherwise.
 */
export default function Button(props: ButtonProps) {
  const {
    children,
    variant = "primary",
    size = "md",
    className = "",
  } = props;
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (props.href !== undefined) {
    const { href, external } = props;
    if (external) {
      return (
        <a
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, ...rest } = props;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
