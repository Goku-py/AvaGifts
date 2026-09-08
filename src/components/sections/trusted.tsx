import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { trusted } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Wordmark treatments — plain-text logotypes (no fabricated brand assets),
 * each with a distinct type treatment so the row reads like a logo wall.
 */
const wordmarkClasses = [
  "font-sans text-xl font-medium tracking-[-0.02em]",
  "font-sans text-xl font-semibold tracking-tight",
  "font-sans text-lg font-semibold uppercase tracking-[0.18em]",
  "font-serif text-xl font-semibold italic",
] as const;

export function TrustedCustomers() {
  return (
    <Section id="trusted" labelledBy="trusted-heading" tone="surface" className="py-14 sm:py-16 lg:py-20">
      <SectionHeading
        id="trusted-heading"
        eyebrow={trusted.eyebrow}
        title={trusted.title}
        lede={trusted.lede}
      />

      <ul className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {trusted.customers.map((customer, index) => (
          <Reveal key={customer.name} delay={index * 0.06} className="h-full">
            <li className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-divider bg-white p-6 shadow-card transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-7">
              <span className={cn("text-text-primary", wordmarkClasses[index])}>
                {customer.name}
              </span>
              <p className="text-caption text-muted">
                Repeat customer since {customer.since}
              </p>
            </li>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
