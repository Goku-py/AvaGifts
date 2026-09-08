import { MapPin } from "lucide-react";
import { CatalogButton } from "@/components/catalog/catalog-button";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProductArt } from "@/components/ui/product-art";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { stats } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <Section
      id="top"
      labelledBy="hero-heading"
      tone="paper"
      className="overflow-hidden py-14 sm:py-16 lg:py-24"
      aria-label="Introduction"
    >
      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        {/* Copy */}
        <div>
          <Reveal>
            <Eyebrow>Corporate gifting, curated</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h1
              id="hero-heading"
              className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-[4.25rem]"
            >
              Gifts that say the <em className="italic text-accent">right</em> thing.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
              AvaGifts curates, customises and delivers premium gifts from India’s finest
              makers — for teams, clients and the moments that matter.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <CatalogButton size="lg" />
              <ButtonLink variant="secondary" size="lg" href="#contact" arrow>
                Talk to us
              </ButtonLink>
            </div>
          </Reveal>
        </div>

        {/* Composition */}
        <div
          aria-hidden="true"
          className="relative mx-auto h-[400px] w-full max-w-[500px] sm:h-[460px] lg:h-[540px]"
        >
          <div className="absolute left-1/2 top-1/2 -z-10 size-[115%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream blur-3xl" />

          <Reveal delay={0.15} className="absolute right-0 top-0 w-[62%] rotate-2">
            <Card hoverable className="p-2.5 shadow-lift">
              <ProductArt seed="hero-jaipur-pottery" icon="Flower2" aspect="aspect-[4/5]" className="rounded-lg" />
            </Card>
          </Reveal>

          <Reveal delay={0.25} className="absolute left-0 top-[16%] w-[56%] -rotate-3">
            <Card hoverable className="p-2.5 shadow-lift">
              <ProductArt seed="hero-chai-studio" icon="Coffee" aspect="aspect-square" className="rounded-lg" />
            </Card>
          </Reveal>

          <Reveal delay={0.35} className="absolute bottom-0 right-[6%] w-[46%] rotate-1">
            <Card hoverable className="p-2.5 shadow-lift">
              <ProductArt seed="hero-signature-box" icon="Gift" aspect="aspect-[5/4]" className="rounded-lg" />
            </Card>
          </Reveal>

          <div className="absolute right-[2%] top-[40%] z-10">
            <span className="animate-drift inline-flex items-center gap-1.5 rounded-full border border-line bg-card/95 px-3.5 py-2 text-xs font-medium text-ink shadow-lift">
              <MapPin aria-hidden="true" className="size-3.5 text-gold" />
              Handcrafted in Jaipur
            </span>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <Reveal delay={0.35} className="mt-16 lg:mt-20">
        <dl className="grid grid-cols-2 gap-y-10 border-t border-line pt-10 md:grid-cols-4 md:divide-x md:divide-line">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col md:px-8",
                index === 0 && "md:pl-0",
                index === stats.length - 1 && "md:pr-0",
              )}
            >
              <dd className="order-1 font-display text-3xl font-semibold tracking-[-0.02em] md:text-4xl">
                {stat.value}
              </dd>
              <dt className="order-2 mt-1.5 text-sm text-ink-soft">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}
