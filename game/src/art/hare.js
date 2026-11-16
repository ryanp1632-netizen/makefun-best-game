// The Hare Knight, drawn in ink and colour: cream fur, lapis tabard with a gold cross,
// a steel helm with a vermilion plume and a pennoned lance.
import { PALETTE } from '../config.js';

export function drawHare(ctx, p, time, scale = 1) {
  const facingLeft = Math.cos(p.facing) < 0;
  const hopping = p.hop > 0;
  const bob = Math.sin(p.stride * 2) * 2.5;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(scale, scale);

  ctx.fillStyle = PALETTE.shadow;
  ctx.beginPath();
  ctx.ellipse(0, 16, 17, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (p.invulnerable > 0 && !hopping && Math.floor(time * 16) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.translate(0, hopping ? -10 : bob * 0.4);
  if (facingLeft) ctx.scale(-1, 1);
  if (hopping) ctx.scale(1.15, 0.9);
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineJoin = 'round';

  // lance behind the body
  ctx.save();
  ctx.rotate(-0.55 + (p.throwAnim > 0 ? 0.5 : 0));
  ctx.strokeStyle = '#6b4a2a';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-6, 10);
  ctx.lineTo(34, 10);
  ctx.stroke();
  ctx.fillStyle = '#c9ced8';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(34, 6);
  ctx.lineTo(46, 10);
  ctx.lineTo(34, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.vermilion;
  ctx.beginPath();
  ctx.moveTo(24, 10);
  ctx.lineTo(16, 0 + Math.sin(time * 9) * 2);
  ctx.lineTo(30, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // feet
  ctx.fillStyle = PALETTE.cream;
  ctx.lineWidth = 2;
  const kick = Math.sin(p.stride * 2) * 4;
  ctx.beginPath();
  ctx.ellipse(-7 + kick, 13, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(7 - kick, 13, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // body + tabard
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.ellipse(0, 2, 13, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.lapis;
  ctx.beginPath();
  ctx.moveTo(-11, -4);
  ctx.lineTo(11, -4);
  ctx.lineTo(9, 13);
  ctx.lineTo(-9, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = PALETTE.goldLight;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, 11);
  ctx.moveTo(-6, 3);
  ctx.lineTo(6, 3);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;

  // ears
  const flop = Math.sin(time * 3 + p.stride) * 0.12 + (hopping ? -0.35 : 0);
  for (const [ox, rot] of [
    [-4, -0.32 + flop],
    [5, 0.12 + flop * 0.6],
  ]) {
    ctx.save();
    ctx.translate(ox, -20);
    ctx.rotate(rot);
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.ellipse(0, -14, 5, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.rose;
    ctx.beginPath();
    ctx.ellipse(0, -13, 2.2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // head + helm
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.arc(4, -15, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b8bfcc';
  ctx.beginPath();
  ctx.arc(3, -17, 10, Math.PI * 1.02, Math.PI * 1.98);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.vermilion;
  ctx.beginPath();
  ctx.moveTo(-1, -26);
  ctx.quadraticCurveTo(-14, -34, -16, -22);
  ctx.quadraticCurveTo(-8, -26, -1, -24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(9, -14, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.rose;
  ctx.beginPath();
  ctx.arc(13.5, -11, 1.8, 0, Math.PI * 2);
  ctx.fill();

  if (p.hurtFlash > 0) {
    ctx.strokeStyle = `rgba(196, 53, 28, ${Math.min(1, p.hurtFlash * 4)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -6, 30 + (0.3 - p.hurtFlash) * 40, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
