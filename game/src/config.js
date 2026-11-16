// Every tuning number of MARGINALIA in one place: the page, the hare, the ink, the seal,
// the difficulty levels and the colours of the manuscript.

/** Logical canvas size; the canvas is scaled to the window but the game always thinks in these pixels. */
export const VIEW = { w: 1280, h: 800 };

/** The writable page: foes and the hare live inside this rectangle, the HUD sits around it. */
export const PAGE = { left: 56, top: 110, right: 1224, bottom: 708 };

/** The HUD bands above and below the page. */
export const HUD = { topBand: 86, bottomBand: 736 };

/** Fixed simulation step (seconds): the game logic always advances in these ticks. */
export const STEP = 1 / 60;

export const PALETTE = {
  parchment: '#f2e4c3',
  parchmentDeep: '#e3cd9f',
  parchmentEdge: '#b98d55',
  ink: '#1c1826',
  inkSoft: '#3d3550',
  inkWash: 'rgba(28, 24, 38, 0.16)',
  vermilion: '#c4351c',
  vermilionLight: '#e8674a',
  lapis: '#2647a3',
  lapisLight: '#5a7fd8',
  gold: '#d39b17',
  goldLight: '#f7d76a',
  goldPale: '#fff1b8',
  verdigris: '#2c8a72',
  verdigrisLight: '#6cc3a6',
  rose: '#d7637a',
  cream: '#fffaf0',
  shadow: 'rgba(60, 35, 10, 0.28)',
  panel: 'rgba(255, 247, 226, 0.94)',
  panelEdge: '#7a5328',
};

export const FONT = '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif';

export const PLAYER = {
  radius: 15,
  speed: 235,
  hearts: 5,
  hopSpeed: 640,
  hopTime: 0.17,
  hopCooldown: 1.5,
  invulnerable: 1.1,
  magnet: 95,
};

export const INK = {
  max: 100,
  regen: 7,
  costPerPixel: 0.05,
  strokeLife: 2.4,
  strokeWidth: 7,
  strokeDps: 26,
  pointSpacing: 7,
  closeDistance: 30,
  minLoopArea: 1400,
  illuminateDamage: 70,
  dropAmount: 4,
};

export const SEAL = { cooldown: 9, radius: 125, damage: 50, knockback: 420, stun: 1.2 };

export const DARTS = { interval: 0.62, damage: 9, speed: 660, range: 400, life: 0.9 };

export const DIFFICULTIES = {
  novice: { key: 'novice', label: 'NOVICE', note: 'gentle foes', hp: 0.7, spawn: 0.75, hearts: 6, score: 0.75 },
  scribe: { key: 'scribe', label: 'SCRIBE', note: 'as written', hp: 1, spawn: 1, hearts: 5, score: 1 },
  abbot: { key: 'abbot', label: 'ABBOT', note: 'merciless', hp: 1.35, spawn: 1.3, hearts: 4, score: 1.6 },
};

export const DIFFICULTY_ORDER = ['novice', 'scribe', 'abbot'];

/** Score thresholds for the end-of-run grade, best first. */
export const GRADES = [
  { grade: 'S', min: 150000 },
  { grade: 'A', min: 90000 },
  { grade: 'B', min: 45000 },
  { grade: 'C', min: 20000 },
  { grade: 'D', min: 0 },
];
