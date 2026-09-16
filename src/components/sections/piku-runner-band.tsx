import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { PikuRunner } from "@/components/piku-runner/PikuRunner";

export function PikuRunnerBand() {
  return (
    <Section id="piku-run" labelledBy="piku-run-heading" tone="surface">
      <div className="flex flex-col items-center gap-4">
        <Reveal>
          <h2 id="piku-run-heading" className="text-section-title text-center text-text-primary">
            Take a breather with Piku
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-body-lg mx-auto max-w-[62ch] text-center text-text-secondary">
            Gifting projects take patience — so does a good delivery run. Stretch your fingers,
            dodge a few crates, then let&rsquo;s find gifts people actually keep.
          </p>
        </Reveal>
      </div>
      <Reveal delay={0.12} className="mt-10 lg:mt-14">
        <PikuRunner />
      </Reveal>
    </Section>
  );
}
