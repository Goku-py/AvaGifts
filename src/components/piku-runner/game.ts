// PikuGame — the engine behind the PIKU RUNNER canvas mini-game.
//
// Piku is the AvaGifts mascot. This is a first-party endless runner in a
// pixel-art delivery world: gift boxes, crates and parcels roll in from the
// right, the sky drifts from morning to night as the score climbs, and Piku
// keeps delivering. Everything renders to a 400x150 logical canvas that is
// upscaled with nearest-neighbour sampling, so the game stays crisp while the
// surrounding site stays modern.
//
// The engine is dependency-free and fully offline-capable: all art is drawn
// procedurally (see piku-art.ts + sprites.ts), all sound is synthesised with
// WebAudio, and the only outside state is localStorage for records.

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  PIKU_H,
  PIKU_DUCK_H,
  PIKU_X,
  PIKU_HITBOX_RUN,
  PIKU_HITBOX_DUCK,
  GRAVITY,
  JUMP_VELOCITY,
  JUMP_SPEED_KICK,
  DROP_VELOCITY,
  MIN_JUMP_HEIGHT,
  SPEED_DROP_FACTOR,
  SPEED_START,
  SPEED_MAX,
  SPEED_GROWTH,
  FIXED_STEP_MS,
  CLEAR_TIME_MS,
  GAMEOVER_INPUT_MS,
  READY_MS,
  RUN_FRAME_MS,
  DUCK_FRAME_MS,
  BLINK_EVERY_MS,
  BLINK_MS,
  SQUASH_MS,
  HIT_MS,
  OVERLAY_FADE_MS,
  NEAR_MISS_MS,
  NEAR_MISS_COOLDOWN_MS,
  ENV_GLIDE,
  SCORE_COEFFICIENT,
  SCORE_DIGITS,
  MILESTONE_STEP,
  BIG_MILESTONE_STEP,
  BEST_KEY,
  LEGACY_BEST_KEY,
  SOUND_KEY,
  NIGHT_SCORE,
  envIndexAtScore,
  PALETTES,
  SUN_Y_ANCHORS,
  SUN_X_ANCHORS,
  SUN_ALPHA_ANCHORS,
  MOON_ALPHA_ANCHORS,
  STAR_ALPHA_ANCHORS,
  MOON_X,
  MOON_Y,
  SKYLINE_PARALLAX,
  CLOUD_PARALLAX,
  OBSTACLE_DEFS,
  obstacleBottom,
  GROUND_IDS,
  DUCK_GATE_IDS,
  GAP,
  MAX_ON_SCREEN,
  difficultyFactor,
  clamp,
  sampleAnchors,
  randInt,
  type Palette,
  type ObstacleId,
  type ObstacleDef,
} from './tuning';
import {
  buildPikuSheet,
  buildVariantAtlas,
  buildMoonSheet,
  drawText,
  SKYLINE_TILE_HEIGHT,
  SKYLINE_TILE_WIDTH,
  type PikuSheet,
  type PikuFrame,
  type VariantAtlas,
  type MoonSheet,
} from './sprites';

export type GameState =
  | 'READY'
  | 'RUNNING'
  | 'DUCKING'
  | 'JUMPING'
  | 'FALLING'
  | 'HIT'
  | 'GAME_OVER';

export interface PikuGameOptions {
  onGameOver?: (score: number, best: number) => void;
  onScore?: (score: number) => void;
  /** Fired once when Piku crashes (state HIT), before GAME_OVER resolves. */
  onHit?: () => void;
  /** Fired on every "big" milestone (see BIG_MILESTONE_STEP). */
  onBigMilestone?: (score: number) => void;
}

interface Obstacle {
  def: ObstacleDef;
  x: number;
  y: number;
  frame: number;
  frameT: number;
  passed: boolean;
  minGap: number;
}

interface Cloud {
  x: number;
  y: number;
  variant: number;
  speed: number;
}

interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  scroll: boolean;
}

interface Popup {
  active: boolean;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  age: number;
  maxAge: number;
  floats: boolean;
}

interface Star {
  x: number;
  y: number;
  big: boolean;
  phase: number;
}

interface PatternPart {
  id: ObstacleId;
  /** Gap after this part, in frames of travel at the current speed. */
  gapAfter: number;
}

interface PatternDef {
  name: string;
  minScore: number;
  weight: number;
  build: (score: number) => PatternPart[];
}

const PARTICLE_POOL = 48;
const CLOUD_COUNT = 4;
const STAR_COUNT = 30;
const BIG_STAR_COUNT = 4;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function parseHex(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function toHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const hexRgbCache = new Map<string, [number, number, number]>();

function hexRgb(hex: string): [number, number, number] {
  const cached = hexRgbCache.get(hex);
  if (cached) return cached;
  const rgb = parseHex(hex);
  if (hexRgbCache.size > 256) hexRgbCache.clear();
  hexRgbCache.set(hex, rgb);
  return rgb;
}

function mixHex(a: string, b: string, t: number): string {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const [ar, ag, ab] = hexRgb(a);
  const [br, bg, bb] = hexRgb(b);
  return toHex(
    Math.round(ar + (br - ar) * t),
    Math.round(ag + (bg - ag) * t),
    Math.round(ab + (bb - ab) * t),
  );
}

/** Blends the 7 palette anchors into a live palette for the current env level. */
function buildPalette(env: number): Palette {
  const i = Math.floor(env);
  const j = Math.min(PALETTES.length - 1, i + 1);
  const t = env - i;
  if (t <= 0) return PALETTES[i];
  const a = PALETTES[i];
  const b = PALETTES[j];
  const out = {} as Record<keyof Palette, string>;
  (Object.keys(a) as (keyof Palette)[]).forEach((key) => {
    out[key] = mixHex(a[key], b[key], t);
  });
  // HUD ink is a binary axis: dark family over the light skies (0–2), light
  // family over the dark skies (3–6). Interpolating straight across the
  // family boundary produced midtone text with poor contrast over the
  // golden→sunset sky (env ≈ 2.5–2.9), so keep the blend inside one family.
  const [inkA, inkB] =
    env < 2.6
      ? [PALETTES[Math.min(i, 2)], PALETTES[Math.min(j, 2)]]
      : [PALETTES[Math.max(i, 3)], PALETTES[Math.max(j, 3)]];
  out.inkHud = mixHex(inkA.inkHud, inkB.inkHud, t);
  return out as Palette;
}

function readHi(): number {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    if (raw !== null) {
      const v = Number.parseInt(raw, 10);
      if (Number.isFinite(v) && v >= 0) return v;
    }
    const legacy = window.localStorage.getItem(LEGACY_BEST_KEY);
    if (legacy !== null) {
      const v = Number.parseInt(legacy, 10);
      if (Number.isFinite(v) && v >= 0) {
        window.localStorage.setItem(BEST_KEY, String(v));
        return v;
      }
    }
  } catch {
    /* storage unavailable — play without a saved record */
  }
  return 0;
}

function writeHi(value: number): void {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* ignore */
  }
}

function readSound(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== '0';
  } catch {
    return true;
  }
}

function writeSound(on: boolean): void {
  try {
    window.localStorage.setItem(SOUND_KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// WebAudio blips — tiny, soft, all local
// ---------------------------------------------------------------------------

/* Soothing loop: roots walk A–G–F–C, every note from the pentatonic family
 * that sits over them, so any step order stays consonant. */
const MUSIC_STEP_MS = 470;
const MUSIC_CHORDS: ReadonlyArray<{ root: number; notes: readonly number[] }> = [
  { root: 110.0, notes: [220.0, 261.63, 329.63, 392.0, 440.0] },
  { root: 98.0, notes: [196.0, 261.63, 293.66, 349.23, 392.0] },
  { root: 87.31, notes: [174.61, 220.0, 261.63, 349.23, 440.0] },
  { root: 130.81, notes: [261.63, 329.63, 392.0, 493.88, 523.25] },
];
const MUSIC_PATTERN: ReadonlyArray<number> = [0, 2, 4, -1, 3, 2, 1, -1];

class Sfx {
  soundOn = true;

  private ctx: AudioContext | null = null;

  private master: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;

  private musicGain: GainNode | null = null;

  private musicTimer: ReturnType<typeof setInterval> | null = null;

  private musicNext = 0;

  private musicStep = 0;

  /*
   * Generative ambience — a slow pentatonic arpeggio over a soft bass pad,
   * synthesized entirely in WebAudio. No asset, no network, no license to
   * clear, and the same mute flag gates it, so it can never outlive the
   * sound preference. Idempotent: calling while it already runs is a no-op.
   */
  startMusic(): void {
    if (!this.soundOn) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (this.musicTimer !== null) return;
    if (!this.musicGain) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      filter.connect(this.master);
      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.0001;
      this.musicGain.connect(filter);
    }
    const g = this.musicGain.gain;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0.0001, g.value), now);
    g.exponentialRampToValueAtTime(0.55, now + 2);
    this.musicNext = now + 0.2;
    this.musicStep = 0;
    this.musicTimer = setInterval(() => this.pumpMusic(), 250);
    this.pumpMusic();
  }

  /** Fades the loop out and clears the scheduler; safe to call repeatedly. */
  stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    const ctx = this.ctx;
    if (ctx && this.musicGain) {
      const g = this.musicGain.gain;
      const now = ctx.currentTime;
      g.cancelScheduledValues(now);
      g.setValueAtTime(Math.max(0.0001, g.value), now);
      g.exponentialRampToValueAtTime(0.0001, now + 0.35);
    }
  }

  private pumpMusic(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;
    while (this.musicNext < ctx.currentTime + 0.7) {
      const step = this.musicStep;
      const chord = MUSIC_CHORDS[Math.floor(step / 8) % MUSIC_CHORDS.length];
      if (!chord) return;
      const idx = step % 8;
      if (idx === 0) {
        this.musicNote(ctx, chord.root, this.musicNext, 4.2, 'sine', 0.045);
      }
      const pick = MUSIC_PATTERN[idx];
      if (typeof pick === 'number' && pick >= 0) {
        const freq = chord.notes[pick];
        if (typeof freq === 'number') {
          this.musicNote(ctx, freq, this.musicNext, 1.1, 'triangle', 0.026);
        }
      }
      this.musicNext += MUSIC_STEP_MS / 1000;
      this.musicStep += 1;
    }
  }

  private musicNote(
    ctx: AudioContext,
    freq: number,
    when: number,
    dur: number,
    type: OscillatorType,
    gain: number,
  ): void {
    const out = this.musicGain;
    if (!out) return;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(gain, when + 0.12);
    env.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(env);
    env.connect(out);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  unlock(): void {
    this.ensure();
  }

  close(): void {
    this.stopMusic();
    if (this.ctx) {
      void this.ctx.close().catch(() => undefined);
      this.ctx = null;
      this.master = null;
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  private tone(
    f0: number,
    f1: number,
    durMs: number,
    gain: number,
    type: OscillatorType = 'square',
    delayMs = 0,
  ): void {
    if (!this.soundOn) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + delayMs / 1000;
    const dur = durMs / 1000;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env);
    env.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(durMs: number, gain: number, delayMs = 0): void {
    if (!this.soundOn) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (!this.noiseBuffer) {
      const len = Math.max(1, Math.floor(ctx.sampleRate * 0.2));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    const t0 = ctx.currentTime + delayMs / 1000;
    const dur = durMs / 1000;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  jump(): void {
    this.tone(660, 880, 60, 0.05);
  }

  land(): void {
    this.noise(40, 0.04);
  }

  milestone(): void {
    this.tone(988, 988, 50, 0.045, 'triangle');
  }

  bigMilestone(): void {
    this.tone(880, 880, 70, 0.05, 'triangle');
    this.tone(1319, 1319, 90, 0.05, 'triangle', 70);
  }

  nearMiss(): void {
    this.tone(1568, 1568, 40, 0.035, 'triangle');
  }

  hit(): void {
    this.tone(160, 80, 130, 0.06, 'sawtooth');
    this.noise(80, 0.05);
  }

  gameOver(): void {
    this.tone(392, 392, 90, 0.05, 'triangle');
    this.tone(294, 294, 100, 0.05, 'triangle', 110);
    this.tone(196, 196, 180, 0.05, 'triangle', 220);
  }
}

// ---------------------------------------------------------------------------
// Pattern library — every combo respects jump distance and reaction time.
// Gaps are authored in frames of travel and converted using the live speed.
// ---------------------------------------------------------------------------

function pickWeightedGround(score: number): ObstacleId {
  const candidates = GROUND_IDS.filter((id) => OBSTACLE_DEFS[id].minScore <= score);
  if (candidates.length === 0) return GROUND_IDS[0];
  return pickWeighted(candidates);
}

function pickWeightedDuck(score: number): ObstacleId {
  const candidates = DUCK_GATE_IDS.filter((id) => OBSTACLE_DEFS[id].minScore <= score);
  if (candidates.length === 0) return DUCK_GATE_IDS[0];
  return pickWeighted(candidates);
}

function pickWeighted(ids: readonly ObstacleId[]): ObstacleId {
  let total = 0;
  for (const id of ids) total += OBSTACLE_DEFS[id].weight;
  let roll = Math.random() * total;
  for (const id of ids) {
    roll -= OBSTACLE_DEFS[id].weight;
    if (roll <= 0) return id;
  }
  return ids[ids.length - 1];
}

function tailGap(): number {
  return randInt(GAP.BASE_MIN, GAP.BASE_MAX);
}

const PATTERNS: PatternDef[] = [
  {
    name: 'single',
    minScore: 0,
    weight: 12,
    build: (score) => [{ id: pickWeightedGround(score), gapAfter: tailGap() }],
  },
  {
    name: 'pair',
    minScore: 0,
    weight: 10,
    build: (score) => [
      { id: pickWeightedGround(score), gapAfter: randInt(GAP.GROUND_SEP_MIN, GAP.GROUND_SEP_MAX) },
      { id: pickWeightedGround(score), gapAfter: tailGap() },
    ],
  },
  {
    name: 'combo',
    minScore: 150,
    weight: 6,
    build: (score) => [
      { id: pickWeightedGround(score), gapAfter: randInt(GAP.GROUND_COMBO_MIN, GAP.GROUND_COMBO_MAX) },
      { id: pickWeightedGround(score), gapAfter: tailGap() },
    ],
  },
  {
    name: 'duckGate',
    minScore: 520,
    weight: 9,
    build: (score) => [{ id: pickWeightedDuck(score), gapAfter: tailGap() }],
  },
  {
    name: 'boxThenDuck',
    minScore: 660,
    weight: 8,
    build: (score) => [
      { id: pickWeightedGround(score), gapAfter: randInt(GAP.GROUND_DUCK_MIN, GAP.GROUND_DUCK_MIN + 18) },
      { id: pickWeightedDuck(score), gapAfter: tailGap() },
    ],
  },
  {
    name: 'duckThenBox',
    minScore: 820,
    weight: 8,
    build: (score) => [
      { id: pickWeightedDuck(score), gapAfter: randInt(GAP.AFTER_DUCK_MIN, GAP.AFTER_DUCK_MIN + 20) },
      { id: pickWeightedGround(score), gapAfter: tailGap() },
    ],
  },
  {
    name: 'jumpGate',
    minScore: 1100,
    weight: 7,
    build: () => [{ id: 'drone', gapAfter: tailGap() }],
  },
  {
    name: 'jumpThenBox',
    minScore: 1150,
    weight: 5,
    build: (score) => [
      { id: 'drone', gapAfter: randInt(GAP.GROUND_JUMP_MIN, GAP.GROUND_JUMP_MIN + 18) },
      { id: pickWeightedGround(score), gapAfter: tailGap() },
    ],
  },
  {
    name: 'gauntlet',
    minScore: 1400,
    weight: 4,
    build: (score) => [
      { id: pickWeightedGround(score), gapAfter: randInt(GAP.GROUND_SEP_MIN, GAP.GROUND_SEP_MAX) },
      { id: pickWeightedDuck(score), gapAfter: randInt(GAP.AFTER_DUCK_MIN, GAP.AFTER_DUCK_MIN + 20) },
      { id: pickWeightedGround(score), gapAfter: tailGap() },
    ],
  },
];

// ---------------------------------------------------------------------------
// The game
// ---------------------------------------------------------------------------

export class PikuGame {
  private readonly ctx: CanvasRenderingContext2D;

  private readonly opts: PikuGameOptions;

  private readonly sfx = new Sfx();

  private readonly pikuSheet: PikuSheet;

  private readonly moonSheet: MoonSheet;

  private readonly atlases: VariantAtlas[];

  private readonly reducedMotion: boolean;

  private readonly isTouch: boolean;

  private dpr = 1;

  private destroyed = false;

  private paused = false;

  // state machine
  private state: GameState = 'READY';

  private readyAuto = false;

  private readyT = 0;

  private pendingJump = false;

  private crashElapsed = 0;

  private overT = 0;

  private hitT = 0;

  // player
  private py = GROUND_Y;

  private vy = 0;

  private jumping = false;

  private ducking = false;

  private duckHeld = false;

  private speedDrop = false;

  private reachedMinHeight = false;

  private squashT = 0;

  // run
  private speed = SPEED_START;

  private distanceRan = 0;

  private runningTime = 0;

  private score = 0;

  private hi = 0;

  private lastScoreNotified = -1;

  private lastMilestone = 0;

  private flashT = 0;

  private animT = 0;

  private clock = 0;

  private blinkTimer = BLINK_EVERY_MS;

  private blinkT = 0;

  private dustT = 0;

  // environment
  private env = 0;

  private forcedNight = false;

  private palette: Palette = PALETTES[0];

  private paletteKey = -1;

  private atlas: VariantAtlas;

  private atlasKey = 0;

  private moonPhase = 7;

  private moonClock = 0;

  private shootTimer = 8000;

  private shoot: { x: number; y: number; age: number } | null = null;

  // layers
  private groundOffset = 0;

  private skylineOffset = 0;

  private readonly clouds: Cloud[] = [];

  private readonly stars: Star[] = [];

  private readonly obstacles: Obstacle[] = [];

  private nextSpawnGap = 0;

  private readonly particles: Particle[] = [];

  private readonly popups: Popup[] = [];

  private nearMissCooldown = 0;

  constructor(canvas: HTMLCanvasElement, opts: PikuGameOptions = {}) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context unavailable');
    this.ctx = ctx;
    this.opts = opts;

    this.pikuSheet = buildPikuSheet();
    this.moonSheet = buildMoonSheet();
    this.atlases = PALETTES.map((p) => buildVariantAtlas(p));
    this.atlas = this.atlases[0];
    this.hi = readHi();
    this.sfx.soundOn = readSound();

    const mm =
      typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null;
    this.reducedMotion = mm ? mm('(prefers-reduced-motion: reduce)').matches : false;
    this.isTouch = mm ? mm('(pointer: coarse)').matches : false;

    this.seedSky();
    this.seedClouds();
    this.createParticlePool();
    this.nextSpawnGap = Math.round(randInt(GAP.BASE_MIN, GAP.BASE_MAX) * this.speed);
  }

  // ----- public API --------------------------------------------------------

  unlock(): void {
    this.sfx.unlock();
  }

  setDpr(dpr: number): void {
    this.dpr = clamp(dpr, 1, 2);
  }

  getDpr(): number {
    return this.dpr;
  }

  start(): void {
    if (this.destroyed || this.paused) return;
    this.sfx.unlock();
    if (this.state === 'GAME_OVER' || this.state === 'HIT') {
      this.restart();
      return;
    }
    if (this.state === 'READY') {
      if (this.readyAuto) {
        this.pendingJump = true;
        return;
      }
      this.beginRun();
    }
  }

  restart(): void {
    if (this.destroyed) return;
    this.sfx.unlock();
    this.resetRun(true);
  }

  jump(): void {
    if (this.destroyed || this.paused) return;
    if (this.state === 'GAME_OVER' || this.state === 'HIT') return;
    if (this.state === 'READY') {
      if (this.readyAuto) {
        this.pendingJump = true;
        return;
      }
      this.beginRun();
      this.doJump();
      return;
    }
    if (this.jumping) return;
    this.doJump();
  }

  endJump(): void {
    if (!this.jumping) return;
    if (this.reachedMinHeight && this.vy < DROP_VELOCITY) this.vy = DROP_VELOCITY;
  }

  setDucking(down: boolean): void {
    if (this.destroyed || this.paused) return;
    if (this.state === 'GAME_OVER' || this.state === 'HIT') return;
    if (this.state === 'READY') {
      if (!down) return;
      if (this.readyAuto) {
        this.pendingJump = true;
        return;
      }
      this.beginRun();
    }
    this.duckHeld = down;
    if (down) {
      if (this.jumping) {
        if (this.vy < 1) this.vy = 1;
        this.speedDrop = true;
      } else {
        this.ducking = true;
        this.state = 'DUCKING';
      }
    } else {
      this.speedDrop = false;
      this.ducking = false;
      this.state = this.jumping ? (this.vy < 0 ? 'JUMPING' : 'FALLING') : 'RUNNING';
    }
  }

  getScore(): number {
    return this.score;
  }

  getHi(): number {
    return this.hi;
  }

  getState(): GameState {
    return this.state;
  }

  isOver(): boolean {
    return this.state === 'GAME_OVER';
  }

  isPlaying(): boolean {
    const s = this.state;
    return s === 'RUNNING' || s === 'DUCKING' || s === 'JUMPING' || s === 'FALLING';
  }

  isDucking(): boolean {
    return this.state === 'DUCKING';
  }

  isNight(): boolean {
    return this.forcedNight || this.score >= NIGHT_SCORE;
  }

  isPaused(): boolean {
    return this.paused;
  }

  canRestart(): boolean {
    return this.state === 'GAME_OVER' && this.crashElapsed >= GAMEOVER_INPUT_MS;
  }

  forceHit(): void {
    if (this.destroyed) return;
    if (this.state === 'READY') this.beginRun();
    if (this.state === 'GAME_OVER' || this.state === 'HIT') return;
    this.collide();
  }

  forceNight(): void {
    this.forcedNight = true;
    this.env = 6;
    this.paletteKey = -1;
    this.applyEnv();
    this.moonPhase = (this.moonPhase + 1) % 8;
  }

  seekScore(score: number): void {
    const v = Math.max(0, Math.floor(score));
    this.score = v;
    this.distanceRan = v / SCORE_COEFFICIENT;
    this.lastMilestone = Math.floor(v / MILESTONE_STEP);
    this.lastScoreNotified = v;
    if (!this.forcedNight) {
      this.env = envIndexAtScore(v);
      this.paletteKey = -1;
      this.applyEnv();
    }
    this.opts.onScore?.(v);
  }

  setSound(on: boolean): void {
    this.sfx.soundOn = on;
    writeSound(on);
    if (on) {
      this.sfx.unlock();
      if (this.isPlaying()) this.sfx.startMusic();
    } else {
      this.sfx.stopMusic();
    }
  }

  getSound(): boolean {
    return this.sfx.soundOn;
  }

  pause(): void {
    this.paused = true;
    this.sfx.stopMusic();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    if (!this.isPlaying()) return;
    this.sfx.startMusic();
    // Fairness nudge: if the crash course got frozen too close, slide the
    // world right so the player still has a full reaction window.
    let nearest = Number.POSITIVE_INFINITY;
    for (const ob of this.obstacles) {
      if (ob.x + ob.def.w > PIKU_X - 16 && ob.x < nearest) nearest = ob.x;
    }
    if (nearest !== Number.POSITIVE_INFINITY) {
      const minX = PIKU_X + 150;
      if (nearest < minX) {
        const dx = minX - nearest;
        for (const ob of this.obstacles) ob.x += dx;
      }
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.sfx.close();
  }

  // ----- simulation --------------------------------------------------------

  step(): void {
    if (this.destroyed) return;
    const dt = FIXED_STEP_MS;
    this.clock += dt;

    if (this.state === 'HIT') {
      this.hitT += dt;
      this.updateParticles(dt);
      if (this.hitT >= HIT_MS) this.finishCrash();
      return;
    }

    if (this.state === 'GAME_OVER') {
      this.crashElapsed += dt;
      this.overT = Math.min(1, this.overT + dt / OVERLAY_FADE_MS);
      this.updateParticles(dt);
      this.updatePopups(dt);
      return;
    }

    if (this.state === 'READY') {
      this.readyT += dt;
      this.animT += dt;
      this.updateBlink(dt);
      this.updateClouds(dt, false);
      this.updateStars(dt, false);
      this.updateParticles(dt);
      if (this.readyAuto && this.readyT >= READY_MS) this.beginRun();
      return;
    }

    // ----- run -------------------------------------------------------------
    if (this.flashT > 0) this.flashT = Math.max(0, this.flashT - dt);
    if (this.nearMissCooldown > 0) {
      this.nearMissCooldown = Math.max(0, this.nearMissCooldown - dt);
    }
    if (this.squashT > 0) this.squashT = Math.max(0, this.squashT - dt);

    this.runningTime += dt;
    this.animT += dt;
    this.updateBlink(dt);
    this.updateScene(dt);

    if (this.jumping) {
      this.vy += GRAVITY;
      const dy = this.speedDrop ? this.vy * SPEED_DROP_FACTOR : this.vy;
      this.py += dy;
      if (this.py <= GROUND_Y - MIN_JUMP_HEIGHT) this.reachedMinHeight = true;
      if (this.py >= GROUND_Y) {
        this.py = GROUND_Y;
        this.jumping = false;
        this.speedDrop = false;
        this.ducking = this.duckHeld;
        this.state = this.ducking ? 'DUCKING' : 'RUNNING';
        this.squashT = SQUASH_MS;
        this.spawnLandingDust();
        this.sfx.land();
      } else {
        this.state = this.vy < 0 ? 'JUMPING' : 'FALLING';
      }
    } else {
      this.state = this.ducking ? 'DUCKING' : 'RUNNING';
      this.dustT += dt;
      if (this.dustT >= 110) {
        this.dustT = 0;
        this.spawnRunDust();
      }
    }

    this.groundOffset += this.speed;
    if (this.groundOffset >= this.atlas.ground.w) this.groundOffset -= this.atlas.ground.w;
    this.skylineOffset += this.speed * SKYLINE_PARALLAX;
    if (this.skylineOffset >= SKYLINE_TILE_WIDTH) this.skylineOffset -= SKYLINE_TILE_WIDTH;

    this.updateClouds(dt, true);
    this.updateStars(dt, true);

    for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
      const ob = this.obstacles[i];
      ob.x -= this.speed;
      if (ob.def.frames > 1) {
        ob.frameT += dt;
        ob.frame = Math.floor(ob.frameT / ob.def.frameMs) % ob.def.frames;
      }
      if (ob.x + ob.def.w < -8) this.obstacles.splice(i, 1);
    }

    if (this.runningTime > CLEAR_TIME_MS) this.trySpawn();
    if (this.checkCollisions()) return;

    this.distanceRan += this.speed;
    this.speed = Math.min(SPEED_MAX, this.speed + SPEED_GROWTH);
    this.updateScore();

    this.updateParticles(dt);
    this.updatePopups(dt);
  }

  private beginRun(): void {
    this.resetRun(false);
    this.sfx.startMusic();
    if (this.pendingJump) {
      this.pendingJump = false;
      this.doJump();
    }
  }

  private resetRun(asReady: boolean): void {
    this.obstacles.length = 0;
    for (const p of this.particles) p.active = false;
    for (const p of this.popups) p.active = false;

    this.score = 0;
    this.distanceRan = 0;
    this.runningTime = 0;
    this.speed = SPEED_START;
    this.lastMilestone = 0;
    this.lastScoreNotified = -1;
    this.flashT = 0;
    this.nearMissCooldown = 0;
    this.dustT = 0;
    this.nextSpawnGap = Math.round(randInt(GAP.BASE_MIN, GAP.BASE_MAX) * this.speed);
    this.py = GROUND_Y;
    this.vy = 0;
    this.jumping = false;
    this.ducking = false;
    this.duckHeld = false;
    this.speedDrop = false;
    this.reachedMinHeight = false;
    this.squashT = 0;
    this.crashElapsed = 0;
    this.overT = 0;
    this.hitT = 0;
    this.animT = 0;
    this.pendingJump = false;
    this.readyT = 0;
    this.readyAuto = asReady;
    this.state = asReady ? 'READY' : 'RUNNING';
    this.opts.onScore?.(0);
  }

  private doJump(): void {
    if (this.jumping) return;
    this.ducking = false;
    this.vy = JUMP_VELOCITY + this.speed * JUMP_SPEED_KICK;
    this.jumping = true;
    this.reachedMinHeight = false;
    this.speedDrop = false;
    this.state = 'JUMPING';
    this.sfx.jump();
  }

  private collide(): void {
    if (this.state === 'HIT' || this.state === 'GAME_OVER') return;
    this.state = 'HIT';
    this.hitT = 0;
    this.crashElapsed = 0;
    this.sfx.hit();
    this.sfx.stopMusic();
    this.opts.onHit?.();
    const n = this.reducedMotion ? 4 : 8;
    for (let i = 0; i < n; i += 1) {
      this.spawnParticle(
        PIKU_X + 14,
        GROUND_Y - randInt(4, 22),
        (Math.random() - 0.2) * 1.6,
        -Math.random() * 1.4,
        380 + Math.random() * 260,
        1,
        i % 2 === 0 ? this.palette.ribbon : this.palette.cream,
        0.12,
        false,
      );
    }
    if (this.score > this.hi) {
      this.hi = this.score;
      writeHi(this.hi);
    }
  }

  private finishCrash(): void {
    this.state = 'GAME_OVER';
    this.crashElapsed = 0;
    this.overT = 0;
    this.sfx.gameOver();
    this.opts.onGameOver?.(this.score, this.hi);
  }

  private playerBox(): { x: number; y: number; w: number; h: number } {
    const box = this.ducking ? PIKU_HITBOX_DUCK : PIKU_HITBOX_RUN;
    const top = Math.round(this.py) - (this.ducking ? PIKU_DUCK_H : PIKU_H);
    return { x: PIKU_X + box.x, y: top + box.y, w: box.w, h: box.h };
  }

  private checkCollisions(): boolean {
    const pb = this.playerBox();
    for (const ob of this.obstacles) {
      let overlapX = false;
      let gap = Number.POSITIVE_INFINITY;
      for (const hb of ob.def.hitboxes) {
        const ox = ob.x + hb.x;
        const oy = ob.y + hb.y;
        if (
          pb.x < ox + hb.w &&
          pb.x + pb.w > ox &&
          pb.y < oy + hb.h &&
          pb.y + pb.h > oy
        ) {
          this.collide();
          return true;
        }
        if (pb.x < ox + hb.w && pb.x + pb.w > ox) {
          overlapX = true;
          const vGap = Math.max(0, Math.max(pb.y - (oy + hb.h), oy - (pb.y + pb.h)));
          if (vGap < gap) gap = vGap;
        }
      }
      if (overlapX && gap < ob.minGap) ob.minGap = gap;
      if (!ob.passed && ob.x + ob.def.w < PIKU_X) {
        ob.passed = true;
        const intendedDuck = this.ducking && ob.def.band === 'duckGate';
        if (ob.minGap >= 1 && ob.minGap <= 8 && !intendedDuck) this.handleNearMiss(ob);
      }
    }
    return false;
  }

  private handleNearMiss(ob: Obstacle): void {
    if (this.nearMissCooldown > 0) return;
    this.nearMissCooldown = NEAR_MISS_COOLDOWN_MS;
    this.spawnPopup(
      'NICE!',
      clamp(ob.x + ob.def.w / 2, 70, 300),
      ob.y - 10,
      this.palette.ribbon,
      1,
      NEAR_MISS_MS,
      true,
    );
    this.sfx.nearMiss();
    const n = this.reducedMotion ? 2 : 4;
    for (let i = 0; i < n; i += 1) {
      this.spawnParticle(
        ob.x + ob.def.w / 2,
        ob.y + ob.def.h / 2,
        (Math.random() - 0.5) * 0.9,
        -Math.random() * 0.6,
        300,
        1,
        this.palette.ribbon,
        0.04,
        false,
      );
    }
  }

  private updateScene(dt: number): void {
    const target = this.forcedNight ? 6 : envIndexAtScore(this.score);
    if (this.env !== target) {
      if (this.reducedMotion) {
        this.env = target;
      } else {
        const diff = target - this.env;
        this.env += clamp(diff, -ENV_GLIDE, ENV_GLIDE);
      }
    }
    this.applyEnv();

    if (this.env >= 5.4) {
      this.moonClock += dt;
      if (this.moonClock > 42000) {
        this.moonClock = 0;
        this.moonPhase = (this.moonPhase + 1) % 8;
      }
      if (!this.reducedMotion) {
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && !this.shoot) {
          this.shoot = { x: randInt(140, 360), y: randInt(8, 36), age: 0 };
          this.shootTimer = randInt(30000, 55000);
        }
      }
    }
    if (this.shoot) {
      this.shoot.age += dt;
      this.shoot.x -= 3.2;
      this.shoot.y += 1.5;
      if (this.shoot.age > 900 || this.shoot.x < -30) this.shoot = null;
    }
  }

  private applyEnv(): void {
    const idx = Math.round(this.env);
    if (idx !== this.atlasKey && this.atlases[idx]) {
      this.atlasKey = idx;
      this.atlas = this.atlases[idx];
    }
    const q = Math.round(this.env * 64);
    if (q !== this.paletteKey) {
      this.paletteKey = q;
      this.palette = buildPalette(clamp(this.env, 0, 6));
    }
  }

  private updateScore(): void {
    const next = Math.round(this.distanceRan * SCORE_COEFFICIENT);
    if (next === this.score) return;
    this.score = next;
    this.lastScoreNotified = next;
    this.opts.onScore?.(next);

    const m = Math.floor(this.score / MILESTONE_STEP);
    if (m > this.lastMilestone) {
      const delta = m - this.lastMilestone;
      this.lastMilestone = m;
      if (delta < 50) {
        const isBig = m % (BIG_MILESTONE_STEP / MILESTONE_STEP) === 0;
        if (isBig) {
          this.spawnPopup(
            `${m * MILESTONE_STEP}!`,
            CANVAS_WIDTH / 2,
            34,
            this.palette.ribbon,
            2,
            1100,
            true,
          );
          this.sparkleBurst(CANVAS_WIDTH / 2, 44);
          this.sfx.bigMilestone();
          this.opts.onBigMilestone?.(this.score);
        } else {
          this.flashT = 320;
          this.sfx.milestone();
        }
      }
    }
  }

  private trySpawn(): void {
    if (this.obstacles.length >= MAX_ON_SCREEN) return;
    let rightmost = Number.NEGATIVE_INFINITY;
    for (const ob of this.obstacles) {
      const right = ob.x + ob.def.w;
      if (right > rightmost) rightmost = right;
    }
    if (rightmost > CANVAS_WIDTH - this.nextSpawnGap) return;

    const pattern = this.pickPattern();
    const df = difficultyFactor(this.score);
    const parts = pattern.build(this.score);
    let x = CANVAS_WIDTH + 6;
    for (const part of parts) {
      const def = OBSTACLE_DEFS[part.id];
      this.obstacles.push({
        def,
        x,
        y: obstacleBottom(def) - def.h,
        frame: 0,
        frameT: 0,
        passed: false,
        minGap: Number.POSITIVE_INFINITY,
      });
      x += def.w + Math.round(part.gapAfter * this.speed * df);
    }
    const tail = parts[parts.length - 1].gapAfter;
    this.nextSpawnGap = Math.round(tail * this.speed * df);
  }

  private pickPattern(): PatternDef {
    const options = PATTERNS.filter((p) => p.minScore <= this.score);
    let total = 0;
    for (const p of options) total += p.weight;
    let roll = Math.random() * total;
    for (const p of options) {
      roll -= p.weight;
      if (roll <= 0) return p;
    }
    return PATTERNS[0];
  }

  private updateBlink(dt: number): void {
    if (this.state !== 'READY' && this.state !== 'RUNNING') return;
    if (this.blinkT > 0) {
      this.blinkT -= dt;
      if (this.blinkT <= 0) this.blinkTimer = BLINK_EVERY_MS;
    } else {
      this.blinkTimer -= dt;
      if (this.blinkTimer <= 0) this.blinkT = BLINK_MS;
    }
  }

  private updateClouds(dt: number, scroll: boolean): void {
    const k = dt / FIXED_STEP_MS;
    for (const cloud of this.clouds) {
      cloud.x -= (cloud.speed + (scroll ? this.speed * CLOUD_PARALLAX : 0.05)) * k;
      if (cloud.x + 40 < 0) {
        cloud.x = CANVAS_WIDTH + randInt(40, 140);
        cloud.y = randInt(16, 62);
        cloud.variant = randInt(0, this.atlas.clouds.length - 1);
      }
    }
  }

  private updateStars(dt: number, scroll: boolean): void {
    const k = dt / FIXED_STEP_MS;
    for (const star of this.stars) {
      star.x -= (scroll ? this.speed * 0.02 : 0.012) * k;
      if (star.x < -4) {
        star.x += CANVAS_WIDTH + 8;
        star.y = randInt(4, 92);
      }
    }
  }

  private createParticlePool(): void {
    for (let i = 0; i < PARTICLE_POOL; i += 1) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 1,
        color: '#FFFFFF',
        gravity: 0,
        scroll: false,
      });
    }
  }

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
    color: string,
    gravity: number,
    scroll: boolean,
  ): void {
    const p = this.particles.find((q) => !q.active);
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
    p.size = size;
    p.color = color;
    p.gravity = gravity;
    p.scroll = scroll;
  }

  private updateParticles(dt: number): void {
    const k = dt / FIXED_STEP_MS;
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      if (p.scroll) p.x -= this.speed * k;
      if (p.y > CANVAS_HEIGHT || p.x < -6) p.active = false;
    }
  }

  private spawnPopup(
    text: string,
    x: number,
    y: number,
    color: string,
    scale: number,
    maxAge: number,
    floats: boolean,
  ): void {
    let popup = this.popups.find((p) => !p.active);
    if (!popup) {
      if (this.popups.length >= 8) {
        popup = this.popups[0];
      } else {
        popup = {
          active: false,
          text: '',
          x: 0,
          y: 0,
          color: '#FFFFFF',
          scale: 1,
          age: 0,
          maxAge: 1,
          floats: false,
        };
        this.popups.push(popup);
      }
    }
    popup.active = true;
    popup.text = text;
    popup.x = x;
    popup.y = y;
    popup.color = color;
    popup.scale = scale;
    popup.age = 0;
    popup.maxAge = maxAge;
    popup.floats = floats;
  }

  private updatePopups(dt: number): void {
    for (const p of this.popups) {
      if (!p.active) continue;
      p.age += dt;
      if (p.floats && !this.reducedMotion) p.y -= 0.18;
      if (p.age >= p.maxAge) p.active = false;
    }
  }

  private spawnRunDust(): void {
    this.spawnParticle(
      PIKU_X + randInt(1, 6),
      GROUND_Y - 1,
      -this.speed * 0.25 - Math.random() * 0.3,
      -Math.random() * 0.4,
      280 + Math.random() * 140,
      1,
      this.palette.speckle,
      0.02,
      false,
    );
  }

  private spawnLandingDust(): void {
    const n = this.reducedMotion ? 2 : 5;
    for (let i = 0; i < n; i += 1) {
      this.spawnParticle(
        PIKU_X + randInt(2, 16),
        GROUND_Y - 1,
        -this.speed * 0.2 - Math.random() * 0.7,
        -Math.random() * 0.7,
        300 + Math.random() * 180,
        1,
        this.palette.speckle,
        0.03,
        false,
      );
    }
  }

  private sparkleBurst(x: number, y: number): void {
    const n = this.reducedMotion ? 3 : 8;
    for (let i = 0; i < n; i += 1) {
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.6;
      this.spawnParticle(
        x,
        y,
        Math.cos(ang) * 1.1,
        Math.sin(ang) * 0.9 - 0.4,
        420 + Math.random() * 240,
        2,
        i % 2 === 0 ? this.palette.ribbon : this.palette.blueLight,
        0.06,
        false,
      );
    }
  }

  private seedSky(): void {
    for (let i = 0; i < STAR_COUNT; i += 1) {
      this.stars.push({
        x: randInt(0, CANVAS_WIDTH),
        y: randInt(4, 92),
        big: i < BIG_STAR_COUNT,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private seedClouds(): void {
    for (let i = 0; i < CLOUD_COUNT; i += 1) {
      this.clouds.push({
        x: Math.round((CANVAS_WIDTH / CLOUD_COUNT) * i + randInt(-30, 30)),
        y: randInt(16, 62),
        variant: randInt(0, 2),
        speed: 0.02 + Math.random() * 0.04,
      });
    }
  }

  // ----- rendering ---------------------------------------------------------

  draw(): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const pal = this.palette;

    this.drawSky(pal);
    this.drawStars(this.env);
    this.drawMoon(this.env);
    this.drawSun(this.env);
    this.drawSkyline();
    this.drawClouds();
    this.drawGround();
    this.drawObstacles();
    this.drawPiku();
    this.drawParticles();
    this.drawPopups();
    if (this.state === 'READY') this.drawReady();
    this.drawHud();
    if (this.state === 'GAME_OVER') this.drawGameOver();
  }

  private readonly checkerCache = new Map<string, CanvasPattern | null>();

  private checker(color: string): CanvasPattern | null {
    const cached = this.checkerCache.get(color);
    if (cached !== undefined) return cached;
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 1;
    const cc = c.getContext('2d');
    let pat: CanvasPattern | null = null;
    if (cc) {
      cc.fillStyle = color;
      cc.fillRect(0, 0, 1, 1);
      pat = this.ctx.createPattern(c, 'repeat');
    }
    if (this.checkerCache.size > 96) this.checkerCache.clear();
    this.checkerCache.set(color, pat);
    return pat;
  }

  /** A 50% checker seam so sky bands melt into each other. */
  private dither(y: number, color: string): void {
    const pat = this.checker(color);
    if (!pat) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = pat;
    ctx.fillRect(0, y, CANVAS_WIDTH, 1);
    ctx.restore();
  }

  private drawSky(pal: Palette): void {
    const ctx = this.ctx;
    ctx.fillStyle = pal.skyTop;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 44);
    ctx.fillStyle = pal.skyMid;
    ctx.fillRect(0, 44, CANVAS_WIDTH, 34);
    ctx.fillStyle = pal.skyLow;
    ctx.fillRect(0, 78, CANVAS_WIDTH, 26);
    ctx.fillStyle = pal.horizon;
    ctx.fillRect(0, 104, CANVAS_WIDTH, 14);
    this.dither(43, pal.skyMid);
    this.dither(77, pal.skyLow);
    this.dither(103, pal.horizon);

    if (this.env > 0.7 && this.env < 5.2) {
      const a = 0.28 * Math.max(0, 1 - Math.abs((this.env - 2.6) / 2.4));
      if (a > 0.01) {
        ctx.globalAlpha = a;
        ctx.fillStyle = pal.horizonGlow;
        ctx.fillRect(0, 94, CANVAS_WIDTH, 24);
        ctx.globalAlpha = 1;
      }
    }
  }

  private drawStars(env: number): void {
    const base = sampleAnchors(STAR_ALPHA_ANCHORS, env);
    if (base <= 0.01) return;
    const ctx = this.ctx;
    for (const star of this.stars) {
      let tw = 1;
      if (star.big && !this.reducedMotion) {
        tw = 0.65 + 0.35 * Math.sin(this.clock * 0.003 + star.phase);
      }
      ctx.globalAlpha = base * tw;
      ctx.fillStyle = star.big ? '#F1F5F9' : '#CBD5E1';
      const s = star.big ? 2 : 1;
      ctx.fillRect(Math.round(star.x), star.y, s, s);
    }
    if (this.shoot) {
      const t = clamp(this.shoot.age / 900, 0, 1);
      ctx.globalAlpha = (1 - t) * base * 0.9;
      ctx.fillStyle = '#F8FAFC';
      const sx = Math.round(this.shoot.x);
      const sy = Math.round(this.shoot.y);
      ctx.fillRect(sx, sy, 2, 1);
      ctx.fillRect(sx + 3, sy - 2, 1, 1);
      ctx.fillRect(sx + 6, sy - 4, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  private drawMoon(env: number): void {
    const a = sampleAnchors(MOON_ALPHA_ANCHORS, env);
    if (a <= 0.01) return;
    const frame = this.moonSheet.frames[this.moonPhase];
    const ctx = this.ctx;
    ctx.globalAlpha = a;
    ctx.drawImage(
      this.moonSheet.canvas,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      MOON_X,
      MOON_Y,
      frame.w,
      frame.h,
    );
    ctx.globalAlpha = 1;
  }

  private drawSun(env: number): void {
    const a = sampleAnchors(SUN_ALPHA_ANCHORS, env);
    if (a <= 0.01) return;
    const x = Math.round(sampleAnchors(SUN_X_ANCHORS, env));
    const y = Math.round(sampleAnchors(SUN_Y_ANCHORS, env));
    const rect = this.atlas.sun;
    const ctx = this.ctx;
    ctx.globalAlpha = a;
    ctx.drawImage(this.atlas.canvas, rect.x, rect.y, rect.w, rect.h, x, y, rect.w, rect.h);
    ctx.globalAlpha = 1;
  }

  private drawSkyline(): void {
    const rect = this.atlas.skyline;
    const y = GROUND_Y - SKYLINE_TILE_HEIGHT;
    const ctx = this.ctx;
    for (let i = 0; i <= 2; i += 1) {
      const x = Math.round(i * SKYLINE_TILE_WIDTH - this.skylineOffset);
      if (x > CANVAS_WIDTH || x + SKYLINE_TILE_WIDTH < 0) continue;
      ctx.drawImage(this.atlas.canvas, rect.x, rect.y, rect.w, rect.h, x, y, rect.w, rect.h);
    }
  }

  private drawClouds(): void {
    const ctx = this.ctx;
    const count = this.atlas.clouds.length;
    for (const cloud of this.clouds) {
      const rect = this.atlas.clouds[cloud.variant % count];
      ctx.drawImage(
        this.atlas.canvas,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        Math.round(cloud.x),
        cloud.y,
        rect.w,
        rect.h,
      );
    }
  }

  private drawGround(): void {
    const rect = this.atlas.ground;
    const ctx = this.ctx;
    const off = Math.floor(this.groundOffset);
    for (let i = 0; i <= 2; i += 1) {
      const x = i * rect.w - off;
      if (x > CANVAS_WIDTH || x + rect.w < 0) continue;
      ctx.drawImage(this.atlas.canvas, rect.x, rect.y, rect.w, rect.h, x, GROUND_Y, rect.w, rect.h);
    }
  }

  private drawObstacles(): void {
    const ctx = this.ctx;
    for (const ob of this.obstacles) {
      const frames = this.atlas.obstacles[ob.def.id].frames;
      const rect = frames[Math.min(ob.frame, frames.length - 1)];
      if (ob.def.band !== 'ground') {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(Math.round(ob.x + ob.def.w * 0.15), GROUND_Y + 1, Math.round(ob.def.w * 0.7), 1);
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(
        this.atlas.canvas,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        Math.round(ob.x),
        Math.round(ob.y),
        rect.w,
        rect.h,
      );
    }
  }

  private pikuFrame(): PikuFrame {
    switch (this.state) {
      case 'READY':
        return this.blinkT > 0 ? 'idleBlink' : 'idle';
      case 'DUCKING':
        return Math.floor(this.animT / DUCK_FRAME_MS) % 2 === 0 ? 'duck0' : 'duck1';
      case 'JUMPING':
        return 'jump';
      case 'FALLING':
        return 'fall';
      case 'HIT':
        return 'hit';
      case 'GAME_OVER':
        return 'over';
      default: {
        const i = Math.floor(this.animT / RUN_FRAME_MS) % 4;
        return i === 0 ? 'run0' : i === 1 ? 'run1' : i === 2 ? 'run2' : 'run3';
      }
    }
  }

  private drawPiku(): void {
    const ctx = this.ctx;
    const frame = this.pikuFrame();
    const rect = this.pikuSheet.frames[frame];
    const feet = Math.round(this.py);
    const jolt =
      this.state === 'HIT' && !this.reducedMotion && Math.floor(this.hitT / 55) % 2 === 1
        ? 1
        : 0;
    const squash = this.squashT > 0 ? 1 : 0;
    const dx = PIKU_X + jolt;
    const dy = feet - rect.h + squash;

    const shAlpha = clamp(0.22 - (GROUND_Y - this.py) * 0.004, 0.06, 0.22);
    const shW = Math.round(rect.w * (this.ducking ? 0.9 : 0.7));
    ctx.globalAlpha = shAlpha;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(Math.round(PIKU_X + (rect.w - shW) / 2), GROUND_Y + 1, shW, 1);
    ctx.globalAlpha = 1;

    ctx.drawImage(
      this.pikuSheet.canvas,
      rect.x,
      rect.y,
      rect.w,
      rect.h,
      dx,
      dy,
      rect.w,
      rect.h,
    );

    const rim = clamp((this.env - 3.2) / 1.6, 0, 1);
    if (rim > 0.02) {
      ctx.globalAlpha = rim * 0.85;
      ctx.drawImage(this.pikuSheet.rim, rect.x, rect.y, rect.w, rect.h, dx, dy, rect.w, rect.h);
      ctx.globalAlpha = 1;
    }
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    for (const p of this.particles) {
      if (!p.active) continue;
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  private drawPopups(): void {
    const ctx = this.ctx;
    for (const p of this.popups) {
      if (!p.active) continue;
      const t = p.age / p.maxAge;
      const alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      ctx.globalAlpha = clamp(alpha, 0, 1);
      drawText(ctx, p.text, p.x, Math.round(p.y), p.color, p.scale, 'center');
    }
    ctx.globalAlpha = 1;
  }

  private drawHud(): void {
    const ctx = this.ctx;
    const pal = this.palette;
    const right = CANVAS_WIDTH - 6;
    const scoreStr = String(this.score).padStart(SCORE_DIGITS, '0');
    const hiStr = String(this.hi).padStart(SCORE_DIGITS, '0');
    ctx.globalAlpha = 0.6;
    drawText(ctx, `HI ${hiStr}`, right, 5, pal.inkHud, 1, 'right');
    ctx.globalAlpha = 1;
    const color = this.flashT > 0 ? pal.ribbon : pal.inkHud;
    drawText(ctx, scoreStr, right, 15, color, 1, 'right');
  }

  private drawReady(): void {
    if (this.readyAuto) return;
    const ctx = this.ctx;
    const pal = this.palette;
    const cx = CANVAS_WIDTH / 2;
    ctx.globalAlpha = 0.55;
    drawText(ctx, 'AVAGIFTS PRESENTS', cx, 24, pal.inkHud, 1, 'center');
    ctx.globalAlpha = 1;
    drawText(ctx, 'PIKU RUNNER', cx, 36, pal.inkHud, 2, 'center');
    const hint = this.isTouch ? 'TAP TO RUN' : 'PRESS SPACE TO RUN';
    if (this.reducedMotion || Math.floor(this.clock / 500) % 2 === 0) {
      drawText(ctx, hint, cx, 100, pal.inkHud, 1, 'center');
    }
  }

  private drawGameOver(): void {
    const ramp = this.overT;
    if (ramp <= 0) return;
    const ctx = this.ctx;
    const pal = this.palette;

    ctx.globalAlpha = 0.68 * ramp;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.globalAlpha = ramp;
    const x = 112;
    const y = 32;
    const w = 176;
    const h = 88;
    ctx.fillStyle = 'rgba(11,17,32,0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(96,165,250,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = pal.ribbon;
    ctx.fillRect(x + 3, y + 3, 2, 2);
    ctx.fillRect(x + w - 5, y + 3, 2, 2);
    ctx.fillRect(x + 3, y + h - 5, 2, 2);
    ctx.fillRect(x + w - 5, y + h - 5, 2, 2);

    const cx = x + w / 2;
    drawText(ctx, 'PIKU', cx, y + 8, pal.ribbon, 1, 'center');
    drawText(ctx, 'GAME OVER', cx, y + 18, pal.cream, 2, 'center');
    drawText(
      ctx,
      `SCORE ${String(this.score).padStart(SCORE_DIGITS, '0')}`,
      cx,
      y + 40,
      pal.cream,
      1,
      'center',
    );
    drawText(
      ctx,
      `BEST ${String(this.hi).padStart(SCORE_DIGITS, '0')}`,
      cx,
      y + 50,
      pal.cloudShade,
      1,
      'center',
    );

    ctx.globalAlpha = ramp * 0.35;
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(x + 18, y + 63, w - 36, 1);
    ctx.globalAlpha = ramp;

    if (this.crashElapsed >= GAMEOVER_INPUT_MS) {
      if (this.reducedMotion || Math.floor(this.clock / 450) % 2 === 0) {
        const hint = this.isTouch ? 'TAP TO RUN AGAIN' : '[SPACE] RUN AGAIN';
        drawText(ctx, hint, cx, y + 72, pal.cream, 1, 'center');
      }
    }
    ctx.globalAlpha = 1;
  }
}
