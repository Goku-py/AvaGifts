/*
 * Piku dialogue library — the single source of truth for what Piku says and
 * how he reacts. The brain (`use-piku-brain.ts`) is the only consumer: it
 * resolves an event key to an entry, applies priority / cooldown /
 * probability / session limits, picks a message (never repeating the last
 * one), and drives the emotion + bubble state.
 *
 * Style contract (see PIKU-BIBLE.md):
 *   A clever, friendly friend. Short — 1–2 sentences max, usually one.
 *   Warm, slightly playful, emojis sparingly. Never corporate, never
 *   AI-speak ("How may I assist you today?"), never salesy, never shaming.
 *
 * Priorities (Phase 8):
 *   critical  success/error the user must not miss
 *   high      enquiry success, game completion, major milestones, direct
 *             user actions (clicks)
 *   medium    concierge/catalog opens, CTAs, form completion
 *   low       hover, cursor, scroll, section hints
 *   background breathing, blink, gaze, idle (not scheduled here)
 */

export type PikuEmotion =
  | "wave"
  | "idle"
  | "happy"
  | "sleepy"
  | "surprised"
  | "curious"
  | "thinking"
  | "excited"
  | "proud"
  | "nervous"
  | "peeking"
  | "celebrate";

export type PikuPriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "background";

export const PIKU_PRIORITY: Record<PikuPriority, number> = {
  critical: 100,
  high: 80,
  medium: 60,
  low: 40,
  background: 20,
};

export interface PikuDialogueEntry {
  /** Emotion to hold while the reaction plays. */
  emotion: PikuEmotion;
  /** Candidate lines. Empty = silent reaction (emotion only, no bubble). */
  messages: readonly string[];
  priority: PikuPriority;
  /** How long the emotion holds before returning to idle/sleepy. */
  durationMs: number;
  /** Per-event cooldown. Absent = no cooldown (direct user actions). */
  cooldownMs?: number;
  /** 0..1 chance to fire at all. Absent = always. */
  probability?: number;
  /** Max fires per page session. Absent = unlimited. */
  sessionLimit?: number;
  /** Meaningful success/error may speak even inside the global cooldown. */
  bypassGlobalCooldown?: boolean;
}

export const PIKU_DIALOGUE = {
  /* ---------------------------------------------------------------- *
   * Arrival                                                           *
   * ---------------------------------------------------------------- */
  greeting: {
    emotion: "wave",
    messages: ["Hey! 👋", "Hi there!", "Looking for a gift?"],
    priority: "medium",
    durationMs: 2600,
  },
  welcome_back: {
    emotion: "happy",
    messages: ["You're back! 👀", "Missed me?", "Hey again!"],
    priority: "low",
    durationMs: 1800,
    probability: 0.5,
  },

  /* ---------------------------------------------------------------- *
   * Clicks — 1st happy, 2nd curious, rapid → playful nervous          *
   * ---------------------------------------------------------------- */
  click_first: {
    emotion: "happy",
    messages: ["Hi! 👋", "Hey — that tickles!", "Hello there!"],
    priority: "high",
    durationMs: 1700,
  },
  click_second: {
    emotion: "curious",
    messages: ["Again? 😄", "Hey again!", "Still me."],
    priority: "high",
    durationMs: 1800,
  },
  click_rapid: {
    emotion: "nervous",
    messages: ["Easy there! 😂", "Whoa — gentle!", "I'm not going anywhere 😅"],
    priority: "high",
    durationMs: 2500,
  },

  /* ---------------------------------------------------------------- *
   * Ambient — hover / cursor / scroll / glances                       *
   * ---------------------------------------------------------------- */
  hover_notice: {
    emotion: "curious",
    messages: [],
    priority: "low",
    durationMs: 900,
    cooldownMs: 20_000,
  },
  hover_wave: {
    emotion: "wave",
    messages: ["Need a hand? 👀", "What's up?", "Looking for a gift?"],
    priority: "low",
    durationMs: 1400,
    cooldownMs: 45_000,
    probability: 0.65,
  },
  cursor_notice: {
    emotion: "curious",
    messages: ["Psst... 👀", "I saw that.", "Hey."],
    priority: "low",
    durationMs: 1500,
    cooldownMs: 25_000,
    probability: 0.35,
  },
  glance: {
    emotion: "curious",
    messages: [],
    priority: "low",
    durationMs: 2500,
    cooldownMs: 8_000,
  },
  scroll_fast: {
    emotion: "surprised",
    messages: ["Whoa!", "Going somewhere? 😳"],
    priority: "low",
    durationMs: 1300,
    cooldownMs: 30_000,
  },
  scroll_bottom: {
    emotion: "excited",
    messages: ["You made it! 🎉", "Nice scroll.", "Bottom's comfy, right?"],
    priority: "low",
    durationMs: 2000,
    cooldownMs: 60_000,
    probability: 0.8,
  },

  /* ---------------------------------------------------------------- *
   * Section hints — once per section per session                      *
   * ---------------------------------------------------------------- */
  hint_catalog: {
    emotion: "curious",
    messages: ["Gift hunting? I'm in.", "Let's find something good."],
    priority: "low",
    durationMs: 2500,
    sessionLimit: 1,
  },
  hint_featured: {
    emotion: "curious",
    messages: ["These caught my eye 👀", "Nice ones, right?"],
    priority: "low",
    durationMs: 2500,
    sessionLimit: 1,
  },
  hint_why: {
    emotion: "curious",
    messages: ["Want to know why?", "Curious about us? 👀"],
    priority: "low",
    durationMs: 2500,
    sessionLimit: 1,
  },
  hint_contact: {
    emotion: "curious",
    messages: ["I'm right here if you need me.", "Need a hand? 👀"],
    priority: "low",
    durationMs: 2500,
    sessionLimit: 1,
  },

  /* ---------------------------------------------------------------- *
   * Catalog + concierge                                              *
   * ---------------------------------------------------------------- */
  catalog_open: {
    emotion: "excited",
    messages: ["Gift hunting? I'm in.", "Ooh, good timing.", "Let's find something good."],
    priority: "medium",
    durationMs: 2000,
    cooldownMs: 20_000,
  },
  concierge_open: {
    emotion: "wave",
    messages: ["Let's find something special.", "Right this way. 👀"],
    priority: "medium",
    durationMs: 1600,
    cooldownMs: 8_000,
  },
  concierge_close: {
    emotion: "wave",
    messages: ["See you soon!", "I'll be here. 👋"],
    priority: "low",
    durationMs: 1400,
    probability: 0.6,
  },
  concierge_step_occasion: {
    emotion: "happy",
    messages: ["What are we shopping for?"],
    priority: "medium",
    durationMs: 1400,
    probability: 0.7,
  },
  concierge_step_feeling: {
    emotion: "curious",
    messages: ["Tell me about them."],
    priority: "medium",
    durationMs: 1400,
    probability: 0.6,
  },
  concierge_step_style: {
    emotion: "curious",
    messages: ["What's the vibe?"],
    priority: "medium",
    durationMs: 1400,
    probability: 0.6,
  },
  concierge_step_details: {
    emotion: "thinking",
    messages: ["Got it.", "Noted."],
    priority: "medium",
    durationMs: 1400,
    cooldownMs: 20_000,
    probability: 0.45,
  },
  concierge_step_budget: {
    emotion: "happy",
    messages: ["No worries — we'll work with that."],
    priority: "medium",
    durationMs: 1600,
    probability: 0.8,
  },
  concierge_step_confirm: {
    emotion: "proud",
    messages: ["Perfect. I have the idea."],
    priority: "medium",
    durationMs: 1800,
    probability: 0.8,
  },
  enquiry_sent: {
    emotion: "excited",
    messages: ["On it! 🎉", "Gift mission accepted. 🫡"],
    priority: "high",
    durationMs: 2200,
    bypassGlobalCooldown: true,
  },
  enquiry_success: {
    emotion: "celebrate",
    messages: ["You're all set!", "Consider it done. 🎉"],
    priority: "critical",
    durationMs: 3000,
    bypassGlobalCooldown: true,
  },

  /* ---------------------------------------------------------------- *
   * Forms                                                            *
   * ---------------------------------------------------------------- */
  form_focus: {
    emotion: "thinking",
    messages: ["Take your time.", "I'm listening."],
    priority: "low",
    durationMs: 2000,
    cooldownMs: 30_000,
    probability: 0.5,
  },
  form_valid: {
    emotion: "happy",
    messages: ["Looking good!", "Nice."],
    priority: "low",
    durationMs: 1600,
    cooldownMs: 20_000,
    probability: 0.6,
  },
  form_error: {
    emotion: "nervous",
    messages: ["Almost! Let's fix that.", "Oops — let's fix that."],
    priority: "high",
    durationMs: 2200,
    cooldownMs: 8_000,
    bypassGlobalCooldown: true,
  },

  /* ---------------------------------------------------------------- *
   * Connectivity + sleep                                             *
   * ---------------------------------------------------------------- */
  offline: {
    emotion: "nervous",
    messages: ["Looks like you're offline.", "No signal — I'll wait here."],
    priority: "high",
    durationMs: 2600,
    cooldownMs: 120_000,
    bypassGlobalCooldown: true,
  },
  online: {
    emotion: "happy",
    messages: ["You're back online!", "And we're back. 😌"],
    priority: "high",
    durationMs: 2000,
    cooldownMs: 5_000,
  },
  wake_flash: {
    emotion: "surprised",
    messages: [],
    priority: "medium",
    durationMs: 400,
  },
  wake_happy: {
    emotion: "happy",
    messages: ["Oh! You're back.", "There you are!"],
    priority: "medium",
    durationMs: 1600,
    probability: 0.6,
  },
  sleepy_quip: {
    emotion: "sleepy",
    messages: ["Still there? 😴", "I'll keep an eye out... 😴"],
    priority: "low",
    durationMs: 2600,
    probability: 0.35,
  },

  /* ---------------------------------------------------------------- *
   * Piku Runner                                                      *
   * ---------------------------------------------------------------- */
  game_opened: {
    emotion: "excited",
    messages: ["Game time!", "Ooh — going for a run?"],
    priority: "medium",
    durationMs: 2000,
    cooldownMs: 10_000,
  },
  game_started: {
    emotion: "happy",
    messages: ["Go go go!", "Nice pace."],
    priority: "medium",
    durationMs: 1500,
    cooldownMs: 5_000,
    probability: 0.5,
  },
  game_hit: {
    emotion: "nervous",
    messages: ["Careful!", "Oof — shake it off."],
    priority: "medium",
    durationMs: 1800,
    cooldownMs: 6_000,
  },
  game_milestone: {
    emotion: "proud",
    messages: ["Okay, that was good!", "Look at you go!"],
    priority: "high",
    durationMs: 2200,
    cooldownMs: 15_000,
  },
  game_completed: {
    emotion: "celebrate",
    messages: ["Nice run! 🏆", "Great run!"],
    priority: "high",
    durationMs: 3000,
    cooldownMs: 10_000,
    bypassGlobalCooldown: true,
  },
  game_exited: {
    emotion: "happy",
    messages: [],
    priority: "low",
    durationMs: 1400,
  },
} as const satisfies Record<string, PikuDialogueEntry>;

export type PikuDialogueKey = keyof typeof PIKU_DIALOGUE;
