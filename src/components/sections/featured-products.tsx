import { Card } from "@/components/ui/card";
import { ProductArt } from "@/components/ui/product-art";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { featuredProducts } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function FeaturedProducts() {
  return (
    <Section id="featured" labelledBy="featured-heading" tone="paper">
      <SectionHeading
        id="featured-heading"
        eyebrow="Featured"
        title="This season’s shortlist."
        lede="Eight pieces our clients keep reordering — maker-made, brandable and delivered gift-ready."
      />

      <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {featuredProducts.map((product, index) => (
          <Reveal key={product.id} delay={(index % 4) * STAGGER} className="h-full">
            <Card hoverable className="group h-full overflow-hidden">
              <ProductArt
                seed={product.id}
                icon={product.icon}
                aspect="aspect-[4/5]"
                className="rounded-none border-b border-line"
              />
              <div className="p-4 sm:p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-soft sm:text-[11px]">
                  {product.category}
                </p>
                <h3 className="mt-1.5 font-display text-base font-semibold leading-snug tracking-[-0.01em] sm:text-lg">
                  {product.name}
                </h3>
                <p className="mt-1.5 hidden text-xs leading-relaxed text-ink-soft sm:line-clamp-2">
                  {product.blurb}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-soft sm:text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm font-semibold text-accent">{product.priceBand}</p>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
