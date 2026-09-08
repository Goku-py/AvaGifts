import {
  PIKU_GLANCE_END_EVENT,
  PIKU_GLANCE_EVENT,
  type PikuGlanceDetail,
} from "@/lib/events";

/**
 * Dispatchers for the mascot's "glance at that" gaze bias.
 *
 * `Piku` has always listened for these events, but nothing dispatched them, so
 * the whole hover-glance path was unreachable. These helpers close that gap:
 * point the mascot at an element and it looks over at it.
 *
 * The payload is a bias in the mascot's own gaze units (clamped to ±2.2 on the
 * receiving side), measured from wherever the mascot currently is — it wanders,
 * so its position is read from the DOM rather than assumed.
 */

/** Gaze units across one full viewport width/height. */
const GAZE_RANGE = 4.4;

function mascotCentre() {
  const root = document.querySelector(".piku-root");
  if (!root) return null;
  const rect = root.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Ask the mascot to look towards `element`. No-op if it isn't mounted. */
export function glanceAt(element: Element | null | undefined) {
  if (typeof window === "undefined" || !element) return;

  const origin = mascotCentre();
  if (!origin) return;

  const rect = element.getBoundingClientRect();
  const detail: PikuGlanceDetail = {
    x: ((rect.left + rect.width / 2 - origin.x) / window.innerWidth) * GAZE_RANGE,
    y: ((rect.top + rect.height / 2 - origin.y) / window.innerHeight) * GAZE_RANGE,
  };

  window.dispatchEvent(new CustomEvent<PikuGlanceDetail>(PIKU_GLANCE_EVENT, { detail }));
}

/** Release the glance so the mascot returns to its own gaze behaviour. */
export function endGlance() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PIKU_GLANCE_END_EVENT));
}

/**
 * Spread onto an element to make the mascot look at it while hovered.
 * Pointer events only — the mascot already ignores glances on touch and
 * reduced-motion, and keyboard focus has its own `focusin` reaction.
 */
export const glanceHandlers = {
  onPointerEnter: (event: { currentTarget: Element }) => glanceAt(event.currentTarget),
  onPointerLeave: () => endGlance(),
} as const;
