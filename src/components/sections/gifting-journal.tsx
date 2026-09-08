import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { journal, journalArticles } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function GiftingJournal() {
  return (
    <Section id="journal" labelledBy="journal-heading" tone="surface">
      <SectionHeading
        id="journal-heading"
        eyebrow={journal.eyebrow}
        title={journal.title}
        lede={journal.lede}
      />

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {journalArticles.map((article, index) => (
          <Reveal key={article.title} delay={index * STAGGER} className="h-full">
            <Card hoverable className="group flex h-full flex-col p-6 lg:p-7">
              <p className="text-caption uppercase tracking-[0.14em] text-muted">
                {article.category}
              </p>
              <h3 className="text-h5 mt-3 font-sans leading-snug text-text-primary">
                {article.title}
              </h3>
              <p className="text-body mt-3 text-sm leading-relaxed text-text-secondary">
                {article.excerpt}
              </p>
              <div className="mt-auto flex items-center justify-between pt-6">
                <span className="text-caption text-muted">{article.readTime}</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-interactive transition-colors duration-200 group-hover:text-interactive-hover">
                  Read article
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:translate-x-0 motion-reduce:transition-none"
                  />
                </span>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
