"use client";

import { useReducedMotion } from "motion/react";
import { Package, Sparkles, Stamp, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Button } from "@/components/ui/button";
import { PikuSprite } from "@/components/piku/piku-sprite";
import type { PikuEmotion } from "@/components/piku/use-piku-brain";
import {
  PIKU_GAME_COMPLETED_EVENT,
  PIKU_GAME_EXITED_EVENT,
  PIKU_GAME_STARTED_EVENT,
  type PikuGameOutcomeDetail,
} from "@/lib/events";
import "./piku-game.css";

/* ------------------------------------------------------------------ */
/* Rules — a few named constants rather than magic numbers, so the      */
/* balance can be tuned in one place.                                   */
/* ------------------------------------------------------------------ */

const ROUND_MS = 60_000;
const MAX_MISSES = 3;
const POINTS_PER_HIT = 10;
/** Hits needed to reach maximum difficulty; ramp plateaus after this. */
const DIFFICULTY_RAMP_HITS = 12;

const BASE_FALL_MS = 2600;
const MIN_FALL_MS = 1400;
const BASE_ZONE_MS = 650;
/** Real-time width of the hit window at maximum difficulty — kept above
 *  average human reaction time (~200-250ms) so the game never becomes
 *  literally unwinnable, only harder. */
const MIN_ZONE_MS = 380;
/** Where the zone sits along the fall, as a fraction of the total distance. */
const ZONE_CENTER = 0.8;

const TRACK_HEIGHT_PX = 288;
const BOX_SIZE_PX = 56;
const FALL_DISTANCE_PX = TRACK_HEIGHT_PX - BOX_SIZE_PX;

interface Difficulty {
  fallMs: number;
  /** Hit window, as [start, end] fractions of the fall (0..1). */
  zoneStart: number;
  zoneEnd: number;
}

/**
 * Pure function of score → this round's timing. Never mutated after a box
 * mounts — difficulty changes are applied by remounting a new box (keyed by
 * round index), not by adjusting a running animation's duration, which
 * would visually jump the box mid-fall (the browser re-evaluates keyframe
 * percentages live against the new duration).
 */
function getDifficulty(score: number): Difficulty {
  const hits = score / POINTS_PER_HIT;
  const t = Math.min(hits / DIFFICULTY_RAMP_HITS, 1);
  const fallMs = BASE_FALL_MS - t * (BASE_FALL_MS - MIN_FALL_MS);
  const zoneMs = BASE_ZONE_MS - t * (BASE_ZONE_MS - MIN_ZONE_MS);
  const halfWidth = zoneMs / fallMs / 2;
  return {
    fallMs,
    zoneStart: Math.max(0, ZONE_CENTER - halfWidth),
    zoneEnd: Math.min(1, ZONE_CENTER + halfWidth),
  };
}

type Phase = "idle" | "playing" | "gameOver";
type Outcome = "hit" | "miss" | null;

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export default function PikuGame({ onClose }: { onClose: () => void }) {
  const reduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_MS);
  const [emotion, setEmotion] = useState<PikuEmotion>("happy");
  const [zoneActive, setZoneActive] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<Outcome>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stampRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  /* Guards against double-scoring a single box — a click and the box's own
     animationend (auto-miss) can otherwise both fire for the same round. */
  const settledRef = useRef(false);
  const emotionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoneTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Mirrors of score/hits/misses, updated in lockstep with the state
     setters below. Lets the countdown interval read the current values at
     the moment the round times out without calling endGame from inside a
     setState updater (a real anti-pattern — updater functions are meant to
     be pure) or adding another effect to keep them "in sync" reactively. */
  const scoreRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  /* Hit parity for proud/WINK alternation: odd hits stay plain proud, even
     hits add the WINK lean class. Ref holds the count (no render); winkLean
     drives the class toggle. */
  const hitParityRef = useRef(0);
  const [winkLean, setWinkLean] = useState(false);
  const winkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const difficulty = useMemo(() => getDifficulty(score), [score]);

  const clearZoneTimers = useCallback(() => {
    zoneTimers.current.forEach(clearTimeout);
    zoneTimers.current = [];
  }, []);

  const flashEmotion = useCallback((next: PikuEmotion, ms: number) => {
    if (emotionTimer.current) clearTimeout(emotionTimer.current);
    setEmotion(next);
    emotionTimer.current = setTimeout(() => setEmotion("happy"), ms);
  }, []);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    hitsRef.current = 0;
    missesRef.current = 0;
    hitParityRef.current = 0;
    if (winkTimer.current) clearTimeout(winkTimer.current);
    setWinkLean(false);
    setScore(0);
    setHits(0);
    setMisses(0);
    setTimeLeftMs(ROUND_MS);
    setLastOutcome(null);
    setEmotion("happy");
    setRoundIndex((i) => i + 1);
    setPhase("playing");
    window.dispatchEvent(new Event(PIKU_GAME_STARTED_EVENT));
  }, []);

  const endGame = useCallback(
    (finalScore: number, finalHits: number, finalMisses: number) => {
      clearZoneTimers();
      if (winkTimer.current) clearTimeout(winkTimer.current);
      setWinkLean(false);
      setPhase("gameOver");
      const detail: PikuGameOutcomeDetail = {
        score: finalScore,
        hits: finalHits,
        misses: finalMisses,
      };
      window.dispatchEvent(
        new CustomEvent<PikuGameOutcomeDetail>(PIKU_GAME_COMPLETED_EVENT, { detail }),
      );
      flashEmotion(finalHits >= 5 ? "excited" : "happy", 2000);
    },
    [clearZoneTimers, flashEmotion],
  );

  /** Called exactly once per box, however it settles. */
  /*
   * Decides whether the round is over right here, synchronously, rather
   * than in a useEffect watching `misses` — that pattern was flagged by
   * the React Compiler (a setState-triggering effect cascades an extra
   * render). Since `settle` only ever runs once per box (guarded by
   * settledRef) and is always called from a real event (click, keydown,
   * animationend, or a setTimeout callback — never from inside an effect
   * body), incrementing `misses` here and immediately checking the new
   * total is both simpler and avoids that extra render entirely.
   */
  const settle = useCallback(
    (outcome: "hit" | "miss") => {
      if (settledRef.current) return;
      settledRef.current = true;
      clearZoneTimers();
      setZoneActive(false);
      setLastOutcome(outcome);

      if (outcome === "hit") {
        hitParityRef.current += 1;
        const isWinkFrame = hitParityRef.current % 2 === 0;
        flashEmotion("proud", 700);
        if (winkTimer.current) clearTimeout(winkTimer.current);
        setWinkLean(isWinkFrame);
        if (isWinkFrame) {
          winkTimer.current = setTimeout(() => setWinkLean(false), 700);
        }
        const nextHits = hits + 1;
        const nextScore = score + POINTS_PER_HIT;
        hitsRef.current = nextHits;
        scoreRef.current = nextScore;
        setHits(nextHits);
        setScore(nextScore);
        advanceTimer.current = setTimeout(() => {
          setLastOutcome(null);
          setRoundIndex((i) => i + 1);
        }, 380);
      } else {
        if (winkTimer.current) clearTimeout(winkTimer.current);
        setWinkLean(false);
        flashEmotion("nervous", 700);
        const nextMisses = misses + 1;
        missesRef.current = nextMisses;
        setMisses(nextMisses);
        if (nextMisses >= MAX_MISSES) {
          endGame(score, hits, nextMisses);
        } else {
          advanceTimer.current = setTimeout(() => {
            setLastOutcome(null);
            setRoundIndex((i) => i + 1);
          }, 380);
        }
      }
    },
    [clearZoneTimers, flashEmotion, hits, score, misses, endGame],
  );

  /* Countdown display + round timeout. A once-a-second label tick, not a
     hit-detection mechanism — a plain interval is the right tool here. Reads
     score/hits/misses from the refs kept alongside their state (see above)
     rather than nesting three setState updaters just to read current values
     — calling endGame (itself several setState calls) from inside another
     updater function is the same anti-pattern the round-end logic in
     `settle` avoids, just relocated. */
  useEffect(() => {
    if (phase !== "playing") return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const remaining = ROUND_MS - (Date.now() - startedAt);
      if (remaining <= 0) {
        setTimeLeftMs(0);
        clearInterval(interval);
        if (advanceTimer.current) clearTimeout(advanceTimer.current);
        endGame(scoreRef.current, hitsRef.current, missesRef.current);
      } else {
        setTimeLeftMs(remaining);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, endGame]);

  /*
   * New box: reset the settle guard (a ref — not reactive state, fine to
   * write directly in an effect) and schedule the zone-active window.
   * Deliberately does NOT call setState synchronously in the effect body
   * itself (the React Compiler flags that pattern — it forces an extra
   * render): every setState here happens inside a setTimeout callback,
   * i.e. later, in response to time passing, not during the effect's own
   * synchronous execution. The reduced-motion case skips zone-timing
   * altogether — see `zoneVisualActive` below, which derives the same
   * visual from state that's already set from real event-driven paths
   * (startGame / settle), rather than needing its own setState here.
   */
  useEffect(() => {
    if (phase !== "playing") return;
    settledRef.current = false;
    clearZoneTimers();

    if (reduceMotion) {
      const t = setTimeout(() => settle("miss"), 1500);
      zoneTimers.current.push(t);
      return () => clearTimeout(t);
    }

    const zoneEnterMs = difficulty.zoneStart * difficulty.fallMs;
    const zoneExitMs = difficulty.zoneEnd * difficulty.fallMs;
    /* IDEA pre-beat, mirroring use-piku-brain: surprised 350ms then curious.
       Cancelled by settle's clearZoneTimers if the box settles first (the
       curious beat is pushed so it clears with the zone timers). */
    const enter = setTimeout(() => {
      setZoneActive(true);
      flashEmotion("surprised", 350);
      const curiousBeat = setTimeout(() => flashEmotion("curious", 700), 350);
      zoneTimers.current.push(curiousBeat);
    }, zoneEnterMs);
    const exit = setTimeout(() => setZoneActive(false), zoneExitMs);
    zoneTimers.current.push(enter, exit);
    return () => {
      clearTimeout(enter);
      clearTimeout(exit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, phase, reduceMotion]);

  /** Whether the zone should render as "active" right now. Real timing for
   *  the normal path (state set by the timers above); for reduced motion,
   *  derived straight from lastOutcome — true for a box's whole life until
   *  it settles, no separate timer/state needed. */
  const zoneVisualActive = reduceMotion
    ? phase === "playing" && lastOutcome === null
    : zoneActive;

  /** The one authority on hit/miss: reads the box's real animation clock at
   *  the moment of the press, rather than trusting the JS-timer-driven
   *  zoneActive visual (which exists only to look right, a frame or two of
   *  drift from it is invisible and doesn't change what counts as a hit). */
  const handleStamp = useCallback(() => {
    if (phase !== "playing" || settledRef.current) return;

    if (reduceMotion) {
      settle("hit");
      return;
    }

    const el = boxRef.current;
    const anim = el?.getAnimations().find((a) => {
      const effect = a.effect;
      return effect instanceof KeyframeEffect && effect.target === el;
    });

    if (!anim || !anim.effect) {
      // getAnimations() unsupported — degrade to "any press while a box is
      // on screen counts", rather than the game becoming unplayable.
      settle("hit");
      return;
    }

    const timing = anim.effect.getComputedTiming();
    const duration = typeof timing.duration === "number" ? timing.duration : difficulty.fallMs;
    const current = typeof anim.currentTime === "number" ? anim.currentTime : 0;
    const progress = duration > 0 ? current / duration : 0;

    settle(
      progress >= difficulty.zoneStart && progress <= difficulty.zoneEnd ? "hit" : "miss",
    );
  }, [phase, reduceMotion, difficulty, settle]);

  /* Space/Enter without focus on the Stamp button. Routes through the
     button's own click rather than duplicating handleStamp, so a press
     while the button IS focused can't score twice (native activation +
     this listener both firing). */
  useEffect(() => {
    if (phase !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") return;
      if (document.activeElement === stampRef.current) return; // native activation handles it
      event.preventDefault();
      stampRef.current?.click();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  const handleClose = useCallback(() => {
    if (phase === "playing") {
      window.dispatchEvent(
        new CustomEvent<PikuGameOutcomeDetail>(PIKU_GAME_EXITED_EVENT, {
          detail: { score, hits, misses },
        }),
      );
    }
    if (emotionTimer.current) clearTimeout(emotionTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (winkTimer.current) clearTimeout(winkTimer.current);
    clearZoneTimers();
    onClose();
  }, [phase, score, hits, misses, clearZoneTimers, onClose]);

  /* Wink-lean timer is outside the zone/advance timers (it outlives the
     380ms round advance), so it needs its own unmount cleanup. */
  useEffect(
    () => () => {
      if (winkTimer.current) clearTimeout(winkTimer.current);
    },
    [],
  );

  /* Scroll-lock + Esc + initial focus + focus trap while open — mirrors
     the concierge modal's implementation (the more complete of the two
     existing modal precedents in this codebase). Declared above this
     effect (not below, as it originally was) — referencing it here before
     its declaration line compiled and ran fine via closures, but the React
     Compiler correctly flags it as unsafe to reorder around. */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secondsLeft = Math.ceil(timeLeftMs / 1000);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-primary/60 sm:items-center sm:p-6"
      onClick={handleClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Brand the Gifts — a quick game with Piku"
        onClick={(event) => event.stopPropagation()}
        className="flex w-full flex-col overflow-hidden bg-white sm:max-w-md sm:rounded-2xl sm:shadow-lift"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-divider px-4 py-3 sm:px-5">
          <span
            className={
              winkLean
                ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-surface piku-game-wink [&_svg]:size-7"
                : "flex size-9 shrink-0 items-center justify-center rounded-full bg-surface [&_svg]:size-7"
            }
          >
            <PikuSprite emotion={emotion} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-semibold leading-tight tracking-[-0.01em] text-text-primary">
              Brand the Gifts
            </span>
            <span className="block truncate text-xs text-text-secondary">
              A quick break with Piku
            </span>
          </span>
          {phase === "playing" ? (
            <span className="shrink-0 text-right">
              <span className="block font-sans text-sm font-semibold tabular-nums text-text-primary">
                Score {score}
              </span>
              <span className="block text-xs tabular-nums text-text-secondary">
                {secondsLeft}s left
              </span>
            </span>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            aria-label="Close game"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-hover-surface hover:text-text-primary"
          >
            <X aria-hidden="true" className="size-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-6 sm:px-6">
          {phase === "idle" ? (
            <div className="flex flex-col items-center text-center">
              <p className="text-body text-text-secondary">
                Gift boxes come down the line — press{" "}
                <strong className="font-semibold text-text-primary">Stamp</strong>{" "}
                the moment one reaches Piku to brand it. Miss {MAX_MISSES} and
                the round’s over.
              </p>
              <Button variant="gradient" size="lg" onClick={startGame} className="mt-6">
                Start
              </Button>
            </div>
          ) : null}

          {phase === "playing" ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {Array.from({ length: MAX_MISSES }, (_, i) => (
                  <span
                    key={i}
                    className={
                      i < MAX_MISSES - misses
                        ? "size-2 rounded-full bg-interactive"
                        : "size-2 rounded-full bg-divider"
                    }
                  />
                ))}
              </div>

              <div
                className="relative w-full overflow-hidden rounded-xl bg-surface"
                style={{ height: TRACK_HEIGHT_PX }}
              >
                {/* Stamp zone — the visual echoes zoneVisualActive with an
                    icon swap and label change, not colour/pulse alone. */}
                <div
                  className="absolute inset-x-0 flex items-center justify-center gap-1.5 border-y-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-150"
                  style={{
                    top: difficulty.zoneStart * FALL_DISTANCE_PX,
                    height: (difficulty.zoneEnd - difficulty.zoneStart) * FALL_DISTANCE_PX + BOX_SIZE_PX,
                    borderColor: zoneVisualActive ? "var(--color-interactive)" : "var(--color-divider)",
                    color: zoneVisualActive ? "var(--color-interactive)" : "var(--color-text-muted)",
                  }}
                >
                  {zoneVisualActive ? (
                    <>
                      <Sparkles aria-hidden="true" className="size-3.5" />
                      Now!
                    </>
                  ) : (
                    "Zone"
                  )}
                </div>

                <div
                  key={roundIndex}
                  ref={boxRef}
                  className="piku-game-box absolute left-1/2 flex items-center justify-center rounded-lg border border-divider bg-white shadow-card"
                  style={
                    {
                      // Reduced motion disables the fall animation entirely
                      // (piku-game.css), which freezes the box at its `from`
                      // keyframe — the top of the track. Without this, the
                      // box would sit at the top while the zone below shows
                      // "Now!", two things visually disagreeing about where
                      // the box is. Placed directly in the zone instead, to
                      // match the reduced-motion design: the box is already
                      // "there" for its whole life until it settles.
                      top: reduceMotion ? difficulty.zoneStart * FALL_DISTANCE_PX : 0,
                      width: BOX_SIZE_PX,
                      height: BOX_SIZE_PX,
                      marginLeft: -BOX_SIZE_PX / 2,
                      "--fall-duration": `${difficulty.fallMs}ms`,
                      "--fall-distance": `${FALL_DISTANCE_PX}px`,
                    } as CSSProperties
                  }
                  onAnimationEnd={() => settle("miss")}
                >
                  <Package aria-hidden="true" className="size-6 text-interactive" />
                </div>

                {/*
                  piku.css's `.piku-svg { width: 100%; height: 100% }` is
                  imported unlayered, so it always wins over any Tailwind
                  utility targeting the svg descendant, regardless of
                  specificity — a `[&_svg]:size-*` utility here would be
                  silently ignored. The svg fills whatever box its own
                  wrapper is explicitly sized to, so the wrapper itself
                  needs the real dimensions (as the header avatar above
                  already does, via its own `size-9`).
                */}
                <div
                  className={
                    winkLean
                      ? "absolute bottom-1 right-2 size-14 piku-game-wink"
                      : "absolute bottom-1 right-2 size-14"
                  }
                >
                  <PikuSprite emotion={emotion} />
                </div>
              </div>

              <button
                ref={stampRef}
                type="button"
                onClick={handleStamp}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-interactive text-button text-white transition-colors duration-150 hover:bg-interactive-hover active:translate-y-px motion-reduce:transition-none"
              >
                <Stamp aria-hidden="true" className="size-5" />
                Stamp
              </button>

              <p aria-live="polite" className="sr-only">
                {lastOutcome === "hit" ? "Branded correctly." : null}
                {lastOutcome === "miss" ? "Missed." : null}
              </p>
            </div>
          ) : null}

          {phase === "gameOver" ? (
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex size-24">
                <PikuSprite emotion={emotion} />
              </span>
              <p className="text-h4 mt-3 font-sans text-text-primary">
                {hits} gift{hits === 1 ? "" : "s"} branded
              </p>
              <p className="text-body mt-1.5 text-text-secondary">
                Score: {score}
              </p>
              <div className="mt-6 flex w-full gap-3">
                <Button variant="secondary" size="lg" onClick={handleClose} className="flex-1">
                  Exit
                </Button>
                <Button variant="gradient" size="lg" onClick={startGame} className="flex-1">
                  Play Again
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
