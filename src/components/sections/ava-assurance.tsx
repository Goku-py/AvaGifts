import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { assurance } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function AvaAssurance() {
  return (
    <Section
      id="assurance"
      labelledBy="assurance-heading"
      tone="white"
      className="pt-20 pb-14 sm:pt-24 sm:pb-16 lg:pt-30 lg:pb-20"
    >
      <div className="flex flex-col items-center gap-[15px]">
        <Reveal>
          <h2
            id="assurance-heading"
            className="text-section-title text-center text-ink-900"
          >
            {assurance.title}
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-center text-[18px] leading-[29.7px] text-text-secondary">
            {assurance.lede}
          </p>
        </Reveal>
      </div>

      <div className="mt-10 flex flex-col items-center gap-12">
        {/*
          `w-full` on the Reveal itself matters: this column is `items-center`,
          so a block child shrinks to fit-content, and an aspect-ratio box with
          no intrinsic width then resolves to zero and the image disappears.
        */}
        <Reveal delay={0.12} className="w-full max-w-[904px]">
          {/* aspect ratio rather than the design's fixed 509px, so the
              artwork keeps its proportion at every width. */}
          <div className="relative aspect-[904/509] w-full">
            <Image
              src={assurance.image}
              alt={assurance.imageAlt}
              fill
              sizes="(min-width: 1024px) 904px, 100vw"
              className="object-contain"
            />
          </div>
        </Reveal>

        {/* Fixed 400px cards, centred — the design does not stretch them. */}
        <ul className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row sm:items-stretch">
          {assurance.points.map((point, index) => (
            <li key={point.title} className="flex w-full max-w-[400px]">
              <Reveal delay={(index % 3) * STAGGER} className="flex w-full">
                <div className="flex w-full flex-col gap-2 rounded-xl border border-border bg-white p-3 drop-shadow-[0_1px_1px_rgba(18,115,235,0.12)]">
                  <Image
                    src={point.icon}
                    alt=""
                    width={40}
                    height={40}
                    className="size-10"
                  />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-ink-850">
                      {point.title}
                    </h3>
                    <p className="text-base leading-[1.5] text-text-secondary">
                      {point.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
