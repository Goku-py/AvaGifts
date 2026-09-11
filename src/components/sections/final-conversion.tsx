"use client";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { finalConversion } from "@/lib/data";
import { usePikuConcierge } from "@/components/piku-concierge/piku-concierge-context";
import { glanceHandlers } from "@/lib/piku-glance";

export function FinalConversion() {
  const { openConcierge } = usePikuConcierge();

  return (
    /*
      `data-piku="contact"` is this band's only claim to the mascot's
      contextual hint ("Need bulk pricing or custom branding?"). It is not
      decorative — dropping it fails silently.
    */
    <Section
      id="contact"
      labelledBy="contact-heading"
      tone="ink-deep"
      data-piku="contact"
      className="py-16 sm:py-20 lg:py-25"
    >
      <div className="flex flex-col items-center gap-8">
        <Reveal>
          {/*
            Inter Extra Bold here, not the Jost used by every other band
            heading — the design sets this one in the UI face.
          */}
          <h2
            id="contact-heading"
            className="font-ui text-center text-[28px] font-extrabold text-white sm:text-[32px] lg:text-[36px]"
          >
            {finalConversion.titleLine1}
            <br />
            {finalConversion.titleLine2}
          </h2>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="font-ui max-w-[640px] text-center text-base leading-[1.5] text-white">
            {finalConversion.lede}
          </p>
        </Reveal>

        <Reveal delay={0.16} className="w-full">
          {/*
            Square, not pill — the design deliberately departs from every
            other CTA on the page here. `rounded-none` wins over the Button
            primitive's `rounded-full` through tailwind-merge.
          */}
          <div className="flex flex-col items-center gap-4 pt-2 sm:flex-row sm:justify-center">
            <Button
              variant="light"
              onClick={() => openConcierge()}
              className="h-auto w-full rounded-none border-0 bg-white px-6 py-3 text-[#222] hover:bg-neutral-100 sm:w-auto"
              {...glanceHandlers}
            >
              {finalConversion.quoteCta}
            </Button>
            <Button
              variant="inverse"
              onClick={() => openConcierge("contact")}
              className="h-auto w-full rounded-none border-[#d1d5db] px-6 py-3 text-white sm:w-auto"
            >
              {finalConversion.expertCta}
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
