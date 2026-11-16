// Gold leaf (experience toward the next Illumination), ink drops and the rare mended heart.
import { PLAYER } from '../config.js';
import { emit } from './events.js';
import { rubricLevel, offerRubrics } from './rubrics.js';

/** Scatter what a blotted foe leaves: gold leaf always, ink drops sometimes, a heart rarely. */
export function dropLoot(run, x, y, xp, gilded, source) {
  const giltBonus = gilded ? 1 + 0.5 * rubricLevel(run, 'gilt') : 1;
  const leaves = Math.max(1, Math.round(xp * (gilded ? 2 : 1) * giltBonus));
  for (let i = 0; i < leaves; i += 1) addPickup(run, 'leaf', x, y, 1);
  if (gilded && rubricLevel(run, 'saint') > 0) addPickup(run, 'ink', x, y, 3);
  else if (run.rng.chance(source === 'loop' ? 0.45 : 0.22)) addPickup(run, 'ink', x, y, 4);
  if (run.rng.chance(0.012)) addPickup(run, 'heart', x, y, 1);
}

export function addPickup(run, kind, x, y, value) {
  const a = run.rng.range(0, Math.PI * 2);
  const s = run.rng.range(40, 140);
  run.pickups.push({ kind, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, value, age: 0 });
}

/** Experience needed for the next Illumination. */
export function leafForLevel(level) {
  return 7 + level * 6;
}

export function updatePickups(run, dt) {
  const p = run.player;
  const magnet = PLAYER.magnet * (1 + 0.7 * rubricLevel(run, 'lodestone'));
  for (const item of run.pickups) {
    item.age += dt;
    item.vx *= 1 - Math.min(1, 4 * dt);
    item.vy *= 1 - Math.min(1, 4 * dt);
    const dx = p.x - item.x;
    const dy = p.y - item.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < magnet && item.age > 0.25) {
      const pull = 520 * (1 - d / magnet) + 120;
      item.vx += (dx / d) * pull * dt * 6;
      item.vy += (dy / d) * pull * dt * 6;
    }
    item.x += item.vx * dt;
    item.y += item.vy * dt;
    if (d < p.r + 10 && item.age > 0.2) collect(run, item);
  }
  run.pickups = run.pickups.filter((item) => !item.taken && item.age < 16);
}

function collect(run, item) {
  item.taken = true;
  const p = run.player;
  if (item.kind === 'leaf') {
    run.xp += item.value;
    run.stats.leaf += item.value;
    while (run.xp >= run.xpNext) {
      run.xp -= run.xpNext;
      run.level += 1;
      run.xpNext = leafForLevel(run.level);
      run.pendingPicks += 1;
    }
    if (run.pendingPicks > 0 && !run.offer) {
      run.offer = offerRubrics(run);
      if (run.offer.length === 0) {
        run.offer = null;
        run.pendingPicks = 0;
      } else emit(run, 'levelup', { level: run.level });
    }
  } else if (item.kind === 'ink') {
    run.ink.level = Math.min(run.ink.max, run.ink.level + item.value);
  } else if (item.kind === 'heart') {
    p.hearts = Math.min(p.maxHearts, p.hearts + 1);
  }
  emit(run, 'pickup', { kind: item.kind, x: item.x, y: item.y });
}
