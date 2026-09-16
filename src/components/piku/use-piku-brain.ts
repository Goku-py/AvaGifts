"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PIKU_CELEBRATE_EVENT,
  PIKU_CONCIERGE_CLOSED_EVENT,
  PIKU_CONCIERGE_OPENED_EVENT,
  PIKU_CONCIERGE_STEP_EVENT,
  PIKU_ENQUIRY_SENT_EVENT,
  PIKU_FORM_ERROR_EVENT,
  PIKU_FORM_VALID_EVENT,
  PIKU_GAME_COMPLETED_EVENT,
  PIKU_GAME_EXITED_EVENT,
  PIKU_GAME_HIT_EVENT,
  PIKU_GAME_MILESTONE_EVENT,
  PIKU_GAME_OPENED_EVENT,
  PIKU_GAME_STARTED_EVENT,
  PIKU_GLANCE_EVENT,
  OPEN_CATALOG_EVENT,
  type PikuConciergeStepDetail,
} from "@/lib/events";
import { OPEN_PIKU_EVENT } from "@/lib/piku-concierge";
import {
  PIKU_DIALOGUE,
  PIKU_PRIORITY,
  type PikuDialogueEntry,
  type PikuDialogueKey,
  type PikuEmotion,
} from "./piku-dialogue";

/* ------------------------------------------------------------------ *
 * Piku Brain 2.0 — the single source of Piku's behaviour.
 *
 * Pipeline: EVENT → normalize → priority → cooldown → emotion →
 * dialogue → animate → return to idle.
 *
 * One brain, one bus. Everything Piku does — greeting, clicks, cursor,
 * hover, scroll, hints, forms, connectivity, concierge steps, game beats,
 * sleep/wake — is scheduled through `fire()`, which enforces priority
 * tiers, per-event cooldowns, session limits, probability rolls, global
 * speech spacing, duplicate-message avoidance and hidden-tab suppression.
 * The dialogue library lives in ./piku-dialogue (phase 29).
 * ------------------------------------------------------------------ */

export type { PikuEmotion };
export type PikuAnchor = { right: number; bottom: number };

/* Piku holds one corner. His anchor is handed to the widget as CSS vars. */
const ANCHOR: PikuAnchor = { right: 28, bottom: 28 };

const IDLE_TIMEOUT_MS = 35_000; // sleepy after ~35s of silence (phase 19)
const BUBBLE_MS = 4_800;
const GLOBAL_SPEAK_COOLDOWN_MS = 6_000; // never chatter every few seconds
const RECENT_MESSAGE_MEMORY = 8;
const WAKE_SECOND_BEAT_MS = 420;
const HOVER_WAVE_DELAY_MS = 1_800; // hover 1.5–2s → possible wave (phase 12)
const HINT_GAP_MS = 15_000; // spacing when several sections scroll past
const SCROLL_BOTTOM_THRESHOLD = 200;
const CLICK_BURST_WINDOW_MS = 1_500;
const CLICK_BURST_LIMIT = 4;
const CLICK_RESET_GAP_MS = 4_000;

/* Session-scoped memory. sessionStorage (not localStorage) so a fresh
   session gets a fresh hello; try/catch keeps private mode harmless. */
const SS_GREETED = "piku:greeted";
const SS_WELCOMED = "piku:welcomed";
const SS_INTERACTED = "piku:interacted";

function sessionGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionSet(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable — behaviour degrades to always-greet */
  }
}

/** Concierge step id → dialogue entry (phase 20). Unmapped = silence. */
const CONCIERGE_STEP_KEYS: Record<string, PikuDialogueKey> = {
  occasion: "concierge_step_occasion",
  feeling: "concierge_step_feeling",
  "gift-style": "concierge_step_style",
  "details-budget": "concierge_step_budget",
  confirm: "concierge_step_confirm",
};

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */
export function usePikuBrain() {
  const [emotion, setEmotion] = useState<PikuEmotion>("idle");
  const [bubble, setBubble] = useState<string | null>(null);

  /* Scheduler state */
  const activeUntil = useRef(0);
  const activePriority = useRef(0);
  const lastFired = useRef(new Map<PikuDialogueKey, number>());
  const sessionCounts = useRef(new Map<PikuDialogueKey, number>());
  const lastSpokeAt = useRef(0);
  const bubbleVisible = useRef(false);
  const recentMessages = useRef<string[]>([]);

  /* Reaction / idle timers */
  const emotionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Behaviour state */
  const isSleepy = useRef(false);
  const celebrateOnClose = useRef(false);
  const clickTimestamps = useRef<number[]>([]);
  const clickCount = useRef(0);
  const lastClickAt = useRef(0);
  const lastHintAt = useRef(0);
  const scrollPos = useRef({ y: 0, t: 0 });

  /* ---- Settle: show an emotion, then fall back to sleepy/idle ---- */
  const settle = useCallback((next: PikuEmotion, ms: number) => {
    if (emotionTimer.current) clearTimeout(emotionTimer.current);
    setEmotion(next);
    emotionTimer.current = setTimeout(() => {
      activeUntil.current = 0;
      activePriority.current = 0;
      setEmotion(isSleepy.current ? "sleepy" : "idle");
    }, ms);
  }, []);

  /* ---- Speak: one bubble, spaced out, never the same line twice ---- */
  const speak = useCallback(
    (messages: readonly string[], bypassGlobalCooldown?: boolean) => {
      const now = Date.now();
      if (
        !bypassGlobalCooldown &&
        (bubbleVisible.current ||
          now - lastSpokeAt.current < GLOBAL_SPEAK_COOLDOWN_MS)
      ) {
        return;
      }
      const recent = recentMessages.current;
      let pool = messages.filter((m) => !recent.includes(m));
      if (pool.length === 0) pool = [...messages];
      const text = pool[Math.floor(Math.random() * pool.length)]!;
      recentMessages.current = [...recent, text].slice(
        -RECENT_MESSAGE_MEMORY,
      );
      lastSpokeAt.current = now;
      setBubble(text);
      bubbleVisible.current = true;
      if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
      bubbleTimer.current = setTimeout(() => {
        bubbleVisible.current = false;
        setBubble(null);
      }, BUBBLE_MS);
    },
    [],
  );

  /* ---- fire(): the only door into an emotion + dialogue ---- */
  const fire = useCallback(
    (key: PikuDialogueKey) => {
      const entry: PikuDialogueEntry = PIKU_DIALOGUE[key];
      const now = Date.now();

      /* Hidden tabs: no reactions at all (phase 18). */
      if (document.visibilityState === "hidden") return;
      /* A low-priority beat never interrupts a meaningful one. */
      if (
        now < activeUntil.current &&
        PIKU_PRIORITY[entry.priority] <= activePriority.current
      )
        return;
      /* Per-event cooldown. */
      const last = lastFired.current.get(key) ?? 0;
      if (entry.cooldownMs !== undefined && now - last < entry.cooldownMs)
        return;
      /* Session limit (section hints, greeting…). */
      const used = sessionCounts.current.get(key) ?? 0;
      if (entry.sessionLimit !== undefined && used >= entry.sessionLimit)
        return;
      /* Probability — a failed roll costs nothing. */
      if (entry.probability !== undefined && Math.random() > entry.probability)
        return;

      lastFired.current.set(key, now);
      if (entry.sessionLimit !== undefined)
        sessionCounts.current.set(key, used + 1);
      activeUntil.current = now + entry.durationMs;
      activePriority.current = PIKU_PRIORITY[entry.priority];
      settle(entry.emotion, entry.durationMs);
      if (entry.messages.length > 0) speak(entry.messages, entry.bypassGlobalCooldown);
    },
    [settle, speak],
  );

  /* ---- Idle arm: drift off after silence ---- */
  const armIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      isSleepy.current = true;
      setEmotion("sleepy");
      fire("sleepy_quip");
    }, IDLE_TIMEOUT_MS);
  }, [fire]);

  /* ---- Wake: surprised flash → happy beat (phases 19). Rare speech. ---- */
  const wakeUp = useCallback(() => {
    armIdle();
    if (!isSleepy.current) return;
    isSleepy.current = false;
    fire("wake_flash");
    if (wakeTimer.current) clearTimeout(wakeTimer.current);
    wakeTimer.current = setTimeout(() => fire("wake_happy"), WAKE_SECOND_BEAT_MS);
  }, [armIdle, fire]);

  /* poke(): pure activity (pointer/keydown/visibility) — no click cadence. */
  const poke = wakeUp;

  /* ---- Click cadence (phase 13): 1st happy → 2nd curious → rapid nervous ---- */
  const interact = useCallback(() => {
    wakeUp();
    sessionSet(SS_INTERACTED, "1");

    const now = Date.now();
    clickTimestamps.current.push(now);
    clickTimestamps.current = clickTimestamps.current.filter(
      (t) => now - t < CLICK_BURST_WINDOW_MS,
    );
    if (clickTimestamps.current.length >= CLICK_BURST_LIMIT) {
      clickTimestamps.current = [];
      clickCount.current = 0;
      /*
       * A burst is a deliberate cue. The earlier clicks in this same burst
       * already latched an active high-priority beat, and equal priorities
       * never interrupt each other — so without clearing the window the
       * nervous reaction could never actually surface.
       */
      activeUntil.current = 0;
      activePriority.current = 0;
      fire("click_rapid");
      return;
    }

    if (now - lastClickAt.current > CLICK_RESET_GAP_MS) clickCount.current = 0;
    lastClickAt.current = now;
    clickCount.current += 1;

    if (clickCount.current === 1) fire("click_first");
    else if (clickCount.current === 2) fire("click_second");
    else fire(Math.random() < 0.5 ? "click_first" : "click_second");
  }, [fire, wakeUp]);

  /* ---- Hover: component-level handlers (phase 12) ---- */
  const hoverHandlers = useMemo(
    () => ({
      onPointerEnter: () => {
        poke();
        fire("hover_notice");
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(
          () => fire("hover_wave"),
          HOVER_WAVE_DELAY_MS,
        );
      },
      onPointerLeave: () => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current);
      },
    }),
    [fire, poke],
  );

  /* ---- Greeting: once per session, welcome-back once after that ---- */
  useEffect(() => {
    const t = setTimeout(() => {
      if (sessionGet(SS_GREETED) === null) {
        sessionSet(SS_GREETED, "1");
        fire("greeting");
        return;
      }
      if (
        sessionGet(SS_INTERACTED) !== null &&
        sessionGet(SS_WELCOMED) === null
      ) {
        sessionSet(SS_WELCOMED, "1");
        fire("welcome_back");
      }
    }, 1_200);
    return () => clearTimeout(t);
  }, [fire]);

  /* ---- Global event bus + environment listeners ---- */
  useEffect(() => {
    armIdle();

    const onActivity = () => poke();

    const onScroll = () => {
      poke();
      const now = Date.now();
      const prev = scrollPos.current;
      const delta = Math.abs(window.scrollY - prev.y);
      const dt = Math.max(now - prev.t, 1);
      const speed = prev.t !== 0 ? delta / dt : 0;

      if (prev.t !== 0 && now - prev.t < 400 && delta > 550 && speed > 1.2) {
        fire("scroll_fast");
      }

      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - SCROLL_BOTTOM_THRESHOLD;
      if (atBottom && delta > 0) fire("scroll_bottom");

      scrollPos.current = { y: window.scrollY, t: now };
    };

    /* Cursor approach (phase 11): desktop only, throttled, deadzoned. */
    let lastCursorTime = 0;
    let lastCursorX = 0;
    let lastCursorY = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
      const now = Date.now();
      if (now - lastCursorTime < 48) return;

      const dt = Math.max(now - lastCursorTime, 1);
      const vx = (e.clientX - lastCursorX) / dt;
      const vy = (e.clientY - lastCursorY) / dt;
      const speed = Math.sqrt(vx * vx + vy * vy);

      lastCursorTime = now;
      lastCursorX = e.clientX;
      lastCursorY = e.clientY;
      if (speed < 0.45) return;

      poke();

      const pikuX = window.innerWidth - 76;
      const pikuY = window.innerHeight - 76;
      const dot = (pikuX - e.clientX) * vx + (pikuY - e.clientY) * vy;
      if (dot > 200 && speed > 0.9) fire("cursor_notice");
    };

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT"
      ) {
        poke();
        fire("form_focus");
      }
    };

    /* Connectivity (phase 17). */
    const onOffline = () => fire("offline");
    const onOnline = () => fire("online");

    /* Hidden tab: stop the sleep countdown; resume on return, no drama. */
    const onVisibility = () => {
      if (document.visibilityState === "visible") armIdle();
      else if (idleTimer.current) clearTimeout(idleTimer.current);
    };

    const onCatalogOpen = () => fire("catalog_open");
    const onConciergeOpen = () => fire("concierge_open");

    /* Concierge steps (phase 20) — one beat per stage, silence is fine. */
    const onConciergeStep = (e: Event) => {
      const step = (e as CustomEvent<PikuConciergeStepDetail>).detail?.step ?? "";
      const key =
        CONCIERGE_STEP_KEYS[step] ??
        (step.startsWith("details-") ? "concierge_step_details" : null);
      if (key) fire(key);
    };

    /* Enquiry flow (phase 16/20): sent → excited; closed after success →
       celebrate + hearts (PIKU_CELEBRATE_EVENT is the launcher's cue). */
    const onEnquirySent = () => {
      celebrateOnClose.current = true;
      fire("enquiry_sent");
    };
    const onConciergeClosed = () => {
      if (!celebrateOnClose.current) {
        fire("concierge_close");
        return;
      }
      celebrateOnClose.current = false;
      fire("enquiry_success");
      window.dispatchEvent(new CustomEvent(PIKU_CELEBRATE_EVENT));
    };

    /* Field-level form intelligence (phase 16). */
    const onFormValid = () => fire("form_valid");
    const onFormError = () => fire("form_error");

    /* Runner beats (phase 22). */
    const onGameOpened = () => fire("game_opened");
    const onGameStarted = () => fire("game_started");
    const onGameHit = () => fire("game_hit");
    const onGameMilestone = () => fire("game_milestone");
    const onGameCompleted = () => fire("game_completed");
    const onGameExited = () => fire("game_exited");

    /* Glance (CTA hover): silent surprised pre-beat, then curious gaze. */
    const onGlance = () => {
      settle("surprised", 400);
      if (glanceTimer.current) clearTimeout(glanceTimer.current);
      glanceTimer.current = setTimeout(() => fire("glance"), 420);
    };

    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(OPEN_CATALOG_EVENT, onCatalogOpen as EventListener);
    window.addEventListener(OPEN_PIKU_EVENT, onConciergeOpen);
    window.addEventListener(
      PIKU_CONCIERGE_OPENED_EVENT,
      onConciergeOpen as EventListener,
    );
    window.addEventListener(PIKU_CONCIERGE_STEP_EVENT, onConciergeStep);
    window.addEventListener(PIKU_ENQUIRY_SENT_EVENT, onEnquirySent);
    window.addEventListener(PIKU_CONCIERGE_CLOSED_EVENT, onConciergeClosed);
    window.addEventListener(PIKU_FORM_VALID_EVENT, onFormValid);
    window.addEventListener(PIKU_FORM_ERROR_EVENT, onFormError);
    window.addEventListener(PIKU_GAME_OPENED_EVENT, onGameOpened);
    window.addEventListener(PIKU_GAME_STARTED_EVENT, onGameStarted);
    window.addEventListener(PIKU_GAME_HIT_EVENT, onGameHit);
    window.addEventListener(PIKU_GAME_MILESTONE_EVENT, onGameMilestone);
    window.addEventListener(PIKU_GAME_COMPLETED_EVENT, onGameCompleted);
    window.addEventListener(PIKU_GAME_EXITED_EVENT, onGameExited);
    window.addEventListener(PIKU_GLANCE_EVENT, onGlance);

    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(OPEN_CATALOG_EVENT, onCatalogOpen as EventListener);
      window.removeEventListener(OPEN_PIKU_EVENT, onConciergeOpen);
      window.removeEventListener(
        PIKU_CONCIERGE_OPENED_EVENT,
        onConciergeOpen as EventListener,
      );
      window.removeEventListener(PIKU_CONCIERGE_STEP_EVENT, onConciergeStep);
      window.removeEventListener(PIKU_ENQUIRY_SENT_EVENT, onEnquirySent);
      window.removeEventListener(PIKU_CONCIERGE_CLOSED_EVENT, onConciergeClosed);
      window.removeEventListener(PIKU_FORM_VALID_EVENT, onFormValid);
      window.removeEventListener(PIKU_FORM_ERROR_EVENT, onFormError);
      window.removeEventListener(PIKU_GAME_OPENED_EVENT, onGameOpened);
      window.removeEventListener(PIKU_GAME_STARTED_EVENT, onGameStarted);
      window.removeEventListener(PIKU_GAME_HIT_EVENT, onGameHit);
      window.removeEventListener(PIKU_GAME_MILESTONE_EVENT, onGameMilestone);
      window.removeEventListener(PIKU_GAME_COMPLETED_EVENT, onGameCompleted);
      window.removeEventListener(PIKU_GAME_EXITED_EVENT, onGameExited);
      window.removeEventListener(PIKU_GLANCE_EVENT, onGlance);
    };
  }, [armIdle, fire, poke, settle]);

  /* ---- Unmount: leave no timer behind ---- */
  useEffect(
    () => () => {
      [
        emotionTimer,
        bubbleTimer,
        idleTimer,
        wakeTimer,
        hoverTimer,
        glanceTimer,
      ].forEach((ref) => {
        if (ref.current) clearTimeout(ref.current);
      });
    },
    [],
  );

  /* ---- Section hints: once per section per session (phase 15) ---- */
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
          const section = (entry.target as HTMLElement).dataset.piku ?? "";
          const key = `hint_${section}` as PikuDialogueKey;
          if (!(key in PIKU_DIALOGUE)) continue;
          if (now - lastHintAt.current < HINT_GAP_MS) continue;
          lastHintAt.current = now;
          fire(key);
        }
      },
      { threshold: 0.2 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [fire]);

  return {
    emotion,
    anchor: ANCHOR,
    bubble,
    interact: interact as () => void,
    poke: poke as () => void,
    hoverHandlers,
  };
}
