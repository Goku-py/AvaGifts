"use client";

import { AnimatePresence, motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { usePikuConcierge } from "./piku-concierge-context";

/**
 * Fixed bottom-screen CTA. Always visible (until the modal opens) so the
 * guided flow is one tap away from anywhere on the page.
 */
export function PikuDock() {
  const { isOpen, openConcierge } = usePikuConcierge();

  return (
    <AnimatePresence>
      {!isOpen ? (
        <motion.div
          key="piku-dock"
          data-piku-dock
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <button
            type="button"
            onClick={() => openConcierge()}
            className={cn(
              "group pointer-events-auto inline-flex h-12 items-center gap-2.5 rounded-full",
              "bg-primary px-6 text-sm font-medium text-white shadow-lift",
              "transition-[background-color,transform] duration-200 ease-out",
              "hover:bg-interactive-hover active:translate-y-px",
              "motion-reduce:transition-none",
            )}
          >
            <MessageCircle aria-hidden="true" className="size-4 text-accent" />
            Chat with Piku
            <span
              aria-hidden="true"
              className="transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:translate-x-0"
            >
              →
            </span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
