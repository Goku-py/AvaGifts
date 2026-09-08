import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { company, makerCta } from "@/lib/data";

export function MakerCta() {
  return (
    <Section
      id="for-makers"
      labelledBy="for-makers-heading"
      tone="gradient"
      className="overflow-hidden"
    >
      <div className="relative mx-auto max-w-2xl text-center">
        <Reveal>
          <h2 id="for-makers-heading" className="text-h2 font-sans text-white">
            {makerCta.title}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-body-lg mx-auto mt-5 max-w-xl text-white/75">
            {makerCta.body}
          </p>
        </Reveal>
        <Reveal delay={0.16}>
          <a
            href={`mailto:${company.email}?subject=Gifting%20Partnership`}
            className="group mt-9 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 text-button text-text-primary transition-[transform,background-color] duration-200 hover:bg-surface active:translate-y-px motion-reduce:transition-none"
          >
            {makerCta.cta}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:translate-x-0 motion-reduce:transition-none"
            />
          </a>
        </Reveal>
      </div>
    </Section>
  );
}
