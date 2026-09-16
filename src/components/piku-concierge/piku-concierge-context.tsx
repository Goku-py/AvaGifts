"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { OPEN_PIKU_EVENT, type ConciergeStep } from "@/lib/piku-concierge";
import {
  PIKU_CONCIERGE_CLOSED_EVENT,
  PIKU_CONCIERGE_OPENED_EVENT,
} from "@/lib/events";

interface PikuConciergeContextValue {
  isOpen: boolean;
  /**
   * Open the flow. With no argument the conversation resumes where it was
   * (or starts at the intro); pass a step to jump straight there — e.g.
   * the "Send a Gifting Brief" card opens the details form directly.
   * Answers are never cleared.
   */
  openConcierge: (step?: ConciergeStep) => void;
  closeConcierge: () => void;
  /** Step requested by the opener, consumed once by the modal on open. */
  pendingStep: ConciergeStep | null;
  clearPendingStep: () => void;
}

const PikuConciergeContext = createContext<PikuConciergeContextValue | null>(
  null,
);

/**
 * Owns the Piku concierge open state. Any button on the page can also open
 * the flow by dispatching `avagifts:open-piku` — no context needed.
 */
export function PikuConciergeProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingStep, setPendingStep] = useState<ConciergeStep | null>(null);

  /* Opening notifies the mascot (Phase 20) — both entry points below
     announce so the brain can wave without polling open state. */
  const openConcierge = useCallback((step?: ConciergeStep) => {
    setPendingStep(step ?? null);
    setIsOpen(true);
    window.dispatchEvent(new CustomEvent(PIKU_CONCIERGE_OPENED_EVENT));
  }, []);

  const clearPendingStep = useCallback(() => {
    setPendingStep(null);
  }, []);
  /* Closing notifies the mascot (celebration after a sent enquiry). */
  const closeConcierge = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(PIKU_CONCIERGE_CLOSED_EVENT));
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      window.dispatchEvent(new CustomEvent(PIKU_CONCIERGE_OPENED_EVENT));
    };
    window.addEventListener(OPEN_PIKU_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_PIKU_EVENT, handleOpen);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      openConcierge,
      closeConcierge,
      pendingStep,
      clearPendingStep,
    }),
    [isOpen, openConcierge, closeConcierge, pendingStep, clearPendingStep],
  );

  return (
    <PikuConciergeContext.Provider value={value}>
      {children}
    </PikuConciergeContext.Provider>
  );
}

export function usePikuConcierge(): PikuConciergeContextValue {
  const context = useContext(PikuConciergeContext);
  if (!context) {
    throw new Error(
      "usePikuConcierge must be used inside <PikuConciergeProvider>.",
    );
  }
  return context;
}
