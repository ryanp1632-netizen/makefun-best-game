// The Illumination screen: the run pauses and the hare chooses one of three rubrics.
import { PALETTE, VIEW } from '../config.js';
import { RUBRICS, rubricById, rubricLevel } from '../sim/rubrics.js';
import { FOLIOS, NUMERALS, verseHint } from '../sim/director.js';
import { BOSSES } from '../sim/bosses.js';
import { FOE_KINDS } from '../sim/foes.js';
import { drawFoe } from '../art/foeArt.js';
import { drawIcon } from '../art/icons.js';
import { button, panel, roundRect, text } from './widgets.js';

const ROMAN = ['', 'I', 'II', 'III'];

export function drawRubricPick(ctx, ui, run, time) {
  ctx.fillStyle = 'rgba(40, 25, 10, 0.55)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const cx = VIEW.w / 2;
  panel(ctx, cx - 330, 96, 660, 104, { radius: 14, edge: PALETTE.gold });
  text(ctx, `ILLUMINATION! LEVEL ${run.level}`, cx, 146, { size: 46, color: PALETTE.gold, align: 'center', baseline: 'middle', outline: PALETTE.ink, outlineWidth: 7 });
  text(ctx, 'Choose one rubric for your quill:  press 1, 2 or 3', cx, 184, { size: 22, align: 'center', baseline: 'middle', italic: true, weight: 'normal' });

  const cardW = 330;
  const gap = 34;
  const x0 = cx - (cardW * 3 + gap * 2) / 2;
  run.offer.forEach((id, i) => {
    const r = rubricById(id);
    const x = x0 + i * (cardW + gap);
    const y = 220;
    const hover = ui.mouse.x >= x && ui.mouse.x <= x + cardW && ui.mouse.y >= y && ui.mouse.y <= y + 336;
    const lift = hover ? -8 : Math.sin(time * 2 + i) * 2;
    panel(ctx, x, y + lift, cardW, 336, { radius: 16, edge: hover ? PALETTE.vermilion : PALETTE.panelEdge });
    ctx.fillStyle = r.color;
    roundRect(ctx, x + 14, y + lift + 14, cardW - 28, 120, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 250, 240, 0.85)';
    ctx.beginPath();
    ctx.arc(x + cardW / 2, y + lift + 74, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawIcon(ctx, r.icon, x + cardW / 2, y + lift + 74, 70, r.color);
    text(ctx, r.name, x + cardW / 2, y + lift + 168, { size: 29, align: 'center', baseline: 'middle', color: PALETTE.ink });
    const words = r.text.split(' ');
    let line = '';
    let ly = y + lift + 206;
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
    text(ctx, level > 0 ? `rank ${ROMAN[level]} > ${ROMAN[level + 1]}  (max ${ROMAN[r.max]})` : `new  (max ${ROMAN[r.max]})`, x + cardW / 2, y + lift + 282, {
      size: 17,
      align: 'center',
      color: PALETTE.inkSoft,
    });
    button(ctx, ui, `pick:${i}`, x + 40, y + lift + 296, cardW - 80, 30, `TAKE  [${i + 1}]`, { size: 18, primary: hover });
    ui.buttons.push({ id: `pick:${i}`, x, y, w: cardW, h: 336 });
  });

  drawComingNext(ctx, run, cx - 600, 574, 650, 150, time);
  drawOwned(ctx, run, cx + 70, 574, 530, 150);
}


const BOSS_LINES = {
  gastropod: 'Darts glance off its shell: LOOP the Abbot to crack it',
  wyrm: 'Sixteen segments long: loop across its body to strike many',
  blot: 'It throws rings of ink: hop through, and loop it with its brood',
};

/** A dark gold-edged plate, the same as the HUD panels. */
function plate(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(36, 22, 14, 0.9)';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(247, 215, 106, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

/** What waits after this pick: the next verse and its foes, or the folio's Grotesque. */
function drawComingNext(ctx, run, x, y, w, h, time) {
  plate(ctx, x, y, w, h);
  const folio = FOLIOS[run.folio];
  const nextVerse = run.stage === 'verse' && run.verse + 1 < folio.verses.length ? run.verse + 1 : -1;
  ctx.fillStyle = PALETTE.vermilion;
  roundRect(ctx, x + 16, y + 14, 150, 28, 14);
  ctx.fill();
  text(ctx, 'COMING NEXT', x + 91, y + 29, { size: 16, color: '#fff3d6', align: 'center', baseline: 'middle' });
  if (nextVerse >= 0) {
    text(ctx, `FOLIO ${NUMERALS[run.folio]} · VERSE ${NUMERALS[nextVerse]}`, x + 182, y + 35, { size: 26, color: '#ffd75e' });
    text(ctx, verseHint(run.folio, nextVerse), x + 18, y + 70, { size: 18, color: '#fff3d6', weight: 'normal', italic: true });
    const kinds = Object.keys(folio.verses[nextVerse].mix);
    kinds.forEach((kind, i) => {
      const fx = x + 50 + i * 100;
      const def = FOE_KINDS[kind];
      ctx.fillStyle = 'rgba(255, 243, 214, 0.92)';
      roundRect(ctx, fx - 44, y + 84, 88, 56, 9);
      ctx.fill();
      ctx.save();
      ctx.translate(fx, y + 106);
      ctx.scale(0.8, 0.8);
      drawFoe(ctx, { kind, x: 0, y: 0, r: Math.min(def.r, 18), vx: 0, vy: 0, hp: 1, maxHp: 1, emerge: 0, stun: 0, flash: 0, crack: 0, slow: 0, gild: 0, timer: 2, phase: i, facing: 0, segments: null }, time + i, { x: 0, y: 120 });
      ctx.restore();
      text(ctx, def.name.replace('Gargoyle ', '').replace('Scribble ', '').replace(' Errant', ''), fx, y + 134, { size: 13, color: PALETTE.ink, align: 'center' });
    });
  } else {
    const boss = BOSSES[folio.boss];
    text(ctx, `THE GROTESQUE: ${boss.name}`, x + 182, y + 35, { size: 24, color: '#ff8a66' });
    text(ctx, boss.title, x + 18, y + 72, { size: 19, color: '#d9c49a', weight: 'normal', italic: true });
    text(ctx, BOSS_LINES[folio.boss], x + 18, y + 108, { size: 19, color: '#fff3d6' });
  }
}

/** The rubrics already on the quill, by name and rank. */
function drawOwned(ctx, run, x, y, w, h) {
  plate(ctx, x, y, w, h);
  const owned = RUBRICS.filter((r) => rubricLevel(run, r.id) > 0);
  text(ctx, 'YOUR RUBRICS', x + 18, y + 32, { size: 20, color: '#ffd75e' });
  text(ctx, `${owned.length} held`, x + w - 18, y + 32, { size: 17, color: '#fff3d6', align: 'right' });
  if (!owned.length) {
    text(ctx, 'None yet: this is your first', x + 18, y + 80, { size: 18, color: '#d9c49a', italic: true, weight: 'normal' });
    return;
  }
  if (owned.length <= 4) {
    const boss = BOSSES[FOLIOS[run.folio].boss];
    ctx.strokeStyle = 'rgba(247, 215, 106, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + h - 46);
    ctx.lineTo(x + w - 16, y + h - 46);
    ctx.stroke();
    text(ctx, `END OF FOLIO ${NUMERALS[run.folio]}:`, x + 18, y + h - 18, { size: 16, color: '#d9c49a' });
    text(ctx, `${boss.name}, ${boss.title}`, x + 196, y + h - 18, { size: 17, color: '#ff8a66' });
  }
  owned.slice(0, 8).forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const rx = x + 30 + col * 256;
    const ry = y + 62 + row * 26;
    ctx.fillStyle = 'rgba(255, 243, 214, 0.92)';
    ctx.beginPath();
    ctx.arc(rx, ry, 11, 0, Math.PI * 2);
    ctx.fill();
    drawIcon(ctx, r.icon, rx, ry, 16, r.color);
    text(ctx, r.name, rx + 18, ry + 6, { size: 16, color: '#fff3d6' });
    const lv = rubricLevel(run, r.id);
    for (let k = 0; k < r.max; k += 1) {
      ctx.fillStyle = k < lv ? PALETTE.goldLight : 'rgba(255, 243, 214, 0.2)';
      ctx.beginPath();
      ctx.arc(rx + 210 - (r.max - 1 - k) * 11, ry, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
