"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PIKU_GAME_OPENED_EVENT } from "@/lib/events";

/* ------------------------------------------------------------------ */
/* Game context — mounts the game panel on demand, same pattern as      */
/* CatalogProvider. Nothing about the game (code or otherwise — there   */
/* are no image/audio assets, only CSS/SVG) loads until opened.         */
/* ------------------------------------------------------------------ */

const PikuGame = dynamic(() => import("@/components/piku-game/piku-game"), {
  ssr: false,
});

interface PikuGameContextValue {
  isOpen: boolean;
  openGame: () => void;
  closeGame: () => void;
}

const PikuGameContext = createContext<PikuGameContextValue | null>(null);

export function PikuGameProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openGame = useCallback(() => {
    setIsOpen(true);
    window.dispatchEvent(new Event(PIKU_GAME_OPENED_EVENT));
  }, []);
  const closeGame = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, openGame, closeGame }),
    [isOpen, openGame, closeGame],
  );

  return (
    <PikuGameContext.Provider value={value}>
      {children}
      {isOpen ? <PikuGame onClose={closeGame} /> : null}
    </PikuGameContext.Provider>
  );
}

export function usePikuGame(): PikuGameContextValue {
  const context = useContext(PikuGameContext);
  if (!context) {
    throw new Error("usePikuGame must be used within <PikuGameProvider>");
  }
  return context;
}
