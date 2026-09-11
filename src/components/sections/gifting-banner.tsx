"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { giftingBanner } from "@/lib/data";
import { usePikuConcierge } from "@/components/piku-concierge/piku-concierge-context";
import { glanceHandlers } from "@/lib/piku-glance";

export function GiftingBanner() {
  const { openConcierge } = usePikuConcierge();

  return (
    /*
      Full-bleed, so the container padding is zeroed — but it still goes
      through `Section` rather than a bare <section>, because the tone is what
      sets `data-tone="dark"`, and without it the CTA's focus ring would be
      interactive blue on a near-black photo. `overflow-hidden` keeps the
      `fill` image from adding horizontal scroll.
    */
    <Section
      labelledBy="gifting-banner-heading"
      tone="ink-deep"
      width="wide"
      className="relative overflow-hidden py-0"
      /* Every breakpoint's gutter must be zeroed: Section sets px-5 md:px-10
         lg:px-20, and an unmatched variant would inset the full-bleed photo. */
      containerClassName="max-w-none px-0 md:px-0 lg:px-0"
    >
      <div className="relative flex min-h-[420px] items-center sm:min-h-[500px] lg:aspect-[1440/580] lg:min-h-0">
        <Image
          src={giftingBanner.image}
          alt={giftingBanner.imageAlt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        {/*
          The design's scrim is a 248deg diagonal, which works across a wide
          frame. On a tall mobile band its stops land elsewhere and the copy
          can end up over the light end, so below lg it runs vertically.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-b from-ink-900/88 to-ink-900/55 lg:bg-[linear-gradient(248.3deg,rgba(10,10,10,0.88)_17.83%,rgba(10,10,10,0.55)_74.77%,rgba(10,10,10,0.2)_99.63%)]"
        />

        <div className="relative mx-auto flex w-full max-w-[594px] flex-col gap-5 px-6 sm:px-10 lg:gap-[23px] lg:px-10">
          <Reveal>
            <h2
              id="gifting-banner-heading"
              /* Tracking is em-relative, not the design's literal -2.72px:
                 that value on a 36px mobile heading collapses the letters. */
              className="font-display text-[clamp(2.25rem,1.2rem+3.6vw,4.25rem)] font-medium leading-[1.05] tracking-[-0.04em] text-white"
            >
              {giftingBanner.titleLine1}
              <br />
              <span className="text-accent">{giftingBanner.titleLine2}</span>
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="max-w-[480px] text-[18px] leading-[29.7px] text-neutral-500">
              {giftingBanner.lede}
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <Button
              variant="light"
              size="lg"
              onClick={() => openConcierge()}
              className="h-[52px] px-8"
              {...glanceHandlers}
            >
              {giftingBanner.cta}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Button>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
