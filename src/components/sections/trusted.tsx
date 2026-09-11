"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { trusted } from "@/lib/data";

/** Seconds per logo — keeps the scroll speed steady as the list grows. */
const SECONDS_PER_LOGO = 5;

function LogoRow({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <ul
      aria-hidden={ariaHidden}
      className="flex shrink-0 items-center"
      /* The list is presentational here — the logos carry the meaning. */
      role={ariaHidden ? "presentation" : undefined}
    >
      {trusted.customers.map((customer) => (
        <li
          key={customer.name}
          className="flex h-[60px] shrink-0 items-center justify-center px-7 sm:px-9"
        >
          <Image
            src={customer.logo}
            alt={ariaHidden ? "" : customer.name}
            width={customer.width}
            height={customer.height}
            sizes="140px"
            className="max-h-[52px] w-auto max-w-[140px] object-contain"
          />
        </li>
      ))}
    </ul>
  );
}

export function TrustedCustomers() {
  const reduceMotion = useReducedMotion();

  return (
    <Section
      id="trusted"
      labelledBy="trusted-heading"
      tone="accent"
      density="compact"
    >
      <Reveal>
        <h2
          id="trusted-heading"
          className="text-h2 max-w-4xl font-medium text-ink-850"
        >
          {trusted.title}
        </h2>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="text-body-lg mt-4 text-text-secondary">{trusted.lede}</p>
      </Reveal>

      {/*
        Deliberately NOT wrapped in Reveal: its whileInView sets opacity 0
        until the element intersects, and inside an overflow-hidden,
        paint-contained viewport that can leave the track stuck invisible.
      */}
      <div className="marquee-viewport mt-10">
        {reduceMotion ? (
          /* One static copy. Killing only the animation would leave the
             second copy sitting there, half of it clipped. */
          <div className="flex flex-wrap items-center justify-center gap-y-2">
            <LogoRow />
          </div>
        ) : (
          <div
            className="marquee-track"
            style={
              {
                "--marquee-duration": `${trusted.customers.length * SECONDS_PER_LOGO}s`,
              } as React.CSSProperties
            }
          >
            <LogoRow />
            {/* The visual loop needs a second copy; a screen reader does
                not need to hear every client twice. */}
            <LogoRow ariaHidden />
          </div>
        )}
      </div>
    </Section>
  );
}
