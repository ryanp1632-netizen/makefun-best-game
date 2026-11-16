// The hare's other tools: quill darts it throws on its own, and the wax seal it stamps on the page.
import { DARTS, PAGE, SEAL } from '../config.js';
import { damageFoe, foeCircles } from './foes.js';
import { emit } from './events.js';
import { rubricLevel } from './rubrics.js';

/** The nearest `count` foes within reach of the hare, closest first. */
function nearestFoes(run, count, range) {
  const p = run.player;
  const list = [];
  for (const foe of run.foes) {
    if (foe.dead || foe.emerge > 0) continue;
    const d = Math.hypot(foe.x - p.x, foe.y - p.y) - foe.r;
    if (d <= range) list.push({ foe, d });
  }
  list.sort((a, b) => a.d - b.d);
  return list.slice(0, count).map((e) => e.foe);
}

export function updateDarts(run, dt) {
  const p = run.player;
  run.dartTimer -= dt;
  if (run.dartTimer <= 0) {
    const volley = 1 + rubricLevel(run, 'twin');
    const targets = nearestFoes(run, volley, DARTS.range);
    if (targets.length > 0) {
      const barbs = rubricLevel(run, 'barbs');
      for (let i = 0; i < volley; i += 1) {
        const target = targets[i % targets.length];
        const spread = i >= targets.length ? (i - targets.length + 1) * 0.18 : 0;
        const a = Math.atan2(target.y - p.y, target.x - p.x) + spread;
        run.darts.push({
          x: p.x,
          y: p.y,
          vx: Math.cos(a) * DARTS.speed,
          vy: Math.sin(a) * DARTS.speed,
          life: DARTS.life,
          pierce: barbs,
          damage: DARTS.damage + 3 * barbs,
          hit: [],
        });
      }
      p.facing = Math.atan2(targets[0].y - p.y, targets[0].x - p.x);
      p.throwAnim = 0.15;
      emit(run, 'dart', { x: p.x, y: p.y });
      run.dartTimer = DARTS.interval;
    } else {
      run.dartTimer = 0.1;
    }
  }
  for (const dart of run.darts) {
    dart.life -= dt;
    dart.x += dart.vx * dt;
    dart.y += dart.vy * dt;
    if (dart.x < PAGE.left || dart.x > PAGE.right || dart.y < PAGE.top || dart.y > PAGE.bottom) dart.life = 0;
    if (dart.life <= 0) continue;
    for (const foe of run.foes) {
      if (foe.dead || foe.emerge > 0 || dart.hit.includes(foe.id)) continue;
      const hit = foeCircles(foe).some((c) => Math.hypot(c.x - dart.x, c.y - dart.y) < c.r + 4);
      if (!hit) continue;
      dart.hit.push(foe.id);
      damageFoe(run, foe, dart.damage, 'dart');
      foe.vx += dart.vx * 0.08;
      foe.vy += dart.vy * 0.08;
      dart.pierce -= 1;
      if (dart.pierce < 0) {
        dart.life = 0;
        break;
      }
    }
  }
  run.darts = run.darts.filter((d) => d.life > 0);
}

export function sealRadius(run) {
  return SEAL.radius * (1 + 0.2 * rubricLevel(run, 'wax'));
}

/** Stamp the wax seal at (x, y): a burst that knocks foes back and washes away their spit. */
export function castSeal(run, x, y, free = false) {
  if (!free) {
    if (run.seal.cooldown > 0) return false;
    run.seal.cooldown = SEAL.cooldown * (1 - 0.3 * rubricLevel(run, 'wax'));
    run.stats.seals += 1;
  }
  const r = sealRadius(run);
  for (const foe of run.foes) {
    if (foe.dead || foe.emerge > 0.3) continue;
    const dx = foe.x - x;
    const dy = foe.y - y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > r + foe.r) continue;
    if (!foe.boss) {
      foe.vx += (dx / d) * SEAL.knockback;
      foe.vy += (dy / d) * SEAL.knockback;
      foe.stun = Math.max(foe.stun, SEAL.stun);
    }
    damageFoe(run, foe, SEAL.damage * (1 - (0.4 * d) / (r + foe.r)), 'seal');
  }
  run.globs = run.globs.filter((g) => Math.hypot(g.x - x, g.y - y) > r);
  run.puddles = run.puddles.filter((pd) => Math.hypot(pd.x - x, pd.y - y) > r * 0.8);
  run.sealMarks.push({ x, y, r, age: 0 });
  emit(run, 'seal', { x, y, r, free });
  return true;
}
