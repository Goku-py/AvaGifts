"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Download } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CatalogButton } from "@/components/catalog/catalog-button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { discoveries, featuredProducts } from "@/lib/data";
import { STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Premium", "Personalised", "Sustainable", "Useful", "Local"] as const;

export function GiftDiscoveries() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const visible = useMemo(
    () =>
      filter === "All"
        ? featuredProducts
        : featuredProducts.filter((product) => product.tags.includes(filter)),
    [filter],
  );

  const [feature, ...rest] = visible;

  return (
    <Section id="gifts" labelledBy="gifts-heading" tone="white">
      <div
        data-piku="featured"
        className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
      >
        <SectionHeading
          id="gifts-heading"
          eyebrow={discoveries.eyebrow}
          title={discoveries.title}
          lede={discoveries.lede}
          className="max-w-xl"
        />

        {/* Filter chips */}
        <Reveal delay={0.12}>
          <div
            role="group"
            aria-label="Filter gifts by style"
            className="flex flex-wrap gap-2"
          >
            {FILTERS.map((option) => {
              const selected = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter(option)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200",
                    selected
                      ? "border-primary bg-primary text-white"
                      : "border-neutral-300 bg-white text-text-secondary hover:border-neutral-400 hover:bg-hover-surface",
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </Reveal>
      </div>

      {/*
        One piece is featured at a wider scale and the rest run as a grid.
        A single uniform tile grid is the flattest way to show a range; giving
        the lead item its own proportions makes the section read as curated.
        The feature follows the active filter, so it always shows a match.
      */}
      {feature ? (
        <Reveal delay={0.08}>
          <Card
            hoverable
            className="group mt-12 grid overflow-hidden md:grid-cols-2"
          >
            <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[340px]">
              <Image
                src={feature.photo}
                alt={feature.photoAlt}
                fill
                sizes="(min-width: 768px) 560px, 100vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
              <p className="text-caption uppercase tracking-[0.12em] text-text-muted">
                {feature.category}
              </p>
              <h3 className="text-h3 mt-2 font-sans leading-tight text-text-primary">
                {feature.name}
              </h3>
              <p className="text-body-lg mt-4 text-text-secondary">
                {feature.blurb}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-divider px-2.5 py-1 text-[11px] text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-6 font-sans text-lg font-semibold text-interactive">
                {feature.priceBand}
              </p>
            </div>
          </Card>
        </Reveal>
      ) : (
        <p className="text-body mt-12 text-text-secondary">
          No gifts match that filter yet — try another, or browse the full
          catalog below.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {rest.map((product, index) => (
          <Reveal key={product.id} delay={(index % 4) * STAGGER} className="h-full">
            <Card hoverable className="group h-full overflow-hidden">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={product.photo}
                  alt={product.photoAlt}
                  fill
                  sizes="(min-width: 1024px) 280px, 46vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-caption uppercase tracking-[0.12em] text-text-muted">
                  {product.category}
                </p>
                <h3 className="text-h6 mt-1.5 font-sans leading-snug text-text-primary">
                  {product.name}
                </h3>
                <p className="text-small mt-1.5 hidden leading-relaxed text-text-secondary sm:line-clamp-2">
                  {product.blurb}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-divider px-2 py-0.5 text-[11px] text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm font-semibold text-interactive">
                  {product.priceBand}
                </p>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Full catalog */}
      <Reveal delay={0.1}>
        <div
          data-piku="catalog"
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <CatalogButton variant="gradient" size="lg" arrow={false}>
            View Full Catalog
          </CatalogButton>
          <ButtonLink
            variant="ghost"
            size="lg"
            href="/catalog/avagifts-catalog.pdf"
            download
            className="text-text-secondary hover:bg-hover-surface hover:text-text-primary"
          >
            <Download aria-hidden="true" className="size-4" />
            Download PDF
          </ButtonLink>
        </div>
      </Reveal>
    </Section>
  );
}
