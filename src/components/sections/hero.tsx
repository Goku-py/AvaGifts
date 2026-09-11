"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { hero } from "@/lib/data";
import { usePikuConcierge } from "@/components/piku-concierge/piku-concierge-context";
import { glanceHandlers } from "@/lib/piku-glance";
import { cn } from "@/lib/utils";

/** How long each carousel slide holds before advancing. */
const SLIDE_MS = 5000;

export function Hero() {
  const { openConcierge } = usePikuConcierge();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = hero.visualCards;
  const slideCount = slides.length;

  /*
   * Auto-advance, paused on hover/focus so it can't yank a slide away while
   * someone is reading it, and disabled entirely under reduced motion —
   * the dots still work, so the carousel stays fully usable either way.
   */
  useEffect(() => {
    if (reduceMotion || paused || slideCount < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % slideCount),
      SLIDE_MS,
    );
    return () => clearInterval(timer);
  }, [reduceMotion, paused, slideCount]);

  const hold = useCallback(() => setPaused(true), []);
  const release = useCallback(() => setPaused(false), []);

  const active = slides[index];

  return (
    <Section
      id="top"
      labelledBy="hero-heading"
      tone="white"
      density="compact"
      className="overflow-hidden"
      aria-label="Introduction"
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-12">
        {/* Copy */}
        <div>
          <Reveal>
            {/* The design's own eyebrow treatment: a solid green status dot
                rather than the blue rule the other sections use. */}
            <p className="flex items-center gap-2 text-xs font-medium capitalize text-[#090909]">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 rounded-full bg-success"
              />
              {hero.eyebrow}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <h1
              id="hero-heading"
              className="text-h1 mt-4 leading-[1.1] text-text-primary"
            >
              Corporate gifting, without the{" "}
              <em className="font-serif font-medium italic text-interactive">
                boring
              </em>{" "}
              part.
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="text-body-lg mt-6 max-w-xl text-text-secondary">
              {hero.subtext}
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={() => openConcierge()}
                {...glanceHandlers}
              >
                {hero.primaryCta}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Carousel */}
        <Reveal delay={0.2}>
          <div
            className="relative mx-auto w-full max-w-[616px] overflow-hidden rounded-2xl"
            onMouseEnter={hold}
            onMouseLeave={release}
            onFocusCapture={hold}
            onBlurCapture={release}
          >
            <div className="relative aspect-[616/721]">
              {slides.map((slide, i) => (
                <Image
                  key={slide.src}
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  /* Only the first slide is priority — four would compete
                     for bandwidth and hurt LCP. */
                  priority={i === 0}
                  sizes="(min-width: 1024px) 616px, 100vw"
                  className={cn(
                    "object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none",
                    i === index ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden={i === index ? undefined : true}
                />
              ))}

              {/*
                The exported slides are COMPLETE renders: each PNG already
                contains its own background tint, the concentric rings, the
                category badge and the dot row with the correct dot filled.
                So none of that is redrawn here — doing so rendered a second
                badge and a second row of dots on top of the artwork.

                The consequence is that the visible dots are pixels, not
                controls. These transparent buttons sit exactly on top of
                them, positioned from the Figma geometry (dots at x=269,291,
                313,335 of a 616-wide frame, y=670 of 721), so they scale
                with the image at any width. If the slides are ever
                re-exported with the dot row moved, re-check these numbers.
              */}
              {slideCount > 1 ? (
                <div
                  role="tablist"
                  aria-label="Choose a gift category"
                  className="absolute inset-0"
                >
                  {slides.map((slide, i) => (
                    <button
                      key={slide.src}
                      type="button"
                      role="tab"
                      aria-selected={i === index}
                      aria-label={slide.category}
                      onClick={() => setIndex(i)}
                      style={{
                        left: `${((269 + i * 22 + 6) / 616) * 100}%`,
                        top: `${((670 + 6) / 721) * 100}%`,
                        width: `${(12 / 616) * 100}%`,
                        aspectRatio: "1",
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-interactive"
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {/* Sighted users get the badge baked into the artwork; this is
                how the category change reaches a screen reader. */}
            <p aria-live="polite" className="sr-only">
              {active.category}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
