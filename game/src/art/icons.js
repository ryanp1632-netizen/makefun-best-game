// Small emblems for the HUD and the rubric cards: inkwell, flame, sun, leaf, seal and the rest.
import { PALETTE } from '../config.js';
import { drawHeartShape } from './inkArt.js';

export function drawIcon(ctx, icon, x, y, size, color) {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = PALETTE.ink;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.08);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  switch (icon) {
    case 'flame':
      ctx.beginPath();
      ctx.moveTo(0, s * 0.5);
      ctx.bezierCurveTo(-s * 0.5, s * 0.4, -s * 0.4, -s * 0.1, 0, -s * 0.5);
      ctx.bezierCurveTo(s * 0.1, -s * 0.15, s * 0.5, -s * 0.05, s * 0.35, s * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.goldLight;
      ctx.beginPath();
      ctx.ellipse(0, s * 0.22, s * 0.14, s * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'drop':
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.5);
      ctx.quadraticCurveTo(s * 0.45, s * 0.05, 0, s * 0.45);
      ctx.quadraticCurveTo(-s * 0.45, s * 0.05, 0, -s * 0.5);
      ctx.fill();
      ctx.stroke();
      break;
    case 'well':
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, -s * 0.15);
      ctx.lineTo(s * 0.4, -s * 0.15);
      ctx.lineTo(s * 0.32, s * 0.45);
      ctx.lineTo(-s * 0.32, s * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.fillRect(-s * 0.18, -s * 0.32, s * 0.36, s * 0.18);
      ctx.strokeStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.moveTo(s * 0.05, -s * 0.3);
      ctx.lineTo(s * 0.45, -s * 0.55);
      ctx.stroke();
      break;
    case 'quill':
      ctx.rotate(-0.7);
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.5);
      ctx.quadraticCurveTo(-s * 0.3, 0, 0, -s * 0.5);
      ctx.quadraticCurveTo(s * 0.3, 0, 0, s * 0.5);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.5);
      ctx.lineTo(0, -s * 0.4);
      ctx.stroke();
      break;
    case 'sun':
      for (let i = 0; i < 12; i += 1) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.25, Math.sin(a) * s * 0.25);
        ctx.lineTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5);
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.08;
        ctx.stroke();
      }
      ctx.strokeStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 'leaf':
      ctx.beginPath();
      ctx.moveTo(-s * 0.45, s * 0.1);
      ctx.quadraticCurveTo(0, -s * 0.5, s * 0.45, -s * 0.1);
      ctx.quadraticCurveTo(0, s * 0.5, -s * 0.45, s * 0.1);
      ctx.fill();
      ctx.stroke();
      break;
    case 'darts':
    case 'barb':
      for (const off of icon === 'darts' ? [-s * 0.18, s * 0.18] : [0]) {
        ctx.beginPath();
        ctx.moveTo(-s * 0.45, off + s * 0.2);
        ctx.lineTo(s * 0.4, off - s * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-s * 0.45, off + s * 0.2);
        ctx.lineTo(-s * 0.25, off + s * 0.36);
        ctx.lineTo(-s * 0.3, off + s * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      if (icon === 'barb') {
        ctx.beginPath();
        ctx.moveTo(s * 0.4, -s * 0.2);
        ctx.lineTo(s * 0.2, -s * 0.28);
        ctx.moveTo(s * 0.4, -s * 0.2);
        ctx.lineTo(s * 0.3, -s * 0.02);
        ctx.stroke();
      }
      break;
    case 'hare':
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.ellipse(0, s * 0.15, s * 0.3, s * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-s * 0.1, -s * 0.25, s * 0.08, s * 0.25, -0.3, 0, Math.PI * 2);
      ctx.ellipse(s * 0.1, -s * 0.25, s * 0.08, s * 0.25, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5, s * 0.05);
      ctx.lineTo(-s * 0.35, s * 0.05);
      ctx.moveTo(-s * 0.5, s * 0.25);
      ctx.lineTo(-s * 0.35, s * 0.25);
      ctx.stroke();
      break;
    case 'seal':
      ctx.beginPath();
      for (let i = 0; i <= 14; i += 1) {
        const a = (i / 14) * Math.PI * 2;
        const rr = s * 0.45 * (1 + (i % 2) * 0.1);
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#8a1f0c';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.27, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'hourglass':
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.45);
      ctx.lineTo(s * 0.3, -s * 0.45);
      ctx.lineTo(-s * 0.3, s * 0.45);
      ctx.lineTo(s * 0.3, s * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'heart':
      drawHeartShape(ctx, 0, 0, s * 0.45, color);
      break;
    case 'halo':
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.12;
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.2, s * 0.4, s * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(0, s * 0.2, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'magnet':
      ctx.lineCap = 'butt';
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = s * 0.3;
      ctx.beginPath();
      ctx.arc(0, s * 0.05, s * 0.28, Math.PI, 0);
      ctx.lineTo(s * 0.28, s * 0.42);
      ctx.moveTo(-s * 0.28, s * 0.05);
      ctx.lineTo(-s * 0.28, s * 0.42);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = s * 0.18;
      ctx.stroke();
      ctx.fillStyle = PALETTE.cream;
      ctx.fillRect(-s * 0.37, s * 0.26, s * 0.18, s * 0.18);
      ctx.fillRect(s * 0.19, s * 0.26, s * 0.18, s * 0.18);
      break;
    default:
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
  }
  ctx.restore();
}
