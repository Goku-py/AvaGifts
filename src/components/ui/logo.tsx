import { cn } from "@/lib/utils";

interface GiftMarkProps {
  className?: string;
  /** Outline version that inherits `currentColor` — for navy/gradient bands. */
  mono?: boolean;
}

/**
 * AvaGifts mark — gradient rounded square with a white gift glyph and an
 * accent ribbon; `mono` renders an outline variant for dark surfaces.
 */
export function GiftMark({ className, mono = false }: GiftMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
      fill="none"
    >
      {mono ? (
        <>
          <rect x="1.5" y="1.5" width="29" height="29" rx="7.5" stroke="currentColor" strokeWidth="2" />
          <rect x="9" y="15" width="14" height="8.5" rx="1.6" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
          <rect x="7.5" y="11.5" width="17" height="3.2" rx="1.2" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
          <path d="M16 11.5V23.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M16 10.6c-1.5-2.4-5-2-4.2.4.4 1.1 2.6 1.2 4.2-.4Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 10.6c1.5-2.4 5-2 4.2.4-.4 1.1-2.6 1.2-4.2-.4Z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <defs>
            <linearGradient id="avagifts-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#0B2A4D" />
              <stop offset="1" stopColor="#1273EB" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#avagifts-mark)" />
          <rect x="9" y="15" width="14" height="8.5" rx="1.6" stroke="#FFFFFF" strokeWidth="1.9" strokeLinejoin="round" />
          <rect x="7.5" y="11.5" width="17" height="3.2" rx="1.2" stroke="#FFFFFF" strokeWidth="1.9" strokeLinejoin="round" />
          <path d="M16 11.5V23.5" stroke="#FFDE59" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M16 10.6c-1.5-2.4-5-2-4.2.4.4 1.1 2.6 1.2 4.2-.4Z" stroke="#FFDE59" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 10.6c1.5-2.4 5-2 4.2.4-.4 1.1-2.6 1.2-4.2-.4Z" stroke="#FFDE59" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

interface LogoProps {
  /** Single-colour version (inherits text colour) — use on navy/gradient bands. */
  mono?: boolean;
  className?: string;
}

/** AvaGifts wordmark: gradient gift-mark + name with interactive-blue period. */
export function Logo({ mono = false, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <GiftMark mono={mono} />
      <span
        className={cn(
          "font-sans text-[17px] font-semibold tracking-[-0.01em]",
          mono ? "text-current" : "text-text-primary",
        )}
      >
        AvaGifts<span className={mono ? "" : "text-interactive"}>.</span>
      </span>
    </span>
  );
}
