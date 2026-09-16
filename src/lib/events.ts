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

/* Piku ↔ concierge step intelligence (Phase 20). The modal announces its
   opening and each conversation stage so the brain can react once per
   step instead of every keystroke. */
export const PIKU_CONCIERGE_OPENED_EVENT = "avagifts:piku-concierge-opened";
export const PIKU_CONCIERGE_STEP_EVENT = "avagifts:piku-concierge-step";

/** Payload for PIKU_CONCIERGE_STEP_EVENT — the ConciergeStep id. */
export interface PikuConciergeStepDetail {
  step: string;
}

/* Form intelligence (Phase 16) — field-level validation feedback. */
export const PIKU_FORM_VALID_EVENT = "avagifts:piku-form-valid";
export const PIKU_FORM_ERROR_EVENT = "avagifts:piku-form-error";

/* In-round runner reactions (Phase 22) — hit and milestone beats between
   STARTED and COMPLETED. */
export const PIKU_GAME_HIT_EVENT = "avagifts:piku-game-hit";
export const PIKU_GAME_MILESTONE_EVENT = "avagifts:piku-game-milestone";

/** Payload for PIKU_GAME_MILESTONE_EVENT. */
export interface PikuGameMilestoneDetail {
  score: number;
}
