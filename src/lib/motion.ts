/**
 * Shared motion language for the site.
 * Every scroll-reveal uses the same ease curve and stagger cadence.
 *
 * Springs are for character: anything that is "Piku being Piku", playful
 * UI (chips, bubbles, panel handoffs) and ambient life. Tweens (EASE)
 * stay reserved for editorial scroll-reveals.
 */

import type { Transition } from "motion/react";

/** Signature ease: fast start, long settle. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Standard scroll-reveal duration (seconds). */
export const REVEAL_DURATION = 0.55;

/** Stagger step between sibling reveals (seconds). */
export const STAGGER = 0.08;

/* ------------------------------------------------------------------ */
/* Piku springs — mass contrast: Piku is light and bouncy, the user's  */
/* own messages land on a heavier, more deliberate spring. Ambient     */
/* motion settles softly with no overshoot.                            */
/* ------------------------------------------------------------------ */

/** Piku-weight: light, bouncy, visible overshoot. Bubbles, avatar, peek. */
export const SPRING_BOUNCY: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 22,
  mass: 0.9,
};

/** User-weight: firm and deliberate. User reply bubbles, confirmations. */
export const SPRING_FIRM: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 1.1,
};

/** Snappy micro-feedback: chip taps, checkmark pops, progress pulse. */
export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 28,
  mass: 0.7,
};

/** Ambient: slow soft settle, no overshoot. Panel handoffs, drifts. */
export const SPRING_SOFT: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 27,
  mass: 1,
};

/**
 * Modal emergence: springs up from the bottom-right corner (where the
 * mascot lives) and settles into place. Gentle overshoot, no wobble.
 */
export const SPRING_EMERGE: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 1,
};
