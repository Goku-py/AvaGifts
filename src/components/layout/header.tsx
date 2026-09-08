"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { CatalogButton } from "@/components/catalog/catalog-button";
import { useCatalog } from "@/components/catalog/catalog-context";
import { Logo } from "@/components/ui/logo";
import { EASE } from "@/lib/motion";
import { headerCta, navLinks } from "@/lib/data";
import { usePikuConcierge } from "@/components/piku-concierge/piku-concierge-context";
import { cn } from "@/lib/utils";

const menuItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export function Header() {
  const { openCatalog } = useCatalog();
  const { openConcierge } = usePikuConcierge();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* Translucent → solid on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Active-section highlight */
  useEffect(() => {
    const sections = navLinks
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
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
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        scrolled
          ? "border-b border-divider bg-white/90 shadow-[0_1px_16px_rgb(11_42_77/0.06)] backdrop-blur-md"
          : "border-b border-transparent bg-white/70 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-6 md:h-[72px]">
        <a href="#top" aria-label="AvaGifts — back to top" className="shrink-0">
          <Logo />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "true" : undefined}
              className={cn(
                "text-sm transition-colors duration-200 hover:text-text-primary",
                active === link.href
                  ? "text-text-primary underline decoration-interactive decoration-[1.5px] underline-offset-8"
                  : "text-text-secondary",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CatalogButton variant="secondary" size="sm" className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => openConcierge()}
            className="hidden h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-interactive px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-interactive-hover active:bg-interactive-active active:translate-y-px motion-reduce:transition-none sm:inline-flex"
          >
            {headerCta}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Open menu"
            className="inline-flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-hover-surface lg:hidden"
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

function MobileMenu({ onClose, onOpenCatalog, onOpenConcierge, closeRef }: MobileMenuProps) {
  return (
    <motion.div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[70] flex flex-col bg-white lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <div className="flex h-16 items-center justify-between px-6 md:h-[72px]">
        <Logo />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="inline-flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-hover-surface"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <motion.nav
        aria-label="Mobile"
        className="flex flex-1 flex-col justify-center px-6"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
      >
        {navLinks.map((link) => (
          <motion.a
            key={link.href}
            href={link.href}
            onClick={onClose}
            variants={menuItemVariants}
            className="border-b border-divider py-4 font-sans text-2xl font-semibold tracking-[-0.02em] text-text-primary transition-colors hover:text-interactive"
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
        <button
          type="button"
          onClick={onOpenConcierge}
          className="inline-flex h-12 items-center justify-center rounded-full bg-interactive px-7 text-button text-white transition-colors duration-200 hover:bg-interactive-hover active:bg-interactive-active active:translate-y-px motion-reduce:transition-none"
        >
          {headerCta}
        </button>
        <CatalogButton variant="secondary" size="lg" onClick={onOpenCatalog} />
      </motion.div>
    </motion.div>
  );
}
