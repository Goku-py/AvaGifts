import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { why, whyPoints } from "@/lib/data";
import { getIcon } from "@/lib/icons";
import { STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function WhyAvaGifts() {
  return (
    <Section id="why" labelledBy="why-heading" tone="white">
      <SectionHeading
        id="why-heading"
        eyebrow={why.eyebrow}
        title={why.title}
        lede={why.lede}
      />

      {/*
        Deliberately not a card grid. Six bordered cards in a row is the single
        most template-looking pattern on the page; ruled cells give the same
        information an editorial, printed-page feel instead. The 1px gap over a
        divider-coloured background draws the rules — no per-cell borders to
        double up at the seams.
      */}
      {/* data-piku marks a landmark the mascot can offer a contextual hint on.
          It sits on the grid rather than the <Section> because the observer
          uses a 0.2 threshold, which a full-height band may never reach. */}
      <div
        data-piku="why"
        className="mt-14 grid gap-px overflow-hidden border-y border-divider bg-divider sm:grid-cols-2 lg:grid-cols-3"
      >
        {whyPoints.map((point, index) => {
          const Icon = getIcon(point.icon);
          return (
            <Reveal
              key={point.title}
              delay={(index % 3) * STAGGER}
              className="h-full"
            >
              <article
                className={cn(
                  "group h-full bg-white p-7 transition-colors duration-300 ease-out lg:p-9",
                  "hover:bg-surface motion-reduce:transition-none",
                )}
              >
                <Icon
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="size-8 text-interactive"
                />
                <h3 className="text-h5 mt-6 font-sans text-text-primary">
                  {point.title}
                </h3>
                <p className="text-body mt-3 text-text-secondary">
                  {point.body}
                </p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
