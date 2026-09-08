import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { makerStory } from "@/lib/data";

export function MadeSomewhere() {
  return (
    <Section id="makers" labelledBy="makers-heading" tone="white">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        {/* Photo */}
        <Reveal>
          <figure className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lift">
              <Image
                src={makerStory.photo}
                alt={makerStory.photoAlt}
                fill
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="absolute bottom-6 left-6 right-6 rounded-xl border border-divider bg-white/95 p-5 shadow-lift backdrop-blur-sm">
              <blockquote className="font-serif text-[15px] italic leading-relaxed text-text-primary">
                “{makerStory.quote}”
              </blockquote>
              <p className="text-caption mt-2 text-text-secondary">
                — {makerStory.location}
              </p>
            </figcaption>
          </figure>
        </Reveal>

        {/* Story */}
        <div>
          <Reveal>
            <Eyebrow>{makerStory.eyebrow}</Eyebrow>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="makers-heading" className="text-h2 mt-4 font-sans text-text-primary">
              {makerStory.title}
            </h2>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="text-caption mt-3 inline-flex items-center gap-1.5 text-text-secondary">
              <MapPin aria-hidden="true" className="size-3.5 text-interactive" />
              {makerStory.location} · {makerStory.craft}
            </p>
          </Reveal>
          {makerStory.paragraphs.map((paragraph, index) => (
            <Reveal key={index} delay={0.2 + index * 0.06}>
              <p className="text-body mt-5 text-text-secondary">{paragraph}</p>
            </Reveal>
          ))}
          <Reveal delay={0.32}>
            <a
              href="#journal"
              className="group mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-interactive transition-colors duration-200 hover:text-interactive-hover"
            >
              Discover their story
              <ArrowRight
                aria-hidden="true"
                className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:translate-x-0 motion-reduce:transition-none"
              />
            </a>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
