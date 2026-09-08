import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { journal, journalArticles } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function GiftingJournal() {
  return (
    <Section id="journal" labelledBy="journal-heading" tone="white">
      <SectionHeading
        id="journal-heading"
        eyebrow={journal.eyebrow}
        title={journal.title}
        lede={journal.lede}
      />

      <div className="mt-14 grid gap-x-6 gap-y-12 md:grid-cols-3">
        {journalArticles.map((article, index) => (
          <Reveal key={article.title} delay={index * STAGGER} className="h-full">
            {/*
              The whole card is the link — previously "Read article" was a
              <span> inside a non-interactive card, so there was no way to open
              an article by keyboard at all.
            */}
            <a
              href={article.href}
              className="group flex h-full flex-col rounded-xl focus-visible:outline-offset-4"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface">
                <Image
                  src={article.photo}
                  alt={article.photoAlt}
                  fill
                  sizes="(min-width: 768px) 380px, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </div>

              <p className="text-caption mt-5 uppercase tracking-[0.14em] text-text-muted">
                {article.category}
              </p>
              <h3 className="text-h5 mt-2 font-sans leading-snug text-text-primary underline-offset-4 group-hover:underline group-focus-visible:underline">
                {article.title}
              </h3>
              <p className="text-body mt-3 text-text-secondary">
                {article.excerpt}
              </p>

              <div className="mt-auto flex items-center justify-between pt-6">
                <span className="text-caption text-text-muted">
                  {article.readTime}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-interactive transition-colors duration-200 group-hover:text-interactive-hover">
                  Read article
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:translate-x-0 motion-reduce:transition-none"
                  />
                </span>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
