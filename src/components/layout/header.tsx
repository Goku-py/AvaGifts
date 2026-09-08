"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { CatalogButton } from "@/components/catalog/catalog-button";
import { useCatalog } from "@/components/catalog/catalog-context";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Catalog", href: "#catalog" },
  { label: "Collections", href: "#collections" },
  { label: "Why AvaGifts", href: "#why" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
] as const;

const menuItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export function Header() {
  const { openCatalog } = useCatalog();
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
    const sections = NAV_LINKS.map((link) => document.getElementById(link.href.slice(1))).filter(
      (element): element is HTMLElement => element !== null,
    );
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
          ? "border-b border-line bg-paper/85 shadow-[0_1px_16px_rgb(23_25_30/0.04)] backdrop-blur-md"
          : "border-b border-transparent bg-paper/60 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8 md:h-[72px]">
        <a href="#top" aria-label="AvaGifts — back to top" className="shrink-0">
          <Logo />
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "true" : undefined}
              className={cn(
                "text-sm transition-colors duration-200 hover:text-ink",
                active === link.href
                  ? "text-ink underline decoration-gold decoration-[1.5px] underline-offset-8"
                  : "text-ink-soft",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink
            variant="ghost"
            size="sm"
            href="#contact"
            className="hidden md:inline-flex"
          >
            Enquire
          </ButtonLink>
          <CatalogButton size="sm" className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Open menu"
            className="inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/[0.06] lg:hidden"
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
  closeRef: React.RefObject<HTMLButtonElement | null>;
}

function MobileMenu({ onClose, onOpenCatalog, closeRef }: MobileMenuProps) {
  return (
    <motion.div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[70] flex flex-col bg-paper lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <div className="flex h-16 items-center justify-between px-5 sm:px-8 md:h-[72px]">
        <Logo />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="inline-flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/[0.06]"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>

      <motion.nav
        aria-label="Mobile"
        className="flex flex-1 flex-col justify-center px-8"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } }}
      >
        {NAV_LINKS.map((link) => (
          <motion.a
            key={link.href}
            href={link.href}
            onClick={onClose}
            variants={menuItemVariants}
            className="border-b border-line py-4 font-display text-3xl font-semibold tracking-[-0.02em] text-ink transition-colors hover:text-accent"
          >
            {link.label}
          </motion.a>
        ))}
      </motion.nav>

      <motion.div
        className="flex flex-col gap-3 px-8 pb-12"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease: EASE }}
      >
        <ButtonLink variant="secondary" size="lg" href="#contact" onClick={onClose} arrow>
          Enquire
        </ButtonLink>
        <CatalogButton size="lg" onClick={onOpenCatalog} />
      </motion.div>
    </motion.div>
  );
}
