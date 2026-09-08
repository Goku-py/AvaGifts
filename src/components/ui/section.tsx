import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionTone = "paper" | "cream" | "ink";

const toneClasses: Record<SectionTone, string> = {
  paper: "bg-paper text-ink",
  cream: "bg-cream text-ink",
  ink: "bg-ink text-paper",
};

interface SectionProps extends ComponentPropsWithoutRef<"section"> {
  tone?: SectionTone;
  /** id of the section heading element, wired to aria-labelledby. */
  labelledBy?: string;
  containerClassName?: string;
  children: ReactNode;
}

/**
 * Page band: background tone + centred container with consistent rhythm.
 */
export function Section({
  tone = "paper",
  labelledBy,
  className,
  containerClassName,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        "relative scroll-mt-24 py-16 sm:py-20 lg:py-28",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", containerClassName)}>
        {children}
      </div>
    </section>
  );
}
