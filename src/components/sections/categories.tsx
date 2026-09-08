import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProductArt } from "@/components/ui/product-art";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { categories } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function Categories() {
  return (
    <Section id="collections" labelledBy="collections-heading" tone="cream">
      <SectionHeading
        id="collections-heading"
        eyebrow="Collections"
        title="Gifting for every occasion."
        lede="Six curated collections, hundreds of maker-made pieces — pick a lane and we’ll take it from there."
      />

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {categories.map((category, index) => (
          <Reveal key={category.slug} delay={(index % 3) * STAGGER} className="h-full">
            <Card hoverable className="group h-full overflow-hidden">
              <ProductArt
                seed={`category-${category.slug}`}
                icon={category.icon}
                className="rounded-none border-b border-line"
              />
              <div className="p-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold tracking-[-0.01em]">
                    {category.title}
                  </h3>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {category.productCount} pieces
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{category.blurb}</p>
                <a
                  href="#featured"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors duration-200 hover:text-accent-ink"
                >
                  Explore
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </a>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
