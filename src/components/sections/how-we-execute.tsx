import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { howWeExecute, processSteps, servicesCapabilities } from "@/lib/data";

export function HowWeExecute() {
  return (
    <Section id="how-it-works" labelledBy="how-heading" tone="white">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            id="how-heading"
            eyebrow={howWeExecute.eyebrow}
            title={howWeExecute.title}
          />

          {/* Key message */}
          <Reveal delay={0.14}>
            <div className="mt-8 rounded-2xl border border-divider bg-surface p-6 sm:p-8">
              <p className="text-h5 font-sans text-text-primary">
                {howWeExecute.vendorMessage}
              </p>
              <p className="text-body mt-3 text-text-secondary">
                {howWeExecute.vendorBody}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {servicesCapabilities.map((capability) => (
                <li
                  key={capability}
                  className="text-small flex items-start gap-2.5 text-text-primary"
                >
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-interactive" />
                  {capability}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <ol className="relative space-y-10 border-l border-divider pl-10">
            {processSteps.map((step, index) => (
              <li key={step.title} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-14 top-0 flex size-8 items-center justify-center rounded-full bg-gradient-primary font-sans text-sm font-semibold text-white"
                >
                  {index + 1}
                </span>
                <h3 className="text-h6 font-sans text-text-primary">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="text-small mt-1.5 max-w-md leading-relaxed text-text-secondary">
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
