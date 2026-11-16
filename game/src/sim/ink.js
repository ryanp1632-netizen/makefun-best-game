// The quill: ink strokes drawn with the mouse. A wet line burns and blocks foes; a line that
// crosses itself (or ends where it began) closes a loop, and every foe inside is Illuminated.
import { INK, PAGE } from '../config.js';
import { clamp, closestOnSegment, distance, pointInPolygon, polygonArea, polygonCenter, segmentCrossing } from './geometry.js';
import { damageFoe, foeCircles } from './foes.js';
import { emit, popup } from './events.js';
import { rubricLevel } from './rubrics.js';
import { addScore, bumpFlourish } from './scoring.js';
import { castSeal } from './weapons.js';

/** Seconds a caught foe glows gold before the Illumination strike lands. */
export const GILD_DELAY = 0.3;

/** Land the strike on every foe whose gilding has run out. */
function strikeGilded(run, dt) {
  for (const foe of run.foes) {
    if (!foe.gild || foe.dead) continue;
    foe.gild -= dt;
    if (foe.gild <= 0) {
      foe.gild = 0;
      damageFoe(run, foe, foe.gildDamage, 'loop');
    }
  }
}

export function createInk(max) {
  return { level: max, max, strokes: [], current: null, loops: [], dryFlash: 0 };
}

function strokeLife(run) {
  return INK.strokeLife * (1 + 0.6 * rubricLevel(run, 'patience'));
}

function newStroke(run, x, y) {
  const stroke = { points: [{ x, y }], age: 0, life: strokeLife(run), gilded: false, minX: x, maxX: x, minY: y, maxY: y };
  run.ink.strokes.push(stroke);
  run.ink.current = stroke;
  return stroke;
}

/** Put the quill down at (x, y). */
export function beginStroke(run, x, y) {
  if (run.ink.level < 2) {
    run.ink.dryFlash = 0.6;
    return;
  }
  newStroke(run, clamp(x, PAGE.left + 4, PAGE.right - 4), clamp(y, PAGE.top + 4, PAGE.bottom - 4));
  emit(run, 'penDown', { x, y });
}

/** Drag the quill to (x, y): long jumps are split so a fast flick still closes its loop. */
export function extendStroke(run, x, y) {
  const stroke = run.ink.current;
  if (!stroke) {
    beginStroke(run, x, y);
    return;
  }
  x = clamp(x, PAGE.left + 4, PAGE.right - 4);
  y = clamp(y, PAGE.top + 4, PAGE.bottom - 4);
  const last = stroke.points[stroke.points.length - 1];
  const d = distance(last.x, last.y, x, y);
  if (d < INK.pointSpacing) return;
  const steps = Math.ceil(d / 16);
  for (let k = 1; k <= steps; k += 1) {
    const from = run.ink.current;
    if (!from) return;
    const tail = from.points[from.points.length - 1];
    const t = 1 / (steps - k + 1);
    if (!addPoint(run, from, tail.x + (x - tail.x) * t, tail.y + (y - tail.y) * t)) return;
  }
}

/** Lift the quill: a stroke whose ends meet closes into a loop. */
export function endStroke(run) {
  const stroke = run.ink.current;
  run.ink.current = null;
  if (!stroke || stroke.points.length < 8) return;
  const first = stroke.points[0];
  const last = stroke.points[stroke.points.length - 1];
  if (distance(first.x, first.y, last.x, last.y) <= INK.closeDistance && polygonArea(stroke.points) >= INK.minLoopArea) {
    stroke.gilded = true;
    illuminate(run, stroke.points.slice());
  }
}

function addPoint(run, stroke, x, y) {
  const ink = run.ink;
  const pts = stroke.points;
  const last = pts[pts.length - 1];
  const cost = distance(last.x, last.y, x, y) * INK.costPerPixel;
  if (ink.level < cost) {
    ink.dryFlash = 0.7;
    emit(run, 'inkDry', { x, y });
    endStroke(run);
    return false;
  }
  ink.level -= cost;
  run.stats.inkUsed += cost;
  // Does the new segment cross an older part of this stroke? The oldest crossing makes the biggest loop.
  for (let i = 0; i < pts.length - 3; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    const hit = segmentCrossing(last.x, last.y, x, y, a.x, a.y, b.x, b.y);
    if (!hit) continue;
    const loop = [hit, ...pts.slice(i + 1)];
    if (polygonArea(loop) < INK.minLoopArea) break;
    pts.push({ x, y });
    growBounds(stroke, x, y);
    stroke.gilded = true;
    illuminate(run, loop);
    newStroke(run, hit.x, hit.y);
    addPoint(run, run.ink.current, x, y);
    return true;
  }
  pts.push({ x, y });
  growBounds(stroke, x, y);
  return true;
}

function growBounds(stroke, x, y) {
  stroke.minX = Math.min(stroke.minX, x);
  stroke.maxX = Math.max(stroke.maxX, x);
  stroke.minY = Math.min(stroke.minY, y);
  stroke.maxY = Math.max(stroke.maxY, y);
}

/** How many of a foe's circles lie inside the loop (a worm can be caught in part). */
function caughtShare(foe, loop) {
  const circles = foeCircles(foe);
  let inside = 0;
  for (const c of circles) if (pointInPolygon(c.x, c.y, loop)) inside += 1;
  return inside / circles.length;
}

/** The heart of the game: every foe inside a closed loop takes a gilded strike, scaled by how many were caught. */
export function illuminate(run, loop) {
  const caught = [];
  for (const foe of run.foes) {
    if (foe.dead || foe.emerge > 0.3 || foe.gild > 0) continue;
    const share = caughtShare(foe, loop);
    if (share > 0 && (foe.boss || share >= 0.34 || pointInPolygon(foe.x, foe.y, loop))) caught.push({ foe, share });
  }
  const n = caught.length;
  const center = polygonCenter(loop);
  run.stats.loops += 1;
  run.ink.loops.push({ poly: loop, age: 0, n, x: center.x, y: center.y });
  if (n === 0) {
    emit(run, 'loop', { n: 0, x: center.x, y: center.y, poly: loop });
    return 0;
  }
  bumpFlourish(run);
  const strike = INK.illuminateDamage * (1 + 0.4 * rubricLevel(run, 'echo')) * (1 + 0.12 * (n - 1));
  for (const { foe, share } of caught) {
    const amount = foe.boss ? strike * 1.6 * Math.max(0.35, share) : strike * Math.max(0.5, share);
    if (foe.boss) {
      foe.stun = Math.max(foe.stun, 0.35);
      damageFoe(run, foe, amount, 'loop');
    } else {
      // Gilded: the foe freezes in gold for a heartbeat, then the strike lands (see strikeGilded).
      foe.gild = GILD_DELAY;
      foe.gildDamage = amount;
      foe.stun = Math.max(foe.stun, GILD_DELAY + 0.5);
    }
  }
  run.stats.bestLoop = Math.max(run.stats.bestLoop, n);
  const label = n > 1 ? `ILLUMINATED x${n}  +#` : 'ILLUMINATED  +#';
  addScore(run, 15 * n * n, center.x, center.y - 20, true, label);
  if (n >= 4 && rubricLevel(run, 'dropcap') > 0) castSeal(run, center.x, center.y, true);
  if (n >= 6) popup(run, center.x, center.y + 18, n >= 10 ? 'MAGNIFICAT!' : 'GLORIOUS!', '#c4351c', 26);
  emit(run, 'loop', { n, x: center.x, y: center.y, poly: loop });
  return n;
}

/** Wet ink: regrowth of the well, drying lines, and the burn and the wall that a line is to foes. */
export function updateInk(run, dt) {
  const ink = run.ink;
  strikeGilded(run, dt);
  ink.dryFlash = Math.max(0, ink.dryFlash - dt);
  const regen = INK.regen * (1 + 0.5 * rubricLevel(run, 'quill')) * (ink.current ? 0.25 : 1);
  ink.level = Math.min(ink.max, ink.level + regen * dt);
  for (const stroke of ink.strokes) if (stroke !== ink.current) stroke.age += dt;
  ink.strokes = ink.strokes.filter((s) => s.age < s.life);
  for (const loop of ink.loops) loop.age += dt;
  ink.loops = ink.loops.filter((l) => l.age < 1.1);
  if (ink.strokes.length === 0) return;

  const dps = INK.strokeDps * (1 + 0.5 * rubricLevel(run, 'vermilion'));
  const lapis = rubricLevel(run, 'lapis');
  const half = INK.strokeWidth / 2;
  for (const foe of run.foes) {
    if (foe.dead || foe.emerge > 0) continue;
    let touching = false;
    for (const stroke of ink.strokes) {
      const reach = foe.r + half + 2;
      if (foe.x < stroke.minX - reach || foe.x > stroke.maxX + reach || foe.y < stroke.minY - reach || foe.y > stroke.maxY + reach) continue;
      const pts = stroke.points;
      for (let i = 1; i < pts.length; i += 1) {
        const c = closestOnSegment(foe.x, foe.y, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
        const dx = foe.x - c.x;
        const dy = foe.y - c.y;
        const d = Math.hypot(dx, dy);
        if (d >= foe.r + half) continue;
        touching = true;
        if (!foe.flies && !foe.boss && d > 0.001) {
          // The line is a wall: push the foe back out to its edge and kill the inward speed.
          const nx = dx / d;
          const ny = dy / d;
          foe.x = c.x + nx * (foe.r + half);
          foe.y = c.y + ny * (foe.r + half);
          const inward = foe.vx * nx + foe.vy * ny;
          if (inward < 0) {
            foe.vx -= inward * nx;
            foe.vy -= inward * ny;
          }
        }
      }
    }
    if (touching) {
      damageFoe(run, foe, dps * dt, 'stroke');
      if (lapis > 0) foe.slow = Math.max(foe.slow, 0.3 + 0.2 * lapis);
      foe.inked = 0.15;
    }
  }
}
