import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { howWeExecute, processSteps, servicesCapabilities } from "@/lib/data";

export function HowWeExecute() {
  return (
    <Section
      id="how-it-works"
      labelledBy="how-heading"
      tone="surface"
      density="spacious"
    >
      {/* Asymmetric split — the sticky claim holds the left rail while the
          process scrolls past it, so the two columns read as one argument
          rather than two stacked lists. */}
      <div className="grid gap-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-24">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            id="how-heading"
            eyebrow={howWeExecute.eyebrow}
            title={howWeExecute.title}
          />

          <Reveal delay={0.14}>
            <div className="mt-8 border-l-2 border-accent pl-6">
              <p className="text-h5 font-sans text-text-primary">
                {howWeExecute.vendorMessage}
              </p>
              <p className="text-body mt-3 text-text-secondary">
                {howWeExecute.vendorBody}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <ul className="mt-10 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {servicesCapabilities.map((capability) => (
                <li
                  key={capability}
                  className="text-small flex items-start gap-2.5 text-text-primary"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-interactive"
                  />
                  {capability}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/*
          Oversized numerals carry the hierarchy here instead of another set of
          badges. They're the page's second typographic peak after the hero and
          give the section a scale nothing else on the page has.
        */}
        <ol className="relative">
          {processSteps.map((step, index) => (
            <Reveal key={step.title} delay={0.1 + index * 0.06}>
              <li className="group relative grid grid-cols-[auto_minmax(0,1fr)] gap-6 border-t border-divider py-8 first:border-t-0 first:pt-0 sm:gap-8">
                <span
                  aria-hidden="true"
                  className="font-sans text-4xl font-bold leading-none tracking-[-0.03em] text-divider transition-colors duration-300 ease-out group-hover:text-accent motion-reduce:transition-none sm:text-5xl"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-h5 font-sans text-text-primary">
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="text-body mt-2 max-w-md text-text-secondary">
                    {step.body}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
