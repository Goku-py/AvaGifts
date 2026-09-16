"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import PikuRunnerCanvas from "@/components/piku-runner/PikuRunnerCanvas";

const SOUND_KEY = "piku_runner_sound";
const SOUND_EVENT = "piku-runner-sound-change";

function subscribeSound(onChange: () => void) {
  window.addEventListener(SOUND_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SOUND_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readSoundPref(): string {
  try {
    return window.localStorage.getItem(SOUND_KEY) ?? "1";
  } catch {
    return "1";
  }
}

function serverSoundPref(): string {
  return "1";
}

/*
 * Piku Runner band — branded pixel-art endless runner.
 * The engine (fixed-step 60Hz canvas game) lives in ./game.ts, input wiring
 * in ./PikuRunnerCanvas.tsx. The chrome around it (rounded frame, controls
 * footer, sound toggle) stays in the AvaGifts design system — everything
 * inside the canvas belongs to the game's own pixel-art language.
 */
export function PikuRunner() {
  const soundPref = useSyncExternalStore(subscribeSound, readSoundPref, serverSoundPref);
  const soundOn = soundPref !== "0";

  const toggleSound = () => {
    try {
      window.localStorage.setItem(SOUND_KEY, soundOn ? "0" : "1");
    } catch {
      /* storage unavailable — keep the in-memory preference */
    }
    window.dispatchEvent(new Event(SOUND_EVENT));
  };

  const kbd =
    "rounded-[5px] border border-border bg-surface px-1.5 py-0.5 font-ui text-[10px] font-medium leading-none text-text-secondary";

  return (
    <div className="mx-auto w-full max-w-[880px]">
      <div className="overflow-hidden rounded-[18px] border border-interactive/15 bg-white shadow-card focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--color-interactive)]">
        <PikuRunnerCanvas soundOn={soundOn} />
        <div className="flex items-center justify-between gap-3 border-t border-border bg-white px-4 py-2.5 sm:px-5">
          <p className="text-caption flex flex-wrap items-center gap-x-2 gap-y-1 text-text-muted">
            <span className="inline-flex items-center gap-1">
              <kbd className={kbd}>Space</kbd>
              <span aria-hidden="true">/</span>
              <kbd className={kbd}>↑</kbd>
              <span className="ml-0.5">Jump</span>
            </span>
            <span aria-hidden="true" className="text-border">
              •
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className={kbd}>↓</kbd>
              <span className="ml-0.5">Duck</span>
            </span>
          </p>
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute game sound" : "Unmute game sound"}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:bg-hover-surface hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-interactive)]"
          >
            {soundOn ? (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
