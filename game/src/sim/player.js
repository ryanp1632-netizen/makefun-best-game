// The Hare Knight: movement, the hop (a short invulnerable dash) and taking wounds.
import { PAGE, PLAYER } from '../config.js';
import { clamp } from './geometry.js';
import { emit } from './events.js';
import { rubricLevel } from './rubrics.js';

export function createPlayer(diff) {
  return {
    x: (PAGE.left + PAGE.right) / 2,
    y: (PAGE.top + PAGE.bottom) / 2 + 40,
    r: PLAYER.radius,
    vx: 0,
    vy: 0,
    hearts: diff.hearts,
    maxHearts: diff.hearts,
    invulnerable: 0,
    hop: 0,
    hopCooldown: 0,
    hopX: 1,
    hopY: 0,
    facing: 0,
    stride: 0,
    throwAnim: 0,
    hurtFlash: 0,
  };
}

export function hopCooldown(run) {
  return PLAYER.hopCooldown * (1 - 0.25 * rubricLevel(run, 'haste'));
}

/** One step of the hare: `controls.move` is a unit vector, `controls.hop` asks for a hop. */
export function updatePlayer(run, controls, dt) {
  const p = run.player;
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.hopCooldown = Math.max(0, p.hopCooldown - dt);
  p.throwAnim = Math.max(0, p.throwAnim - dt);
  p.hurtFlash = Math.max(0, p.hurtFlash - dt);
  const move = controls.move;
  const inPuddle = run.puddles.some((pd) => Math.hypot(pd.x - p.x, pd.y - p.y) < pd.r);
  const speed = PLAYER.speed * (1 + 0.12 * rubricLevel(run, 'haste')) * (inPuddle ? 0.55 : 1);

  if (controls.hop && p.hopCooldown <= 0 && p.hop <= 0) {
    const has = move.x !== 0 || move.y !== 0;
    p.hopX = has ? move.x : Math.cos(p.facing);
    p.hopY = has ? move.y : Math.sin(p.facing);
    p.hop = PLAYER.hopTime;
    p.hopCooldown = hopCooldown(run);
    p.invulnerable = Math.max(p.invulnerable, PLAYER.hopTime + 0.12);
    run.stats.hops += 1;
    emit(run, 'hop', { x: p.x, y: p.y });
  }

  if (p.hop > 0) {
    p.hop -= dt;
    p.vx = p.hopX * PLAYER.hopSpeed;
    p.vy = p.hopY * PLAYER.hopSpeed;
  } else {
    const k = Math.min(1, 14 * dt);
    p.vx += (move.x * speed - p.vx) * k;
    p.vy += (move.y * speed - p.vy) * k;
  }
  p.x = clamp(p.x + p.vx * dt, PAGE.left + p.r, PAGE.right - p.r);
  p.y = clamp(p.y + p.vy * dt, PAGE.top + p.r, PAGE.bottom - p.r);
  const moving = Math.hypot(p.vx, p.vy);
  if (moving > 20) {
    p.stride += moving * dt * 0.05;
    if (p.throwAnim <= 0) p.facing = Math.atan2(p.vy, p.vx);
  }
}

/** One wound to the hare (ignored while it is invulnerable). */
export function hurtPlayer(run, fromX, fromY, cause) {
  const p = run.player;
  if (p.invulnerable > 0 || run.lost || run.won) return false;
  p.hearts -= 1;
  p.invulnerable = PLAYER.invulnerable;
  p.hurtFlash = 0.3;
  const dx = p.x - fromX;
  const dy = p.y - fromY;
  const d = Math.hypot(dx, dy) || 1;
  p.vx = (dx / d) * 420;
  p.vy = (dy / d) * 420;
  run.stats.wounds += 1;
  run.folioWounds += 1;
  emit(run, 'hurt', { x: p.x, y: p.y, hearts: p.hearts });
  if (p.hearts <= 0) {
    run.lost = true;
    run.killer = cause;
    emit(run, 'lost', {});
  }
  return true;
}
