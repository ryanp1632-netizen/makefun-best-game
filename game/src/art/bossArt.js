// The three Grotesques: Sir Gastropod in his mitre, the page-plated Bookwyrm and the many-eyed Great Blot.
import { PALETTE } from '../config.js';
import { blobPath, drawWormBody, eyes } from './foeArt.js';

function drawGastropod(ctx, boss, time) {
  const r = boss.r;
  if (boss.state === 'aim') {
    ctx.save();
    ctx.strokeStyle = `rgba(196, 53, 28, ${0.5 + Math.sin(time * 30) * 0.3})`;
    ctx.lineWidth = 10;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.moveTo(boss.x, boss.y);
    ctx.lineTo(boss.x + boss.aimX * 420, boss.y + boss.aimY * 420);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.translate(boss.x, boss.y);
  const left = boss.vx < 0;
  if (left) ctx.scale(-1, 1);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.fillStyle = '#cfd59a';
  ctx.beginPath();
  ctx.moveTo(-r * 1.2, r * 0.6);
  ctx.quadraticCurveTo(0, r * 0.85, r * 1.35, r * 0.55);
  ctx.quadraticCurveTo(r * 1.45, -r * 0.2, r * 0.9, -r * 0.2);
  ctx.lineTo(-r, r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // mitre
  ctx.fillStyle = '#fbf6ea';
  ctx.beginPath();
  ctx.moveTo(r * 0.85, -r * 0.25);
  ctx.lineTo(r * 1.05, -r * 1.05);
  ctx.lineTo(r * 1.3, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(r * 1.06, -r * 0.95);
  ctx.lineTo(r * 1.08, -r * 0.35);
  ctx.moveTo(r * 0.95, -r * 0.6);
  ctx.lineTo(r * 1.2, -r * 0.6);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.ink;
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(r * 1.2, -r * 0.05, 4, 0, Math.PI * 2);
  ctx.fill();
  const cracked = boss.crack > 0;
  const shellR = r * 0.9;
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 4, 0, -r * 0.1, shellR);
  g.addColorStop(0, cracked ? '#d9e2ff' : PALETTE.lapisLight);
  g.addColorStop(1, cracked ? '#8d9cc8' : '#1d3580');
  ctx.fillStyle = g;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-r * 0.1, -r * 0.15, shellR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = PALETTE.goldLight;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let t = 0; t < 13; t += 0.2) {
    const rr = shellR * 0.85 * (1 - t / 14);
    const x = -r * 0.1 + Math.cos(t) * rr;
    const y = -r * 0.15 + Math.sin(t) * rr;
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (cracked) {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.7);
    ctx.lineTo(-r * 0.2, -r * 0.2);
    ctx.lineTo(-r * 0.4, r * 0.4);
    ctx.moveTo(r * 0.4, -r * 0.9);
    ctx.lineTo(0, -r * 0.3);
    ctx.lineTo(r * 0.5, 0);
    ctx.stroke();
    ctx.strokeStyle = `rgba(247, 215, 106, ${0.5 + Math.sin(time * 12) * 0.4})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.15, shellR + 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (boss.state === 'dizzy' || boss.stun > 0) {
    ctx.fillStyle = PALETTE.goldLight;
    for (let i = 0; i < 4; i += 1) {
      const a = time * 4 + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.8, -r * 1.2 + Math.sin(a) * 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawWyrm(ctx, boss, time) {
  drawWormBody(ctx, boss, '#b9a77a', true);
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate(boss.facing);
  const r = boss.r * 1.3;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.fillStyle = '#8c6d3f';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.2, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const bite = boss.state === 'coil' ? 0.9 : Math.abs(Math.sin(time * 6)) * 0.5;
  ctx.fillStyle = PALETTE.ink;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.9, s * r * 0.35);
    ctx.quadraticCurveTo(r * 1.9, s * r * (0.7 + bite), r * 1.7, s * r * 0.05);
    ctx.lineTo(r * 1.05, s * r * 0.15);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.vermilion;
  ctx.beginPath();
  ctx.arc(r * 0.4, -r * 0.5, 5, 0, Math.PI * 2);
  ctx.arc(r * 0.4, r * 0.5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.goldLight;
  ctx.beginPath();
  ctx.arc(r * 0.45, -r * 0.5, 2, 0, Math.PI * 2);
  ctx.arc(r * 0.45, r * 0.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBlot(ctx, boss, time, player) {
  const r = boss.r;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.fillStyle = 'rgba(28, 24, 38, 0.25)';
  blobPath(ctx, r * 1.35, time * 0.6, 3, 17, 0.12);
  ctx.fill();
  ctx.fillStyle = boss.phase2 ? '#2a1033' : PALETTE.ink;
  blobPath(ctx, r, time * (boss.phase2 ? 1.6 : 0.9), 1, 17, 0.11);
  ctx.fill();
  ctx.fillStyle = boss.phase2 ? 'rgba(196, 53, 28, 0.35)' : 'rgba(90, 127, 216, 0.25)';
  blobPath(ctx, r * 0.6, time * 1.3, 4, 11, 0.2);
  ctx.fill();
  const dx = player.x - boss.x;
  const dy = player.y - boss.y;
  const d = Math.hypot(dx, dy) || 1;
  const spots = [
    [-0.35, -0.25, 9],
    [0.3, -0.3, 11],
    [0, 0.15, 13],
    [-0.5, 0.25, 6],
    [0.5, 0.2, 7],
  ];
  for (const [ex, ey, size] of spots) eyes(ctx, ex * r, ey * r, size * 0.6, 0, dx / d, dy / d, boss.phase2);
  ctx.fillStyle = PALETTE.ink;
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2 + time * 0.3;
    const drip = r * (1.05 + Math.abs(Math.sin(time * 2 + i)) * 0.25);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * drip, Math.sin(a) * drip, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const PAINTERS = { gastropod: drawGastropod, wyrm: drawWyrm, blot: drawBlot };

export function drawBoss(ctx, boss, time, player) {
  ctx.save();
  if (boss.emerge > 0) {
    const t = 1 - boss.emerge / 1.4;
    ctx.fillStyle = 'rgba(28, 24, 38, 0.4)';
    ctx.beginPath();
    ctx.ellipse(boss.x, boss.y + boss.r * 0.5, boss.r * 1.6 * t + 8, boss.r * 0.6 * t + 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = Math.max(0.1, t);
  } else {
    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(boss.x, boss.y + boss.r * 0.8, boss.r * 1.1, boss.r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  PAINTERS[boss.kind](ctx, boss, time, player);
  ctx.restore();
  if (boss.flash > 0) {
    ctx.fillStyle = `rgba(255, 245, 210, ${boss.flash * 3})`;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.r, 0, Math.PI * 2);
    ctx.fill();
  }
}
