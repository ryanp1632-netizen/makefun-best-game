// The manuscript itself: aged parchment, faint script in two ruled columns, and a different
// illuminated border for each folio (garden vines, bestiary knotwork, starry last leaf).
// Everything is painted once into offscreen canvases and reused every frame.
import { PAGE, PALETTE, VIEW } from '../config.js';
import { createRng } from '../rng.js';

const cache = new Map();

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** The bare sheet: colour, fibres, foxing spots, darkened edges. */
function paintSheet(ctx, rng) {
  const g = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 120, VIEW.w / 2, VIEW.h / 2, 820);
  g.addColorStop(0, '#f6ead0');
  g.addColorStop(0.6, PALETTE.parchment);
  g.addColorStop(1, PALETTE.parchmentDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  for (let i = 0; i < 14; i += 1) {
    const x = rng.range(0, VIEW.w);
    const y = rng.range(0, VIEW.h);
    const r = rng.range(40, 160);
    const s = ctx.createRadialGradient(x, y, 0, x, y, r);
    s.addColorStop(0, `rgba(170, 120, 60, ${rng.range(0.04, 0.09)})`);
    s.addColorStop(1, 'rgba(170, 120, 60, 0)');
    ctx.fillStyle = s;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.lineWidth = 1;
  for (let i = 0; i < 520; i += 1) {
    const x = rng.range(0, VIEW.w);
    const y = rng.range(0, VIEW.h);
    const a = rng.range(0, Math.PI);
    const l = rng.range(4, 16);
    ctx.strokeStyle = `rgba(120, 85, 40, ${rng.range(0.04, 0.1)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = `rgba(130, 80, 30, ${rng.range(0.05, 0.16)})`;
    ctx.beginPath();
    ctx.arc(rng.range(0, VIEW.w), rng.range(0, VIEW.h), rng.range(0.6, 2.4), 0, Math.PI * 2);
    ctx.fill();
  }
  const edge = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 420, VIEW.w / 2, VIEW.h / 2, 900);
  edge.addColorStop(0, 'rgba(120, 70, 20, 0)');
  edge.addColorStop(1, 'rgba(110, 62, 18, 0.42)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}

/** Two columns of faded script on ruled lines, like the text the marginal beasts live beside. */
function paintScript(ctx, rng) {
  const columns = [
    [PAGE.left + 60, (PAGE.left + PAGE.right) / 2 - 30],
    [(PAGE.left + PAGE.right) / 2 + 30, PAGE.right - 60],
  ];
  ctx.lineCap = 'round';
  for (const [x0, x1] of columns) {
    for (let y = PAGE.top + 50; y < PAGE.bottom - 30; y += 30) {
      ctx.strokeStyle = 'rgba(150, 60, 40, 0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y + 4);
      ctx.lineTo(x1, y + 4);
      ctx.stroke();
      let x = x0 + (x0 < PAGE.left + 100 && y < PAGE.top + 150 ? 90 : 0);
      ctx.strokeStyle = 'rgba(45, 30, 40, 0.12)';
      ctx.lineWidth = 1.6;
      while (x < x1 - 20) {
        const word = rng.int(2, 7);
        ctx.beginPath();
        for (let k = 0; k < word; k += 1) {
          const h = rng.pick([7, 9, 12, 15]);
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + 2, y - h, x + 5, y - 2);
          ctx.quadraticCurveTo(x + 6, y + 2, x + 8, y - 1);
          x += 8;
        }
        ctx.stroke();
        x += rng.range(6, 12);
      }
    }
  }
}

function vine(ctx, rng, x0, y0, x1, y1, leafColor) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = (x1 - x0) / len;
  const ny = (y1 - y0) / len;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let t = 0; t <= len; t += 6) {
    const off = Math.sin(t / 26) * 6;
    const x = x0 + nx * t - ny * off;
    const y = y0 + ny * t + nx * off;
    if (t === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  for (let t = 20; t < len - 10; t += 26) {
    const side = Math.sin(t / 26) > 0 ? 1 : -1;
    const x = x0 + nx * t;
    const y = y0 + ny * t;
    const a = Math.atan2(ny, nx) + side * 1.1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.fillStyle = rng.chance(0.18) ? PALETTE.vermilion : leafColor;
    ctx.beginPath();
    ctx.ellipse(9, 0, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
}

function knot(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i += 1) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(size * 0.45, 0, size * 0.45, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

/** The illuminated frame around the playing page, one style per folio. */
function paintBorder(ctx, rng, folio) {
  const { left, top, right, bottom } = PAGE;
  const colors = [PALETTE.verdigris, PALETTE.vermilion, PALETTE.lapis];
  const main = colors[folio];
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeRect(left - 10, top - 10, right - left + 20, bottom - top + 20);
  ctx.lineWidth = 6;
  ctx.strokeStyle = main;
  ctx.strokeRect(left - 5, top - 5, right - left + 10, bottom - top + 10);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = PALETTE.gold;
  ctx.strokeRect(left - 1, top - 1, right - left + 2, bottom - top + 2);
  if (folio === 0) {
    vine(ctx, rng, left - 28, top + 30, left - 28, bottom - 30, PALETTE.verdigrisLight);
    vine(ctx, rng, right + 28, top + 30, right + 28, bottom - 30, PALETTE.verdigrisLight);
  } else if (folio === 1) {
    for (let y = top + 40; y < bottom - 20; y += 70) {
      knot(ctx, left - 28, y, 22, PALETTE.lapisLight);
      knot(ctx, right + 28, y, 22, PALETTE.lapisLight);
    }
  } else {
    ctx.fillStyle = PALETTE.lapis;
    ctx.fillRect(left - 44, top - 8, 30, bottom - top + 16);
    ctx.fillRect(right + 14, top - 8, 30, bottom - top + 16);
    for (let y = top + 16; y < bottom - 6; y += 34) {
      ctx.fillStyle = PALETTE.goldLight;
      star(ctx, left - 29, y, 8);
      ctx.fill();
      star(ctx, right + 29, y + 17, 8);
      ctx.fill();
    }
  }
  for (const [x, y] of [
    [left - 10, top - 10],
    [right + 10, top - 10],
    [left - 10, bottom + 10],
    [right + 10, bottom + 10],
  ]) {
    ctx.fillStyle = PALETTE.gold;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

const INITIALS = ['H', 'B', 'S'];

/** A small five-petal flower, the kind scribes dotted along their vines. */
function flower(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

/**
 * The painted decoration inside the page, faded so the beasts stay readable: a large illuminated
 * initial opening the first column, red rubric lines, coloured paragraph marks, and a flowering
 * vine climbing the gutter between the columns.
 */
function paintIllumination(ctx, rng, folio) {
  const { left, top, right, bottom } = PAGE;
  const colors = [PALETTE.verdigris, PALETTE.vermilion, PALETTE.lapis];
  const main = colors[folio];
  ctx.save();
  ctx.globalAlpha = 0.62;
  // the initial: a gold square, a coloured field, the letter in cream with an ink outline
  const ix = left + 26;
  const iy = top + 22;
  const s = 104;
  ctx.fillStyle = PALETTE.gold;
  ctx.fillRect(ix - 6, iy - 6, s + 12, s + 12);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(ix - 6, iy - 6, s + 12, s + 12);
  ctx.fillStyle = main;
  ctx.fillRect(ix, iy, s, s);
  for (let i = 0; i < 18; i += 1) {
    ctx.fillStyle = PALETTE.goldLight;
    ctx.beginPath();
    ctx.arc(ix + rng.range(8, s - 8), iy + rng.range(8, s - 8), rng.range(1.5, 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.font = `bold 92px ${'Palatino Linotype, Palatino, Georgia, serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.strokeStyle = PALETTE.ink;
  ctx.strokeText(INITIALS[folio], ix + s / 2, iy + s / 2 + 6);
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText(INITIALS[folio], ix + s / 2, iy + s / 2 + 6);
  // a vine trailing down from the initial along the outer margin
  vine(ctx, rng, ix + 10, iy + s + 8, ix + 10, bottom - 40, PALETTE.verdigrisLight);
  flower(ctx, ix + 10, bottom - 34, 9, PALETTE.vermilion);
  // the gutter vine, with flowers in the three paint colours
  const gx = (left + right) / 2;
  vine(ctx, rng, gx, top + 30, gx, bottom - 30, PALETTE.verdigrisLight);
  for (let y = top + 70, k = 0; y < bottom - 40; y += 96, k += 1) {
    flower(ctx, gx, y, 10, [PALETTE.vermilion, PALETTE.lapisLight, PALETTE.goldLight][k % 3]);
  }
  // rubric lines (red script) at the head of each column, and paragraph marks
  ctx.strokeStyle = 'rgba(178, 52, 34, 0.9)';
  ctx.lineWidth = 2.4;
  for (const [x0, x1] of [
    [left + 150, gx - 40],
    [gx + 40, right - 60],
  ]) {
    let x = x0;
    ctx.beginPath();
    while (x < x1 - 20) {
      const h = rng.pick([8, 11, 14]);
      ctx.moveTo(x, top + 48);
      ctx.quadraticCurveTo(x + 2, top + 48 - h, x + 5, top + 46);
      ctx.quadraticCurveTo(x + 6, top + 50, x + 9, top + 47);
      x += rng.chance(0.2) ? 22 : 9;
    }
    ctx.stroke();
  }
  ctx.font = `bold 24px ${'Palatino Linotype, Palatino, Georgia, serif'}`;
  for (let y = top + 140; y < bottom - 30; y += 30) {
    if (!rng.chance(0.22)) continue;
    const right_ = rng.chance(0.5);
    ctx.fillStyle = rng.chance(0.5) ? PALETTE.vermilion : PALETTE.lapis;
    ctx.fillText('¶', right_ ? gx + 52 : left + 150, y - 2);
  }
  // a gilded corner piece in the far corner of the page
  for (const [cx, cy, sx, sy] of [
    [right - 18, bottom - 18, -1, -1],
    [right - 18, top + 18, -1, 1],
  ]) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * 90);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * 90, cy);
    ctx.stroke();
    flower(ctx, cx, cy, 11, main);
  }
  ctx.restore();
}

/** The finished page for a folio (0-2), painted once. */
export function pageArt(folio) {
  if (cache.has(folio)) return cache.get(folio);
  const canvas = makeCanvas(VIEW.w, VIEW.h);
  const ctx = canvas.getContext('2d');
  const rng = createRng(1301 + folio * 17);
  paintSheet(ctx, rng);
  paintScript(ctx, rng);
  paintIllumination(ctx, rng, folio);
  paintBorder(ctx, rng, folio);
  cache.set(folio, canvas);
  return canvas;
}

/** A plain sheet with no frame or script, for menus. */
export function blankSheet() {
  if (cache.has('blank')) return cache.get('blank');
  const canvas = makeCanvas(VIEW.w, VIEW.h);
  paintSheet(canvas.getContext('2d'), createRng(77));
  cache.set('blank', canvas);
  return canvas;
}

/** The ink-stain layer: every blotted foe leaves a faint mark that stays until the page turns. */
export function createStainLayer() {
  const canvas = makeCanvas(VIEW.w, VIEW.h);
  return { canvas, ctx: canvas.getContext('2d') };
}

export function clearStains(layer) {
  layer.ctx.clearRect(0, 0, VIEW.w, VIEW.h);
}

export function stainAt(layer, rng, x, y, r, gilded) {
  const ctx = layer.ctx;
  const tint = gilded ? '201, 150, 30' : '110, 80, 60';
  // a soft central bloom, a few satellite drops and a speckle spray, like a real ink spatter
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${tint}, ${gilded ? 0.16 : 0.09})`);
  g.addColorStop(0.7, `rgba(${tint}, ${gilded ? 0.09 : 0.05})`);
  g.addColorStop(1, `rgba(${tint}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(${tint}, ${gilded ? 0.14 : 0.07})`;
  for (let i = 0; i < 3; i += 1) {
    const a = rng.range(0, Math.PI * 2);
    const d = r * rng.range(0.9, 1.9);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rng.range(1, 3.2), 0, Math.PI * 2);
    ctx.fill();
  }
}
