// Drawing helpers shared by the HUD and the menus: lettering, parchment cards, buttons with
// hover and click areas, bars, key caps and the illuminated drop capital.
import { FONT, PALETTE } from '../config.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function text(ctx, str, x, y, opts = {}) {
  const { size = 20, color = PALETTE.ink, align = 'left', baseline = 'alphabetic', weight = 'bold', outline = null, outlineWidth = 4, italic = false, maxWidth } = opts;
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = outline;
    ctx.strokeText(str, x, y, maxWidth);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y, maxWidth);
}

export function textWidth(ctx, str, size, weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  return ctx.measureText(str).width;
}

/** A parchment card with an inked double rule. */
export function panel(ctx, x, y, w, h, opts = {}) {
  const { fill = PALETTE.panel, edge = PALETTE.panelEdge, radius = 12, shadow = true, accent = null } = opts;
  if (shadow) {
    ctx.fillStyle = 'rgba(60, 35, 10, 0.25)';
    roundRect(ctx, x + 4, y + 6, w, h, radius);
    ctx.fill();
  }
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = edge;
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = accent || 'rgba(122, 83, 40, 0.6)';
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, Math.max(2, radius - 4));
  ctx.stroke();
}

export function bar(ctx, x, y, w, h, frac, color, back = 'rgba(28, 24, 38, 0.18)', edge = PALETTE.ink) {
  ctx.fillStyle = back;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, Math.max(h, w * f), h, h / 2);
    ctx.fill();
  }
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.stroke();
}

/** A small key cap, e.g. [SPACE]. Returns its width. */
export function keyCap(ctx, label, x, y, size = 15) {
  ctx.font = `bold ${size}px ${FONT}`;
  const w = ctx.measureText(label).width + 14;
  ctx.fillStyle = PALETTE.cream;
  roundRect(ctx, x, y - size, w, size + 9, 5);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x + 7, y + 1);
  return w;
}

/** UI frame state: the clickable areas drawn this frame and where the mouse is. */
export function createUi() {
  return { buttons: [], mouse: { x: 0, y: 0 }, hover: null };
}

export function beginUi(ui, mouse) {
  ui.buttons = [];
  ui.mouse = mouse;
}

/** Which button (id) is under the mouse, if any. */
export function hitButton(ui, x, y) {
  for (let i = ui.buttons.length - 1; i >= 0; i -= 1) {
    const b = ui.buttons[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
  }
  return null;
}

export function button(ctx, ui, id, x, y, w, h, label, opts = {}) {
  const { primary = false, selected = false, sub = '', size = 26, color = null } = opts;
  ui.buttons.push({ id, x, y, w, h });
  const hover = ui.mouse && ui.mouse.x >= x && ui.mouse.x <= x + w && ui.mouse.y >= y && ui.mouse.y <= y + h;
  const fill = color || (primary ? PALETTE.vermilion : selected ? PALETTE.gold : PALETTE.cream);
  ctx.fillStyle = 'rgba(60, 35, 10, 0.3)';
  roundRect(ctx, x + 3, y + 5, w, h, 10);
  ctx.fill();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y - (hover ? 2 : 0), w, h, 10);
  ctx.fill();
  ctx.lineWidth = hover || selected ? 4 : 2.5;
  ctx.strokeStyle = PALETTE.ink;
  ctx.stroke();
  const ink = primary || color ? PALETTE.cream : PALETTE.ink;
  const cy = y - (hover ? 2 : 0) + h / 2 + (sub ? -9 : 0);
  text(ctx, label, x + w / 2, cy, { size, color: ink, align: 'center', baseline: 'middle' });
  if (sub) text(ctx, sub, x + w / 2, cy + size * 0.5 + 10, { size: 15, color: primary || color ? PALETTE.goldPale : PALETTE.inkSoft, align: 'center', baseline: 'middle', weight: 'normal' });
}

/** An illuminated initial: a gold-leaf square, a coloured letter and a curl of vine. */
export function dropCap(ctx, letter, x, y, size, time = 0) {
  ctx.save();
  ctx.fillStyle = 'rgba(60, 35, 10, 0.3)';
  ctx.fillRect(x + 5, y + 7, size, size);
  const g = ctx.createLinearGradient(x, y, x + size, y + size);
  g.addColorStop(0, PALETTE.goldPale);
  g.addColorStop(0.45, PALETTE.goldLight);
  g.addColorStop(1, PALETTE.gold);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, size, size);
  ctx.fillStyle = PALETTE.lapis;
  ctx.fillRect(x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84);
  ctx.strokeStyle = PALETTE.goldLight;
  ctx.lineWidth = 3;
  ctx.strokeRect(x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84);
  ctx.strokeStyle = 'rgba(247, 215, 106, 0.7)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const cx = x + size * (i < 2 ? 0.2 : 0.8);
    const cy = y + size * (i % 2 ? 0.8 : 0.2);
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.07, 0, Math.PI * 2);
    ctx.stroke();
  }
  text(ctx, letter, x + size / 2, y + size * 0.56, { size: size * 0.78, color: PALETTE.vermilion, align: 'center', baseline: 'middle', outline: PALETTE.goldPale, outlineWidth: 6 });
  ctx.restore();
}

/** A red rubric tag such as GOAL or WIN, used in rule lists. Returns the tag width. */
export function tag(ctx, label, x, y, color = PALETTE.vermilion, size = 17) {
  ctx.font = `bold ${size}px ${FONT}`;
  const w = Math.max(78, ctx.measureText(label).width + 18);
  ctx.fillStyle = color;
  roundRect(ctx, x, y - size, w, size + 10, 6);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, label, x + w / 2, y - size / 2 + 5, { size, color: PALETTE.cream, align: 'center', baseline: 'middle' });
  return w;
}
