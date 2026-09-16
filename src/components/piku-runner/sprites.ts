/**
 * Piku Runner — rasteriser.
 *
 * Turns the character-map art in `piku-art.ts` into offscreen canvases:
 *   - one Piku sheet (all animation frames + a rim-light overlay for night)
 *   - one variant atlas per environment keyframe (obstacles, clouds, sun,
 *     ground tile, skyline tile)
 *   - a moon phase sheet
 *   - a 5×7 pixel font with a small glyph cache
 *
 * Everything here is deterministic and offline — no images, no fonts.
 */

import {
  type ObstacleId,
  type Palette,
  OBSTACLE_DEFS,
  GROUND_TILE_WIDTH,
} from './tuning';
import {
  type Art,
  PIKU_COLORS,
  HEAD_NORMAL,
  HEAD_BLINK,
  HEAD_ALERT,
  HEAD_HIT,
  HEAD_TIRED,
  TORSO_TUCKED,
  TORSO_SPREAD,
  TORSO_DROOP,
  FEET_A,
  FEET_B,
  FEET_C,
  FEET_D,
  FEET_TUCK,
  FEET_DOWN,
  DUCK_0,
  DUCK_1,
  GIFT_SMALL,
  GIFT_MED,
  CRATE,
  GIFT_BAG,
  RIBBON_BUNDLE,
  PARCEL_STACK,
  TALL_BOX,
  GIFT_STACK,
  PLANE_0,
  PLANE_1,
  FLYING_GIFT_0,
  FLYING_GIFT_1,
  DRONE_0,
  DRONE_1,
  BALLOON_PARCEL_0,
  BALLOON_PARCEL_1,
  CLOUD_A,
  CLOUD_B,
  CLOUD_C,
} from './piku-art';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

export interface AtlasRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface VariantAtlas {
  canvas: HTMLCanvasElement;
  obstacles: Record<ObstacleId, { frames: AtlasRect[] }>;
  clouds: AtlasRect[];
  sun: AtlasRect;
  ground: AtlasRect;
  skyline: AtlasRect;
}

export type PikuFrame =
  | 'idle'
  | 'idleBlink'
  | 'run0'
  | 'run1'
  | 'run2'
  | 'run3'
  | 'jump'
  | 'fall'
  | 'duck0'
  | 'duck1'
  | 'hit'
  | 'over';

export interface PikuSheet {
  canvas: HTMLCanvasElement;
  rim: HTMLCanvasElement;
  frames: Record<PikuFrame, AtlasRect>;
}

export interface MoonSheet {
  canvas: HTMLCanvasElement;
  frames: AtlasRect[];
}

export type CharMap = Record<string, string>;

/* ------------------------------------------------------------------ */
/* Low-level helpers                                                    */
/* ------------------------------------------------------------------ */

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  return ctx;
}

/** Rasterise string art at 1:1, merging horizontal runs of one colour. */
export function drawArt(
  ctx: CanvasRenderingContext2D,
  art: Art,
  map: CharMap,
  dx: number,
  dy: number,
  scale = 1,
): void {
  for (let y = 0; y < art.length; y++) {
    const row = art[y];
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      const color = map[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(dx + x * scale, dy + y * scale, run * scale, scale);
      }
      x += run;
    }
  }
}

function artGrid(art: Art): boolean[][] {
  return art.map((row) => Array.from(row, (ch) => ch !== '.' && ch !== ' '));
}

function validateArt(name: string, art: Art): void {
  if (process.env.NODE_ENV === 'production') return;
  const w = art[0]?.length ?? 0;
  for (let i = 0; i < art.length; i++) {
    if (art[i].length !== w) {
      console.warn(`[piku-runner] art "${name}" row ${i} width ${art[i].length} ≠ ${w}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Piku sheet                                                           */
/* ------------------------------------------------------------------ */

function compose(head: Art, torso: Art, feet: Art): Art {
  return [...head, ...torso, ...feet];
}

const PIKU_MAP: CharMap = {
  K: PIKU_COLORS.ink,
  W: PIKU_COLORS.white,
  S: PIKU_COLORS.whiteShade,
  B: PIKU_COLORS.shirt,
  L: PIKU_COLORS.shirtLight,
  D: PIKU_COLORS.shirtDark,
  O: PIKU_COLORS.orange,
  o: PIKU_COLORS.orangeDark,
  G: PIKU_COLORS.glasses,
};

const PIKU_FRAME_ART: Record<PikuFrame, Art> = {
  idle: compose(HEAD_NORMAL, TORSO_TUCKED, FEET_A),
  idleBlink: compose(HEAD_BLINK, TORSO_TUCKED, FEET_A),
  run0: compose(HEAD_NORMAL, TORSO_TUCKED, FEET_A),
  run1: compose(HEAD_NORMAL, TORSO_TUCKED, FEET_B),
  run2: compose(HEAD_NORMAL, TORSO_TUCKED, FEET_C),
  run3: compose(HEAD_NORMAL, TORSO_TUCKED, FEET_D),
  jump: compose(HEAD_ALERT, TORSO_SPREAD, FEET_TUCK),
  fall: compose(HEAD_ALERT, TORSO_SPREAD, FEET_DOWN),
  duck0: DUCK_0,
  duck1: DUCK_1,
  hit: compose(HEAD_HIT, TORSO_TUCKED, FEET_A),
  over: compose(HEAD_TIRED, TORSO_DROOP, FEET_A),
};

const PIKU_FRAME_ORDER: PikuFrame[] = [
  'idle',
  'idleBlink',
  'run0',
  'run1',
  'run2',
  'run3',
  'jump',
  'fall',
  'duck0',
  'duck1',
  'hit',
  'over',
];

export function buildPikuSheet(): PikuSheet {
  let totalH = 0;
  let maxW = 0;
  for (const name of PIKU_FRAME_ORDER) {
    const art = PIKU_FRAME_ART[name];
    validateArt(`piku:${name}`, art);
    totalH += art.length;
    maxW = Math.max(maxW, art[0].length);
  }

  const canvas = makeCanvas(maxW, totalH);
  const rim = makeCanvas(maxW, totalH);
  const ctx = ctx2d(canvas);
  const rimCtx = ctx2d(rim);
  const frames = {} as Record<PikuFrame, AtlasRect>;

  let y = 0;
  for (const name of PIKU_FRAME_ORDER) {
    const art = PIKU_FRAME_ART[name];
    const h = art.length;
    const w = art[0].length;
    drawArt(ctx, art, PIKU_MAP, 0, y);

    // Rim light: silhouette pixels with an empty right / top-right neighbour.
    const grid = artGrid(art);
    rimCtx.fillStyle = PIKU_COLORS.rim;
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        if (!grid[row][col]) continue;
        const rightEmpty = col + 1 >= w || !grid[row][col + 1];
        const topRightEmpty =
          row - 1 < 0 || col + 1 >= w || !grid[row - 1][col + 1];
        if (rightEmpty || topRightEmpty) rimCtx.fillRect(col, y + row, 1, 1);
      }
    }

    frames[name] = { x: 0, y, w, h };
    y += h;
  }

  return { canvas, rim, frames };
}

/* ------------------------------------------------------------------ */
/* Obstacle + cloud art registry                                        */
/* ------------------------------------------------------------------ */

const OBSTACLE_ART: Record<ObstacleId, Art[]> = {
  giftSmall: [GIFT_SMALL],
  giftMed: [GIFT_MED],
  crate: [CRATE],
  giftBag: [GIFT_BAG],
  ribbonBundle: [RIBBON_BUNDLE],
  parcelStack: [PARCEL_STACK],
  tallBox: [TALL_BOX],
  giftStack: [GIFT_STACK],
  paperPlane: [PLANE_0, PLANE_1],
  flyingGift: [FLYING_GIFT_0, FLYING_GIFT_1],
  drone: [DRONE_0, DRONE_1],
  balloonParcel: [BALLOON_PARCEL_0, BALLOON_PARCEL_1],
};

const OBSTACLE_MAP: CharMap = {
  c: 'cream',
  d: 'creamDark',
  b: 'blue',
  n: 'blueDark',
  l: 'blueLight',
  r: 'ribbon',
  x: 'ribbonDark',
  w: 'wood',
  o: 'woodDark',
  y: 'woodLight',
  p: 'paper',
  s: 'paperShade',
  e: 'paperEdge',
  k: 'propInk',
};

function obstacleCharMap(p: Palette): CharMap {
  const out: CharMap = {};
  for (const [ch, slot] of Object.entries(OBSTACLE_MAP)) {
    out[ch] = p[slot as keyof Palette];
  }
  return out;
}

/** Resolves cloud art chars against the live palette, like obstacles do. */
function cloudCharMap(p: Palette): CharMap {
  return { c: p.cloud, d: p.cloudShade };
}

/* ------------------------------------------------------------------ */
/* Ground tile                                                          */
/* ------------------------------------------------------------------ */

export const GROUND_TILE_HEIGHT = 32;

function buildGroundTile(p: Palette): HTMLCanvasElement {
  const c = makeCanvas(GROUND_TILE_WIDTH, GROUND_TILE_HEIGHT);
  const ctx = ctx2d(c);

  ctx.fillStyle = p.groundDeep;
  ctx.fillRect(0, 0, GROUND_TILE_WIDTH, GROUND_TILE_HEIGHT);
  ctx.fillStyle = p.groundBase;
  ctx.fillRect(0, 0, GROUND_TILE_WIDTH, 14);
  ctx.fillStyle = p.groundDark;
  ctx.fillRect(0, 14, GROUND_TILE_WIDTH, 2);
  ctx.fillStyle = p.groundLine;
  ctx.fillRect(0, 1, GROUND_TILE_WIDTH, 2);
  ctx.fillStyle = p.groundLight;
  ctx.fillRect(0, 0, GROUND_TILE_WIDTH, 1);

  // Deterministic speckles + tiny cracks.
  ctx.fillStyle = p.speckle;
  for (let i = 0; i < 18; i++) {
    const x = ((i * 37 + 11) % (GROUND_TILE_WIDTH - 4)) + 2;
    const y = 4 + ((i * 13 + 5) % 8);
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.fillStyle = p.groundDark;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 53 + 29) % (GROUND_TILE_WIDTH - 6)) + 3;
    const y = 5 + ((i * 7 + 1) % 7);
    ctx.fillRect(x, y, 2, 1);
  }

  // Brand accent: a tiny orange delivery mark once per tile.
  ctx.fillStyle = p.ribbon;
  const mx = 168;
  ctx.fillRect(mx + 2, 6, 1, 1);
  ctx.fillRect(mx + 1, 7, 3, 1);
  ctx.fillRect(mx, 8, 5, 1);
  ctx.fillRect(mx + 1, 9, 3, 1);
  ctx.fillRect(mx + 2, 10, 1, 1);

  return c;
}

/* ------------------------------------------------------------------ */
/* Skyline tile (distant scenery, parallax layer)                       */
/* ------------------------------------------------------------------ */

export const SKYLINE_TILE_WIDTH = 200;
export const SKYLINE_TILE_HEIGHT = 40;

const BUILDINGS: Array<{ x: number; w: number; h: number; antenna?: boolean }> = [
  { x: 0, w: 26, h: 22 },
  { x: 30, w: 18, h: 32, antenna: true },
  { x: 52, w: 30, h: 16 },
  { x: 86, w: 22, h: 26 },
  { x: 112, w: 16, h: 20 },
  { x: 132, w: 34, h: 30, antenna: true },
  { x: 170, w: 24, h: 14 },
];

function buildSkylineTile(p: Palette): HTMLCanvasElement {
  const c = makeCanvas(SKYLINE_TILE_WIDTH, SKYLINE_TILE_HEIGHT);
  const ctx = ctx2d(c);
  ctx.fillStyle = p.skyline;

  for (const b of BUILDINGS) {
    const top = SKYLINE_TILE_HEIGHT - b.h;
    ctx.fillRect(b.x, top, b.w, b.h);
    if (b.antenna) {
      ctx.fillRect(b.x + Math.floor(b.w / 2), top - 4, 1, 4);
    }
  }

  // Windows — invisible during the day, lit from dusk onwards.
  ctx.fillStyle = p.skylineWin;
  for (const b of BUILDINGS) {
    if (b.h < 16) continue;
    const top = SKYLINE_TILE_HEIGHT - b.h;
    for (let wy = top + 4; wy < SKYLINE_TILE_HEIGHT - 3; wy += 5) {
      for (let wx = b.x + 3; wx < b.x + b.w - 2; wx += 5) {
        if ((wx * 7 + wy * 13) % 5 < 3) ctx.fillRect(wx, wy, 1, 1);
      }
    }
  }

  return c;
}

/* ------------------------------------------------------------------ */
/* Sun                                                                  */
/* ------------------------------------------------------------------ */

export const SUN_SIZE = 22;

function buildSun(p: Palette): HTMLCanvasElement {
  const c = makeCanvas(SUN_SIZE, SUN_SIZE);
  const ctx = ctx2d(c);
  const r = SUN_SIZE / 2;
  for (let y = 0; y < SUN_SIZE; y++) {
    for (let x = 0; x < SUN_SIZE; x++) {
      const dx = x + 0.5 - r;
      const dy = y + 0.5 - r;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 8.6) continue;
      ctx.fillStyle = d > 5.2 ? p.sunMid : p.sunCore;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Four ray ticks.
  ctx.fillStyle = p.sunMid;
  ctx.fillRect(r - 1, 0, 2, 2);
  ctx.fillRect(r - 1, SUN_SIZE - 2, 2, 2);
  ctx.fillRect(0, r - 1, 2, 2);
  ctx.fillRect(SUN_SIZE - 2, r - 1, 2, 2);
  return c;
}

/* ------------------------------------------------------------------ */
/* Variant atlas                                                        */
/* ------------------------------------------------------------------ */

const ATLAS_W = 640;
const ATLAS_H = 128;
const OBSTACLE_ROW_Y = 0;
const CLOUD_ROW_Y = 34;
const GROUND_Y_IN_ATLAS = 48;
const SKYLINE_Y_IN_ATLAS = 84;

export function buildVariantAtlas(p: Palette): VariantAtlas {
  const canvas = makeCanvas(ATLAS_W, ATLAS_H);
  const ctx = ctx2d(canvas);
  const obstacles = {} as Record<ObstacleId, { frames: AtlasRect[] }>;
  const map = obstacleCharMap(p);

  let cursor = 0;
  for (const id of Object.keys(OBSTACLE_ART) as ObstacleId[]) {
    const frames: AtlasRect[] = [];
    const def = OBSTACLE_DEFS[id];
    for (const art of OBSTACLE_ART[id]) {
      validateArt(`obstacle:${id}`, art);
      const w = art[0].length;
      const h = art.length;
      if (process.env.NODE_ENV !== 'production' && (w !== def.w || h !== def.h)) {
        console.warn(
          `[piku-runner] obstacle "${id}" art ${w}×${h} ≠ tuning ${def.w}×${def.h}`,
        );
      }
      drawArt(ctx, art, map, cursor, OBSTACLE_ROW_Y);
      frames.push({ x: cursor, y: OBSTACLE_ROW_Y, w, h });
      cursor += w + 6;
    }
    obstacles[id] = { frames };
  }

  const clouds: AtlasRect[] = [];
  let cloudX = 0;
  for (const art of [CLOUD_A, CLOUD_B, CLOUD_C]) {
    validateArt('cloud', art);
    const w = art[0].length;
    const h = art.length;
    drawArt(ctx, art, cloudCharMap(p), cloudX, CLOUD_ROW_Y);
    clouds.push({ x: cloudX, y: CLOUD_ROW_Y, w, h });
    cloudX += w + 8;
  }

  const groundTile = buildGroundTile(p);
  ctx.drawImage(groundTile, 0, GROUND_Y_IN_ATLAS);
  const ground: AtlasRect = {
    x: 0,
    y: GROUND_Y_IN_ATLAS,
    w: GROUND_TILE_WIDTH,
    h: GROUND_TILE_HEIGHT,
  };

  const skylineTile = buildSkylineTile(p);
  ctx.drawImage(skylineTile, 0, SKYLINE_Y_IN_ATLAS);
  const skyline: AtlasRect = {
    x: 0,
    y: SKYLINE_Y_IN_ATLAS,
    w: SKYLINE_TILE_WIDTH,
    h: SKYLINE_TILE_HEIGHT,
  };

  const sunTile = buildSun(p);
  const sun: AtlasRect = { x: 420, y: 0, w: SUN_SIZE, h: SUN_SIZE };
  ctx.drawImage(sunTile, sun.x, sun.y);

  return { canvas, obstacles, clouds, sun, ground, skyline };
}

/* ------------------------------------------------------------------ */
/* Moon sheet — 8 phases                                                */
/* ------------------------------------------------------------------ */

const MOON_CELL = 20;
const MOON_CARVE: Array<number | null> = [10, 7, 4, null, -4, -7, -10, -13];

export function buildMoonSheet(): MoonSheet {
  const canvas = makeCanvas(MOON_CELL * MOON_CARVE.length, MOON_CELL);
  const ctx = ctx2d(canvas);
  const frames: AtlasRect[] = [];
  const core = '#F8FAFC';
  const shade = '#CBD5E1';

  MOON_CARVE.forEach((carve, i) => {
    const ox = i * MOON_CELL;
    for (let y = 0; y < MOON_CELL; y++) {
      for (let x = 0; x < MOON_CELL; x++) {
        const dx = x + 0.5 - MOON_CELL / 2;
        const dy = y + 0.5 - MOON_CELL / 2;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 8.8) continue;
        if (carve !== null) {
          const cdx = x + 0.5 - MOON_CELL / 2 - carve;
          const cdy = y + 0.5 - MOON_CELL / 2;
          if (Math.sqrt(cdx * cdx + cdy * cdy) <= 8.4) continue;
        }
        ctx.fillStyle = d > 6.2 ? shade : core;
        ctx.fillRect(ox + x, y, 1, 1);
      }
    }
    frames.push({ x: ox, y: 0, w: MOON_CELL, h: MOON_CELL });
  });

  return { canvas, frames };
}

/* ------------------------------------------------------------------ */
/* 5×7 pixel font                                                       */
/* ------------------------------------------------------------------ */

export const GLYPH_W = 5;
export const GLYPH_H = 7;
export const GLYPH_SPACING = 6;

const GLYPHS: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
};

const glyphCache = new Map<string, HTMLCanvasElement>();
const GLYPH_CACHE_MAX = 320;

/** Quantise a colour so the glyph cache stays small across env blending. */
function quantizeColor(color: string): string {
  if (color[0] !== '#' || color.length !== 7) return color;
  const r = Math.round(parseInt(color.slice(1, 3), 16) / 8) * 8;
  const g = Math.round(parseInt(color.slice(3, 5), 16) / 8) * 8;
  const b = Math.round(parseInt(color.slice(5, 7), 16) / 8) * 8;
  return `rgb(${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)})`;
}

function glyphCanvas(ch: string, color: string, scale: number): HTMLCanvasElement | null {
  const glyph = GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()];
  if (!glyph) return null;
  const key = `${ch}|${quantizeColor(color)}|${scale}`;
  const hit = glyphCache.get(key);
  if (hit) return hit;

  const c = makeCanvas(GLYPH_W * scale, GLYPH_H * scale);
  const ctx = ctx2d(c);
  ctx.fillStyle = color;
  for (let y = 0; y < GLYPH_H; y++) {
    for (let x = 0; x < GLYPH_W; x++) {
      if (glyph[y][x] === '1') ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  if (glyphCache.size >= GLYPH_CACHE_MAX) glyphCache.clear();
  glyphCache.set(key, c);
  return c;
}

export function textWidth(text: string, scale = 1): number {
  if (!text.length) return 0;
  return text.length * GLYPH_SPACING * scale - scale;
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  scale = 1,
  align: 'left' | 'center' | 'right' = 'left',
): void {
  let dx = x;
  const w = textWidth(text, scale);
  if (align === 'center') dx = Math.round(x - w / 2);
  else if (align === 'right') dx = Math.round(x - w);

  for (const ch of text.toUpperCase()) {
    const g = glyphCanvas(ch, color, scale);
    if (g) ctx.drawImage(g, dx, y);
    dx += GLYPH_SPACING * scale;
  }
}
