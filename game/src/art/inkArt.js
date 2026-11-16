// Drawing what the quill and the foes put on the page: wet and gilded strokes, the golden flash of
// an Illumination, puddles, spit, falling drops, the seal, darts and pick-ups.
import { INK, PALETTE } from '../config.js';

function tracePath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i += 1) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
}

export function drawStrokes(ctx, ink, time) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of ink.strokes) {
    if (stroke.points.length < 2) continue;
    const fade = Math.min(1, (stroke.life - stroke.age) / 0.6);
    ctx.globalAlpha = Math.max(0, fade);
    tracePath(ctx, stroke.points);
    if (stroke.gilded) {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = INK.strokeWidth + 4;
      ctx.stroke();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = INK.strokeWidth;
      ctx.stroke();
      ctx.strokeStyle = PALETTE.goldPale;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = INK.strokeWidth + (stroke === ink.current ? 1.5 : 0);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(120, 140, 220, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

/** The burst of gold when a loop closes: the enclosed page glows, rays and a gilded rim. */
export function drawIlluminations(ctx, ink, time) {
  for (const loop of ink.loops) {
    const t = loop.age / 1.1;
    const alpha = 1 - t;
    ctx.save();
    ctx.globalAlpha = alpha * (loop.n > 0 ? 0.75 : 0.35);
    ctx.beginPath();
    loop.poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    const r = 40 + loop.n * 18;
    const g = ctx.createRadialGradient(loop.x, loop.y, 0, loop.x, loop.y, r * 2);
    // burnished gold leaf: bright at the heart, deep amber at the rim, with a glow around the line
    g.addColorStop(0, 'rgba(255, 246, 200, 0.55)');
    g.addColorStop(0.45, PALETTE.goldLight);
    g.addColorStop(1, '#c47f0a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(255, 196, 40, 0.9)';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 5 + 8 * (1 - t);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 250, 225, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (loop.n > 0) {
      ctx.strokeStyle = `rgba(255, 241, 184, ${alpha})`;
      ctx.lineWidth = 3;
      const rays = 10 + loop.n * 2;
      for (let i = 0; i < rays; i += 1) {
        const a = (i / rays) * Math.PI * 2 + loop.age * 0.8;
        const r0 = r * 0.4 + t * 40;
        const r1 = r0 + 30 + loop.n * 6;
        ctx.beginPath();
        ctx.moveTo(loop.x + Math.cos(a) * r0, loop.y + Math.sin(a) * r0);
        ctx.lineTo(loop.x + Math.cos(a) * r1, loop.y + Math.sin(a) * r1);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

/** Slowing ink puddles: a glossy, smooth-edged pool with a wet blue rim. */
export function drawPuddles(ctx, puddles, time) {
  for (const pd of puddles) {
    const grow = Math.min(1, pd.age / 0.25);
    const fade = Math.min(1, pd.life / 0.8);
    const pts = [];
    for (let i = 0; i < 10; i += 1) {
      const ang = (i / 10) * Math.PI * 2;
      const rr = pd.r * grow * (1 + Math.sin(i * 2.3 + pd.x * 0.1) * 0.1 + Math.sin(time * 2 + i) * 0.03);
      pts.push({ x: pd.x + Math.cos(ang) * rr, y: pd.y + Math.sin(ang) * rr * 0.72 });
    }
    ctx.beginPath();
    for (let i = 0; i < pts.length; i += 1) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % pts.length];
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
    }
    ctx.quadraticCurveTo(pts[0].x, pts[0].y, (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
    ctx.closePath();
    ctx.fillStyle = `rgba(26, 22, 48, ${0.62 * fade})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(38, 71, 163, ${0.6 * fade})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = `rgba(150, 170, 240, ${0.35 * fade})`;
    ctx.beginPath();
    ctx.ellipse(pd.x - pd.r * 0.3, pd.y - pd.r * 0.22, pd.r * 0.28, pd.r * 0.09, -0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawGlobs(ctx, globs, time) {
  for (const g of globs) {
    if (g.page) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(time * 9 + g.x * 0.1);
      ctx.fillStyle = '#fbf3dc';
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.6;
      ctx.fillRect(-9, -7, 18, 14);
      ctx.strokeRect(-9, -7, 18, 14);
      ctx.fillStyle = PALETTE.vermilion;
      ctx.fillRect(-6, -4, 5, 5);
      ctx.restore();
    } else {
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(g.x - 2.5, g.y - 2.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Warnings for the Great Blot's attacks: a shrinking target where a drop will fall, a spreading ring. */
export function drawHazards(ctx, hazards, time) {
  for (const h of hazards) {
    if (h.kind === 'drop') {
      const k = Math.max(0, Math.min(1, h.t / 1.2));
      ctx.strokeStyle = PALETTE.vermilion;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(196, 53, 28, ${0.12 + (1 - k) * 0.25})`;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r * (1 - k * 0.85), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.ink;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y - 220 * k, 7, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (h.kind === 'ring') {
      ctx.strokeStyle = 'rgba(28, 24, 38, 0.85)';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(196, 53, 28, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}

export function drawSealMarks(ctx, marks) {
  for (const m of marks) {
    const t = m.age / 0.8;
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.strokeStyle = PALETTE.vermilion;
    ctx.lineWidth = 10 * (1 - t) + 2;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r * (0.4 + t * 0.6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.vermilion;
    ctx.beginPath();
    for (let i = 0; i <= 14; i += 1) {
      const a = (i / 14) * Math.PI * 2;
      const rr = 30 * (1 + (i % 2) * 0.12);
      ctx.lineTo(m.x + Math.cos(a) * rr, m.y + Math.sin(a) * rr);
    }
    ctx.fill();
    ctx.strokeStyle = '#8a1f0c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#8a1f0c';
    ctx.font = `bold 22px ${'Georgia, serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', m.x, m.y + 1);
    ctx.restore();
  }
}

export function drawDarts(ctx, darts) {
  ctx.lineCap = 'round';
  for (const d of darts) {
    const a = Math.atan2(d.vy, d.vx);
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(a);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();
    ctx.fillStyle = PALETTE.vermilion;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-20, -5);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-20, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function drawPickups(ctx, pickups, time) {
  for (const item of pickups) {
    const blink = item.age > 13 && Math.floor(time * 8) % 2 === 0;
    if (blink) continue;
    const bob = Math.sin(time * 5 + item.x) * 2;
    if (item.kind === 'leaf') {
      ctx.save();
      ctx.translate(item.x, item.y + bob);
      ctx.rotate(Math.sin(time * 3 + item.y) * 0.6);
      ctx.fillStyle = PALETTE.gold;
      ctx.strokeStyle = '#7a5a0c';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(0, -7, 6, 0);
      ctx.quadraticCurveTo(0, 7, -6, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = PALETTE.goldPale;
      ctx.fillRect(-2, -1, 3, 2);
      ctx.restore();
    } else if (item.kind === 'ink') {
      ctx.fillStyle = PALETTE.lapis;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(item.x, item.y - 9 + bob);
      ctx.quadraticCurveTo(item.x + 7, item.y + bob, item.x, item.y + 6 + bob);
      ctx.quadraticCurveTo(item.x - 7, item.y + bob, item.x, item.y - 9 + bob);
      ctx.fill();
      ctx.stroke();
    } else {
      drawHeartShape(ctx, item.x, item.y + bob, 10, PALETTE.vermilion);
    }
  }
}

export function drawHeartShape(ctx, x, y, size, color, outline = PALETTE.ink) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.85);
  ctx.bezierCurveTo(-size * 1.3, -size * 0.1, -size * 0.6, -size * 1.05, 0, -size * 0.35);
  ctx.bezierCurveTo(size * 0.6, -size * 1.05, size * 1.3, -size * 0.1, 0, size * 0.85);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = Math.max(1.5, size * 0.14);
  ctx.stroke();
  ctx.restore();
}

/** The quill cursor that follows the mouse over the page. */
export function drawQuill(ctx, x, y, drawing, dry) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.75);
  ctx.fillStyle = dry ? '#c9b8a0' : PALETTE.cream;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -6, 40, -3);
  ctx.quadraticCurveTo(22, 6, 4, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(36, -2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = dry ? PALETTE.vermilion : PALETTE.ink;
  ctx.beginPath();
  ctx.arc(x, y, drawing ? 4 : 2.5, 0, Math.PI * 2);
  ctx.fill();
}
