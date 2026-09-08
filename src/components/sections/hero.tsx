"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogButton } from "@/components/catalog/catalog-button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { hero, stats } from "@/lib/data";
import { usePikuConcierge } from "@/components/piku-concierge/piku-concierge-context";
import { glanceHandlers } from "@/lib/piku-glance";
import { cn } from "@/lib/utils";

const cardLayouts = [
  { position: "absolute right-0 top-0 w-[62%] rotate-2", aspect: "aspect-[4/5]" },
  { position: "absolute left-0 top-[16%] w-[56%] -rotate-3", aspect: "aspect-square" },
  { position: "absolute bottom-0 right-[6%] w-[46%] rotate-1", aspect: "aspect-[5/4]" },
] as const;

export function Hero() {
  const { openConcierge } = usePikuConcierge();

  return (
    <Section
      id="top"
      labelledBy="hero-heading"
      tone="white"
      density="compact"
      className="overflow-hidden"
      aria-label="Introduction"
    >
      <div className="grid items-center gap-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14">
        {/* Copy */}
        <div>
          <Reveal>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            {/* The page's typographic peak — nothing below the hero competes
                with this size, which is what gives the page a hierarchy. */}
            <h1
              id="hero-heading"
              className="text-display mt-5 font-sans text-text-primary"
            >
              Corporate gifting, without the{" "}
              <em className="font-serif italic text-interactive">boring</em> part.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-body-lg mt-6 max-w-xl text-text-secondary">{hero.subtext}</p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => openConcierge()}
                {...glanceHandlers}
              >
                {hero.primaryCta}
              </Button>
              <CatalogButton variant="secondary" size="lg" arrow />
            </div>
          </Reveal>
        </div>

        {/* Composition — real product photography */}
        <div
          aria-hidden="true"
          className="relative mx-auto h-[400px] w-full max-w-[500px] sm:h-[460px] lg:h-[540px]"
        >
          <div className="absolute left-1/2 top-1/2 -z-10 size-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface blur-3xl" />

          {hero.visualCards.map((card, index) => (
            <Reveal
              key={card.src}
              delay={0.15 + index * 0.1}
              className={cn(cardLayouts[index].position)}
            >
              <Card hoverable className="overflow-hidden p-2.5 shadow-lift">
                <div
                  className={cn(
                    "relative overflow-hidden rounded-lg",
                    cardLayouts[index].aspect,
                  )}
                >
                  <Image
                    src={card.src}
                    alt=""
                    fill
                    priority={index === 0}
                    sizes="(min-width: 1024px) 340px, 62vw"
                    className="object-cover"
                  />
                </div>
                <p className="px-1.5 pb-1 pt-2 text-xs font-medium text-text-secondary">
                  {card.caption}
                </p>
              </Card>
            </Reveal>
          ))}

          <div className="absolute right-[2%] top-[40%] z-10">
            <span className="animate-drift inline-flex items-center gap-1.5 rounded-full border border-divider bg-white/95 px-3.5 py-2 text-xs font-medium text-text-primary shadow-lift">
              <MapPin aria-hidden="true" className="size-3.5 text-interactive" />
              {hero.floatingTag}
            </span>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <Reveal delay={0.35} className="mt-16 lg:mt-20">
        <dl className="grid grid-cols-2 gap-y-10 border-t border-divider pt-10 md:grid-cols-4 md:divide-x md:divide-divider">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col md:px-8",
                index === 0 && "md:pl-0",
                index === stats.length - 1 && "md:pr-0",
              )}
            >
              <dd className="order-1 font-sans text-3xl font-bold tracking-[-0.02em] text-text-primary md:text-4xl">
                {stat.value}
              </dd>
              <dt className="order-2 mt-1.5 text-sm text-text-secondary">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}
