"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PIKU_CELEBRATE_EVENT,
  PIKU_CONCIERGE_CLOSED_EVENT,
  PIKU_ENQUIRY_SENT_EVENT,
  OPEN_CATALOG_EVENT,
  PIKU_GLANCE_EVENT,
} from "@/lib/events";
import { OPEN_PIKU_EVENT } from "@/lib/piku-concierge";

/* ------------------------------------------------------------------ *
 * Piku Brain — autonomous life + personality reactions
 * Business corporate gift advisor edition — noticeably different copy.
 *
 * Architecture: single source of emotion/anchor/bubble, flash timers,
 * idle/sleep, contextual hints, wandering, organic cursor/scroll reactions.
 * Zero external imports. Timers + listeners cleaned up on unmount.
 * ------------------------------------------------------------------ */

export type PikuEmotion =
  | "wave"
  | "idle"
  | "happy"
  | "sleepy"
  | "surprised"
  | "curious"
  | "thinking"
  | "excited"
  | "proud"
  | "nervous"
  | "peeking"
  | "walking";

export type PikuAnchor = { right: number; bottom: number };

/* ---- Copy — corporate gift advisor voice ---- */
const GREETING =
  "Hi, I'm Piku — your corporate gifting pro. Let's find something memorable.";

const CLICK_QUIPS = [
  "At your service!",
  "Let's wrap something great.",
  "Need gift ideas? Tap again!",
  "Corporate gifting, made easy.",
  "I've got the perfect pick!",
] as const;

const EXCITED_QUIPS = [
  "Ooh — premium picks incoming!",
  "Let's make your brand unforgettable!",
  "Corporate gifting, elevated!",
  "Found something amazing for your team!",
] as const;

const THINKING_QUIPS = [
  "Hmm, curating the perfect corporate gift...",
  "Considering premium options for your brand...",
  "Thinking of something memorable...",
  "Good brief — let me ponder the catalog...",
] as const;

const PROUD_QUIPS = [
  "Spot-on choice — your clients will love it!",
  "That's corporate gifting done right.",
  "Premium pick — well chosen!",
  "AvaGifts corporate — approved!",
] as const;

const NERVOUS_QUIPS = [
  "Oops — let's double-check that detail.",
  "Hmm, that field needs attention.",
  "Let's fix that before we wrap the gift!",
] as const;

const LONG_HOVER_QUIPS = [
  "Need corporate gifting advice? I'm here!",
  "Browsing for clients or team gifts?",
  "Tap me for curated premium ideas!",
  "Let's find something on-brand.",
] as const;

const SCROLL_BOTTOM_QUIPS = [
  "Reached the end — ready to shortlist your gifts?",
  "Scrolled through it all — let's pick the premium one!",
  "Seen it all? Your memorable gift awaits!",
] as const;

const HINTS: Record<string, string> = {
  catalog: "Psst — our corporate catalog has curated premium collections.",
  contact: "Need bulk pricing or custom branding? We reply within 48h.",
  featured: "Corporate favorites — trusted by 1,200+ brands!",
  why: "Here's why 1,200+ companies trust AvaGifts for corporate gifting.",
};

const ANCHORS: readonly PikuAnchor[] = [
  { right: 28, bottom: 28 },
  { right: 88, bottom: 28 },
  { right: 148, bottom: 28 },
  { right: 28, bottom: 148 },
  { right: 104, bottom: 100 },
];

const IDLE_TIMEOUT_MS = 35_000;
const MOVE_INTERVAL_MS = 32_000;
const BUBBLE_MS = 4_800;
const SCROLL_SURPRISE_COOLDOWN_MS = 4_000;
const HINT_COOLDOWN_MS = 8_000;
const LONG_HOVER_MS = 2_000;
const SCROLL_BOTTOM_THRESHOLD = 200;
const ROAM_IDLE_MS = 9000;
const ROAM_STEP_MS = 2800;

/* ---- Helpers ---- */
function pickRandom<T>(items: readonly T[], avoid?: T): T {
  const pool =
    items.length > 1 && avoid !== undefined
      ? items.filter((i) => i !== avoid)
      : items;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function shouldAllowRoam(): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < 768) return false;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (window.matchMedia("(pointer: coarse)").matches) return false;
  } catch {
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */
export function usePikuBrain() {
  const [emotion, setEmotion] = useState<PikuEmotion>("idle");
  const [anchor, setAnchor] = useState<PikuAnchor>(ANCHORS[0]!);
  const [bubble, setBubble] = useState<string | null>(null);
  const [isRoaming, setIsRoaming] = useState<boolean>(false);

  const emotionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roamIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roamStepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSurprise = useRef(0);
  const lastHintAt = useRef(0);
  const seenHints = useRef(new Set<string>());
  const scrollPos = useRef({ y: 0, t: 0 });
  const isSleepy = useRef(false);
  /* Armed when an enquiry is sent — fires the celebration on flow close. */
  const celebrateOnClose = useRef(false);
  const isRoamingRef = useRef(false);
  const clickTimestamps = useRef<number[]>([]);

  useEffect(() => {
    isRoamingRef.current = isRoaming;
  }, [isRoaming]);

  const clearRoamIdle = useCallback(() => {
    if (roamIdleTimer.current) {
      clearTimeout(roamIdleTimer.current);
      roamIdleTimer.current = null;
    }
  }, []);

  const clearRoamStep = useCallback(() => {
    if (roamStepTimer.current) {
      clearTimeout(roamStepTimer.current);
      roamStepTimer.current = null;
    }
  }, []);

  const cancelRoaming = useCallback(() => {
    clearRoamIdle();
    clearRoamStep();
    if (isRoamingRef.current) {
      isRoamingRef.current = false;
      setIsRoaming(false);
    }
  }, [clearRoamIdle, clearRoamStep]);

  /* ---- Idle arm: sleep after silence ---- */
  const armIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (isRoamingRef.current) return;
    idleTimer.current = setTimeout(() => {
      if (isRoamingRef.current) return;
      isSleepy.current = true;
      setEmotion("sleepy");
    }, IDLE_TIMEOUT_MS);
  }, []);

  const scheduleRoamIdle = useCallback(() => {
    clearRoamIdle();
    if (!shouldAllowRoam()) return;
    if (isRoamingRef.current) return;
    roamIdleTimer.current = setTimeout(() => {
      if (!shouldAllowRoam()) return;
      if (isRoamingRef.current) return;
      isSleepy.current = false;
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
      if (emotionTimer.current) {
        clearTimeout(emotionTimer.current);
        emotionTimer.current = null;
      }
      isRoamingRef.current = true;
      setIsRoaming(true);
      setEmotion("walking");
    }, ROAM_IDLE_MS);
  }, [clearRoamIdle]);

  /* ---- Flash: show emotion then fall back to idle/sleepy ---- */
  const flash = useCallback((next: PikuEmotion, ms: number) => {
    if (emotionTimer.current) clearTimeout(emotionTimer.current);
    // if roaming and flash is not walking, cancel roaming visuals will be handled by wake
    // but allow flash to override walking
    if (isRoamingRef.current && next !== "walking") {
      // keep roaming flag until wake? flash itself should not auto-cancel roaming,
      // but set emotion away from walking
    }
    setEmotion(next);
    emotionTimer.current = setTimeout(() => {
      if (isRoamingRef.current) {
        setEmotion("walking");
        return;
      }
      setEmotion(isSleepy.current ? "sleepy" : "idle");
    }, ms);
  }, []);

  /* ---- Say: bubble with auto-hide ---- */
  const say = useCallback((text: string) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubble(text);
    bubbleTimer.current = setTimeout(() => setBubble(null), BUBBLE_MS);
  }, []);

  /* ---- Greeting wave shortly after mount ---- */
  useEffect(() => {
    let revert: ReturnType<typeof setTimeout> | null = null;
    const t = setTimeout(() => {
      setEmotion("wave");
      say(GREETING);
      revert = setTimeout(() => setEmotion(isRoamingRef.current ? "walking" : "idle"), 2_600);
    }, 1_200);
    return () => {
      clearTimeout(t);
      if (revert) clearTimeout(revert);
    };
  }, [say]);

  /* ---- Click / tap entry point (called from piku.tsx) ---- */
  const interact = useCallback(() => {
    const wasRoaming = isRoamingRef.current;
    if (wasRoaming) {
      cancelRoaming();
    }
    isSleepy.current = false;
    armIdle();
    scheduleRoamIdle();

    const now = Date.now();
    clickTimestamps.current.push(now);
    clickTimestamps.current = clickTimestamps.current.filter(
      (t) => now - t < 1500,
    );

    if (clickTimestamps.current.length >= 4) {
      clickTimestamps.current = [];
      flash("nervous", 2_500);
      say(pickRandom(NERVOUS_QUIPS));
      return;
    }

    const roll = Math.random();
    if (roll < 0.25) {
      flash("excited", 1_800);
      say(pickRandom(EXCITED_QUIPS));
    } else if (roll < 0.45) {
      flash("thinking", 2_200);
      say(pickRandom(THINKING_QUIPS));
    } else if (roll < 0.6) {
      flash("proud", 2_000);
      say(pickRandom(PROUD_QUIPS));
    } else {
      flash("happy", 1_700);
      say(pickRandom(CLICK_QUIPS));
    }
  }, [armIdle, flash, say, cancelRoaming, scheduleRoamIdle]);

  /* ---- Global listeners: wake, scroll, cursor, hover, focus, catalog ---- */
  useEffect(() => {
    armIdle();
    scheduleRoamIdle();

    const wake = () => {
      const wasRoaming = isRoamingRef.current;
      if (wasRoaming) {
        cancelRoaming();
        // snap back to idle unless sleepy logic will handle
        setEmotion("idle");
      }
      if (isSleepy.current) {
        isSleepy.current = false;
        flash("curious", 900);
      }
      armIdle();
      scheduleRoamIdle();
    };

    const onScroll = () => {
      const wasRoaming = isRoamingRef.current;
      if (wasRoaming) {
        cancelRoaming();
        setEmotion("idle");
      }
      wake();
      const now = Date.now();
      const prev = scrollPos.current;
      const delta = Math.abs(window.scrollY - prev.y);
      const dt = Math.max(now - prev.t, 1);
      const speed = prev.t !== 0 ? delta / dt : 0;

      // Softened surprise: keep 550 / 400ms gate but add speed gate to reduce false positives
      if (
        prev.t !== 0 &&
        now - prev.t < 400 &&
        delta > 550 &&
        speed > 1.2 &&
        now - lastSurprise.current > SCROLL_SURPRISE_COOLDOWN_MS
      ) {
        lastSurprise.current = now;
        flash("surprised", 1_300);
        say("Whoa — that was fast! Let's slow down for the good gifts.");
      } else if (
        speed > 3 &&
        now - lastSurprise.current > SCROLL_SURPRISE_COOLDOWN_MS * 2
      ) {
        // Very fast fling → excited with longer cooldown so it doesn't compete
        lastSurprise.current = now;
        flash("excited", 1_500);
        say(pickRandom(EXCITED_QUIPS));
      }

      // Bottom of page → quiet celebration
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - SCROLL_BOTTOM_THRESHOLD;
      if (
        atBottom &&
        now - lastSurprise.current > SCROLL_SURPRISE_COOLDOWN_MS * 2
      ) {
        lastSurprise.current = now;
        flash("excited", 2_000);
        say(pickRandom(SCROLL_BOTTOM_QUIPS));
      }

      scrollPos.current = { y: window.scrollY, t: now };
    };

    /* ---- Organic cursor approach: velocity deadzone + soft cooldown ---- */
    let lastCursorTime = 0;
    let lastCursorX = 0;
    let lastCursorY = 0;

    const onMouseMove = (e: MouseEvent) => {
      // Disable approach curiosity on touch / small screens
      if (window.innerWidth < 768) return;
      const now = Date.now();
      if (now - lastCursorTime < 48) return; // throttle ~20fps for this detector

      const dt = Math.max(now - lastCursorTime, 1);
      const vx = (e.clientX - lastCursorX) / dt;
      const vy = (e.clientY - lastCursorY) / dt;
      const speed = Math.sqrt(vx * vx + vy * vy);
      // Velocity deadzone: ignore tiny drifts
      if (speed < 0.45) {
        lastCursorTime = now;
        lastCursorX = e.clientX;
        lastCursorY = e.clientY;
        return;
      }

      // wake on significant mouse move cancels roaming
      if (isRoamingRef.current) {
        cancelRoaming();
        setEmotion("idle");
        armIdle();
        scheduleRoamIdle();
        // still update cursor tracking then return to avoid double flash
      } else {
        // still re-arm roam idle on activity
        armIdle();
        scheduleRoamIdle();
      }

      lastCursorTime = now;
      lastCursorX = e.clientX;
      lastCursorY = e.clientY;

      const pikuX = window.innerWidth - 76;
      const pikuY = window.innerHeight - 76;
      const toPikuX = pikuX - e.clientX;
      const toPikuY = pikuY - e.clientY;
      const dot = toPikuX * vx + toPikuY * vy;

      if (
        dot > 200 &&
        speed > 0.9 &&
        now - lastSurprise.current > SCROLL_SURPRISE_COOLDOWN_MS
      ) {
        lastSurprise.current = now;
        flash("curious", 1_500);
        say("Need help picking a gift? I'm here!");
      }
    };

    const onPointerDownWake = () => {
      const wasRoaming = isRoamingRef.current;
      if (wasRoaming) {
        cancelRoaming();
        setEmotion("idle");
      }
      wake();
    };

    const onKeyDownWake = () => {
      const wasRoaming = isRoamingRef.current;
      if (wasRoaming) {
        cancelRoaming();
        setEmotion("idle");
      }
      wake();
    };

    const onPikuMouseEnter = () => {
      if (longHoverTimer.current) clearTimeout(longHoverTimer.current);
      longHoverTimer.current = setTimeout(() => {
        // Only wave if still hovering and not already emoting strongly
        flash("wave", 2_000);
        say(pickRandom(LONG_HOVER_QUIPS));
      }, LONG_HOVER_MS);
    };

    const onPikuMouseLeave = () => {
      if (longHoverTimer.current) clearTimeout(longHoverTimer.current);
    };

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT"
      ) {
        // Quiet, not intrusive — thinking with slight delay so tabbing doesn't spam
        flash("thinking", 2_000);
        say("Great choice — tell us about the recipient.");
      }
    };

    const onCatalogOpen = () => {
      flash("excited", 2_000);
      say("Our corporate catalog — let's browse premium picks together!");
    };

    /* ---- Concierge shared emotions: no bubbles, the modal covers them — */
    const onConciergeOpen = () => {
      flash("happy", 1_700);
    };
    /* The glance: hovering the entry CTA — curious, gaze handled in piku. */
    const onGlance = () => {
      flash("curious", 2_500);
    };
    const onEnquirySent = () => {
      celebrateOnClose.current = true;
    };
    const onConciergeClosed = () => {
      if (!celebrateOnClose.current) return;
      celebrateOnClose.current = false;
      flash("excited", 2_200);
      say("Your brief is in — let's celebrate!");
      window.dispatchEvent(new CustomEvent(PIKU_CELEBRATE_EVENT));
    };

    window.addEventListener("pointerdown", onPointerDownWake, { passive: true });
    window.addEventListener("keydown", onKeyDownWake);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    window.addEventListener(OPEN_CATALOG_EVENT, onCatalogOpen as EventListener);
    window.addEventListener(OPEN_PIKU_EVENT, onConciergeOpen);
    window.addEventListener(PIKU_GLANCE_EVENT, onGlance);
    window.addEventListener(PIKU_ENQUIRY_SENT_EVENT, onEnquirySent);
    window.addEventListener(PIKU_CONCIERGE_CLOSED_EVENT, onConciergeClosed);

    const pikuBtn = document.querySelector(".piku-btn");
    if (pikuBtn) {
      pikuBtn.addEventListener("mouseenter", onPikuMouseEnter);
      pikuBtn.addEventListener("mouseleave", onPikuMouseLeave);
    }

    return () => {
      window.removeEventListener("pointerdown", onPointerDownWake);
      window.removeEventListener("keydown", onKeyDownWake);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener(OPEN_CATALOG_EVENT, onCatalogOpen as EventListener);
      window.removeEventListener(OPEN_PIKU_EVENT, onConciergeOpen);
      window.removeEventListener(PIKU_GLANCE_EVENT, onGlance);
      window.removeEventListener(PIKU_ENQUIRY_SENT_EVENT, onEnquirySent);
      window.removeEventListener(PIKU_CONCIERGE_CLOSED_EVENT, onConciergeClosed);
      if (pikuBtn) {
        pikuBtn.removeEventListener("mouseenter", onPikuMouseEnter);
        pikuBtn.removeEventListener("mouseleave", onPikuMouseLeave);
      }
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (emotionTimer.current) clearTimeout(emotionTimer.current);
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      if (longHoverTimer.current) clearTimeout(longHoverTimer.current);
      if (roamIdleTimer.current) clearTimeout(roamIdleTimer.current);
      if (roamStepTimer.current) clearTimeout(roamStepTimer.current);
    };
  }, [armIdle, flash, say, scheduleRoamIdle, cancelRoaming]);

  /* ---- Contextual hints via landmarks ---- */
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-piku]"),
    );
    if (targets.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const now = Date.now();
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const key = (entry.target as HTMLElement).dataset.piku ?? "";
          const hint = HINTS[key];
          if (
            !hint ||
            seenHints.current.has(key) ||
            now - lastHintAt.current < HINT_COOLDOWN_MS
          )
            continue;
          seenHints.current.add(key);
          lastHintAt.current = now;
          flash("curious", BUBBLE_MS);
          say(hint);
        }
      },
      { threshold: 0.2 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [flash, say]);

  /* ---- Wandering between anchors (desktop only) - disabled while roaming ---- */
  useEffect(() => {
    if (isRoaming) return;
    const id = setInterval(() => {
      if (typeof window === "undefined" || window.innerWidth < 768) return;
      if (isRoamingRef.current) return;
      if (!shouldAllowRoam()) return;
      setAnchor((prev) => pickRandom(ANCHORS, prev));
    }, MOVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isRoaming]);

  /* ---- Roaming patrol: faster steps while walking ---- */
  useEffect(() => {
    if (!isRoaming) return;
    if (!shouldAllowRoam()) {
      setIsRoaming(false);
      isRoamingRef.current = false;
      return;
    }
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      if (cancelled) return;
      const jitter = Math.random() * 800 - 400;
      const delay = ROAM_STEP_MS + jitter;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        if (!isRoamingRef.current) return;
        if (!shouldAllowRoam()) {
          isRoamingRef.current = false;
          setIsRoaming(false);
          return;
        }
        setAnchor((prev) => pickRandom(ANCHORS, prev));
        scheduleNext();
      }, delay);
      roamStepTimer.current = timeoutId;
    };

    scheduleNext();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (roamStepTimer.current) {
        clearTimeout(roamStepTimer.current);
        roamStepTimer.current = null;
      }
    };
  }, [isRoaming]);

  return { emotion, anchor, bubble, interact: interact as () => void, isRoaming };
}
