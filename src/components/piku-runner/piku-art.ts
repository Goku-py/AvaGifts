/**
 * Piku Runner — pixel-art source data.
 *
 * Every sprite is authored as a character map (one string per pixel row).
 * `sprites.ts` rasterises these to offscreen canvases. Keep rows the same
 * width inside each art block — the rasteriser validates and warns in dev.
 */

export type Art = string[];

/* ------------------------------------------------------------------ */
/* Piku palette (identity-pinned across every environment)              */
/* ------------------------------------------------------------------ */

export const PIKU_COLORS = {
  ink: '#172033',
  white: '#FFFFFF',
  whiteShade: '#E7ECF5',
  shirt: '#2F80ED',
  shirtLight: '#60A5FA',
  shirtDark: '#2468C7',
  orange: '#F28C28',
  orangeDark: '#EA580C',
  glasses: '#111111',
  rim: '#93C5FD',
} as const;

/* ------------------------------------------------------------------ */
/* Piku — heads (14 rows × 20 cols)                                     */
/* ------------------------------------------------------------------ */

export const HEAD_NORMAL: Art = [
  '......KKKKKKKK......',
  '....KKKKKKKKKKKK....',
  '...KKKKKKKKKKKKKK...',
  '..KKKKKKKKKKKKKKKK..',
  '..KKKKKWWWWWWWWWWK..',
  '..KKKKWWWWWWWWWWWK..',
  '..KKKKKGGGWGGGWWWK..',
  '..KKKKKGKGWGKGWWWK..',
  '..KKKKKGGGWGGGWWWK..',
  '..KKKKWWWWWWWOOOOK..',
  '..KKKKWWWWWWWOOOoK..',
  '..KKKKWWWWWWWooKK...',
  '..KKKKKKWWWWWKKK....',
  '...KKKKKKKKKKKKK....',
];

export const HEAD_BLINK: Art = [
  ...HEAD_NORMAL.slice(0, 6),
  '..KKKKKWWWWWWWWWWK..',
  '..KKKKKGGGWGGGWWWK..',
  '..KKKKKWWWWWWWWWWK..',
  ...HEAD_NORMAL.slice(9),
];

export const HEAD_ALERT: Art = [
  ...HEAD_NORMAL.slice(0, 5),
  '..KKKKKGGGWGGGWWWK..',
  '..KKKKKGKGWGKGWWWK..',
  '..KKKKKGGGWGGGWWWK..',
  '..KKKKKWWWWWWWWWWK..',
  ...HEAD_NORMAL.slice(9),
];

export const HEAD_HIT: Art = [
  ...HEAD_NORMAL.slice(0, 6),
  '..KKKKKGWGWGWGWWWK..',
  '..KKKKKWGWGWGWWWWK..',
  '..KKKKKGWGWGWGWWWK..',
  ...HEAD_NORMAL.slice(9),
];

export const HEAD_TIRED: Art = [
  ...HEAD_NORMAL.slice(0, 6),
  '..KKKKKGGGWGGGWWWK..',
  '..KKKKKGGGWGGGWWWK..',
  '..KKKKKWWWWWWWWWWK..',
  ...HEAD_NORMAL.slice(9),
];

/* ------------------------------------------------------------------ */
/* Piku — torsos (12 rows × 20 cols)                                    */
/* ------------------------------------------------------------------ */

export const TORSO_TUCKED: Art = [
  '....BBBBBBBBBBBB....',
  '...KKBLBBOOBBLBKK...',
  '...KKBLBBOOBBLBKK...',
  '...KKBLBBOOBBLBKK...',
  '...KKBBBBOOBBBBKK...',
  '...KKBBBBOOBBBBKK...',
  '....KBBBBBBBBBBK....',
  '....BBBBBBBBBBBB....',
  '....KKKKKKKKKKKK....',
  '....KKKKKKKKKKKK....',
  '....KKKKKKKKKKKK....',
  '....KKKKKKKKKKKK....',
];

export const TORSO_SPREAD: Art = [
  '....BBBBBBBBBBBB....',
  '..KKKBLBBOOBBLBKKK..',
  '.KKKKBLBBOOBBLBKKKK.',
  '.KKKKBLBBOOBBLBKKKK.',
  '..KKKBBBBOOBBBBKKK..',
  '...KKBBBBOOBBBBKK...',
  '....KBBBBBBBBBBK....',
  '....BBBBBBBBBBBB....',
  '....KKKKKKKKKKKK....',
  '....KKKKKKKKKKKK....',
  '....KKKKKKKKKKKK....',
  '....KKKKKKKKKKKK....',
];

export const TORSO_DROOP: Art = [
  '....BBBBBBBBBBBB....',
  '...KKBLBBOOBBLBKK...',
  '...KKBLBBOOBBLBKK...',
  '...KKBLBBOOBBLBKK...',
  '...KKBBBBOOBBBBKK...',
  '...KKBBBBOOBBBBKK...',
  '...KKBBBBBBBBBBKK...',
  '..KKKBBBBBBBBBBKKK..',
  '....KKKKKKKKKKKK....',
  '....KKKKKKKKKKKK....',
  '....KKKKKKKKKKKK....',
  '....KKKKKKKKKKKK....',
];

/* ------------------------------------------------------------------ */
/* Piku — feet (4 rows × 20 cols)                                       */
/* ------------------------------------------------------------------ */

export const FEET_A: Art = [
  '.....OO......OO.....',
  '.....OO......OO.....',
  '....OOOO....OOOO....',
  '....OOOO....OOOO....',
];

export const FEET_B: Art = [
  '.....OO......OO.....',
  '.....OO.....OOO.....',
  '....OOOO....OOO.....',
  '....OOOO............',
];

export const FEET_C: Art = [
  '......OO.....OO.....',
  '......OO.....OO.....',
  '.....OOOO...OOOO....',
  '.....OOOO...OOOO....',
];

export const FEET_D: Art = [
  '.....OO......OO.....',
  '....OOO......OO.....',
  '....OOO.....OOOO....',
  '............OOOO....',
];

export const FEET_TUCK: Art = [
  '.....OO......OO.....',
  '....OOOO....OOOO....',
  '....OOOO....OOOO....',
  '.....oo......oo.....',
];

export const FEET_DOWN: Art = [
  '.....OO......OO.....',
  '.....OO......OO.....',
  '.....OO......OO.....',
  '....OOOO....OOOO....',
];

/* ------------------------------------------------------------------ */
/* Piku — duck frames (18 rows × 36 cols)                               */
/* ------------------------------------------------------------------ */

export const DUCK_0: Art = [
  '....................KKKKKKKKKK......',
  '..................KKKKKKKKKKKK......',
  '..................KKKKKKWWWWWK......',
  '..................KKKKKWGGGWWK......',
  '..................KKKKKWGKGWWKOOOO..',
  '..................KKKKKWGGGWWKOOOOO.',
  '..................KKKKKWWWWWWKOOO...',
  '...................KKKKKWWWWWK......',
  '....................KKKKKKKKK.......',
  '....................KKKKKKK.........',
  '....KKKKBBBBBBBBBBBBBBBBBBBB........',
  '....KKKKBLBBBBBBOOBBBBBBLB..........',
  '.OOOKKKKKBBBBBBBBBBBBBBBBBB.........',
  '..OOKKKKKKKKKKKKKKKKKKKKKK..........',
  '......KKKKKKKKKKKK..................',
  '.......KKKKKKKKK....................',
  '........KKKKKKKK....................',
  '........KKKKKK......................',
];

export const DUCK_1: Art = [
  ...DUCK_0.slice(0, 12),
  'OOOOKKKKKBBBBBBBBBBBBBBBBBB.........',
  ...DUCK_0.slice(13),
];

/* ------------------------------------------------------------------ */
/* Obstacles                                                            */
/* ------------------------------------------------------------------ */

export const GIFT_SMALL: Art = [
  '...rr..rr.....',
  '...rrrrrr.....',
  '.....rr.......',
  '..cccccccccc..',
  '..ccccrrcccc..',
  '..ccccrrcccc..',
  '..rrrrrrrrrr..',
  '..rrrrrrrrrr..',
  '..ccccrrcccc..',
  '..ccccrrcccc..',
  '..ddddrrdddd..',
  '..dddddddddd..',
];

export const GIFT_MED: Art = [
  '....rr....rr......',
  '....rrrrrrrr......',
  '.......rr.........',
  '..cccccccccccccc..',
  '..ccccccrrcccccc..',
  '..ccccccrrcccccc..',
  '..rrrrrrrrrrrrrr..',
  '..rrrrrrrrrrrrrr..',
  '..ccccccrrcccccc..',
  '..ccccccrrcccccc..',
  '..ccccccrrcccccc..',
  '..ccccccrrcccccc..',
  '..ccccccrrcccccc..',
  '..ddddddrrdddddd..',
  '..dddddddddddddd..',
  '..dddddddddddddd..',
];

export const CRATE: Art = [
  'oooooooooooooooooooooo',
  'owwwwwwwwwwwwwwwwwwwwo',
  'owwwywwwwywwwwywwwwwwo',
  'owwwywwwwywwwwywwwwwwo',
  'owwwwwwwwwwwwwwwwwwwwo',
  'owwwwkkkkkkkkkkwwwwwwo',
  'owwwwksssssssskwwwwwwo',
  'owwwwksssssssskwwwwwwo',
  'owwwwkkkkkkkkkkwwwwwwo',
  'owwwwwwwwwwwwwwwwwwwwo',
  'owwwywwwwywwwwywwwwwwo',
  'owwwywwwwywwwwywwwwwwo',
  'owwwwwwwwwwwwwwwwwwwwo',
  'oyyyyyyyyyyyyyyyyyyyyo',
  'oooooooooooooooooooooo',
  'oooooooooooooooooooooo',
  'oooooooooooooooooooooo',
  'oooooooooooooooooooooo',
];

export const GIFT_BAG: Art = [
  '.....kk..kk.....',
  '....k..kk..k....',
  '....k......k....',
  '..cccccccccccc..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..rrrrrrrrrrrr..',
  '..rrrrrrrrrrrr..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccOOccccn..',
  '..clcccOOccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..dddddddddddd..',
  '..dddddddddddd..',
  '..dddddddddddd..',
  '..dddddddddddd..',
];

export const RIBBON_BUNDLE: Art = [
  '......cccccccc........',
  '....cccccccccccc......',
  '..ccccrrcccccccc......',
  '..cccrrrrcccccccc.....',
  '..cccrrrrccccccccc....',
  '..ccccrrcccccccccc....',
  '.cccccccccccccccccc...',
  '.dddddddddddddddddd...',
  '..dddddddddddddddd....',
  '...dddddddddddddd.....',
];

export const PARCEL_STACK: Art = [
  '.........cccccccccccc.....',
  '.........cbbbbbbbbbbc.....',
  '.........cbbbbccbbbbc.....',
  '.........cbbbbccbbbbc.....',
  '.........cbbbbccbbbbc.....',
  '.........cccccccccccc.....',
  '....cccccccccccccccccccccc',
  '....cccccrrccccccccccccccc',
  '....cccccrrccccccccccccccc',
  '....cccccrrccccccccccccccc',
  '....cccccrrccccccccccccccc',
  '....cccccrrccccccccccccccc',
  '....cccccrrccccccccccccccc',
  '....cccccrrccccccccccccccc',
  '....dddddddddddddddddddddd',
  '....dddddddddddddddddddddd',
  '....dddddddddddddddddddddd',
  '....dddddddddddddddddddddd',
];

export const TALL_BOX: Art = [
  '..cccccccccccc..',
  '..cwwwwwwwwwwc..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..rrrrrrrrrrrr..',
  '..rrrrrrrrrrrr..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clccckkccccn..',
  '..clccckkccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..clcccccccccn..',
  '..dddddddddddd..',
  '..dddddddddddd..',
  '..dddddddddddd..',
  '..dddddddddddd..',
];

export const GIFT_STACK: Art = [
  '....rr......rr....',
  '....rrrrrrrrrr....',
  '.......rr.........',
  '...cccccccccccc...',
  '...cccccrrccccc...',
  '...cccccrrccccc...',
  '...cccccrrccccc...',
  '...cccccrrccccc...',
  '...rrrrrrrrrrrr...',
  '...rrrrrrrrrrrr...',
  '...cccccrrccccc...',
  '...cccccrrccccc...',
  '.cccccccccccccccc.',
  '.bbbbbbbrrbbbbbbb.',
  '.bbbbbbbrrbbbbbbb.',
  '.rrrrrrrrrrrrrrrr.',
  '.rrrrrrrrrrrrrrrr.',
  '.bbbbbbbrrbbbbbbb.',
  '.bbbbbbbrrbbbbbbb.',
  '.bbbbbbbrrbbbbbbb.',
  '.bbbbbbbrrbbbbbbb.',
  '.bbbbbbbrrbbbbbbb.',
  '.bbbbbbbrrbbbbbbb.',
  '.nnnnnnnrrnnnnnnn.',
  '.nnnnnnnnnnnnnnnn.',
  '.nnnnnnnnnnnnnnnn.',
  '.nnnnnnnnnnnnnnnn.',
  '.nnnnnnnnnnnnnnnn.',
];

export const PLANE_0: Art = [
  '..........................',
  '......................pppp',
  '....................pppppp',
  '..................pppppppp',
  '................pppppppppp',
  '..pppppppppppppppppppppppp',
  '..pppppppppppppppppppppppp',
  '.....ppppppppppppssssssss.',
  '........pppppppsssssss....',
  '..........pppssssss.......',
  '............sssss.........',
  '..........................',
];

export const PLANE_1: Art = [
  '......................pppp',
  '....................pppppp',
  '..................pppppppp',
  '................pppppppppp',
  '..........................',
  '..pppppppppppppppppppppppp',
  '..pppppppppppppppppppppppp',
  '.....ppppppppppppssssssss.',
  '........pppppppsssssss....',
  '..........pppssssss.......',
  '............sssss.........',
  '..........................',
];

export const FLYING_GIFT_0: Art = [
  '....pp....pp....',
  '...p..pppp..p...',
  '....cccccccc....',
  '....cwccccdc....',
  '....cccrrccc....',
  '....rrrrrrrr....',
  '....rrrrrrrr....',
  '....cccrrccc....',
  '....cwcrrcdc....',
  '....cccccccc....',
  '....dddddddd....',
  '....dddddddd....',
  '.....dddddd.....',
  '......k..k......',
];

export const FLYING_GIFT_1: Art = [
  '...pp......pp...',
  '..p..pppppp..p..',
  '....cccccccc....',
  '....cwccccdc....',
  '....cccrrccc....',
  '....rrrrrrrr....',
  '....rrrrrrrr....',
  '....cccrrccc....',
  '....cwcrrcdc....',
  '....cccccccc....',
  '....dddddddd....',
  '....dddddddd....',
  '.....dddddd.....',
  '......k..k......',
];

export const DRONE_0: Art = [
  '...kkkkk..............kkkkk...',
  '......k................k......',
  '.......k..............k.......',
  '........kkkkkkkkkkkkkk........',
  '.......kbbbbbbbbbbbbbbk.......',
  '.......kbbllbbbbbbbbbbk.......',
  '.......kbbllbbbbbbbbbbk.......',
  '.......kbbbbbbbbbbbbbbk.......',
  '.......kkkkkkkkkkkkkkkk.......',
  '...........k......k...........',
  '..........kk......kk..........',
  '..........cccccccccc..........',
  '..........ccrrrrrrcc..........',
  '..........ccrrrrrrcc..........',
  '..........dddddddddd..........',
  '..........dddddddddd..........',
];

export const DRONE_1: Art = [
  '....kkkkk............kkkkk....',
  '.....k..................k.....',
  '......k................k......',
  '........kkkkkkkkkkkkkk........',
  ...DRONE_0.slice(4),
];

export const BALLOON_PARCEL_0: Art = [
  '......kkkkkk......',
  '.....krrrrrrk.....',
  '....krrrrrrrrk....',
  '....krrrrrrrrk....',
  '....krrrrrrrrk....',
  '.....krrrrrrk.....',
  '......krrrrk......',
  '.......kkkk.......',
  '........kk........',
  '........kk........',
  '....cccccccccc....',
  '....cccccccccc....',
  '....ccccrrcccc....',
  '....rrrrrrrrrr....',
  '....rrrrrrrrrr....',
  '....ccccrrcccc....',
  '....ccccrrcccc....',
  '....ddddrrdddd....',
  '....dddddddddd....',
  '....dddddddddd....',
  '.....dddddddd.....',
  '.....dddddddd.....',
  '......dddddd......',
  '......dddddd......',
];

export const BALLOON_PARCEL_1: Art = [
  '......kkkkkk......',
  '.....krrrrrrk.....',
  '....krrrrrrrrk....',
  '....krrrrrrrrk....',
  '....krrrrrrrrk....',
  '.....krrrrrk......',
  '......krrk........',
  '.......kk.........',
  '.......kk.........',
  '.......kk.........',
  '....cccccccccc....',
  '....cccccccccc....',
  '....ccccrrcccc....',
  '....rrrrrrrrrr....',
  '....rrrrrrrrrr....',
  '....ccccrrcccc....',
  '....ccccrrcccc....',
  '....ddddrrdddd....',
  '....dddddddddd....',
  '....dddddddddd....',
  '.....dddddddd.....',
  '.....dddddddd.....',
  '......dddddd......',
  '......dddddd......',
];

/* ------------------------------------------------------------------ */
/* Clouds                                                               */
/* ------------------------------------------------------------------ */

export const CLOUD_A: Art = [
  '..........cccccc..............',
  '.......cccccccccccc...........',
  '.....cccccccccccccccc.........',
  '....cccccccccccccccccc........',
  '...cccccccccccccccccccc.......',
  '..cccccccccccccccccccccc......',
  '..cccccccccccccccccccccc......',
  '.cccccccccccccccccccccccc.....',
  '.dddddddddddddddddddddddd.....',
  '...dddddddddddddddddddd.......',
];

export const CLOUD_B: Art = [
  '...........cccccc...........',
  '.......cccccccccccccc.......',
  '.....cccccccccccccccccc.....',
  '...cccccccccccccccccccccc...',
  '..cccccccccccccccccccccccc..',
  '.cccccccccccccccccccccccccc.',
  '.cccccccccccccccccccccccccc.',
  '.cccccccccccccccccccccccccc.',
  '.dddddddddddddddddddddddddd.',
  '..dddddddddddddddddddddddd..',
  '....dddddddddddddddddddd....',
];

export const CLOUD_C: Art = [
  '.......cccccc.......',
  '....cccccccccccc....',
  '..cccccccccccccccc..',
  '.cccccccccccccccccc.',
  '.cccccccccccccccccc.',
  '.dddddddddddddddddd.',
  '...dddddddddddddd...',
  '.....dddddddd.......',
];
