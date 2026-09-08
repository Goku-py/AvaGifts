"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { usePikuConcierge } from "./piku-concierge-context";

/**
 * Mid-page entry point for the Piku concierge — sits between the ink
 * catalog band and the Why section. Opens the guided flow modal.
 */
export function PikuEntrySection() {
  const { openConcierge } = usePikuConcierge();

  return (
    <Section
      id="piku"
      labelledBy="piku-heading"
      tone="cream"
      className="overflow-hidden"
    >
      {/* Faint concentric arcs — same decorative language as CatalogCta */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-56 size-[560px] rounded-full border border-ink/[0.06]" />
        <div className="absolute -left-24 -top-40 size-[380px] rounded-full border border-ink/[0.08]" />
        <div className="absolute -bottom-72 -right-40 size-[620px] rounded-full border border-ink/[0.05]" />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <Reveal>
          <Eyebrow className="justify-center">Meet Piku</Eyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <h2
            id="piku-heading"
            className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-5xl"
          >
            Tell Piku what you’re looking for.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
            A two-minute chat about your occasion, your people and your budget —
            then our gifting team takes it from there.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-col items-center justify-center gap-4">
            <Button size="lg" arrow onClick={openConcierge}>
              <MessageCircle aria-hidden="true" className="size-4" />
              Chat with Piku
            </Button>
            <p className="text-sm text-ink-soft">
              No sign-ups. No catalogs to scroll. Just a short chat.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
