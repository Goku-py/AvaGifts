import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { journalArticles } from "@/lib/data";
import { STAGGER } from "@/lib/motion";

export function GiftingJournal() {
  return (
    /*
      No section heading — the full-bleed banner directly above is this
      section's title card. `#journal` stays here rather than moving to the
      banner: two elements with the same id is not an error, and the browser
      would silently scroll to whichever comes first.
    */
    <Section
      id="journal"
      tone="white"
      aria-label="Gifting Journal"
      className="py-14 sm:py-16 lg:py-20"
    >
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {journalArticles.map((article, index) => (
          <li key={article.title} className="flex">
            <Reveal delay={(index % 3) * STAGGER} className="flex w-full">
              {/* Square top, 24px bottom — the same card shape as the
                  discovery grid, inverted to dark on a white band. */}
              <article className="flex w-full flex-col rounded-b-3xl border border-[#d1d5db] bg-ink-900">
                <div className="relative aspect-[410/260] w-full">
                  <Image
                    src={article.photo}
                    alt={article.photoAlt}
                    fill
                    sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-3 p-5">
                  <p className="text-xs font-medium capitalize text-text-disabled">
                    {article.eyebrow}
                  </p>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-h6 font-bold text-white">
                      {article.title}
                    </h3>
                    <p className="text-sm leading-[1.4] text-text-disabled">
                      {article.subtitle}
                    </p>
                  </div>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
