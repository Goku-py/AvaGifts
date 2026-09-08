import { Eyebrow } from "@/components/ui/eyebrow";
import { Card } from "@/components/ui/card";
import { GiftMark } from "@/components/ui/logo";
import { ProductArt } from "@/components/ui/product-art";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { company } from "@/lib/data";

export function About() {
  return (
    <Section id="about" labelledBy="about-heading" tone="paper">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Composition */}
        <div aria-hidden="true" className="relative mx-auto h-[420px] w-full max-w-[460px] sm:h-[480px]">
          <Reveal className="absolute left-0 top-0 w-[68%]">
            <Card className="p-2.5 shadow-lift">
              <ProductArt
                seed="about-studio-shelf"
                icon="Sparkles"
                aspect="aspect-[4/5]"
                className="rounded-lg"
              />
            </Card>
          </Reveal>
          <Reveal delay={0.15} className="absolute bottom-0 right-0 w-[50%] rotate-2">
            <Card className="p-2.5 shadow-lift">
              <ProductArt
                seed="about-block-print"
                icon="PenTool"
                aspect="aspect-square"
                className="rounded-lg"
              />
            </Card>
          </Reveal>
          <Reveal delay={0.25} className="absolute bottom-[10%] left-[4%] w-[58%] max-w-[250px]">
            <figure className="rounded-2xl border border-line bg-card/95 p-5 shadow-lift backdrop-blur-sm">
              <blockquote className="font-display text-[15px] italic leading-relaxed text-ink">
                “A gift should feel chosen, not ordered.”
              </blockquote>
              <figcaption className="mt-2 text-xs text-ink-soft">
                — The AvaGifts studio, Jaipur
              </figcaption>
            </figure>
          </Reveal>
        </div>

        {/* Story */}
        <div>
          <Reveal>
            <Eyebrow>About AvaGifts</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2
              id="about-heading"
              className="mt-4 font-display text-3xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-4xl lg:text-[2.75rem]"
            >
              Born in Jaipur. Gifting everywhere.
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 text-base leading-relaxed text-ink-soft">{company.story[0]}</p>
          </Reveal>
          <Reveal delay={0.22}>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">{company.story[1]}</p>
          </Reveal>
          <Reveal delay={0.28}>
            <div className="mt-8 flex items-center gap-3.5 border-t border-line pt-6">
              <span className="text-ink">
                <GiftMark className="size-8" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{company.name}</p>
                <p className="text-xs text-ink-soft">
                  {company.founded} · {company.cities}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
