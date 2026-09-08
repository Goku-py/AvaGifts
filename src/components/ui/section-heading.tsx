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
  /** Use "dark" on ink-toned bands. */
  tone?: "light" | "dark";
  className?: string;
}

/** Eyebrow + Fraunces title + optional lede, with staggered scroll-reveal. */
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
        <h2
          id={id}
          className="mt-4 font-display text-3xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-4xl lg:text-[2.75rem]"
        >
          {title}
        </h2>
      </Reveal>
      {lede ? (
        <Reveal delay={0.16}>
          <p
            className={cn(
              "mt-4 text-base leading-relaxed sm:text-lg",
              tone === "dark" ? "text-paper/70" : "text-ink-soft",
            )}
          >
            {lede}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
