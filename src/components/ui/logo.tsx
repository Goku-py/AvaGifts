import { cn } from "@/lib/utils";

/** Geometric gift-box monogram — 2px strokes, inherits `currentColor`. */
export function GiftMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* box */}
      <rect x="4.5" y="12" width="23" height="15.5" rx="2.5" />
      {/* lid */}
      <rect x="3" y="6.5" width="26" height="5.5" rx="1.75" />
      {/* ribbon */}
      <path d="M16 12v15.5" />
      {/* bow */}
      <path d="M16 6.5C14.2 3.6 9.6 4 10.5 6.5c.5 1.4 3.2 1.5 5.5 0Z" />
      <path d="M16 6.5c1.8-2.9 6.4-2.5 5.5 0-.5 1.4-3.2 1.5-5.5 0Z" />
    </svg>
  );
}

interface LogoProps {
  /** Single-colour version (inherits text colour) — use on ink bands or as a signature. */
  mono?: boolean;
  className?: string;
}

/** AvaGifts wordmark: monogram + name. Inline SVG so it stays crisp at any size. */
export function Logo({ mono = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <GiftMark className={mono ? "text-current" : "text-accent"} />
      <span
        className={cn(
          "font-sans text-[17px] font-semibold tracking-[-0.01em]",
          mono ? "text-current" : "text-ink",
        )}
      >
        AvaGifts
      </span>
    </span>
  );
}
