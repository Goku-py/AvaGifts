/* ------------------------------------------------------------------ */
/* Minimum lead time — delivery date validation                        */
/*                                                                     */
/* Business rule: requests must be submitted at least MIN_LEAD_DAYS     */
/* before the requested delivery date. Shared by the Piku concierge,    */
/* the main enquiry form, and the API route, so the rule is enforced    */
/* identically everywhere it's checked.                                 */
/* ------------------------------------------------------------------ */

export const MIN_LEAD_DAYS = 7;

/**
 * Parse a "YYYY-MM-DD" string as a LOCAL calendar date — not `new
 * Date(isoString)`, which the spec parses as UTC midnight and which then
 * reads back a day early in any timezone west of UTC. Splits the string and
 * constructs the Date from local fields instead.
 *
 * Also rejects calendar-invalid input (e.g. "2026-02-30"): native Date
 * normalizes an out-of-range day/month instead of rejecting it (Feb 30
 * silently becomes Mar 2), so the result is round-tripped back through its
 * own fields to confirm it matches what was asked for.
 */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  const roundTrips =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return roundTrips ? date : null;
}

/** Midnight today, local time — the baseline every comparison is made from. */
function todayLocalMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * The earliest date that satisfies the minimum lead time.
 *
 * Uses calendar-field arithmetic (`setDate`/`getDate`), which JS normalizes
 * correctly across month length, year rollover and leap years on its own —
 * no manual month-length table needed. Deliberately NOT millisecond
 * arithmetic (`date.getTime() + MIN_LEAD_DAYS * 86_400_000`): that version
 * breaks across DST transitions in timezones that observe it. Moot for this
 * business today (IST year-round), but keep it this way so a future
 * "simplification" doesn't reintroduce that bug.
 */
export function getMinDeliveryDate(from: Date = todayLocalMidnight()): Date {
  const min = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  min.setDate(min.getDate() + MIN_LEAD_DAYS);
  return min;
}

/**
 * Format a Date as "YYYY-MM-DD" using LOCAL fields — not `toISOString()`,
 * which is UTC and can shift the date by a day, the mirror image of the
 * parsing bug `parseLocalDate` avoids. This is what feeds a native
 * `<input type="date" min={...}>`.
 */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The earliest valid delivery date, as a native date-input value. */
export function minDeliveryDateInputValue(): string {
  return toDateInputValue(getMinDeliveryDate());
}

/**
 * Whether `value` ("YYYY-MM-DD") satisfies the minimum lead time. Used both
 * client-side and inside the shared zod schema (`enquirySchema`), so the API
 * enforces the same rule a client-side bypass would otherwise skip.
 */
export function isDeliveryDateValid(value: string): boolean {
  const date = parseLocalDate(value);
  if (!date) return false;
  return date.getTime() >= getMinDeliveryDate().getTime();
}

const FRIENDLY_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "2026-09-16" -> "16 Sept 2026", for human-readable summaries. Falls back
 *  to the raw value if it isn't a parseable date (e.g. legacy free text). */
export function formatFriendlyDate(value: string): string {
  const date = parseLocalDate(value);
  return date ? FRIENDLY_FORMATTER.format(date) : value;
}
