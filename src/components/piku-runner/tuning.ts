/**
 * Piku Runner — tuning constants.
 *
 * Pure data: geometry, physics, timing, palettes, obstacle table and the
 * fairness rules used by the procedural pattern generator.
 *
 * Logical resolution is 400×150; every value here is in logical pixels or
 * fixed-step (60 Hz) frames unless stated otherwise.
 */

/* ------------------------------------------------------------------ */
/* Canvas & geometry                                                    */
/* ------------------------------------------------------------------ */

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 150;

/** Feet baseline. Player and ground obstacles sit on this line. */
export const GROUND_Y = 118;
/** Top of the ground slab (line), below this the road texture begins. */
export const GROUND_SURFACE_Y = 118;
/** Ground tiles are 200px wide, drawn twice and wrapped. */
export const GROUND_TILE_WIDTH = 200;

/** Horizontal position of Piku (left edge of sprite cell). */
export const PIKU_X = 46;
/** Standing cell. */
export const PIKU_W = 20;
export const PIKU_H = 30;
/** Duck cell (bottom aligned to GROUND_Y). */
export const PIKU_DUCK_W = 36;
export const PIKU_DUCK_H = 18;

/** Forgiving inner hitboxes (see spec §11). */
export const PIKU_HITBOX_RUN = { x: 3, y: 2, w: 14, h: 26 };
export const PIKU_HITBOX_DUCK = { x: 2, y: 3, w: 32, h: 13 };

/* ------------------------------------------------------------------ */
/* Physics                                                              */
/* ------------------------------------------------------------------ */

export const GRAVITY = 0.48;
/** Base launch velocity (negative = up). */
export const JUMP_VELOCITY = -6.8;
/** Tiny extra launch at higher speed keeps the arc feeling consistent. */
export const JUMP_SPEED_KICK = -0.08;
/** Early release clamps the rise once it is past MIN_JUMP_HEIGHT. */
export const DROP_VELOCITY = -3.2;
/** You must rise at least this much before an early release is honoured. */
export const MIN_JUMP_HEIGHT = 20;
/** Holding Down while airborne triggers an enhanced fast-fall. */
export const SPEED_DROP_FACTOR = 2.6;

export const SPEED_START = 2.38;
export const SPEED_MAX = 4.6;
export const SPEED_GROWTH = 0.00037;

/* ------------------------------------------------------------------ */
/* Timing                                                               */
/* ------------------------------------------------------------------ */

export const FIXED_STEP_MS = 1000 / 60;
export const MAX_FRAME_DELTA_MS = 100;
export const MAX_STEPS_PER_FRAME = 5;

/** No obstacles for this long after (re)starting. */
export const CLEAR_TIME_MS = 1200;
/** Input gate after a crash (restart only after this). */
export const GAMEOVER_INPUT_MS = 600;
/** Ready stance before a run begins. */
export const READY_MS = 240;
export const RUN_FRAME_MS = 110;
export const DUCK_FRAME_MS = 130;
export const BLINK_EVERY_MS = 3600;
export const BLINK_MS = 110;
export const SQUASH_MS = 70;
export const HIT_MS = 480;
export const HITSTOP_MS = 90;
export const OVERLAY_FADE_MS = 140;
export const POPUP_MS = 1100;
export const NEAR_MISS_MS = 750;
export const NEAR_MISS_COOLDOWN_MS = 1200;

/** How fast the environment parameter glides toward its target (env units per step). */
export const ENV_GLIDE = 0.02;

/* ------------------------------------------------------------------ */
/* Score                                                                */
/* ------------------------------------------------------------------ */

export const SCORE_COEFFICIENT = 0.055;
export const SCORE_DIGITS = 5;
export const MILESTONE_STEP = 100;
export const BIG_MILESTONE_STEP = 500;

/* ------------------------------------------------------------------ */
/* Persistence keys                                                     */
/* ------------------------------------------------------------------ */

export const BEST_KEY = 'piku_runner_hi';
export const LEGACY_BEST_KEY = 'piku-runner-best';
export const SOUND_KEY = 'piku_runner_sound';

/* ------------------------------------------------------------------ */
/* Environment — 7 keyframes of the day/dusk/night cycle                */
/* ------------------------------------------------------------------ */

export interface Palette {
  skyTop: string;
  skyMid: string;
  skyLow: string;
  horizon: string;
  horizonGlow: string;
  sunCore: string;
  sunMid: string;
  cloud: string;
  cloudShade: string;
  groundLight: string;
  groundLine: string;
  groundBase: string;
  groundDark: string;
  groundDeep: string;
  speckle: string;
  shadow: string;
  skyline: string;
  skylineWin: string;
  inkHud: string;
  cream: string;
  creamDark: string;
  blue: string;
  blueDark: string;
  blueLight: string;
  ribbon: string;
  ribbonDark: string;
  wood: string;
  woodDark: string;
  woodLight: string;
  paper: string;
  paperShade: string;
  paperEdge: string;
  propInk: string;
}

/**
 * Score anchors for the environment keyframes. Between anchors the palette is
 * interpolated every frame, so transitions are gradual (spec §14/§20).
 */
export const ENV_SCORES = [0, 200, 400, 700, 1000, 1250, 1500] as const;

export const PALETTES: Palette[] = [
  /* 0 — day */
  {
    skyTop: '#EAF2FB', skyMid: '#EFF5FB', skyLow: '#F4F7FA', horizon: '#F7FAFD',
    horizonGlow: '#F7FAFD', sunCore: '#FFF7D6', sunMid: '#FFE9A8',
    cloud: '#DCE6F1', cloudShade: '#CFDCEA',
    groundLight: '#E2E9F1', groundLine: '#8FA0B5', groundBase: '#CBD5E1',
    groundDark: '#B4C1D1', groundDeep: '#A6B3C6', speckle: '#A9B8CA', shadow: '#9FB0C4',
    skyline: '#DFE7F0', skylineWin: '#E7EDF4', inkHud: '#172033',
    cream: '#FFF7ED', creamDark: '#EBD9C4',
    blue: '#3B82F6', blueDark: '#2563EB', blueLight: '#60A5FA',
    ribbon: '#F97316', ribbonDark: '#C2410C',
    wood: '#D9A76A', woodDark: '#B07C43', woodLight: '#EAC79A',
    paper: '#FBFDFF', paperShade: '#DCE4EF', paperEdge: '#8A9AAD',
    propInk: '#172033',
  },
  /* 1 — late afternoon */
  {
    skyTop: '#EAF1FA', skyMid: '#F0F3F9', skyLow: '#F7F3EA', horizon: '#FBEED7',
    horizonGlow: '#FDE3B8', sunCore: '#FFE39B', sunMid: '#FFD98A',
    cloud: '#DFE5EF', cloudShade: '#D2DCE9',
    groundLight: '#E4E6E8', groundLine: '#93A0B0', groundBase: '#CFD3D8',
    groundDark: '#B7BCC5', groundDeep: '#A9AFB9', speckle: '#AEB6C1', shadow: '#A3ACB8',
    skyline: '#E0E5EC', skylineWin: '#E6E9EF', inkHud: '#1B2434',
    cream: '#FFF4E4', creamDark: '#ECDCC6',
    blue: '#3B7FF0', blueDark: '#2563D0', blueLight: '#5FA6F5',
    ribbon: '#F97A1C', ribbonDark: '#C5530F',
    wood: '#D9A76A', woodDark: '#B07C43', woodLight: '#EAC79A',
    paper: '#FBFDFF', paperShade: '#DCE4EF', paperEdge: '#8A9AAD',
    propInk: '#1B2434',
  },
  /* 2 — golden afternoon */
  {
    skyTop: '#F0E9DC', skyMid: '#F6E9D3', skyLow: '#F8E7D0', horizon: '#FDBA74',
    horizonGlow: '#FB923C', sunCore: '#FFD27F', sunMid: '#FFE9AE',
    cloud: '#F0E2CE', cloudShade: '#E3D3BC',
    groundLight: '#E3D9C6', groundLine: '#9C8C76', groundBase: '#CFC0AC',
    groundDark: '#B8A992', groundDeep: '#A8987F', speckle: '#AC9C85', shadow: '#A2947F',
    skyline: '#E8DCC8', skylineWin: '#EDE2D0', inkHud: '#2A2530',
    cream: '#FFF1DC', creamDark: '#EAD6BC',
    blue: '#3D74E8', blueDark: '#2857C4', blueLight: '#5E8FF0',
    ribbon: '#F97316', ribbonDark: '#C2410C',
    wood: '#D19B62', woodDark: '#A87142', woodLight: '#E6C08E',
    paper: '#FBFDFF', paperShade: '#E8E0D2', paperEdge: '#97876F',
    propInk: '#2A2530',
  },
  /* 3 — sunset */
  {
    skyTop: '#5B4FC4', skyMid: '#8B63C9', skyLow: '#CE8DB4', horizon: '#F97316',
    horizonGlow: '#FB923C', sunCore: '#FFD98A', sunMid: '#FB923C',
    cloud: '#C79BC5', cloudShade: '#AF87B3',
    groundLight: '#9A8AA0', groundLine: '#57485F', groundBase: '#8A7A90',
    groundDark: '#6E5F76', groundDeep: '#5E5166', speckle: '#7C6C84', shadow: '#6A5B72',
    skyline: '#4E4270', skylineWin: '#6A5C8F', inkHud: '#FFF7ED',
    cream: '#FFE9C9', creamDark: '#E3C7A0',
    blue: '#4B6FE0', blueDark: '#3450B8', blueLight: '#6E8CEC',
    ribbon: '#FB7A22', ribbonDark: '#C34A0E',
    wood: '#C08F5C', woodDark: '#95673C', woodLight: '#D9B183',
    paper: '#FBF2E4', paperShade: '#E3D0B8', paperEdge: '#A08162',
    propInk: '#2A1F2E',
  },
  /* 4 — dusk */
  {
    skyTop: '#23214F', skyMid: '#33306B', skyLow: '#4A3B7A', horizon: '#6E3F63',
    horizonGlow: '#8A4A5E', sunCore: '#FFD98A', sunMid: '#FB923C',
    cloud: '#4A4670', cloudShade: '#3B3760',
    groundLight: '#5A5566', groundLine: '#2E2B38', groundBase: '#4E4A5C',
    groundDark: '#3C3947', groundDeep: '#332F3D', speckle: '#454052', shadow: '#363243',
    skyline: '#262347', skylineWin: '#453F6B', inkHud: '#EDE9FE',
    cream: '#E4CDB9', creamDark: '#C9AF98',
    blue: '#4C63C9', blueDark: '#3549A5', blueLight: '#6B82DE',
    ribbon: '#F97316', ribbonDark: '#BF480D',
    wood: '#9A7350', woodDark: '#755538', woodLight: '#B48C66',
    paper: '#EFE7DC', paperShade: '#D2C4B4', paperEdge: '#8C7B68',
    propInk: '#1D1A2A',
  },
  /* 5 — early night */
  {
    skyTop: '#131B3A', skyMid: '#172554', skyLow: '#1B2E5E', horizon: '#23345F',
    horizonGlow: '#2B3D6B', sunCore: '#FFD98A', sunMid: '#FB923C',
    cloud: '#232F4E', cloudShade: '#1C2742',
    groundLight: '#46516A', groundLine: '#222938', groundBase: '#384257',
    groundDark: '#2C3446', groundDeep: '#252C3C', speckle: '#323C4F', shadow: '#28303F',
    skyline: '#1A2140', skylineWin: '#B08E3A', inkHud: '#E2E8F0',
    cream: '#DCCFC0', creamDark: '#BCAE9C',
    blue: '#4A62C4', blueDark: '#3548A0', blueLight: '#6980DA',
    ribbon: '#F97316', ribbonDark: '#B8430C',
    wood: '#8A6B4A', woodDark: '#684E34', woodLight: '#A6845E',
    paper: '#E6E1DA', paperShade: '#C6C0B6', paperEdge: '#7E7669',
    propInk: '#151A2E',
  },
  /* 6 — night */
  {
    skyTop: '#0F172A', skyMid: '#131F3D', skyLow: '#172554', horizon: '#1B2A52',
    horizonGlow: '#223260', sunCore: '#FFD98A', sunMid: '#FB923C',
    cloud: '#1E293B', cloudShade: '#182234',
    groundLight: '#3E4A61', groundLine: '#1E293B', groundBase: '#334155',
    groundDark: '#293548', groundDeep: '#222C3E', speckle: '#2E3A50', shadow: '#232D40',
    skyline: '#0C1322', skylineWin: '#FBBF24', inkHud: '#E2E8F0',
    cream: '#D5DCE8', creamDark: '#AFB9CB',
    blue: '#3563D6', blueDark: '#2648A8', blueLight: '#5B82E4',
    ribbon: '#F97316', ribbonDark: '#B8430C',
    wood: '#7E6349', woodDark: '#5E4832', woodLight: '#997A5B',
    paper: '#DDE3EC', paperShade: '#B8C1CE', paperEdge: '#6E7789',
    propInk: '#0B1120',
  },
];

export const NIGHT_SCORE = ENV_SCORES[ENV_SCORES.length - 1];

/** Environment index (0..6, fractional) for a score. */
export function envIndexAtScore(score: number): number {
  const s = Math.max(0, score);
  for (let i = 0; i < ENV_SCORES.length - 1; i++) {
    const a = ENV_SCORES[i];
    const b = ENV_SCORES[i + 1];
    if (s <= b) return i + (s - a) / (b - a);
  }
  return ENV_SCORES.length - 1;
}

/* Sun / moon / star paths over the environment parameter. */
export const SUN_Y_ANCHORS = [26, 30, 52, 88, 108, 108, 108];
export const SUN_X_ANCHORS = [336, 336, 332, 320, 310, 310, 310];
export const SUN_ALPHA_ANCHORS = [1, 1, 1, 1, 0, 0, 0];
export const MOON_ALPHA_ANCHORS = [0, 0, 0, 0, 0.25, 0.7, 1];
export const STAR_ALPHA_ANCHORS = [0, 0, 0, 0, 0.15, 0.55, 1];
export const MOON_X = 312;
export const MOON_Y = 22;

/* Parallax factors (fraction of world speed). */
export const SKYLINE_PARALLAX = 0.18;
export const CLOUD_PARALLAX = 0.12;

/* ------------------------------------------------------------------ */
/* Obstacles                                                            */
/* ------------------------------------------------------------------ */

export type ObstacleId =
  | 'giftSmall'
  | 'giftMed'
  | 'crate'
  | 'giftBag'
  | 'ribbonBundle'
  | 'parcelStack'
  | 'tallBox'
  | 'giftStack'
  | 'paperPlane'
  | 'flyingGift'
  | 'drone'
  | 'balloonParcel';

export type AirBand = 'ground' | 'duckGate' | 'jumpGate';

export interface Hitbox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ObstacleDef {
  id: ObstacleId;
  w: number;
  h: number;
  band: AirBand;
  /** Minimum score before this obstacle can spawn. */
  minScore: number;
  /** Spawn weight within its eligible pool. */
  weight: number;
  frames: number;
  frameMs: number;
  /** Tight hitboxes (already inset from the art). */
  hitboxes: Hitbox[];
}

/**
 * Flyer bands: a duckGate bottom sits at y=100 — it clips a standing Piku
 * (box 90..116) but sails over a ducking one (box 103..116). A jumpGate
 * bottom sits at y=110 so the only answer is a real jump.
 */
const DUCK_GATE_BOTTOM = 100;
const JUMP_GATE_BOTTOM = 110;

function groundDef(
  id: ObstacleId,
  w: number,
  h: number,
  minScore: number,
  weight: number,
  hitboxes: Hitbox[],
): ObstacleDef {
  return { id, w, h, band: 'ground', minScore, weight, frames: 1, frameMs: 0, hitboxes };
}

function flyerDef(
  id: ObstacleId,
  w: number,
  h: number,
  band: 'duckGate' | 'jumpGate',
  minScore: number,
  weight: number,
  frames: number,
  frameMs: number,
  hitboxes: Hitbox[],
): ObstacleDef {
  return { id, w, h, band, minScore, weight, frames, frameMs, hitboxes };
}

export const OBSTACLE_DEFS: Record<ObstacleId, ObstacleDef> = {
  giftSmall: groundDef('giftSmall', 14, 12, 0, 10, [{ x: 1, y: 1, w: 12, h: 10 }]),
  giftMed: groundDef('giftMed', 18, 16, 0, 10, [{ x: 1, y: 1, w: 16, h: 14 }]),
  crate: groundDef('crate', 22, 18, 150, 9, [{ x: 1, y: 1, w: 20, h: 16 }]),
  giftBag: groundDef('giftBag', 16, 20, 150, 8, [{ x: 2, y: 0, w: 12, h: 19 }]),
  ribbonBundle: groundDef('ribbonBundle', 22, 10, 150, 7, [{ x: 1, y: 0, w: 20, h: 9 }]),
  parcelStack: groundDef('parcelStack', 26, 18, 400, 8, [{ x: 1, y: 2, w: 24, h: 16 }]),
  tallBox: groundDef('tallBox', 16, 26, 400, 8, [{ x: 1, y: 0, w: 14, h: 25 }]),
  giftStack: groundDef('giftStack', 18, 28, 400, 8, [{ x: 1, y: 1, w: 16, h: 26 }]),
  paperPlane: flyerDef('paperPlane', 26, 12, 'duckGate', 500, 10, 2, 130, [
    { x: 1, y: 3, w: 24, h: 8 },
  ]),
  flyingGift: flyerDef('flyingGift', 16, 14, 'duckGate', 500, 9, 2, 150, [
    { x: 1, y: 1, w: 14, h: 12 },
  ]),
  drone: flyerDef('drone', 30, 16, 'jumpGate', 1100, 10, 2, 90, [
    { x: 1, y: 2, w: 28, h: 12 },
  ]),
  balloonParcel: flyerDef('balloonParcel', 18, 24, 'duckGate', 1100, 7, 2, 160, [
    { x: 5, y: 0, w: 8, h: 10 },
    { x: 2, y: 10, w: 14, h: 13 },
  ]),
};

/** Bottom edge (y) of each obstacle band. */
export function obstacleBottom(def: ObstacleDef): number {
  if (def.band === 'duckGate') return DUCK_GATE_BOTTOM;
  if (def.band === 'jumpGate') return JUMP_GATE_BOTTOM;
  return GROUND_Y;
}

export const GROUND_IDS: ObstacleId[] = [
  'giftSmall',
  'giftMed',
  'crate',
  'giftBag',
  'ribbonBundle',
  'parcelStack',
  'tallBox',
  'giftStack',
];
export const DUCK_GATE_IDS: ObstacleId[] = ['paperPlane', 'flyingGift', 'balloonParcel'];
export const JUMP_GATE_IDS: ObstacleId[] = ['drone'];

/* ------------------------------------------------------------------ */
/* Pattern / fairness rules (in frames of travel at the current speed)  */
/* ------------------------------------------------------------------ */

export const GAP = {
  /** Between separate patterns. */
  BASE_MIN: 58,
  BASE_MAX: 88,
  /** Two ground obstacles at a safe jumping distance. */
  GROUND_SEP_MIN: 54,
  GROUND_SEP_MAX: 80,
  /** Two ground obstacles combined in one jump (tight cluster). */
  GROUND_COMBO_MIN: 10,
  GROUND_COMBO_MAX: 16,
  /** Ground → duck gate. */
  GROUND_DUCK_MIN: 48,
  /** Ground → jump gate. */
  GROUND_JUMP_MIN: 46,
  /** Duck gate → duck gate. */
  DUCK_DUCK_MIN: 18,
  /** Anything → a non-flyer that follows a duck gate. */
  AFTER_DUCK_MIN: 55,
} as const;

/** Global floor on reaction distance (frames of travel). */
export const MIN_REACTION_FRAMES = 42;

/** Difficulty contraction applied to gaps as the score grows. */
export function difficultyFactor(score: number): number {
  return 1 - 0.18 * Math.min(1, Math.max(0, score) / 2000);
}

/** Maximum obstacles allowed on screen at once. */
export const MAX_ON_SCREEN = 3;

/* ------------------------------------------------------------------ */
/* Small helpers                                                        */
/* ------------------------------------------------------------------ */

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Piecewise-linear sample of an anchor array over the env parameter. */
export function sampleAnchors(anchors: readonly number[], env: number): number {
  const e = clamp(env, 0, anchors.length - 1);
  const i = Math.min(Math.floor(e), anchors.length - 2);
  return lerp(anchors[i], anchors[i + 1], e - i);
}

export function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}
