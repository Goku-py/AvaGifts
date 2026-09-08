import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { why, whyPoints } from "@/lib/data";
import { getIcon } from "@/lib/icons";
import { STAGGER } from "@/lib/motion";

export function WhyAvaGifts() {
  return (
    <Section id="why" labelledBy="why-heading" tone="surface">
      <SectionHeading
        id="why-heading"
        eyebrow={why.eyebrow}
        title={why.title}
        lede={why.lede}
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {whyPoints.map((point, index) => {
          const Icon = getIcon(point.icon);
          return (
            <Reveal key={point.title} delay={(index % 3) * STAGGER} className="h-full">
              <Card hoverable className="h-full p-6 lg:p-7">
                <div className="flex size-11 items-center justify-center rounded-full bg-surface">
                  <Icon aria-hidden="true" strokeWidth={1.75} className="size-5 text-interactive" />
                </div>
                <h3 className="text-h6 mt-5 font-sans text-text-primary">{point.title}</h3>
                <p className="text-small mt-2 leading-relaxed text-text-secondary">
                  {point.body}
                </p>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
