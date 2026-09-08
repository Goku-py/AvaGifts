/** Custom DOM events shared across AvaGifts components. */
export const CLOSE_CATALOG_EVENT = "avagifts:close-catalog";

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
