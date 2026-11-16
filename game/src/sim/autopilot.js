// A simple scribe-bot that plays MARGINALIA through the same controls a player uses: it keeps
// clear of foes, gathers gold leaf and draws loops around the thickest crowd. It runs the title
// screen's demo page and the screenshot scenes, and lets the balance be tested without a browser.
import { INK, PAGE } from '../config.js';
import { clamp } from './geometry.js';
import { sealRadius } from './weapons.js';

const PREFERENCE = ['echo', 'vermilion', 'inkwell', 'quill', 'twin', 'mail', 'dropcap', 'patience', 'gilt', 'barbs', 'haste', 'wax', 'lapis', 'saint', 'lodestone'];

export function createPilot(skill = 1, pace = 1.25) {
  return { plan: null, step: 0, rest: 0.6, skill, pace, aimX: 640, aimY: 400 };
}

/** The rubric the pilot takes from an offer (index into run.offer). */
export function pilotPick(run) {
  let best = 0;
  let bestRank = 99;
  run.offer.forEach((id, i) => {
    const rank = PREFERENCE.indexOf(id);
    if (rank < bestRank) {
      bestRank = rank;
      best = i;
    }
  });
  return best;
}

/** Find the densest crowd of foes worth a loop: {x, y, r, count}. */
function findCrowd(run) {
  const live = run.foes.filter((f) => !f.dead && f.emerge <= 0);
  if (run.boss && !run.boss.dead && run.boss.emerge <= 0) {
    const b = run.boss;
    const near = live.filter((f) => !f.boss && Math.hypot(f.x - b.x, f.y - b.y) < b.r + 70).length;
    const bodyR = b.segments ? 70 : b.r + 26;
    return { x: b.x, y: b.y, r: bodyR, count: 3 + near };
  }
  let best = null;
  for (const f of live) {
    let count = 0;
    let sx = 0;
    let sy = 0;
    let far = 0;
    for (const g of live) {
      const d = Math.hypot(g.x - f.x, g.y - f.y);
      if (d < 105) {
        count += 1;
        sx += g.x;
        sy += g.y;
      }
    }
    if (!best || count > best.count) {
      const cx = sx / count;
      const cy = sy / count;
      for (const g of live) {
        const d = Math.hypot(g.x - cx, g.y - cy);
        if (d < 120) far = Math.max(far, d + g.r);
      }
      best = { x: cx, y: cy, r: clamp(far + 22, 55, 165), count };
    }
  }
  return best;
}

function planLoop(run, crowd) {
  const n = Math.ceil((Math.PI * 2 * crowd.r) / 15);
  const a0 = run.rng.range(0, Math.PI * 2);
  const pts = [];
  for (let i = 0; i <= n + 3; i += 1) {
    const a = a0 + (i / n) * Math.PI * 2;
    const wobble = 1 + Math.sin(i * 0.9) * 0.04;
    pts.push({
      x: clamp(crowd.x + Math.cos(a) * crowd.r * wobble, PAGE.left + 6, PAGE.right - 6),
      y: clamp(crowd.y + Math.sin(a) * crowd.r * wobble, PAGE.top + 6, PAGE.bottom - 6),
    });
  }
  return pts;
}

/** The controls the pilot sends this step. */
export function pilotControls(run, pilot, dt) {
  const p = run.player;
  let fx = 0;
  let fy = 0;
  let threat = 0;
  for (const foe of run.foes) {
    if (foe.dead) continue;
    const reach = foe.boss ? 300 : 210;
    const circles = foe.segments ? [foe, ...foe.segments] : [foe];
    for (const c of circles) {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > reach) continue;
      const w = ((reach - d) / reach) ** 2 * (foe.boss ? 3 : 1);
      fx += (dx / d) * w;
      fy += (dy / d) * w;
      if (d < foe.r + p.r + 26) threat += 1;
    }
  }
  for (const h of run.hazards) {
    const dx = p.x - h.x;
    const dy = p.y - h.y;
    const d = Math.hypot(dx, dy) || 1;
    if (h.kind === 'drop' && d < h.r + 50) {
      fx += (dx / d) * 4;
      fy += (dy / d) * 4;
    }
    if (h.kind === 'ring' && Math.abs(d - h.r) < 40 && d > h.r) threat += 2;
  }
  for (const g of run.globs) {
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < 120) {
      fx += (-g.vy / 270) * 1.5;
      fy += (g.vx / 270) * 1.5;
    }
  }
  for (const pd of run.puddles) {
    const dx = p.x - pd.x;
    const dy = p.y - pd.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d < pd.r + 20) {
      fx += (dx / d) * 1.2;
      fy += (dy / d) * 1.2;
    }
  }
  const cx = (PAGE.left + PAGE.right) / 2;
  const cy = (PAGE.top + PAGE.bottom) / 2;
  fx += (cx - p.x) * 0.0016;
  fy += (cy - p.y) * 0.0022;
  const calm = Math.hypot(fx, fy) < 0.4;
  if (calm) {
    let leaf = null;
    let ld = 260;
    for (const item of run.pickups) {
      const d = Math.hypot(item.x - p.x, item.y - p.y);
      if (d < ld) {
        ld = d;
        leaf = item;
      }
    }
    if (leaf) {
      fx += ((leaf.x - p.x) / ld) * 0.6;
      fy += ((leaf.y - p.y) / ld) * 0.6;
    }
  }
  const len = Math.hypot(fx, fy);
  const move = len > 0.05 ? { x: fx / len, y: fy / len } : { x: 0, y: 0 };

  // The quill: follow a planned loop, or plan one around the thickest crowd.
  let pen = { down: false, x: pilot.aimX, y: pilot.aimY };
  pilot.rest -= dt;
  if (pilot.plan) {
    // about 1,100 px of ink a second: a quick but human hand
    pilot.step += pilot.pace;
    const i = Math.min(Math.floor(pilot.step), pilot.plan.length - 1);
    pen = { down: true, x: pilot.plan[i].x, y: pilot.plan[i].y };
    if (pilot.step >= pilot.plan.length - 1) {
      pilot.plan = null;
      pilot.rest = 0.45 / pilot.skill;
    }
  } else if (pilot.rest <= 0 && !run.ink.current) {
    const crowd = findCrowd(run);
    const cost = Math.PI * 2 * (crowd ? crowd.r : 0) * INK.costPerPixel + 4;
    if (crowd && crowd.count >= (run.boss && !run.boss.dead ? 1 : 2) && run.ink.level > cost) {
      pilot.plan = planLoop(run, crowd);
      pilot.step = 0;
      pen = { down: true, x: pilot.plan[0].x, y: pilot.plan[0].y };
    }
  }
  pilot.aimX = pen.x;
  pilot.aimY = pen.y;

  let seal = null;
  if (run.seal.cooldown <= 0) {
    const r = sealRadius(run);
    const near = run.foes.filter((f) => !f.dead && f.emerge <= 0 && Math.hypot(f.x - p.x, f.y - p.y) < r).length;
    if (near >= 6 || (threat >= 2 && near >= 3)) seal = { x: p.x, y: p.y };
  }
  const hop = threat >= 1 && p.hopCooldown <= 0;
  return { move, hop, pen, seal };
}
