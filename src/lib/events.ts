/** Custom DOM events shared across AvadheshCo components. */
export const CLOSE_CATALOG_EVENT = "avagifts:close-catalog";
export const OPEN_CATALOG_EVENT = "avagifts:open-catalog";

/* Piku ↔ concierge shared emotions + the glance. Dispatched with
   CustomEvent where a payload is needed (glance carries gaze bias). */
export const PIKU_GLANCE_EVENT = "avagifts:piku-glance";
export const PIKU_GLANCE_END_EVENT = "avagifts:piku-glance-end";
export const PIKU_ENQUIRY_SENT_EVENT = "avagifts:piku-enquiry-sent";
export const PIKU_CONCIERGE_CLOSED_EVENT = "avagifts:piku-concierge-closed";
export const PIKU_CELEBRATE_EVENT = "avagifts:piku-celebrate";

/** Gaze-bias payload for PIKU_GLANCE_EVENT (mascot-gaze units, ±2.2ish). */
export interface PikuGlanceDetail {
  x: number;
  y: number;
}

/*
 * Piku mini-game engagement events. There's no analytics platform in this
 * project — these are plain CustomEvents on `window`, the same bus used
 * everywhere above, ready for a future listener (e.g. a real analytics SDK)
 * to subscribe to without any change here.
 */
export const PIKU_GAME_OPENED_EVENT = "avagifts:piku-game-opened";
export const PIKU_GAME_STARTED_EVENT = "avagifts:piku-game-started";
export const PIKU_GAME_COMPLETED_EVENT = "avagifts:piku-game-completed";
export const PIKU_GAME_EXITED_EVENT = "avagifts:piku-game-exited";

/** Payload for PIKU_GAME_COMPLETED_EVENT and PIKU_GAME_EXITED_EVENT. */
export interface PikuGameOutcomeDetail {
  score: number;
  /** Hits landed this round — separate from score since scoring may not
   *  stay a flat rate forever. */
  hits: number;
  misses: number;
}
