'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FIXED_STEP_MS,
  MAX_FRAME_DELTA_MS,
  MAX_STEPS_PER_FRAME,
} from './tuning';
import { PikuGame } from './game';
import {
  PIKU_GAME_COMPLETED_EVENT,
  PIKU_GAME_EXITED_EVENT,
  PIKU_GAME_HIT_EVENT,
  PIKU_GAME_MILESTONE_EVENT,
  PIKU_GAME_OPENED_EVENT,
  PIKU_GAME_STARTED_EVENT,
} from '@/lib/events';
import './piku-runner.css';

declare global {
  interface Window {
    __pikuRunner?: {
      forceHit: () => void;
      forceNight: () => void;
      seekScore: (score: number) => void;
      getScore: () => number;
      getHi: () => number;
      isOver: () => boolean;
      isNight: () => boolean;
      isDucking: () => boolean;
      canRestart: () => boolean;
      start: () => void;
      restart: () => void;
      setSound: (on: boolean) => void;
      getSound: () => boolean;
    };
  }
}

interface PikuRunnerCanvasProps {
  /** Mirrors the mute preference held by the wrapper (persisted to localStorage). */
  soundOn: boolean;
}

const TAP_DECISION_MS = 60;
const SWIPE_DUCK_PX = 16;
const SWIPE_WINDOW_MS = 250;

export default function PikuRunnerCanvas({ soundOn }: PikuRunnerCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<PikuGame | null>(null);
  const [crashed, setCrashed] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalBest, setFinalBest] = useState(0);
  const [liveText, setLiveText] = useState('Score 0');
  const announceRef = useRef(0);
  const tapRef = useRef<{ id: number; y: number; t: number; decided: boolean } | null>(null);
  const tapTimerRef = useRef(0);

  const doRestart = useCallback(() => {
    const game = gameRef.current;
    if (!game || !game.canRestart()) return;
    game.restart();
    setCrashed(false);
    tapRef.current = null;
    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = 0;
    }
    wrapRef.current?.focus({ preventScroll: true });
  }, []);

  // Engine + render loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;

    const game = new PikuGame(canvas, {
      onGameOver: (score, best) => {
        setCrashed(true);
        setFinalScore(score);
        setFinalBest(best);
        setLiveText(`Game over. Score ${score}. Best ${best}. Press space or tap to run again.`);
        /* Phase 22 — the mascot celebrates the run over the shared bus. */
        window.dispatchEvent(
          new CustomEvent(PIKU_GAME_COMPLETED_EVENT, {
            detail: { score, hits: 0, misses: 0 },
          }),
        );
      },
      onHit: () => {
        window.dispatchEvent(new CustomEvent(PIKU_GAME_HIT_EVENT));
      },
      onBigMilestone: (score) => {
        window.dispatchEvent(
          new CustomEvent(PIKU_GAME_MILESTONE_EVENT, { detail: { score } }),
        );
      },
    });
    gameRef.current = game;

    /* "Game launched" means the band is actually seen — a page load with
       the runner far below the fold should not fire it (Phase 22). */
    let announcedOpen = false;
    const openObserver = new IntersectionObserver(
      (entries) => {
        if (announcedOpen) return;
        if (!entries.some((entry) => entry.isIntersecting)) return;
        announcedOpen = true;
        window.dispatchEvent(new CustomEvent(PIKU_GAME_OPENED_EVENT));
        openObserver.disconnect();
      },
      { threshold: 0.35 },
    );
    openObserver.observe(wrap);

    const applySize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      game.setDpr(dpr);
      canvas.width = Math.round(CANVAS_WIDTH * dpr);
      canvas.height = Math.round(CANVAS_HEIGHT * dpr);
      game.draw();
    };
    applySize();

    window.__pikuRunner = {
      forceHit: () => game.forceHit(),
      forceNight: () => {
        game.forceNight();
        game.draw();
      },
      seekScore: (score: number) => {
        game.seekScore(score);
        game.draw();
      },
      getScore: () => game.getScore(),
      getHi: () => game.getHi(),
      isOver: () => game.isOver(),
      isNight: () => game.isNight(),
      isDucking: () => game.isDucking(),
      canRestart: () => game.canRestart(),
      start: () => game.start(),
      restart: () => game.restart(),
      setSound: (on: boolean) => game.setSound(on),
      getSound: () => game.getSound(),
    };

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let wasPlaying = false;

    const loop = (now: number) => {
      raf = window.requestAnimationFrame(loop);
      if (document.hidden) {
        last = now;
        acc = 0;
        return;
      }
      let delta = now - last;
      last = now;
      if (delta < 0) delta = 0;
      if (delta > MAX_FRAME_DELTA_MS) delta = MAX_FRAME_DELTA_MS;
      acc += delta;
      let steps = 0;
      while (acc >= FIXED_STEP_MS && steps < MAX_STEPS_PER_FRAME) {
        game.step();
        acc -= FIXED_STEP_MS;
        steps += 1;
      }
      if (steps >= MAX_STEPS_PER_FRAME) acc = 0;
      if (steps > 0) game.draw();

      const playing = game.isPlaying();
      if (playing && !wasPlaying) {
        window.dispatchEvent(new CustomEvent(PIKU_GAME_STARTED_EVENT));
      }
      wasPlaying = playing;

      if (game.isPlaying() && now - announceRef.current > 1000) {
        announceRef.current = now;
        setLiveText(`Score ${game.getScore()}`);
      }
    };
    raf = window.requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) {
        game.pause();
      } else {
        last = performance.now();
        acc = 0;
        game.resume();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', applySize);

    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', applySize);
      openObserver.disconnect();
      window.dispatchEvent(new CustomEvent(PIKU_GAME_EXITED_EVENT));
      game.destroy();
      gameRef.current = null;
      if (window.__pikuRunner) delete window.__pikuRunner;
    };
  }, []);

  // Keep the engine's mute flag in sync with the wrapper's persisted preference.
  useEffect(() => {
    gameRef.current?.setSound(soundOn);
  }, [soundOn]);

  // Keyboard controls.
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el || typeof el.closest !== 'function') return false;
      return Boolean(
        el.closest(
          "input, textarea, select, button, a[href], [role='button'], [contenteditable='true']",
        ),
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
          e.preventDefault();
        }
        return;
      }
      if (isTypingTarget(e.target)) return;
      const game = gameRef.current;
      if (!game) return;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (game.isOver()) {
          doRestart();
          return;
        }
        if (game.getState() === 'HIT') return;
        game.unlock();
        game.jump();
        return;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (game.isOver() || game.getState() === 'HIT') return;
        game.unlock();
        game.setDucking(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const game = gameRef.current;
      if (!game) return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        game.endJump();
        return;
      }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        game.setDucking(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [doRestart]);

  // Pointer / touch: tap to jump, swipe down to duck.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const clearTapTimer = () => {
      if (tapTimerRef.current) {
        window.clearTimeout(tapTimerRef.current);
        tapTimerRef.current = 0;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const game = gameRef.current;
      if (!game) return;
      e.preventDefault();
      wrap.focus({ preventScroll: true });
      game.unlock();
      if (game.isOver()) {
        doRestart();
        return;
      }
      if (game.getState() === 'HIT') return;

      if (e.pointerType === 'touch') {
        tapRef.current = { id: e.pointerId, y: e.clientY, t: performance.now(), decided: false };
        clearTapTimer();
        tapTimerRef.current = window.setTimeout(() => {
          tapTimerRef.current = 0;
          const tap = tapRef.current;
          if (tap && !tap.decided) {
            tap.decided = true;
            gameRef.current?.jump();
          }
        }, TAP_DECISION_MS);
      } else {
        game.jump();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const tap = tapRef.current;
      if (!tap || tap.id !== e.pointerId || tap.decided) return;
      if (e.clientY - tap.y > SWIPE_DUCK_PX && performance.now() - tap.t < SWIPE_WINDOW_MS) {
        tap.decided = true;
        clearTapTimer();
        gameRef.current?.setDucking(true);
      }
    };

    const onPointerEnd = () => {
      const tap = tapRef.current;
      tapRef.current = null;
      clearTapTimer();
      const game = gameRef.current;
      if (!game) return;
      if (tap && !tap.decided) {
        // Quick tap released before the decision timer: short hop.
        tap.decided = true;
        game.jump();
        game.endJump();
        return;
      }
      game.endJump();
      game.setDucking(false);
    };

    wrap.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);

    return () => {
      clearTapTimer();
      wrap.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [doRestart]);

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      role="application"
      aria-label="Piku runner game. Press Space or Up to jump, Down to duck under flyers."
      className="piku-runner"
    >
      <canvas ref={canvasRef} className="piku-runner-canvas" aria-hidden="true" />
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveText}
      </p>
      {crashed ? (
        <div className="sr-only" role="alert">
          {`Game over. Score ${finalScore}. Best ${finalBest}. Press space or tap to run again.`}
        </div>
      ) : null}
    </div>
  );
}
