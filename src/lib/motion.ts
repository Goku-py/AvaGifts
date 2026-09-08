/**
 * Shared motion language for the site.
 * Every scroll-reveal uses the same ease curve and stagger cadence.
 */

/** Signature ease: fast start, long settle. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Standard scroll-reveal duration (seconds). */
export const REVEAL_DURATION = 0.55;

/** Stagger step between sibling reveals (seconds). */
export const STAGGER = 0.08;
