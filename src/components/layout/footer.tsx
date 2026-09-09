"use client";

import { Logo } from "@/components/ui/logo";
import { usePikuGame } from "@/components/piku-game/piku-game-context";
import { InstagramIcon, LinkedinIcon, TwitterIcon } from "@/components/ui/social-icons";
import { company, footerColumns, legalLinks, pikuGame } from "@/lib/data";

const SOCIALS = [
  { label: "AvaGifts on LinkedIn", href: "#", Icon: LinkedinIcon },
  { label: "AvaGifts on Instagram", href: "#", Icon: InstagramIcon },
  { label: "AvaGifts on Twitter", href: "#", Icon: TwitterIcon },
] as const;

export function Footer() {
  const { openGame } = usePikuGame();
  return (
    /* data-tone="dark" switches the focus ring to the accent — interactive
       blue is close to invisible against the navy band. */
    <footer data-tone="dark" className="bg-primary text-white">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2fr] lg:gap-16">
          <div>
            <Logo mono className="text-white" />
            <p className="text-small mt-4 max-w-xs leading-relaxed text-white/70">
              {company.tagline} Curated, customised and delivered from India’s finest
              makers.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4"
          >
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-caption uppercase tracking-[0.14em] text-white/60">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-white/75 transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-caption text-white/60">
            © {new Date().getFullYear()} {company.name} · Crafted with care in India
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-caption text-white/60 transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={openGame}
              className="text-caption text-white/60 transition-colors duration-200 hover:text-white"
            >
              {pikuGame.footerCta}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex size-9 items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                <Icon aria-hidden="true" className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
