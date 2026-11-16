// How each marginal beast is drawn: wobbling blots with eyes, scribbled wasps, armoured snails,
// spitting gargoyles, segmented bookworms and the splitting Blotch.
import { PALETTE } from '../config.js';

/** A wobbling ink blob outline (used by blotlings, the Blotch and the Great Blot). */
export function blobPath(ctx, r, time, seed, points = 11, wobble = 0.13) {
  ctx.beginPath();
  for (let i = 0; i <= points; i += 1) {
    const a = (i / points) * Math.PI * 2;
    const rr = r * (1 + Math.sin(time * 3.1 + i * 1.7 + seed) * wobble + Math.sin(time * 5.3 + i * 2.9 + seed) * wobble * 0.5);
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** A pair of eyes that look toward (lookX, lookY) in the foe's own frame. */
export function eyes(ctx, ox, oy, size, gap, lookX, lookY, angry = false) {
  for (const s of [-1, 1]) {
    const ex = ox + s * gap;
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    ctx.arc(ex, oy, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(ex + lookX * size * 0.4, oy + lookY * size * 0.4, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    if (angry) {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex - size * 1.1, oy - size * (s < 0 ? 1.4 : 0.8));
      ctx.lineTo(ex + size * 1.1, oy - size * (s < 0 ? 0.8 : 1.4));
      ctx.stroke();
    }
  }
}

function look(foe, player) {
  const dx = player.x - foe.x;
  const dy = player.y - foe.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d };
}

function drawBlotling(ctx, foe, time, player) {
  const l = look(foe, player);
  ctx.fillStyle = foe.inked > 0 ? '#28305a' : PALETTE.ink;
  blobPath(ctx, foe.r, time, foe.phase);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(-foe.r * 0.35, -foe.r * 0.45, foe.r * 0.32, foe.r * 0.18, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.ellipse(foe.r * 0.2, foe.r * 1.05 + Math.sin(time * 4 + foe.phase) * 2, 2.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, l.x * 3, -2 + l.y * 2, foe.r * 0.3, foe.r * 0.36, l.x, l.y);
}

function drawBlotch(ctx, foe, time, player) {
  const l = look(foe, player);
  ctx.fillStyle = '#2b1f3a';
  blobPath(ctx, foe.r, time * 0.8, foe.phase, 13, 0.16);
  ctx.fill();
  ctx.fillStyle = 'rgba(160, 120, 220, 0.25)';
  blobPath(ctx, foe.r * 0.6, time, foe.phase + 2, 9, 0.2);
  ctx.fill();
  eyes(ctx, l.x * 4 - 3, -5 + l.y * 3, 5, 7, l.x, l.y, true);
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.arc(l.x * 4 + 9, 6 + l.y * 3, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(l.x * 5 + 9, 6 + l.y * 4, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawWasp(ctx, foe, time) {
  ctx.rotate(foe.facing);
  const flap = Math.sin(time * 40 + foe.phase) * 0.5;
  ctx.fillStyle = 'rgba(230, 240, 255, 0.7)';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(-2, s * 9, 9, 5, s * (0.5 + flap), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.gold;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(-4, 0, 11, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  for (const x of [-9, -4, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, -6);
    ctx.lineTo(x, 6);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(8, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-14, -2);
  ctx.lineTo(-21, 0);
  ctx.lineTo(-14, 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.vermilion;
  ctx.beginPath();
  ctx.arc(10, -2, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnail(ctx, foe, time) {
  const left = Math.cos(foe.facing) < 0;
  if (left) ctx.scale(-1, 1);
  const r = foe.r;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.fillStyle = '#cfd59a';
  ctx.beginPath();
  ctx.moveTo(-r * 1.1, r * 0.55);
  ctx.quadraticCurveTo(0, r * 0.75, r * 1.25, r * 0.5);
  ctx.quadraticCurveTo(r * 1.3, -r * 0.1, r * 0.85, -r * 0.05);
  ctx.lineTo(-r * 0.9, r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const wave = Math.sin(time * 3 + foe.phase) * 2;
  ctx.beginPath();
  ctx.moveTo(r * 1.0, 0);
  ctx.lineTo(r * 1.15, -r * 0.7 + wave);
  ctx.moveTo(r * 0.85, 0);
  ctx.lineTo(r * 0.85, -r * 0.65 - wave);
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(r * 1.15, -r * 0.7 + wave, 2.5, 0, Math.PI * 2);
  ctx.arc(r * 0.85, -r * 0.65 - wave, 2.5, 0, Math.PI * 2);
  ctx.fill();
  const cracked = foe.crack > 0;
  ctx.fillStyle = cracked ? '#9fb0d8' : PALETTE.lapis;
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.1, r * 0.82, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = PALETTE.goldLight;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let t = 0; t < 12; t += 0.3) {
    const rr = r * 0.7 * (1 - t / 13);
    const x = -r * 0.1 + Math.cos(t) * rr;
    const y = -r * 0.1 + Math.sin(t) * rr;
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (cracked) {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.6);
    ctx.lineTo(-r * 0.1, -r * 0.1);
    ctx.lineTo(-r * 0.3, r * 0.3);
    ctx.moveTo(r * 0.3, -r * 0.7);
    ctx.lineTo(0, -r * 0.2);
    ctx.stroke();
  }
}

function drawSpitter(ctx, foe, time, player) {
  const l = look(foe, player);
  const r = foe.r;
  const flap = Math.sin(time * 9 + foe.phase) * 0.3;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.fillStyle = '#8a8478';
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);
    ctx.rotate(flap);
    ctx.beginPath();
    ctx.moveTo(r * 0.5, -r * 0.2);
    ctx.lineTo(r * 1.7, -r * 0.9);
    ctx.lineTo(r * 1.4, -r * 0.1);
    ctx.lineTo(r * 1.7, r * 0.3);
    ctx.lineTo(r * 0.6, r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#a49d8e';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6e685d';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * r * 0.4, -r * 0.8);
    ctx.lineTo(s * r * 0.75, -r * 1.45);
    ctx.lineTo(s * r * 0.8, -r * 0.6);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.ellipse(l.x * 3, r * 0.3 + l.y * 2, r * 0.45, r * 0.32 + (foe.timer < 0.5 ? 3 : 0), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.vermilion;
  ctx.beginPath();
  ctx.ellipse(l.x * 3, r * 0.45 + l.y * 2, r * 0.22, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  eyes(ctx, l.x * 3, -r * 0.25 + l.y * 2, r * 0.22, r * 0.33, l.x, l.y, true);
}

function drawWorm(ctx, foe, time) {
  // body is drawn in world space by drawFoe; this draws the head only
  ctx.rotate(foe.facing);
  const r = foe.r * 1.15;
  ctx.fillStyle = '#c9c48a';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.15, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const bite = Math.abs(Math.sin(time * 8 + foe.phase)) * 0.5;
  ctx.fillStyle = PALETTE.ink;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.9, s * r * 0.3);
    ctx.quadraticCurveTo(r * 1.7, s * r * (0.6 + bite), r * 1.5, s * r * 0.05);
    ctx.lineTo(r * 1.0, s * r * 0.15);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(r * 0.35, -r * 0.45, 2.6, 0, Math.PI * 2);
  ctx.arc(r * 0.35, r * 0.45, 2.6, 0, Math.PI * 2);
  ctx.fill();
}

/** A worm's trailing body, drawn tail first so the head overlaps it. */
export function drawWormBody(ctx, foe, color = '#c9c48a', plates = false) {
  const segs = foe.segments;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  for (let i = segs.length - 1; i >= 0; i -= 1) {
    const s = segs[i];
    const r = (foe.segR || foe.r) * (1 - (i / segs.length) * 0.35);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (plates) {
      ctx.fillStyle = '#fbf3dc';
      ctx.fillRect(s.x - r * 0.55, s.y - r * 0.6, r * 1.1, r * 1.2);
      ctx.strokeRect(s.x - r * 0.55, s.y - r * 0.6, r * 1.1, r * 1.2);
      ctx.strokeStyle = 'rgba(28,24,38,0.5)';
      ctx.lineWidth = 1;
      for (let k = -2; k <= 2; k += 1) {
        ctx.beginPath();
        ctx.moveTo(s.x - r * 0.4, s.y + k * r * 0.2);
        ctx.lineTo(s.x + r * 0.4, s.y + k * r * 0.2);
        ctx.stroke();
      }
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
    } else {
      ctx.beginPath();
      ctx.arc(s.x, s.y, r * 0.55, 0.3, 2.8);
      ctx.stroke();
    }
  }
}

const PAINTERS = { blotling: drawBlotling, blotch: drawBlotch, wasp: drawWasp, snail: drawSnail, spitter: drawSpitter, worm: drawWorm };

/** Draw one common foe at its place, with its spawn seep, hit flash, stun stars and health. */
export function drawFoe(ctx, foe, time, player) {
  if (foe.segments) drawWormBody(ctx, foe);
  ctx.save();
  ctx.translate(foe.x, foe.y);
  if (foe.emerge > 0) {
    const t = 1 - foe.emerge / 0.6;
    ctx.fillStyle = 'rgba(28, 24, 38, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, foe.r * 0.6, foe.r * 1.3 * t + 4, foe.r * 0.5 * t + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.max(0.15, t);
    ctx.scale(0.3 + 0.7 * t, 0.3 + 0.7 * t);
  } else {
    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(0, foe.r * 0.85, foe.r * 0.95, foe.r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (foe.gild > 0) {
    const halo = ctx.createRadialGradient(0, 0, foe.r * 0.3, 0, 0, foe.r * 2.2);
    halo.addColorStop(0, 'rgba(255, 241, 184, 0.95)');
    halo.addColorStop(1, 'rgba(247, 215, 106, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, foe.r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  PAINTERS[foe.kind](ctx, foe, time, player);
  ctx.restore();
  if (foe.gild > 0) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(foe.x, foe.y, foe.r + 5 + (0.3 - foe.gild) * 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(247, 215, 106, 0.45)';
    ctx.beginPath();
    ctx.arc(foe.x, foe.y, foe.r * 1.05, 0, Math.PI * 2);
    ctx.fill();
  }
  if (foe.flash > 0) {
    ctx.fillStyle = `rgba(255, 245, 210, ${foe.flash * 5})`;
    ctx.beginPath();
    ctx.arc(foe.x, foe.y, foe.r * 1.05, 0, Math.PI * 2);
    ctx.fill();
  }
  if (foe.stun > 0 && foe.emerge <= 0) {
    ctx.fillStyle = PALETTE.goldLight;
    for (let i = 0; i < 3; i += 1) {
      const a = time * 5 + (i * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(foe.x + Math.cos(a) * foe.r, foe.y - foe.r - 6 + Math.sin(a) * 4, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (foe.hp < foe.maxHp && foe.maxHp >= 25 && foe.emerge <= 0) {
    const w = foe.r * 2;
    ctx.fillStyle = 'rgba(28,24,38,0.55)';
    ctx.fillRect(foe.x - w / 2, foe.y - foe.r - 12, w, 4);
    ctx.fillStyle = PALETTE.vermilion;
    ctx.fillRect(foe.x - w / 2, foe.y - foe.r - 12, (w * Math.max(0, foe.hp)) / foe.maxHp, 4);
  }
}
