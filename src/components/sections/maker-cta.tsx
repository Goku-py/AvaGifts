import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { company, makerCta } from "@/lib/data";

export function MakerCta() {
  return (
    <Section
      id="for-makers"
      labelledBy="for-makers-heading"
      /* Warm gradient rather than the brand navy→blue used by the hero and the
         final CTA: this is an aside to a different audience, and repeating the
         primary gradient a third time is what flattens a page. */
      tone="warm"
      density="compact"
      className="overflow-hidden"
    >
      <div className="relative grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-12">
        <div>
          <Reveal>
            <h2
              id="for-makers-heading"
              className="text-h3 font-sans text-primary"
            >
              {makerCta.title}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            {/* Full-strength navy, not /80: against the orange end of the
                gradient the faded version drops to ~3.6:1, under AA. */}
            <p className="text-body mt-3 max-w-xl text-primary">
              {makerCta.body}
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.16}>
          <ButtonLink
            href={`mailto:${company.email}?subject=Gifting%20Partnership`}
            size="lg"
            arrow
            className="bg-primary text-white hover:bg-primary/90"
          >
            {makerCta.cta}
          </ButtonLink>
        </Reveal>
      </div>
    </Section>
  );
}
