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
import { OPEN_PIKU_EVENT } from "@/lib/piku-concierge";

interface PikuConciergeContextValue {
  isOpen: boolean;
  openConcierge: () => void;
  closeConcierge: () => void;
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

  const openConcierge = useCallback(() => setIsOpen(true), []);
  const closeConcierge = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener(OPEN_PIKU_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_PIKU_EVENT, handleOpen);
  }, []);

  const value = useMemo(
    () => ({ isOpen, openConcierge, closeConcierge }),
    [isOpen, openConcierge, closeConcierge],
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

/** Imperative opener for buttons that don't consume the context. */
export function openPikuConcierge() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_PIKU_EVENT));
  }
}
