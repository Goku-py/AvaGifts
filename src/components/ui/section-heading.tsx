import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  /** id for the <h2> — pair with Section's `labelledBy`. */
  id: string;
  eyebrow: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  /** Use "dark" on navy/gradient bands. */
  tone?: "light" | "dark";
  className?: string;
}

/** Eyebrow + H2 title + optional serif lede, with staggered scroll-reveal. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lede,
  align = "left",
  tone = "light",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div className={cn("max-w-2xl", centered && "mx-auto text-center", className)}>
      <Reveal>
        <Eyebrow tone={tone} className={cn(centered && "justify-center")}>
          {eyebrow}
        </Eyebrow>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 id={id} className="text-h2 mt-4 font-sans text-text-primary">
          {title}
        </h2>
      </Reveal>
      {lede ? (
        <Reveal delay={0.16}>
          <p
            className={cn(
              "text-body-lg mt-4 max-w-[65ch]",
              tone === "dark" ? "text-white/70" : "text-text-secondary",
            )}
          >
            {lede}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
