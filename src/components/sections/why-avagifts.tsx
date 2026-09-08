import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { whyPoints } from "@/lib/data";
import { getIcon } from "@/lib/icons";
import { STAGGER } from "@/lib/motion";

export function WhyAvaGifts() {
  return (
    <Section id="why" labelledBy="why-heading" tone="paper">
      <SectionHeading
        id="why-heading"
        eyebrow="Why AvaGifts"
        title="Built for busy teams."
        lede="We removed everything painful about corporate gifting — minimums, follow-ups and forgettable gifts."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {whyPoints.map((point, index) => {
          const Icon = getIcon(point.icon);
          return (
            <Reveal key={point.title} delay={(index % 3) * STAGGER} className="h-full">
              <Card hoverable className="h-full p-6 lg:p-7">
                <div className="flex size-11 items-center justify-center rounded-full bg-cream">
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-5 text-accent" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-[-0.01em]">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{point.body}</p>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
