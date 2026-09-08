import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionTone = "white" | "surface" | "navy" | "gradient" | "paper" | "cream" | "ink";

const toneClasses: Record<SectionTone, string> = {
  white: "bg-white text-text-primary",
  surface: "bg-surface text-text-primary",
  navy: "bg-primary text-white",
  gradient: "bg-gradient-primary text-white",
  /* Legacy aliases */
  paper: "bg-white text-text-primary",
  cream: "bg-surface text-text-primary",
  ink: "bg-primary text-white",
};

type SectionWidth = "standard" | "narrow";

const containerWidthClasses: Record<SectionWidth, string> = {
  standard: "max-w-[1200px]",
  narrow: "max-w-[720px]",
};

interface SectionProps extends ComponentPropsWithoutRef<"section"> {
  tone?: SectionTone;
  /** id of the section heading element, wired to aria-labelledby. */
  labelledBy?: string;
  /** Content container width — narrow gives the 720px reading measure. */
  width?: SectionWidth;
  containerClassName?: string;
  children: ReactNode;
}

/**
 * Page band: background tone + centred container with consistent rhythm.
 * Vertical rhythm 64 → 96 → 128px (mobile/tablet/desktop).
 */
export function Section({
  tone = "white",
  labelledBy,
  width = "standard",
  className,
  containerClassName,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        "relative scroll-mt-24 py-16 sm:py-24 lg:py-32",
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
