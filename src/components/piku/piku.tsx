"use client";

/*
 * <Piku /> — the floating chat launcher.
 *
 * Piku is a rendered image, not a live character. `tools/piku3d/widget_render.py`
 * renders the 3D model to a 24-frame breathing loop and
 * `tools/piku3d/widget_encode.sh` packs it into an animated WebP (~128 KB).
 * The GLB in public/brand/piku stays a source asset — nothing loads it at
 * runtime, so there is no three.js in the bundle and nothing to wait for.
 *
 * He does not move. He used to wander between five corner anchors, patrol on
 * idle and run a RAF walk cycle with leg lift and foot dust; all of that is
 * gone. The only things that animate now are the speech bubble, the click
 * burst, and the breath baked into the image.
 */

import "./piku.css";
import { usePikuBrain } from "./use-piku-brain";
import { PIKU_CELEBRATE_EVENT, PIKU_CONCIERGE_CLOSED_EVENT } from "@/lib/events";
import { usePikuConcierge } from "@/components/piku-concierge/piku-concierge-context";
import { useCallback, useEffect, useRef, useState } from "react";

/* The launcher art is the WebP loop below. The Rive/vector path is fully
   absent — removed together with its dependency — so nothing fetches a
   .riv asset and the WebP loop is the sole runtime art. */

/** 2x renders of the 96x104 CSS box. See tools/piku3d/widget_render.py. */
const PIKU_LOOP = "/brand/piku/piku-idle.webp";
const PIKU_STILL = "/brand/piku/piku-still.webp";

export type PikuProps = Record<string, never>;

export function Piku() {
  const { emotion, anchor, bubble, interact, poke, hoverHandlers } =
    usePikuBrain();
  const { isOpen, openConcierge, closeConcierge } = usePikuConcierge();

  const [burst, setBurst] = useState<Array<{ x: number; y: number; r: number }> | null>(null);
  const burstTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  /* Reduced motion uses the still frame below.
     False on first render so SSR and pre-hydration HTML match. */
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /*
   * Blink — scheduled here, not on a fixed CSS loop: 3–7s randomized gaps
   * so the idle never reads like a metronome. Applied only while the
   * emotion is idle, skipped under reduced motion and while the tab is
   * hidden (nobody is watching a background tab).
   */
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    if (reducedMotion) return;
    let timer: ReturnType<typeof setTimeout>;
    const loop = (delay: number) => {
      timer = setTimeout(() => {
        if (document.visibilityState === "visible") {
          setBlinking(true);
          timer = setTimeout(() => setBlinking(false), 170);
        }
        loop(3000 + Math.random() * 4000);
      }, delay);
    };
    loop(3000 + Math.random() * 4000);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  /*
   * Bubble lifecycle — the brain clears its bubble after the display
   * window, but the card needs a 150ms exit animation. Keep it mounted
   * with .piku-bubble--leaving until that finishes, then drop it. All
   * state lands in timers (never synchronously in the effect body).
   */
  const [bubbleView, setBubbleView] = useState<{ text: string; leaving: boolean } | null>(null);
  useEffect(() => {
    if (bubble) {
      const show = setTimeout(() => setBubbleView({ text: bubble, leaving: false }), 0);
      return () => clearTimeout(show);
    }
    const fade = setTimeout(() => {
      setBubbleView((prev) => (prev && !prev.leaving ? { ...prev, leaving: true } : prev));
    }, 0);
    const drop = setTimeout(() => setBubbleView(null), 150);
    return () => {
      clearTimeout(fade);
      clearTimeout(drop);
    };
  }, [bubble]);

  useEffect(
    () => () => {
      burstTimers.current.forEach(clearTimeout);
    },
    [],
  );

  /* A little puff of hearts. Pure particles — the character itself never
     squashes or bounces. (The old rapid-click star burst is gone: with the
     click now toggling the panel, every fourth click is a close.) */
  const playBurst = useCallback((count: number) => {
    const spread = 28;
    const range = 18;
    const bursts: Array<{ x: number; y: number; r: number }> = [];
    for (let i = 0; i < count; i++) {
      const angle = ((Math.PI * 2) / count) * i + Math.random() * 0.28;
      const dist = spread + Math.random() * range;
      bursts.push({
        x: Math.cos(angle) * dist,
        y: -Math.abs(Math.sin(angle)) * dist - 10,
        r: (Math.random() - 0.5) * 46,
      });
    }
    setBurst(bursts);
    burstTimers.current.push(setTimeout(() => setBurst(null), 900));
  }, []);

  /*
   * Clicking Piku toggles the concierge. He stays put while it is open — the
   * panel sits beside him, the way a floating chat assistant should — so the
   * same target both opens and closes it.
   */
  const handleClick = useCallback(() => {
    interact();
    if (isOpen) {
      closeConcierge();
      return;
    }
    openConcierge();
    playBurst(5);
  }, [interact, isOpen, openConcierge, closeConcierge, playBurst]);

  /* The concierge fires this when an enquiry is sent. */
  useEffect(() => {
    const onCelebrate = () => playBurst(7);
    window.addEventListener(PIKU_CELEBRATE_EVENT, onCelebrate);
    return () => window.removeEventListener(PIKU_CELEBRATE_EVENT, onCelebrate);
  }, [playBurst]);

  /* Closing from inside the panel counts as activity, so the idle timers
     don't immediately decide he's been abandoned. */
  useEffect(() => {
    window.addEventListener(PIKU_CONCIERGE_CLOSED_EVENT, poke);
    return () => window.removeEventListener(PIKU_CONCIERGE_CLOSED_EVENT, poke);
  }, [poke]);

  return (
    /* Emotion class on the root drives the .piku-btn fallback hops
       (happy/excited/wave) and the WINK squeeze when the SVG is absent.
       The anchor comes in as --piku-right/--piku-bottom so tablet/mobile
       media queries can override it; .piku-root itself never transforms,
       keeping its boundingBox stable for the stillness test. Pixels stay
       immutable WebP; no GLB/three.js. */
    <div
      className={`piku-root piku--${emotion}${blinking && emotion === "idle" ? " piku-blinking" : ""}`}
      style={
        {
          "--piku-right": `${anchor.right}px`,
          "--piku-bottom": `${anchor.bottom}px`,
        } as React.CSSProperties
      }
    >
      {/* The bubble and the invite both hang to Piku's left — which is where
          the panel opens. While it is open the conversation lives there, so
          neither is shown (and the bubble stops announcing over it). */}
      {bubbleView && !isOpen && (
        <span
          className={`piku-bubble${bubbleView.leaving ? " piku-bubble--leaving" : ""}`}
          role="status"
          aria-live="polite"
        >
          {bubbleView.text}
        </span>
      )}

      {/* Standing invitation. The label belongs to the character instead of
          floating separately over the page, so there is one thing to click. */}
      {!isOpen && (
        <span aria-hidden="true" className="piku-invite">
          Chat with Piku
        </span>
      )}

      <button
        type="button"
        className="piku-btn"
        onClick={handleClick}
        onPointerEnter={hoverHandlers.onPointerEnter}
        onPointerLeave={hoverHandlers.onPointerLeave}
        aria-label="Chat with Piku, your gifting concierge — answer a few questions and we'll shortlist gifts for you."
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Chat with Piku"
      >
        {/* WebP-only launcher: reduced motion gets the still frame;
            otherwise the animated loop. Plain img, not next/image: the
            optimiser would re-encode the animated WebP and drop frames.
            Art is aria-hidden; the button label carries the accessible
            name. */}
        {reducedMotion ? (
          <img
            className="piku-img"
            src={PIKU_STILL}
            width={96}
            height={104}
            alt=""
            aria-hidden="true"
            draggable={false}
            decoding="async"
          />
        ) : (
          <picture>
            <source media="(prefers-reduced-motion: reduce)" srcSet={PIKU_STILL} />
            <img
              className="piku-img"
              src={PIKU_LOOP}
              width={96}
              height={104}
              alt=""
              aria-hidden="true"
              draggable={false}
              decoding="async"
            />
          </picture>
        )}
      </button>

      {burst?.map((pos, i) => (
        <span
          key={i}
          className="piku-heart-burst"
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
