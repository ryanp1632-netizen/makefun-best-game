// Feedback that is only for the eye: ink droplets, gold sparks, floating score text, screen shake,
// lasting stains on the page and the page-turn between folios. Fed by the run's events.
import { PALETTE, FONT, VIEW } from '../config.js';
import { createRng } from '../rng.js';
import { clearStains, createStainLayer, stainAt } from './parchment.js';

export function createEffects() {
  return { particles: [], popups: [], shake: 0, flash: 0, flashColor: '255, 241, 184', stains: createStainLayer(), rng: createRng(4242), pageTurn: 0 };
}

function burst(fx, x, y, count, color, speed, life, size, gravity = 0) {
  const rng = fx.rng;
  for (let i = 0; i < count; i += 1) {
    const a = rng.range(0, Math.PI * 2);
    const s = rng.range(speed * 0.3, speed);
    fx.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rng.range(life * 0.6, life), age: 0, color, size: rng.range(size * 0.5, size), gravity });
  }
}

/** Turn this step's run events into particles, popups and shakes. */
export function absorbEvents(fx, events) {
  for (const e of events) {
    switch (e.type) {
      case 'kill':
        burst(fx, e.x, e.y, e.gilded ? 14 : 9, e.gilded ? PALETTE.gold : PALETTE.ink, 190, 0.6, 5, 300);
        if (e.gilded) burst(fx, e.x, e.y, 6, PALETTE.goldPale, 120, 0.8, 3);
        stainAt(fx.stains, fx.rng, e.x, e.y, e.r * 0.9, e.gilded);
        break;
      case 'loop':
        if (e.n > 0) {
          for (let i = 0; i < e.poly.length; i += 3) burst(fx, e.poly[i].x, e.poly[i].y, 1, PALETTE.goldLight, 80, 0.7, 4);
          burst(fx, e.x, e.y, 10 + e.n * 4, PALETTE.goldPale, 260, 0.9, 5);
          fx.shake = Math.max(fx.shake, Math.min(14, 3 + e.n * 1.5));
          fx.flash = Math.min(0.35, 0.08 + e.n * 0.03);
          fx.flashColor = '255, 241, 184';
        }
        break;
      case 'hit':
        burst(fx, e.x, e.y, 3, e.source === 'dart' ? PALETTE.vermilionLight : PALETTE.ink, 120, 0.25, 3);
        break;
      case 'seal':
        burst(fx, e.x, e.y, 18, PALETTE.vermilion, 320, 0.5, 6);
        fx.shake = Math.max(fx.shake, 9);
        break;
      case 'hurt':
        fx.shake = Math.max(fx.shake, 12);
        fx.flash = 0.3;
        fx.flashColor = '196, 53, 28';
        burst(fx, e.x, e.y, 10, PALETTE.vermilion, 200, 0.5, 4);
        break;
      case 'crack':
        burst(fx, e.x, e.y, e.boss ? 24 : 10, PALETTE.lapisLight, 260, 0.6, 5, 400);
        if (e.boss) fx.shake = Math.max(fx.shake, 12);
        break;
      case 'bossDown':
        burst(fx, e.x, e.y, 70, PALETTE.gold, 420, 1.3, 7, 200);
        burst(fx, e.x, e.y, 50, PALETTE.ink, 360, 1, 8, 300);
        stainAt(fx.stains, fx.rng, e.x, e.y, e.r * 1.4, true);
        fx.shake = 22;
        fx.flash = 0.5;
        fx.flashColor = '255, 241, 184';
        break;
      case 'splash':
        burst(fx, e.x, e.y, 12, PALETTE.ink, 200, 0.5, 5, 300);
        fx.shake = Math.max(fx.shake, 4);
        break;
      case 'surge':
      case 'phase2':
        fx.shake = Math.max(fx.shake, 10);
        break;
      case 'pickup':
        if (e.kind !== 'leaf') burst(fx, e.x, e.y, 6, e.kind === 'ink' ? PALETTE.lapisLight : PALETTE.rose, 90, 0.4, 3);
        break;
      case 'hop':
        burst(fx, e.x, e.y + 12, 6, PALETTE.parchmentEdge, 90, 0.35, 4);
        break;
      case 'folio':
        if (e.index > 0) fx.pageTurn = 1;
        clearStains(fx.stains);
        break;
      case 'popup':
        fx.popups.push({ x: e.x, y: e.y, text: e.text, color: e.color, size: e.size, age: 0 });
        break;
      default:
        break;
    }
  }
}

export function updateEffects(fx, dt) {
  for (const p of fx.particles) {
    p.age += dt;
    p.vx *= 1 - Math.min(1, 2.5 * dt);
    p.vy = p.vy * (1 - Math.min(1, 2.5 * dt)) + p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  fx.particles = fx.particles.filter((p) => p.age < p.life);
  if (fx.particles.length > 900) fx.particles.splice(0, fx.particles.length - 900);
  for (const pop of fx.popups) pop.age += dt;
  fx.popups = fx.popups.filter((p) => p.age < 1.3);
  fx.shake = Math.max(0, fx.shake - dt * 40);
  fx.flash = Math.max(0, fx.flash - dt * 1.2);
  fx.pageTurn = Math.max(0, fx.pageTurn - dt * 1.4);
}

export function drawParticles(ctx, fx) {
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 - (p.age / p.life) * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Popup ink colours lifted to their bright versions for the dark lozenges. */
const BRIGHT = { '#a5760c': '#ffd75e', '#c4351c': '#ff8a66', '#2647a3': '#9db8ff' };

function roundPill(ctx, x, y, w, h) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawPopups(ctx, fx) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const pop of fx.popups) {
    const t = pop.age / 1.3;
    const rise = pop.age * 40;
    const pulse = pop.age < 0.15 ? 1 + (0.15 - pop.age) * 3 : 1;
    ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    const size = Math.round(pop.size * 1.3 * pulse);
    ctx.font = `bold ${size}px ${FONT}`;
    const x = Math.max(80, Math.min(VIEW.w - 80, pop.x));
    const y = pop.y - rise;
    if (pop.size >= 20) {
      // the big ones sit on a dark lozenge, bright enough to read across the page
      const w = ctx.measureText(pop.text).width + size * 0.9;
      ctx.fillStyle = 'rgba(36, 22, 14, 0.72)';
      roundPill(ctx, x - w / 2, y - size * 0.62, w, size * 1.24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(247, 215, 106, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = BRIGHT[pop.color] || '#fff3d6';
      ctx.fillText(pop.text, x, y + 1);
    } else {
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255, 248, 228, 0.95)';
      ctx.strokeText(pop.text, x, y);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, x, y);
    }
  }
  ctx.globalAlpha = 1;
}

/** Screen-wide flash (gold for a loop, red for a wound) and the page-turn sweep. */
export function drawOverlays(ctx, fx) {
  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(${fx.flashColor}, ${fx.flash * 0.5})`;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  if (fx.pageTurn > 0) {
    const x = VIEW.w * (1 - fx.pageTurn) * 1.3 - 120;
    const g = ctx.createLinearGradient(x - 160, 0, x + 40, 0);
    g.addColorStop(0, 'rgba(90, 55, 20, 0)');
    g.addColorStop(0.8, 'rgba(90, 55, 20, 0.35)');
    g.addColorStop(1, 'rgba(90, 55, 20, 0)');
    ctx.fillStyle = PALETTE.parchment;
    ctx.globalAlpha = Math.min(1, fx.pageTurn * 1.5);
    ctx.fillRect(x, 0, VIEW.w - x, VIEW.h);
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(x - 160, 0, 200, VIEW.h);
  }
}

export function shakeOffset(fx, time) {
  if (fx.shake <= 0) return { x: 0, y: 0 };
  return { x: Math.sin(time * 91) * fx.shake * 0.5, y: Math.cos(time * 77) * fx.shake * 0.5 };
}
