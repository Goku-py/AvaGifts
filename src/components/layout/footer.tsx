import { Logo } from "@/components/ui/logo";
import { InstagramIcon, LinkedinIcon, TwitterIcon } from "@/components/ui/social-icons";
import { company } from "@/lib/data";

const LINK_COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Collections", href: "#collections" },
      { label: "Featured", href: "#featured" },
      { label: "Catalog", href: "#catalog" },
      { label: "Why AvaGifts", href: "#why" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Bulk Gifting", href: "#services" },
      { label: "Custom Branding", href: "#services" },
      { label: "Corporate Events", href: "#services" },
      { label: "Enquire", href: "#contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Journal", href: "#" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
] as const;

const SOCIALS = [
  { label: "AvaGifts on LinkedIn", href: "#", Icon: LinkedinIcon },
  { label: "AvaGifts on Instagram", href: "#", Icon: InstagramIcon },
  { label: "AvaGifts on Twitter", href: "#", Icon: TwitterIcon },
] as const;

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_2fr] lg:gap-16">
          <div>
            <Logo mono className="text-paper" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/60">
              {company.tagline} Curated, customised and delivered from India’s finest makers.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            {LINK_COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-paper/50">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-paper/75 transition-colors duration-200 hover:text-paper"
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

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-paper/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-paper/50">
            © 2026 AvaGifts · Crafted with care in India
          </p>
          <div className="flex items-center gap-2">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex size-9 items-center justify-center rounded-full text-paper/70 transition-colors duration-200 hover:bg-paper/10 hover:text-paper"
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
