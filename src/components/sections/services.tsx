import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { processSteps, servicesCapabilities } from "@/lib/data";

export function Services() {
  return (
    <Section id="services" labelledBy="services-heading" tone="cream">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div>
          <SectionHeading
            id="services-heading"
            eyebrow="Services"
            title="Custom & bulk, handled end to end."
            lede="Whether it’s 50 onboarding kits or 2,000 Diwali hampers across six cities, we run the whole programme — custom branding, co-packed hampers, multi-city delivery and GST invoicing, with one dedicated project manager on your brief."
          />

          <Reveal delay={0.2}>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {servicesCapabilities.map((capability) => (
                <li key={capability} className="flex items-start gap-2.5 text-sm text-ink">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
                  {capability}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.28}>
            <div className="mt-9">
              <ButtonLink variant="secondary" href="#contact" arrow>
                Start an enquiry
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ol className="relative space-y-10 border-l border-line pl-10">
            {processSteps.map((step, index) => (
              <li key={step.title} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-14 top-0 flex size-8 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-paper"
                >
                  {index + 1}
                </span>
                <h3 className="font-display text-lg font-semibold tracking-[-0.01em]">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </Section>
  );
}
