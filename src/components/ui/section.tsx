import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionTone =
  | "white"
  | "surface"
  | "navy"
  | "gradient"
  | "warm"
  | "ink"
  | "ink-deep"
  | "accent";

const toneClasses: Record<SectionTone, string> = {
  white: "bg-white text-text-primary",
  surface: "bg-surface text-text-primary",
  navy: "bg-primary text-white",
  gradient: "bg-gradient-primary text-white",
  warm: "bg-gradient-warm text-primary",
  /* The redesign's black bands. */
  ink: "bg-ink-850 text-text-on-dark",
  "ink-deep": "bg-ink-900 text-text-on-dark",
  /* The yellow logo band. */
  accent: "bg-accent text-primary",
};

/**
 * Focus-ring context per tone. The default interactive blue only reads on
 * light, low-chroma backgrounds:
 *  - "dark"  (navy/gradient/ink) → accent gold
 *  - "warm"  (orange→gold)       → navy, since blue on orange is muddy
 *  - "accent" (solid yellow)     → navy, same reason
 * Everything else keeps the global blue ring.
 */
const toneFocusContext: Partial<Record<SectionTone, string>> = {
  navy: "dark",
  gradient: "dark",
  ink: "dark",
  "ink-deep": "dark",
  warm: "warm",
  accent: "warm",
};

type SectionWidth = "standard" | "narrow" | "wide";

const containerWidthClasses: Record<SectionWidth, string> = {
  standard: "max-w-[1200px]",
  narrow: "max-w-[720px]",
  wide: "max-w-[1360px]",
};

/**
 * Vertical rhythm. Uniform spacing on every band is what makes a page read as
 * templated, so bands opt into a density instead of all sharing one value.
 */
type SectionDensity = "compact" | "default" | "spacious";

const densityClasses: Record<SectionDensity, string> = {
  compact: "py-12 sm:py-16 lg:py-20",
  default: "py-16 sm:py-24 lg:py-28",
  spacious: "py-20 sm:py-28 lg:py-40",
};

interface SectionProps extends ComponentPropsWithoutRef<"section"> {
  tone?: SectionTone;
  /** id of the section heading element, wired to aria-labelledby. */
  labelledBy?: string;
  /** Content container width — narrow gives the 720px reading measure. */
  width?: SectionWidth;
  /** Vertical rhythm. Vary this across the page so bands don't all feel alike. */
  density?: SectionDensity;
  containerClassName?: string;
  children: ReactNode;
}

/**
 * Page band: background tone + centred container.
 * Dark tones are marked with `data-tone="dark"` so the accent focus ring in
 * globals.css applies to everything inside them.
 */
export function Section({
  tone = "white",
  labelledBy,
  width = "standard",
  density = "default",
  className,
  containerClassName,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      data-tone={toneFocusContext[tone]}
      className={cn(
        "relative scroll-mt-24",
        densityClasses[density],
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      <div
        className={cn(
          "mx-auto w-full px-6",
          containerWidthClasses[width],
          containerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
