// The Illumination screen: the run pauses and the hare chooses one of three rubrics.
import { PALETTE, VIEW } from '../config.js';
import { rubricById, rubricLevel } from '../sim/rubrics.js';
import { drawIcon } from '../art/icons.js';
import { button, panel, roundRect, text } from './widgets.js';

const ROMAN = ['', 'I', 'II', 'III'];

export function drawRubricPick(ctx, ui, run, time) {
  ctx.fillStyle = 'rgba(40, 25, 10, 0.55)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const cx = VIEW.w / 2;
  panel(ctx, cx - 330, 96, 660, 104, { radius: 14, edge: PALETTE.gold });
  text(ctx, `ILLUMINATION! LEVEL ${run.level}`, cx, 146, { size: 46, color: PALETTE.gold, align: 'center', baseline: 'middle', outline: PALETTE.ink, outlineWidth: 7 });
  text(ctx, 'Choose one rubric for your quill', cx, 184, { size: 22, align: 'center', baseline: 'middle', italic: true, weight: 'normal' });

  const cardW = 330;
  const gap = 34;
  const x0 = cx - (cardW * 3 + gap * 2) / 2;
  run.offer.forEach((id, i) => {
    const r = rubricById(id);
    const x = x0 + i * (cardW + gap);
    const y = 236;
    const hover = ui.mouse.x >= x && ui.mouse.x <= x + cardW && ui.mouse.y >= y && ui.mouse.y <= y + 380;
    const lift = hover ? -8 : Math.sin(time * 2 + i) * 2;
    panel(ctx, x, y + lift, cardW, 380, { radius: 16, edge: hover ? PALETTE.vermilion : PALETTE.panelEdge });
    ctx.fillStyle = r.color;
    roundRect(ctx, x + 14, y + lift + 14, cardW - 28, 150, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 250, 240, 0.85)';
    ctx.beginPath();
    ctx.arc(x + cardW / 2, y + lift + 89, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawIcon(ctx, r.icon, x + cardW / 2, y + lift + 89, 84, r.color);
    text(ctx, r.name, x + cardW / 2, y + lift + 206, { size: 29, align: 'center', baseline: 'middle', color: PALETTE.ink });
    const words = r.text.split(' ');
    let line = '';
    let ly = y + lift + 250;
    ctx.font = `normal 21px ${'Georgia, serif'}`;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > cardW - 50 && line) {
        text(ctx, line, x + cardW / 2, ly, { size: 21, align: 'center', weight: 'normal' });
        line = w;
        ly += 28;
      } else line = test;
    }
    text(ctx, line, x + cardW / 2, ly, { size: 21, align: 'center', weight: 'normal' });
    const level = rubricLevel(run, id);
    text(ctx, level > 0 ? `rank ${ROMAN[level]} > ${ROMAN[level + 1]}  (max ${ROMAN[r.max]})` : `new  (max ${ROMAN[r.max]})`, x + cardW / 2, y + lift + 326, {
      size: 17,
      align: 'center',
      color: PALETTE.inkSoft,
    });
    button(ctx, ui, `pick:${i}`, x + 40, y + lift + 340, cardW - 80, 30, `TAKE  [${i + 1}]`, { size: 18, primary: hover });
    ui.buttons.push({ id: `pick:${i}`, x, y, w: cardW, h: 380 });
  });

  const owned = run.rubricOrder;
  text(ctx, owned.length ? 'YOUR RUBRICS' : 'No rubrics yet: this is your first', cx, 660, { size: 18, align: 'center', color: PALETTE.cream });
  const counts = {};
  for (const id of owned) counts[id] = (counts[id] || 0) + 1;
  const ids = Object.keys(counts);
  ids.forEach((id, i) => {
    const r = rubricById(id);
    const x = cx - (ids.length * 46) / 2 + i * 46 + 23;
    ctx.fillStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(x, 700, 20, 0, Math.PI * 2);
    ctx.fill();
    drawIcon(ctx, r.icon, x, 700, 28, r.color);
    if (counts[id] > 1) text(ctx, ROMAN[counts[id]], x + 16, 722, { size: 14, color: PALETTE.goldLight });
  });
}
