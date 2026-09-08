"use client";

/*
 * <Piku /> — flat 2D mascot (Duolingo-style penguin)
 * ONE centralized RAF writes continuous CSS vars onto .piku-btn.
 * Discrete interactions (hover, squash, burst) are CSS classes/transitions.
 * Organic gaze: inertia + spring-damper, deadzone, dampened prediction,
 * emotion-synced micro-saccade + world-stable pupils.
 */

import "./piku.css";
import { usePikuBrain } from "./use-piku-brain";
import { PikuSprite } from "./piku-sprite";
import {
  PIKU_CELEBRATE_EVENT,
  PIKU_GLANCE_END_EVENT,
  PIKU_GLANCE_EVENT,
  type PikuGlanceDetail,
} from "@/lib/events";
import { useCallback, useEffect, useRef, useState } from "react";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    } else {
      // @ts-ignore legacy
      mql.addListener(update);
      return () => {
        // @ts-ignore legacy
        mql.removeListener(update);
      };
    }
  }, []);
  return reduced;
}

function useIsCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mql.matches);
    update();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    } else {
      // @ts-ignore legacy
      mql.addListener(update);
      return () => {
        // @ts-ignore legacy
        mql.removeListener(update);
      };
    }
  }, []);
  return coarse;
}

export type PikuProps = Record<string, never>;

export function Piku(_props: PikuProps = {}) {
  const { emotion, anchor, bubble, interact, isRoaming } = usePikuBrain();

  const prefersReduced = useReducedMotion();
  const isCoarse = useIsCoarsePointer();

  const [isHovering, setIsHovering] = useState(false);
  const [clickPhase, setClickPhase] = useState<"idle" | "squash" | "bounce" | "burst">("idle");
  const [burstPositions, setBurstPositions] = useState<Array<{ x: number; y: number; r: number }>>([]);
  const [btnEl, setBtnEl] = useState<HTMLButtonElement | null>(null);
  const [isWaking, setIsWaking] = useState(false);

  const targetRot = useRef({ rx: 0, ry: 0, rz: 0 });
  const currentRot = useRef({ rx: 0, ry: 0, rz: 0 });
  const targetPupil = useRef({ x: 0, y: 0 });
  const currentPupil = useRef({ x: 0, y: 0 });

  const breathPhase = useRef(Math.random() * Math.PI * 2);
  const swayPhase = useRef(Math.random() * Math.PI * 2);
  const scarfLag = useRef({ rx: 0, ry: 0 });

  const prevCursorPos = useRef({ x: 0, y: 0 });
  const cursorVel = useRef({ x: 0, y: 0 });
  const cursorNorm = useRef({ x: 0, y: 0 });

  const scrollVel = useRef(0);
  const prevScrollY = useRef(0);

  const clickTimestamps = useRef<number[]>([]);
  const burstKind = useRef<"heart" | "star">("heart");
  /* The glance: external gaze-bias target (entry CTA hover) + blend weight. */
  const glanceTarget = useRef<{ x: number; y: number } | null>(null);
  const glanceWeight = useRef(0);

  const nextBlinkAt = useRef(performance.now() + 2500 + Math.random() * 2000);
  const blinkUntil = useRef(0);
  const dartTimer = useRef(0);
  const dartOffset = useRef({ x: 0, y: 0 });
  const dartUntil = useRef(0);
  const surpriseUntil = useRef(0);
  const prevEmotionForScale = useRef(emotion);

  // walking refs
  const walkPhase = useRef(Math.random() * Math.PI * 0.5);
  const walkDir = useRef(1);
  const prevAnchor = useRef(anchor);
  const wakingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emotionRef = useRef(emotion);
  useEffect(() => {
    emotionRef.current = emotion;
  }, [emotion]);
  const isHoveringRef = useRef(isHovering);
  useEffect(() => {
    isHoveringRef.current = isHovering;
  }, [isHovering]);
  const isRoamingRef = useRef(isRoaming);
  useEffect(() => {
    isRoamingRef.current = isRoaming;
  }, [isRoaming]);
  const anchorRef = useRef(anchor);
  useEffect(() => {
    anchorRef.current = anchor;
  }, [anchor]);
  const prefersReducedRef = useRef(prefersReduced);
  useEffect(() => {
    prefersReducedRef.current = prefersReduced;
  }, [prefersReduced]);
  const isCoarseRef = useRef(isCoarse);
  useEffect(() => {
    isCoarseRef.current = isCoarse;
  }, [isCoarse]);

  // detect anchor direction change for walkDir
  useEffect(() => {
    const cur = anchor;
    const prev = prevAnchor.current;
    if (cur.right !== prev.right || cur.bottom !== prev.bottom) {
      walkDir.current = cur.right > prev.right ? 1 : -1;
      prevAnchor.current = { ...cur };
    }
  }, [anchor]);

  // scroll wake visual: when walking and scroll occurs, hop
  useEffect(() => {
    const onScrollWake = () => {
      const y = window.scrollY;
      const delta = y - prevScrollY.current;
      if (
        isRoamingRef.current &&
        Math.abs(delta) > 2 &&
        !prefersReducedRef.current &&
        window.innerWidth >= 768 &&
        !isCoarseRef.current
      ) {
        setIsWaking(true);
        if (wakingTimeout.current) clearTimeout(wakingTimeout.current);
        wakingTimeout.current = setTimeout(() => setIsWaking(false), 600);
      }
    };
    window.addEventListener("scroll", onScrollWake, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScrollWake);
      if (wakingTimeout.current) clearTimeout(wakingTimeout.current);
    };
  }, []);

  useEffect(() => {
    if (!btnEl) return;

    let prevTime = performance.now();
    let rafId = 0;

    const frame = () => {
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.05);
      prevTime = now;

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const hoverFactor = isHoveringRef.current && !isMobile ? 1 : 0;
      const curEmotion = emotionRef.current;
      const roaming = isRoamingRef.current;
      const reduced = prefersReducedRef.current;
      const coarse = isCoarseRef.current;
      const isWalking = (curEmotion === "walking" || roaming) && !isMobile && !reduced && !coarse;

      if (prevEmotionForScale.current !== curEmotion) {
        if (curEmotion === "surprised") surpriseUntil.current = now + 460;
        prevEmotionForScale.current = curEmotion;
      }

      // walking phase advance
      if (isWalking) {
        walkPhase.current += dt * 10.0;
      } else {
        walkPhase.current = lerp(walkPhase.current, 0, 0.12);
      }
      const wPhase = walkPhase.current;
      const hasPhase = isWalking || Math.abs(wPhase) > 0.001;
      const walkBob = hasPhase ? Math.sin(wPhase) * 2.1 : 0;
      const walkStep = hasPhase ? Math.sin(wPhase) * 5.5 : 0;
      const walkSway = hasPhase ? Math.cos(wPhase) * 1.4 : 0;
      const walkLiftL = hasPhase ? Math.max(Math.sin(wPhase), 0) * 3.0 : 0;
      const walkLiftR = hasPhase ? Math.max(Math.sin(wPhase + Math.PI), 0) * 3.0 : 0;
      const walkLift = hasPhase ? Math.max(walkLiftL, walkLiftR) : 0;

      const curAnchor = anchorRef.current;
      const prevA = prevAnchor.current;
      if (curAnchor.right !== prevA.right || curAnchor.bottom !== prevA.bottom) {
        walkDir.current = curAnchor.right > prevA.right ? 1 : -1;
        prevAnchor.current = { ...curAnchor };
      }
      const wDir = walkDir.current;

      const drift = Math.sin(now * 0.00034) * 0.42 + Math.sin(now * 0.00092) * 0.18;
      const breathSpeed = isMobile ? 1.55 : 1.75 + drift;
      const sleepMul = curEmotion === "sleepy" ? 0.62 : 1;
      breathPhase.current += dt * breathSpeed * sleepMul;

      /* Idle breathing + hip sway removed: Piku stays visually stable.
         Phases keep advancing (timing intact); amplitudes are zeroed. */
      const breathSin = Math.sin(breathPhase.current);
      const breathRx = breathSin * 0;
      const breathRz = Math.sin(breathPhase.current * 0.55) * 0;

      swayPhase.current += dt * (isMobile ? 0.62 : 0.84);
      const hipSwayRz = Math.sin(swayPhase.current) * 0;
      const hipSwayRy = Math.cos(swayPhase.current * 0.72) * 0;
      const hipSwayRx = Math.sin(swayPhase.current * 0.52) * 0;

      const isBlinkingNow = now < blinkUntil.current;
      const isSleepy = curEmotion === "sleepy";
      const isThinking = curEmotion === "thinking";
      const isCurious = curEmotion === "curious";
      const isExcited = curEmotion === "excited";
      const isNervous = curEmotion === "nervous";
      const isSurprised = curEmotion === "surprised";

      let dartIntervalMin = 1.6;
      let dartIntervalMax = 3.2;
      let dartMagX = 0.7;
      let dartMagY = 0.55;
      let dartDwellMin = 110;
      let dartDwellMax = 200;
      let allowDart = true;

      if (isSleepy) {
        allowDart = false;
      } else if (isWalking) {
        dartIntervalMin = 2.2;
        dartIntervalMax = 3.6;
        dartMagX = 0.22;
        dartMagY = 0.18;
        dartDwellMin = 160;
        dartDwellMax = 260;
      } else if (isThinking) {
        dartIntervalMin = 1.6;
        dartIntervalMax = 3.2;
        dartMagX = 0.42;
        dartMagY = 0.36;
        dartDwellMin = 140;
        dartDwellMax = 220;
      } else if (isCurious) {
        dartIntervalMin = 0.9;
        dartIntervalMax = 1.6;
        dartMagX = 1.15;
        dartMagY = 0.95;
        dartDwellMin = 110;
        dartDwellMax = 180;
      } else if (isExcited) {
        dartIntervalMin = 0.6;
        dartIntervalMax = 1.0;
        dartMagX = 0.9;
        dartMagY = 0.72;
        dartDwellMin = 70;
        dartDwellMax = 115;
      } else if (isNervous) {
        dartIntervalMin = 0.35;
        dartIntervalMax = 0.75;
        dartMagX = 1.4;
        dartMagY = 1.05;
        dartDwellMin = 65;
        dartDwellMax = 105;
      } else if (isSurprised) {
        dartIntervalMin = 1.1;
        dartIntervalMax = 2.0;
        dartMagX = 0.55;
        dartMagY = 0.45;
        dartDwellMin = 90;
        dartDwellMax = 145;
      } else {
        dartIntervalMin = 1.45;
        dartIntervalMax = 2.85;
        dartMagX = 0.62;
        dartMagY = 0.48;
      }

      dartTimer.current += dt;
      const canDart = allowDart && !isBlinkingNow;

      if (!canDart) {
        if (isSleepy) {
          dartOffset.current.x = lerp(dartOffset.current.x, 0, 0.22);
          dartOffset.current.y = lerp(dartOffset.current.y, 0, 0.22);
          dartTimer.current = 0;
          dartUntil.current = now;
        } else if (isBlinkingNow) {
          dartOffset.current.x = lerp(dartOffset.current.x, dartOffset.current.x * 0.96, 0.18);
          dartOffset.current.y = lerp(dartOffset.current.y, dartOffset.current.y * 0.96, 0.18);
        } else {
          dartOffset.current.x = lerp(dartOffset.current.x, 0, 0.14);
          dartOffset.current.y = lerp(dartOffset.current.y, 0, 0.14);
        }
      } else {
        if (now > dartUntil.current) {
          const threshold = dartIntervalMin + Math.random() * (dartIntervalMax - dartIntervalMin);
          if (dartTimer.current > threshold) {
            dartTimer.current = 0;
            const dx = (Math.random() - 0.5) * dartMagX * 2;
            const dy = (Math.random() - 0.5) * dartMagY * 2;
            dartOffset.current = { x: dx, y: dy };
            dartUntil.current = now + dartDwellMin + Math.random() * (dartDwellMax - dartDwellMin);
          }
        }
      }

      const dartActive = canDart && now < dartUntil.current;
      const dartX = dartActive ? dartOffset.current.x : lerp(dartOffset.current.x, 0, 0.16);
      const dartY = dartActive ? dartOffset.current.y : lerp(dartOffset.current.y, 0, 0.16);
      if (!dartActive) {
        dartOffset.current.x = dartX;
        dartOffset.current.y = dartY;
      }

      if (!isSleepy && now > nextBlinkAt.current) {
        blinkUntil.current = now + 135;
        const willDouble = Math.random() < 0.18;
        const base = 2600 + Math.random() * 2800;
        nextBlinkAt.current = now + base + (willDouble ? 280 : 0);
        btnEl.classList.add("piku-blinking");
        if (willDouble) {
          window.setTimeout(() => {
            blinkUntil.current = performance.now() + 125;
            btnEl.classList.add("piku-blinking");
          }, 220);
        }
      }
      if (now > blinkUntil.current) {
        btnEl.classList.remove("piku-blinking");
      }

      let headLerp = isMobile ? 0.065 : 0.095;
      let pupilLerp = isMobile ? 0.12 : 0.18;
      if (isWalking) {
        pupilLerp *= 0.7;
      }
      if (isBlinkingNow) pupilLerp *= 0.14;
      else if (isThinking) pupilLerp = isMobile ? 0.06 : 0.09;
      else if (isSleepy) pupilLerp = 0.07;
      else if (isNervous) pupilLerp = isMobile ? 0.16 : 0.22;
      else if (isExcited) pupilLerp = isMobile ? 0.14 : 0.21;

      const hoverRy = hoverFactor * 1.1;
      const hoverRx = hoverFactor * -0.9;
      const scrollNudge = clamp(scrollVel.current * 0.16, -1.4, 1.4);

      currentRot.current.rx = lerp(currentRot.current.rx, targetRot.current.rx + hoverRx + scrollNudge + breathRx + hipSwayRx, headLerp);
      currentRot.current.ry = lerp(currentRot.current.ry, targetRot.current.ry + hoverRy + hipSwayRy, headLerp);
      const hoverRz = hoverFactor * 0.6;
      currentRot.current.rz = lerp(currentRot.current.rz, targetRot.current.rz + hipSwayRz + breathRz + hoverRz, isMobile ? 0.07 : 0.095);

      const finalRy = clamp(currentRot.current.ry, -12, 12);
      const finalRx = clamp(currentRot.current.rx, -8, 8);
      const finalRz = clamp(currentRot.current.rz, -6, 6);

      let gazeX = cursorNorm.current.x * 2.15;
      let gazeY = cursorNorm.current.y * 1.95;

      if (isWalking) {
        gazeX += wDir * 0.32;
        gazeY += -0.18;
      }

      if (isSleepy) {
        gazeX = 0;
        gazeY = 0.62;
      } else if (isThinking) {
        gazeY += -1.32;
        gazeX += 0.22;
      } else if (isCurious) {
        gazeX += 0.42;
        gazeY += -0.28;
      } else if (curEmotion === "proud") {
        gazeX += 0.32;
        gazeY += -0.34;
      } else if (curEmotion === "happy") {
        gazeY += -0.18;
      }

      // The glance: ease a bias toward the entry CTA while it is hovered.
      glanceWeight.current = lerp(
        glanceWeight.current,
        glanceTarget.current ? 1 : 0,
        0.08,
      );
      if (glanceTarget.current && glanceWeight.current > 0.01) {
        gazeX += glanceTarget.current.x * glanceWeight.current;
        gazeY += glanceTarget.current.y * glanceWeight.current;
      }

      const compX = clamp(gazeX - finalRy * 0.18, -2.6, 2.6);
      const compY = clamp(gazeY - finalRx * 0.11, -2.45, 2.45);

      let pupTargetX = compX + dartX;
      let pupTargetY = compY + dartY;

      if (isSleepy) {
        pupTargetX = dartX * 0.12;
        pupTargetY = 0.62 + dartY * 0.12;
      }

      pupTargetX = clamp(pupTargetX, -2.72, 2.72);
      pupTargetY = clamp(pupTargetY, -2.58, 2.58);

      if (isSleepy) {
        pupTargetX = lerp(currentPupil.current.x, pupTargetX, 0.08);
        pupTargetY = lerp(currentPupil.current.y, pupTargetY, 0.08);
        currentPupil.current.x = pupTargetX;
        currentPupil.current.y = pupTargetY;
      } else {
        currentPupil.current.x = lerp(currentPupil.current.x, pupTargetX, pupilLerp);
        currentPupil.current.y = lerp(currentPupil.current.y, pupTargetY, pupilLerp);
      }

      scarfLag.current.rx = lerp(scarfLag.current.rx, currentRot.current.rx, 0.04);
      scarfLag.current.ry = lerp(scarfLag.current.ry, currentRot.current.ry, 0.04);

      scrollVel.current *= 0.92;

      const liftProxy = hoverFactor * -0.9;
      const shadowScale = 1 - Math.abs(liftProxy) * 0.012;
      const shadowOpacity = 0.17 + liftProxy * -0.006;

      let pupilScale = 1;
      if (now < surpriseUntil.current) pupilScale = 1.15;
      else if (isExcited) pupilScale = 1 + Math.sin(now * 0.006) * 0.02;
      else if (isSleepy) pupilScale = 0.92;

      btnEl.style.setProperty("--rx", finalRx.toFixed(2));
      btnEl.style.setProperty("--ry", finalRy.toFixed(2));
      btnEl.style.setProperty("--rz", finalRz.toFixed(2));
      btnEl.style.setProperty("--pupil-x", `${currentPupil.current.x.toFixed(2)}px`);
      btnEl.style.setProperty("--pupil-y", `${currentPupil.current.y.toFixed(2)}px`);
      btnEl.style.setProperty("--pupil-scale", pupilScale.toFixed(3));
      btnEl.style.setProperty("--scarf-rx", scarfLag.current.rx.toFixed(2));
      btnEl.style.setProperty("--scarf-ry", scarfLag.current.ry.toFixed(2));
      btnEl.style.setProperty("--tie-rx", scarfLag.current.rx.toFixed(2));
      btnEl.style.setProperty("--tie-ry", scarfLag.current.ry.toFixed(2));
      btnEl.style.setProperty("--shadow-scale-x", shadowScale.toFixed(3));
      btnEl.style.setProperty("--shadow-scale-y", (shadowScale * 0.58).toFixed(3));
      btnEl.style.setProperty("--shadow-opacity", shadowOpacity.toFixed(3));
      // walking vars
      btnEl.style.setProperty("--walk-bob", walkBob.toFixed(2));
      btnEl.style.setProperty("--walk-step", walkStep.toFixed(2));
      btnEl.style.setProperty("--walk-lift", walkLift.toFixed(2));
      btnEl.style.setProperty("--walk-lift-l", walkLiftL.toFixed(2));
      btnEl.style.setProperty("--walk-lift-r", walkLiftR.toFixed(2));
      btnEl.style.setProperty("--walk-sway", walkSway.toFixed(2));
      btnEl.style.setProperty("--walk-dir", String(wDir));
      btnEl.style.setProperty("--walk-phase", wPhase.toFixed(3));

      btnEl.classList.toggle("piku-rotated-left", finalRy < -1.5);
      btnEl.classList.toggle("piku-rotated-right", finalRy > 1.5);

      rafId = requestAnimationFrame(frame);
    };

    btnEl.style.setProperty("--rx", "0");
    btnEl.style.setProperty("--ry", "0");
    btnEl.style.setProperty("--rz", "0");
    btnEl.style.setProperty("--pupil-x", "0px");
    btnEl.style.setProperty("--pupil-y", "0px");
    btnEl.style.setProperty("--pupil-scale", "1");
    btnEl.style.setProperty("--scarf-rx", "0");
    btnEl.style.setProperty("--scarf-ry", "0");
    btnEl.style.setProperty("--tie-rx", "0");
    btnEl.style.setProperty("--tie-ry", "0");
    btnEl.style.setProperty("--shadow-scale-x", "1");
    btnEl.style.setProperty("--shadow-scale-y", "0.58");
    btnEl.style.setProperty("--shadow-opacity", "0.17");
    btnEl.style.setProperty("--walk-bob", "0");
    btnEl.style.setProperty("--walk-step", "0");
    btnEl.style.setProperty("--walk-lift", "0");
    btnEl.style.setProperty("--walk-lift-l", "0");
    btnEl.style.setProperty("--walk-lift-r", "0");
    btnEl.style.setProperty("--walk-sway", "0");
    btnEl.style.setProperty("--walk-dir", "1");
    btnEl.style.setProperty("--walk-phase", "0");

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [btnEl]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!btnEl) return;
      if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;

      const rect = btnEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const halfW = rect.width / 2 || 48;
      const halfH = rect.height / 2 || 52;

      const dx = (e.clientX - cx) / halfW;
      const dy = (e.clientY - cy) / halfH;

      const vx = e.clientX - prevCursorPos.current.x;
      const vy = e.clientY - prevCursorPos.current.y;
      cursorVel.current.x = lerp(cursorVel.current.x, vx, 0.35);
      cursorVel.current.y = lerp(cursorVel.current.y, vy, 0.35);
      prevCursorPos.current = { x: e.clientX, y: e.clientY };

      const predDx = (e.clientX + cursorVel.current.x * 2 - cx) / halfW;
      const predDy = (e.clientY + cursorVel.current.y * 2 - cy) / halfH;

      const blendedDx = dx * 0.7 + predDx * 0.3;
      const blendedDy = dy * 0.7 + predDy * 0.3;

      let effDx = blendedDx;
      let effDy = blendedDy;
      if (Math.abs(blendedDx) < 0.15 && Math.abs(blendedDy) < 0.15) {
        effDx *= 0.35;
        effDy *= 0.35;
      }

      cursorNorm.current.x = clamp(effDx, -2.2, 2.2);
      cursorNorm.current.y = clamp(effDy, -2.2, 2.2);

      const rawRy = effDx * 11;
      const rawRx = -effDy * 9.5;
      const rawRz = effDx * -3.8;

      targetRot.current.rx = clamp(rawRx, -9, 9);
      targetRot.current.ry = clamp(rawRy, -13, 13);
      targetRot.current.rz = clamp(rawRz, -5, 5);

      targetPupil.current.x = clamp(dx * 2.15, -2.6, 2.6);
      targetPupil.current.y = clamp(dy * 1.95, -2.45, 2.45);
    },
    [btnEl],
  );

  const handleMouseLeave = useCallback(() => {
    targetRot.current = { rx: 0, ry: 0, rz: 0 };
    targetPupil.current = { x: 0, y: 0 };
    cursorNorm.current = { x: 0, y: 0 };
    cursorVel.current = { x: 0, y: 0 };
  }, []);

  /* Shared burst sequence: click feedback + the enquiry celebration. */
  const playBurst = useCallback(async (kind: "heart" | "star", count: number) => {
    burstKind.current = kind;

    setClickPhase("squash");
    await new Promise<void>((r) => window.setTimeout(r, 80));
    setClickPhase("bounce");
    await new Promise<void>((r) => window.setTimeout(r, 700));
    setClickPhase("burst");

    const spread = kind === "star" ? 22 : 28;
    const range = kind === "star" ? 22 : 18;
    const bursts: Array<{ x: number; y: number; r: number }> = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.28;
      const dist = spread + Math.random() * range;
      bursts.push({
        x: Math.cos(angle) * dist,
        y: -Math.abs(Math.sin(angle)) * dist - 10,
        r: (Math.random() - 0.5) * 46,
      });
    }
    setBurstPositions(bursts);
    await new Promise<void>((r) => window.setTimeout(r, 900));
    setClickPhase("idle");
    setBurstPositions([]);
    burstKind.current = "heart";
  }, []);

  const handleClick = useCallback(async () => {
    const now = Date.now();
    clickTimestamps.current.push(now);
    clickTimestamps.current = clickTimestamps.current.filter((t) => now - t < 1500);
    const isRapid = clickTimestamps.current.length >= 4;

    if (isRapid) clickTimestamps.current = [];

    interact();

    await playBurst(isRapid ? "star" : "heart", isRapid ? 8 : 5);
  }, [interact, playBurst]);

  /* External glance target + celebration trigger (concierge flow). */
  useEffect(() => {
    const onGlance = (event: Event) => {
      if (prefersReducedRef.current || isCoarseRef.current) return;
      if (typeof window !== "undefined" && window.innerWidth < 768) return;
      const detail = (event as CustomEvent<PikuGlanceDetail>).detail;
      if (!detail || typeof detail.x !== "number" || typeof detail.y !== "number") return;
      glanceTarget.current = {
        x: clamp(detail.x, -2.2, 2.2),
        y: clamp(detail.y, -2.2, 2.2),
      };
    };
    const onGlanceEnd = () => {
      glanceTarget.current = null;
    };
    const onCelebrate = () => {
      void playBurst("heart", 7);
    };
    window.addEventListener(PIKU_GLANCE_EVENT, onGlance);
    window.addEventListener(PIKU_GLANCE_END_EVENT, onGlanceEnd);
    window.addEventListener(PIKU_CELEBRATE_EVENT, onCelebrate);
    return () => {
      window.removeEventListener(PIKU_GLANCE_EVENT, onGlance);
      window.removeEventListener(PIKU_GLANCE_END_EVENT, onGlanceEnd);
      window.removeEventListener(PIKU_CELEBRATE_EVENT, onCelebrate);
    };
  }, [playBurst]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      scrollVel.current = (y - prevScrollY.current) * 0.2;
      prevScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const btnClass = [
    "piku-btn",
    "piku-tracking",
    clickPhase === "squash" && "piku-squashing",
    clickPhase === "bounce" && "piku-bouncing",
    isHovering && "piku-hovering",
    (isRoaming || emotion === "walking") && "piku--walking",
    isRoaming && "piku--roaming",
    isWaking && "piku--waking",
  ]
    .filter(Boolean)
    .join(" ");

  const rootClass = [
    "piku-root",
    (isRoaming || emotion === "walking") && "piku--walking",
    isRoaming && "piku--roaming",
    isWaking && "piku--waking",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      style={{ right: anchor.right, bottom: anchor.bottom }}
    >
      {bubble && (
        <span className="piku-bubble" role="status" aria-live="polite">
          {bubble}
        </span>
      )}

      <button
        ref={setBtnEl}
        type="button"
        className={btnClass}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          handleMouseLeave();
        }}
        onMouseMove={handleMouseMove}
        onFocus={() => setIsHovering(true)}
        onBlur={() => {
          setIsHovering(false);
          handleMouseLeave();
        }}
        aria-label="Piku the penguin — your corporate gifting advisor. Click for a friendly hello."
        title="Piku — your corporate gifting advisor"
      >
        <PikuSprite emotion={emotion} />
      </button>

      {clickPhase === "burst" &&
        burstPositions.map((pos, i) => (
          <span
            key={i}
            className={burstKind.current === "star" ? "piku-star-burst" : "piku-heart-burst"}
            style={
              {
                "--burst-x": `${pos.x}px`,
                "--burst-y": `${pos.y}px`,
                "--burst-r": `${pos.r}deg`,
              } as React.CSSProperties
            }
          />
        ))}
    </div>
  );
}
