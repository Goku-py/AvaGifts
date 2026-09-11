import { Logo } from "@/components/ui/logo";
import { company, footerColumns, legalLinks } from "@/lib/data";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    /*
      `data-tone="dark"` swaps the focus ring to the accent — interactive blue
      is effectively invisible on #0a0a0a.

      The footer is set entirely in Inter, unlike the Jost content bands.
    */
    <footer
      data-tone="dark"
      className="font-ui bg-ink-900 text-white"
      aria-label="Site footer"
    >
      <div className="mx-auto w-full max-w-[1440px] px-5 pt-16 pb-10 md:px-10 lg:px-20 lg:pt-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-12">
          <div className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
            {/*
              The design keeps the full-colour lockup on the dark band. Both
              Figma logo frames are 195x56 around the same padded source, so
              the visible lockup is the same size here as in the header —
              hence no size override.

              `self-start` matters: this is a flex column, so the default
              `align-items: stretch` would widen the `w-auto` image to the
              column and the fixed height would squash the mark into an
              ellipse.
            */}
            <Logo className="self-start" />
            <p className="text-[13px] leading-[1.5] text-text-disabled">
              {company.tagline}
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-12"
          >
            {footerColumns.map((column) => (
              <div key={column.title} className="flex flex-col gap-3">
                <h2 className="text-[11px] font-bold uppercase text-white">
                  {column.title}
                </h2>
                {column.links.map((link) =>
                  /*
                    Links without an href render as text, not as anchors that
                    go nowhere. Visually identical to the design; each becomes
                    a real link once its page exists.
                  */
                  link.href ? (
                    <a
                      key={link.label}
                      href={link.href}
                      className="w-fit rounded-sm text-[13px] text-text-disabled transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <span
                      key={link.label}
                      className="text-[13px] text-text-disabled"
                    >
                      {link.label}
                    </span>
                  ),
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-[#e5e7eb] pt-6 text-xs text-white sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} AvadheshCo. All rights reserved.</p>
          <div className="flex gap-6">
            {legalLinks.map((link) =>
              link.href ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-sm transition-colors duration-200 hover:text-text-disabled"
                >
                  {link.label}
                </a>
              ) : (
                <span key={link.label}>{link.label}</span>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
