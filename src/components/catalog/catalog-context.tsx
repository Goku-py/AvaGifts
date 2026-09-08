"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CLOSE_CATALOG_EVENT, OPEN_CATALOG_EVENT } from "@/lib/events";

/* ------------------------------------------------------------------ */
/* Catalog context — mounts the flipbook viewer on demand              */
/* ------------------------------------------------------------------ */

const CatalogViewer = dynamic(() => import("@/components/catalog/catalog-viewer"), {
  ssr: false,
});

interface CatalogContextValue {
  /** Whether the catalog viewer is open. */
  isOpen: boolean;
  /** Open the flipbook catalog viewer. */
  openCatalog: () => void;
  /** Close the catalog viewer. */
  closeCatalog: () => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openCatalog = useCallback(() => {
    setIsOpen(true);
    // The mascot listens for this to react when the catalog opens. Without the
    // dispatch its listener was unreachable.
    window.dispatchEvent(new Event(OPEN_CATALOG_EVENT));
  }, []);
  const closeCatalog = useCallback(() => setIsOpen(false), []);

  // The viewer dispatches CLOSE_CATALOG_EVENT (Esc / close button)
  // so it can live inside fullscreen without prop drilling.
  useEffect(() => {
    if (!isOpen) return;
    const onClose = () => setIsOpen(false);
    window.addEventListener(CLOSE_CATALOG_EVENT, onClose);
    return () => window.removeEventListener(CLOSE_CATALOG_EVENT, onClose);
  }, [isOpen]);

  const value = useMemo(
    () => ({ isOpen, openCatalog, closeCatalog }),
    [isOpen, openCatalog, closeCatalog],
  );

  return (
    <CatalogContext.Provider value={value}>
      {children}
      {isOpen ? <CatalogViewer /> : null}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within <CatalogProvider>");
  }
  return context;
}
