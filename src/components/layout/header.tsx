"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CatalogButton } from "@/components/catalog/catalog-button";
import { useCatalog } from "@/components/catalog/catalog-context";
import { Logo } from "@/components/ui/logo";
import { EASE } from "@/lib/motion";
import { catalogCta, headerCta, navLinks } from "@/lib/data";
import { usePikuConcierge } from "@/components/piku-concierge/piku-concierge-context";
import { cn } from "@/lib/utils";

const menuItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/**
 * The design's own download glyph — a rounded arrow dropping into an open
 * tray. Inlined rather than swapped for lucide's `Download`, whose tray is
 * closed and whose stroke is lighter than the rest of this header.
 */
function DownloadGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 13.3333 15"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M10.5893 8.08925L7.25592 11.4226C6.9305 11.748 6.40283 11.748 6.07742 11.4226L2.74407 8.08925C2.41864 7.76383 2.41864 7.23617 2.74407 6.91075C3.06952 6.58533 3.59715 6.58533 3.92259 6.91075L5.83333 8.8215V0.833333C5.83333 0.373092 6.20642 0 6.66667 0C7.12692 0 7.5 0.373092 7.5 0.833333V8.8215L9.41075 6.91075C9.73617 6.58533 10.2638 6.58533 10.5893 6.91075C10.9147 7.23617 10.9147 7.76383 10.5893 8.08925Z" />
      <path d="M1.66667 10.8333C1.66667 10.3731 1.29357 10 0.833333 10C0.3731 10 0 10.3731 0 10.8333C0 13.1345 1.86548 15 4.16667 15H9.16667C11.4678 15 13.3333 13.1345 13.3333 10.8333C13.3333 10.3731 12.9603 10 12.5 10C12.0398 10 11.6667 10.3731 11.6667 10.8333C11.6667 12.2141 10.5474 13.3333 9.16667 13.3333H4.16667C2.78596 13.3333 1.66667 12.2141 1.66667 10.8333Z" />
    </svg>
  );
}

export function Header() {
  const { openCatalog } = useCatalog();
  const { openConcierge } = usePikuConcierge();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /*
   * The header is translucent by design (white at 93%), so once the page
   * scrolls underneath it, it needs an edge. Figma's shadow is white-on-white
   * and invisible in a browser; a hairline is the honest translation.
   */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Mobile sheet: scroll lock, escape, initial focus */
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/93 backdrop-blur-md transition-[border-color] duration-300 ease-out",
        scrolled ? "border-b border-divider" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-6 lg:h-20">
        <a
          href="#top"
          aria-label="AvadheshCo — back to top"
          className="shrink-0 rounded-lg"
        >
          <Logo priority />
        </a>

        {/*
          The design carries no desktop nav — the two actions are the whole
          right side. The section links survive only in the mobile sheet,
          which is the one place a visitor has no other way to jump around.
        */}
        <div className="flex items-center gap-3 sm:gap-6">
          <CatalogButton
            variant="ghost"
            size="sm"
            arrow={false}
            className="hidden rounded-lg px-3.5 text-button text-ink-850 sm:inline-flex"
          >
            {catalogCta}
            <DownloadGlyph className="ml-2 h-5 w-[18px]" />
          </CatalogButton>

          <Button
            variant="ink"
            size="lg"
            onClick={() => openConcierge()}
            className="hidden px-8 sm:inline-flex"
          >
            {headerCta}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Button>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Open menu"
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-full text-ink-850 transition-colors hover:bg-hover-surface sm:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <MobileMenu
            onClose={() => setMenuOpen(false)}
            closeRef={closeButtonRef}
            onOpenCatalog={() => {
              setMenuOpen(false);
              openCatalog();
            }}
            onOpenConcierge={() => {
              setMenuOpen(false);
              openConcierge();
            }}
          />
        ) : null}
      </AnimatePresence>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile full-screen sheet                                            */
/* ------------------------------------------------------------------ */

interface MobileMenuProps {
  onClose: () => void;
  onOpenCatalog: () => void;
  onOpenConcierge: () => void;
  closeRef: React.RefObject<HTMLButtonElement | null>;
}

function MobileMenu({
  onClose,
  onOpenCatalog,
  onOpenConcierge,
  closeRef,
}: MobileMenuProps) {
  /*
   * Portalled to <body> on purpose. The header carries `backdrop-blur`, and a
   * backdrop-filter makes an element the containing block for its fixed-position
   * descendants — so rendered in place, this sheet's `inset-0` resolved against
   * the 64px header box and the page showed straight through it. The portal is
   * the durable fix: no ancestor filter or transform can trap it again.
   */
  return createPortal(
    <motion.div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[70] flex flex-col bg-white sm:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <div className="flex h-16 items-center justify-between px-6">
        <Logo />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-mr-2 inline-flex size-10 items-center justify-center rounded-full text-ink-850 transition-colors hover:bg-hover-surface"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <motion.nav
        aria-label="Mobile"
        className="flex flex-1 flex-col justify-center px-6"
        initial="hidden"
        animate="show"
        variants={{
          show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
        }}
      >
        {navLinks.map((link) => (
          <motion.a
            key={link.href}
            href={link.href}
            onClick={onClose}
            variants={menuItemVariants}
            className="border-b border-divider py-4 text-2xl font-medium tracking-[-0.02em] text-ink-850 transition-colors hover:text-interactive"
          >
            {link.label}
          </motion.a>
        ))}
      </motion.nav>

      <motion.div
        className="flex flex-col gap-3 px-6 pb-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease: EASE }}
      >
        <Button variant="ink" size="lg" onClick={onOpenConcierge}>
          {headerCta}
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Button>
        <CatalogButton
          variant="secondary"
          size="lg"
          arrow={false}
          onClick={onOpenCatalog}
          className="text-ink-850"
        >
          {catalogCta}
          <DownloadGlyph className="ml-2 h-5 w-[18px]" />
        </CatalogButton>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
