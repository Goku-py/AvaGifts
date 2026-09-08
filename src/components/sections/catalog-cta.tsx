import { BookOpen, Download } from "lucide-react";
import { CatalogButton } from "@/components/catalog/catalog-button";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";

export function CatalogCta() {
  return (
    <Section id="catalog" labelledBy="catalog-heading" tone="ink" className="overflow-hidden" data-piku="catalog">
      {/* Decorative page-turn arcs + faint glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-56 size-[560px] rounded-full border border-paper/[0.07]" />
        <div className="absolute -right-24 -top-40 size-[380px] rounded-full border border-paper/[0.09]" />
        <div className="absolute -bottom-72 -left-40 size-[620px] rounded-full border border-paper/[0.06]" />
        <div className="absolute -bottom-56 -left-24 size-[400px] rounded-full border border-paper/[0.08]" />
        <div className="absolute left-1/2 top-0 h-full w-[760px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgb(185_151_91/0.09),transparent_62%)]" />
      </div>

      <div className="relative mx-auto max-w-2xl text-center">
        <Reveal>
          <Eyebrow tone="dark" className="justify-center">
            The AvaGifts Catalog
          </Eyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <h2
            id="catalog-heading"
            className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-5xl lg:text-6xl"
          >
            Browse the full collection.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-paper/70 sm:text-lg">
            Every product, price band and personalisation option — beautifully bound in one
            flip-through catalog.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CatalogButton
              size="lg"
              arrow={false}
              className="bg-paper text-ink hover:bg-cream active:translate-y-px"
            >
              <BookOpen aria-hidden="true" className="size-4" />
              View Catalog
            </CatalogButton>
            <ButtonLink
              variant="ghost"
              size="lg"
              href="/catalog/avagifts-catalog.pdf"
              download
              className="text-paper/80 hover:bg-paper/10 hover:text-paper"
            >
              <Download aria-hidden="true" className="size-4" />
              Download PDF
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
