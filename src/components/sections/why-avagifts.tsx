import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { why, whyPoints } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function WhyAvaGifts() {
  return (
    <Section
      id="why"
      labelledBy="why-heading"
      tone="white"
      className="pt-20 pb-14 sm:pt-24 sm:pb-16 lg:pt-30 lg:pb-20"
    >
      {/* 580/700, not 50/50 — the design gives the copy column the wider half. */}
      <div className="grid items-start gap-10 lg:grid-cols-[580fr_700fr] lg:gap-0">
        {/*
          Sticky on desktop, as in the design: the photo holds while the six
          rows scroll past it. `top-24` rather than the design's `top-0` —
          the header is sticky too, and 0 would tuck the image underneath it.
        */}
        <div className="w-full lg:sticky lg:top-24 lg:h-[630px]">
          <div className="relative aspect-[580/630] w-full overflow-hidden lg:h-full">
            <Image
              src={why.image}
              alt={why.imageAlt}
              fill
              sizes="(min-width: 1024px) 580px, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-5 lg:p-[60px]">
          <div className="flex flex-col gap-4">
            <Reveal>
              <h2
                id="why-heading"
                className="text-section-title text-ink-900"
              >
                {why.title}
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="text-body-lg text-text-secondary">{why.lede}</p>
            </Reveal>
          </div>

          {/* data-piku marks a landmark the mascot can offer a contextual hint on. */}
          <ul data-piku="why" className="flex flex-col gap-4">
            {whyPoints.map((point, index) => (
              <li key={point.title}>
                <Reveal delay={(index % 3) * STAGGER}>
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
                    <Image
                      src={point.icon}
                      alt=""
                      width={point.iconWidth}
                      height={point.iconHeight}
                      className="shrink-0"
                    />
                    <div className="flex min-w-0 flex-col gap-1">
                      <h3 className="text-base font-bold text-text-primary">
                        {point.title}
                      </h3>
                      <p className="text-base leading-[1.4] text-text-secondary">
                        {point.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
