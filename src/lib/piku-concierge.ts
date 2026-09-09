/* ------------------------------------------------------------------ */
/* Piku concierge — guided gifting flow data + WhatsApp handoff          */
/*                                                                     */
/* Piku is NOT an AI assistant. It is a short guided script: a few      */
/* single-select / multi-select questions, a handful of detail fields,  */
/* then a handoff to the human gifting team via WhatsApp or the         */
/* enquiry form. No recommendations, no product logic, no LLM wording.  */
/* ------------------------------------------------------------------ */

import { formatFriendlyDate } from "@/lib/lead-time";

/** TODO(whatsapp-number): replace with the real team WhatsApp number in
 *  international format, digits only (e.g. "919812345678"). The contact
 *  page currently only carries a placeholder phone number. */
export const PIKU_WHATSAPP_NUMBER = "9198XXXXXXX";

export const OPEN_PIKU_EVENT = "avagifts:open-piku";

export interface ConciergeOption {
  value: string;
  label: string;
}

/* Q1 — occasion (single-select chips) */
export const occasionOptions: ConciergeOption[] = [
  { value: "employee-appreciation", label: "Employee Appreciation" },
  { value: "client-cxo", label: "Client / CXO" },
  { value: "new-joiner", label: "New Joiner" },
  { value: "corporate-event", label: "Corporate Event" },
  { value: "festival", label: "Festival" },
  { value: "recognition-rewards", label: "Recognition / Rewards" },
  { value: "brand-marketing", label: "Brand / Marketing" },
  { value: "other", label: "Other" },
];

/* Q2 — feeling (single-select) */
/*
 * Past participles, not verbs. The question is "how should it make them
 * feel?" and the acknowledgement reads "let's make them feel X" — with verb
 * labels that produced "let's make them feel celebrate". Values are
 * unchanged, so saved answers and the WhatsApp summary still line up.
 */
export const feelingOptions: ConciergeOption[] = [
  { value: "celebrate", label: "Celebrated" },
  { value: "appreciate", label: "Appreciated" },
  { value: "inspire", label: "Inspired" },
  { value: "impress", label: "Impressed" },
  { value: "welcome", label: "Welcomed" },
  { value: "recharge", label: "Recharged" },
];

/* Q3 — gift style (multi-select) */
export const giftStyleOptions: ConciergeOption[] = [
  { value: "local-artisan", label: "Local / Artisan" },
  { value: "personalised", label: "Personalised" },
  { value: "premium", label: "Premium" },
  { value: "sustainable", label: "Sustainable" },
  /* "Useful" was dropped from ProductTag, so offering it here would let
     someone pick a style nothing in the catalogue is tagged with. */
  { value: "experience", label: "Experience" },
  { value: "tech", label: "Tech" },
  { value: "open-to-suggestions", label: "Open to Suggestions" },
];

/* Q4 — budget bands (single-select, conversational wording) */
export const conciergeBudgetOptions: ConciergeOption[] = [
  { value: "under-500", label: "Under ₹500 per gift" },
  { value: "500-1000", label: "₹500–₹1,000 per gift" },
  { value: "1000-2500", label: "₹1,000–₹2,500 per gift" },
  { value: "2500-plus", label: "₹2,500+ per gift" },
  { value: "not-sure", label: "Not sure yet" },
];

export function optionLabel(
  options: ConciergeOption[],
  value: string | null,
): string {
  if (!value) return "—";
  return options.find((option) => option.value === value)?.label ?? value;
}

/* ------------------------------------------------------------------ */
/* Flow state                                                          */
/* ------------------------------------------------------------------ */

export interface ConciergeAnswers {
  occasion: string | null;
  occasionOther: string;
  feeling: string | null;
  styles: string[];
  quantity: string;
  deliveryDate: string;
  location: string;
  budget: string | null;
  requirement: string;
  /* Basic details */
  name: string;
  designation: string;
  company: string;
  phone: string;
  email: string;
  notes: string;
}

export const emptyConciergeAnswers: ConciergeAnswers = {
  occasion: null,
  occasionOther: "",
  feeling: null,
  styles: [],
  quantity: "",
  deliveryDate: "",
  location: "",
  budget: null,
  requirement: "",
  name: "",
  designation: "",
  company: "",
  phone: "",
  email: "",
  notes: "",
};

export type ConciergeStep =
  | "intro"
  | "occasion"
  | "feeling"
  | "gift-style"
  | "details-quantity"
  | "details-date"
  | "details-location"
  | "details-budget"
  | "details-notes"
  | "confirm"
  | "contact"
  | "brief"
  | "done";

/** Ordered steps for progress + back navigation (intro/done excluded). */
export const progressSteps: ConciergeStep[] = [
  "occasion",
  "feeling",
  "gift-style",
  "details-quantity",
  "details-date",
  "details-location",
  "details-budget",
  "details-notes",
  "contact",
  "brief",
];

export function stepIndex(step: ConciergeStep): number {
  return progressSteps.indexOf(step);
}

/* ------------------------------------------------------------------ */
/* Progress stages — the 10 internal steps are grouped into 3 numbered */
/* stages so the header reads "Step 1 of 3" instead of a 10-tick bar.  */
/* ------------------------------------------------------------------ */

export interface ConciergeStage {
  id: string;
  /** Short label shown beside the stage number. */
  label: string;
  steps: ConciergeStep[];
}

export const conciergeStages: ConciergeStage[] = [
  {
    id: "vibe",
    label: "Your vibe",
    steps: ["occasion", "feeling", "gift-style"],
  },
  {
    id: "details",
    label: "The details",
    steps: [
      "details-quantity",
      "details-date",
      "details-location",
      "details-budget",
      "details-notes",
      "confirm",
    ],
  },
  {
    id: "connect",
    label: "Connect",
    steps: ["contact", "brief"],
  },
];

/** 0-based stage containing the step, or -1 for intro/done. */
export function stageIndex(step: ConciergeStep): number {
  return conciergeStages.findIndex((stage) => stage.steps.includes(step));
}

/* ------------------------------------------------------------------ */
/* Acknowledgements — short, human, one question at a time             */
/* ------------------------------------------------------------------ */

export function occasionAck(value: string, other: string): string {
  if (value === "other") {
    return other.trim() ? `Got it — ${other.trim()}.` : "Got it.";
  }
  return `Got it — ${optionLabel(occasionOptions, value).toLowerCase()}.`;
}

export function feelingAck(value: string): string {
  return `Lovely — let's make them feel ${optionLabel(feelingOptions, value).toLowerCase()}.`;
}

export function stylesAck(styles: string[]): string {
  if (styles.length === 0) return "No problem — we'll suggest from across the collection.";
  if (styles.length === 1)
    return `Noted — ${optionLabel(giftStyleOptions, styles[0]).toLowerCase()}.`;
  return `Noted — ${styles.length} styles picked.`;
}

/* ------------------------------------------------------------------ */
/* WhatsApp handoff — includes whatever is known, even partial         */
/* ------------------------------------------------------------------ */

export function conciergeSummaryLines(answers: ConciergeAnswers): string[] {
  const lines: string[] = [];
  if (answers.occasion) {
    lines.push(
      answers.occasion === "other" && answers.occasionOther.trim()
        ? `Occasion: ${answers.occasionOther.trim()}`
        : `Occasion: ${optionLabel(occasionOptions, answers.occasion)}`,
    );
  }
  if (answers.feeling)
    lines.push(`Feeling: ${optionLabel(feelingOptions, answers.feeling)}`);
  if (answers.styles.length > 0)
    lines.push(
      `Gift style: ${answers.styles.map((s) => optionLabel(giftStyleOptions, s)).join(", ")}`,
    );
  if (answers.quantity.trim()) lines.push(`Quantity: ${answers.quantity.trim()}`);
  if (answers.deliveryDate.trim())
    lines.push(`Delivery by: ${formatFriendlyDate(answers.deliveryDate.trim())}`);
  if (answers.location.trim()) lines.push(`Location: ${answers.location.trim()}`);
  if (answers.budget)
    lines.push(`Budget: ${optionLabel(conciergeBudgetOptions, answers.budget)}`);
  if (answers.requirement.trim())
    lines.push(`Requirement: ${answers.requirement.trim()}`);
  if (answers.name.trim()) lines.push(`Name: ${answers.name.trim()}`);
  if (answers.designation.trim())
    lines.push(`Designation: ${answers.designation.trim()}`);
  if (answers.company.trim()) lines.push(`Company: ${answers.company.trim()}`);
  if (answers.phone.trim()) lines.push(`Phone: ${answers.phone.trim()}`);
  if (answers.email.trim()) lines.push(`Email: ${answers.email.trim()}`);
  if (answers.notes.trim()) lines.push(`Notes: ${answers.notes.trim()}`);
  return lines;
}

export function buildWhatsAppMessage(answers: ConciergeAnswers): string {
  const detail = conciergeSummaryLines(answers);
  const header = "Hi AvaGifts team! Piku helped me put together my gifting brief.";
  if (detail.length === 0)
    return `${header} I'd like some help with corporate gifting.`;
  return `${header}\n\n${detail.map((line) => `• ${line}`).join("\n")}`;
}

export function buildWhatsAppUrl(answers: ConciergeAnswers): string {
  return `https://wa.me/${PIKU_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    buildWhatsAppMessage(answers),
  )}`;
}
