import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { discoveries } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function GiftDiscoveries() {
  return (
    <Section
      id="gifts"
      labelledBy="gifts-heading"
      tone="ink-deep"
      className="pt-20 pb-14 sm:pt-24 sm:pb-16 lg:pt-30 lg:pb-20"
    >
      {/* data-piku marks a landmark the mascot can offer a contextual hint on. */}
      <div data-piku="featured" className="max-w-[823px]">
        <Reveal>
          <div className="flex items-center gap-4">
            {/* The design's two-gift-box glyph, reassembled from the three
                stroke fragments Figma exports it as. 40x40 in the design. */}
            <Image
              src="/design/icon-giftbox.svg"
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0"
            />
            <h2 id="gifts-heading" className="text-section-title text-white">
              {discoveries.title}
            </h2>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-body-lg mt-4 text-neutral-500">
            {discoveries.lede}
          </p>
        </Reveal>
      </div>

      <ul
        data-piku="catalog"
        className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {discoveries.cards.map((card, index) => (
          <li key={card.title} className="flex">
            <Reveal delay={(index % 3) * STAGGER} className="flex w-full">
              {/*
                Square top, 24px bottom — the design rounds only the lower
                corners, so the photo runs flush into the card's top edge.
              */}
              <article className="flex w-full flex-col rounded-b-3xl bg-white">
                <div className="relative aspect-[410/320] w-full border-b border-neutral-400">
                  {/*
                    object-contain, not cover: these are cut-out product
                    clusters on a transparent ground, and cropping them
                    would slice the products at the frame edge.
                  */}
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                    className="object-contain p-4"
                  />
                </div>
                <div className="flex flex-col gap-2 p-5">
                  {/*
                    The design's #868e96 measures 3.3:1 on white, under the
                    4.5:1 this 12px label needs, so it runs one step darker.
                  */}
                  <p className="text-xs font-medium capitalize text-neutral-700">
                    {card.eyebrow}
                  </p>
                  <h3 className="text-h6 font-bold text-ink-850">
                    {card.title}
                  </h3>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
