// The ink-blot bestiary: what each foe is, how it moves, how it takes damage and what it leaves behind.
import { PAGE } from '../config.js';
import { clamp, distance } from './geometry.js';
import { emit, popup } from './events.js';
import { dropLoot } from './pickups.js';
import { addScore } from './scoring.js';

export const FOE_KINDS = {
  blotling: { name: 'Blotling', r: 13, hp: 16, speed: 80, points: 10, xp: 1, pack: [3, 5] },
  wasp: { name: 'Scribble Wasp', r: 10, hp: 9, speed: 150, points: 12, xp: 1, pack: [2, 3], flies: true },
  snail: { name: 'Snail Errant', r: 20, hp: 55, speed: 36, points: 30, xp: 3, pack: [1, 2], armored: true },
  spitter: { name: 'Gargoyle Spitter', r: 16, hp: 28, speed: 72, points: 25, xp: 2, pack: [1, 1] },
  worm: { name: 'Bookworm', r: 11, hp: 70, speed: 96, points: 40, xp: 4, pack: [1, 1], segments: 6 },
  blotch: { name: 'Blotch', r: 24, hp: 44, speed: 55, points: 30, xp: 2, pack: [1, 2] },
};

let nextId = 1;

/** Put a new foe on the page; it seeps in over `emerge` seconds and is harmless until then. */
export function spawnFoe(run, kind, x, y) {
  const def = FOE_KINDS[kind];
  const hp = def.hp * run.diff.hp * (1 + run.folio * 0.18);
  const foe = {
    id: nextId++,
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    r: def.r,
    hp,
    maxHp: hp,
    speed: def.speed * (0.92 + run.rng.next() * 0.16),
    emerge: 0.6,
    stun: 0,
    slow: 0,
    flash: 0,
    crack: 0,
    armored: !!def.armored,
    flies: !!def.flies,
    boss: false,
    timer: run.rng.range(0.5, 2.5),
    phase: run.rng.range(0, Math.PI * 2),
    facing: 0,
    segments: null,
  };
  if (def.segments) {
    foe.segments = [];
    for (let i = 0; i < def.segments; i += 1) foe.segments.push({ x, y });
  }
  run.foes.push(foe);
  return foe;
}

/** A random spawn point along the page's edges, kept away from the hare. */
export function edgePoint(run, minFromPlayer = 260) {
  const p = run.player;
  for (let tries = 0; tries < 12; tries += 1) {
    const side = run.rng.int(0, 3);
    const t = run.rng.next();
    const x = side === 0 ? PAGE.left + 24 : side === 1 ? PAGE.right - 24 : PAGE.left + 24 + t * (PAGE.right - PAGE.left - 48);
    const y = side === 2 ? PAGE.top + 24 : side === 3 ? PAGE.bottom - 24 : PAGE.top + 24 + t * (PAGE.bottom - PAGE.top - 48);
    if (distance(x, y, p.x, p.y) >= minFromPlayer) return { x, y };
  }
  return { x: p.x < 640 ? PAGE.right - 30 : PAGE.left + 30, y: (PAGE.top + PAGE.bottom) / 2 };
}

/** Spawn a pack of one kind clustered around an edge point. */
export function spawnPack(run, kind) {
  const def = FOE_KINDS[kind];
  const count = run.rng.int(def.pack[0], def.pack[1]);
  const at = edgePoint(run);
  for (let i = 0; i < count; i += 1) {
    const x = clamp(at.x + run.rng.range(-36, 36), PAGE.left + 16, PAGE.right - 16);
    const y = clamp(at.y + run.rng.range(-36, 36), PAGE.top + 16, PAGE.bottom - 16);
    spawnFoe(run, kind, x, y);
  }
  emit(run, 'spawn', { x: at.x, y: at.y, kind });
  return count;
}

/** Steer a foe's velocity toward a wanted velocity, at a given responsiveness. */
function steer(foe, wantX, wantY, dt, grip = 5) {
  const k = Math.min(1, grip * dt);
  foe.vx += (wantX - foe.vx) * k;
  foe.vy += (wantY - foe.vy) * k;
}

function chase(run, foe, dt, speedScale = 1) {
  const p = run.player;
  const dx = p.x - foe.x;
  const dy = p.y - foe.y;
  const d = Math.hypot(dx, dy) || 1;
  const s = foe.speed * speedScale;
  steer(foe, (dx / d) * s, (dy / d) * s, dt);
}

const BEHAVIOURS = {
  blotling(run, foe, dt) {
    chase(run, foe, dt);
  },
  blotch(run, foe, dt) {
    chase(run, foe, dt);
  },
  snail(run, foe, dt) {
    chase(run, foe, dt);
    if (foe.crack > 0) foe.crack -= dt;
  },
  wasp(run, foe, dt) {
    const p = run.player;
    const dx = p.x - foe.x;
    const dy = p.y - foe.y;
    const d = Math.hypot(dx, dy) || 1;
    foe.phase += dt * 7;
    const weave = Math.sin(foe.phase) * 0.9;
    const wx = dx / d - (dy / d) * weave;
    const wy = dy / d + (dx / d) * weave;
    steer(foe, wx * foe.speed, wy * foe.speed, dt, 6);
  },
  spitter(run, foe, dt) {
    const p = run.player;
    const dx = p.x - foe.x;
    const dy = p.y - foe.y;
    const d = Math.hypot(dx, dy) || 1;
    const away = d < 230 ? -1 : d > 330 ? 1 : 0;
    const side = Math.sin(foe.phase + run.time * 0.7);
    steer(foe, ((dx / d) * away - (dy / d) * side * 0.6) * foe.speed, ((dy / d) * away + (dx / d) * side * 0.6) * foe.speed, dt, 3);
    foe.timer -= dt;
    if (foe.timer <= 0 && foe.emerge <= 0) {
      foe.timer = run.rng.range(2.6, 3.4);
      const travel = Math.min(d, 300);
      run.globs.push({ x: foe.x, y: foe.y, vx: (dx / d) * 250, vy: (dy / d) * 250, life: travel / 250, r: 8 });
      emit(run, 'glob', { x: foe.x, y: foe.y });
    }
  },
  worm(run, foe, dt) {
    const p = run.player;
    const want = Math.atan2(p.y - foe.y, p.x - foe.x) + Math.sin(run.time * 2 + foe.phase) * 0.6;
    let diff = want - foe.facing;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    foe.facing += clamp(diff, -2.6 * dt, 2.6 * dt);
    steer(foe, Math.cos(foe.facing) * foe.speed, Math.sin(foe.facing) * foe.speed, dt, 8);
  },
};

/** Drag a worm's body segments behind its head. */
export function trailSegments(foe, spacing) {
  let lead = foe;
  for (const seg of foe.segments) {
    const dx = seg.x - lead.x;
    const dy = seg.y - lead.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > spacing) {
      seg.x = lead.x + (dx / d) * spacing;
      seg.y = lead.y + (dy / d) * spacing;
    }
    lead = seg;
  }
}

/** Move every common foe one step (bosses move in bosses.js). */
export function updateFoes(run, dt) {
  for (const foe of run.foes) {
    if (foe.boss) continue;
    foe.flash = Math.max(0, foe.flash - dt);
    if (foe.emerge > 0) {
      foe.emerge -= dt;
      continue;
    }
    if (foe.stun > 0) {
      foe.stun -= dt;
      foe.vx *= 0.9;
      foe.vy *= 0.9;
    } else {
      BEHAVIOURS[foe.kind](run, foe, dt);
    }
    const slowFactor = foe.slow > 0 ? 0.55 : 1;
    foe.slow = Math.max(0, foe.slow - dt);
    foe.x += foe.vx * dt * slowFactor;
    foe.y += foe.vy * dt * slowFactor;
    if (Math.abs(foe.vx) + Math.abs(foe.vy) > 1) foe.facing = foe.kind === 'worm' ? foe.facing : Math.atan2(foe.vy, foe.vx);
    foe.x = clamp(foe.x, PAGE.left + foe.r, PAGE.right - foe.r);
    foe.y = clamp(foe.y, PAGE.top + foe.r, PAGE.bottom - foe.r);
    if (foe.segments) trailSegments(foe, 15);
  }
  separateFoes(run);
}

/** Keep foes from piling into one blot: a gentle pairwise push. */
function separateFoes(run) {
  const list = run.foes;
  for (let i = 0; i < list.length; i += 1) {
    const a = list[i];
    for (let j = i + 1; j < list.length; j += 1) {
      const b = list[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const min = (a.r + b.r) * 0.9;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min || d2 === 0) continue;
      const d = Math.sqrt(d2);
      const push = (min - d) * 0.5;
      const wa = a.boss ? 0 : b.boss ? 1 : 0.5;
      const wb = b.boss ? 0 : a.boss ? 1 : 0.5;
      a.x -= (dx / d) * push * wa * 2;
      a.y -= (dy / d) * push * wa * 2;
      b.x += (dx / d) * push * wb * 2;
      b.y += (dy / d) * push * wb * 2;
    }
  }
}

/**
 * Hurt a foe. `source` is 'dart', 'stroke', 'seal', 'loop' or 'hop'. An unbroken shell (snails,
 * Sir Gastropod) shrugs off most of it; a loop around a shell cracks it open.
 */
export function damageFoe(run, foe, amount, source) {
  if (foe.hp <= 0 || foe.emerge > 0.3) return;
  let dealt = amount;
  if (foe.armored && foe.crack <= 0) {
    if (source === 'loop') {
      foe.crack = foe.boss ? 6 : 5;
      popup(run, foe.x, foe.y - foe.r - 10, 'SHELL CRACKED!', '#2647a3', foe.boss ? 30 : 18);
      emit(run, 'crack', { x: foe.x, y: foe.y, boss: foe.boss });
    } else {
      dealt *= foe.boss ? 0.12 : source === 'dart' ? 0.25 : 0.4;
    }
  }
  foe.hp -= dealt;
  foe.flash = 0.12;
  if (source !== 'stroke') emit(run, 'hit', { x: foe.x, y: foe.y, source });
  if (foe.hp <= 0) killFoe(run, foe, source);
}

/** A foe is blotted out: score, gold leaf, ink, splits. Bosses are finished in bosses.js. */
export function killFoe(run, foe, source) {
  foe.hp = 0;
  foe.dead = true;
  const def = FOE_KINDS[foe.kind];
  run.stats.kills += 1;
  if (foe.boss) return;
  const gilded = source === 'loop';
  if (gilded) run.stats.illuminated += 1;
  addScore(run, def.points * (gilded ? 2 : 1), foe.x, foe.y, false);
  dropLoot(run, foe.x, foe.y, def.xp, gilded, source);
  emit(run, 'kill', { x: foe.x, y: foe.y, kind: foe.kind, r: foe.r, gilded });
  if (foe.kind === 'blotch') {
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI * 2 + run.rng.next();
      const child = spawnFoe(run, 'blotling', foe.x + Math.cos(a) * 18, foe.y + Math.sin(a) * 18);
      child.emerge = 0.15;
      child.vx = Math.cos(a) * 160;
      child.vy = Math.sin(a) * 160;
    }
  }
}

/** Every circle a foe occupies (a worm is its head plus body), for hit tests. */
export function foeCircles(foe) {
  if (!foe.segments) return [{ x: foe.x, y: foe.y, r: foe.r }];
  const out = [{ x: foe.x, y: foe.y, r: foe.r * 1.15 }];
  for (const seg of foe.segments) out.push({ x: seg.x, y: seg.y, r: foe.segR || foe.r });
  return out;
}
