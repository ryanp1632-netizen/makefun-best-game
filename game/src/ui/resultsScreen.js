// The colophon: how the run ended, its grade and score, the tally, the rubrics taken, feats earned
// and the way back in (R to run again).
import { DIFFICULTIES, PALETTE, VIEW } from '../config.js';
import { FEATS } from '../sim/scoring.js';
import { rubricById } from '../sim/rubrics.js';
import { drawIcon } from '../art/icons.js';
import { drawHare } from '../art/hare.js';
import { button, panel, roundRect, text } from './widgets.js';

const fmt = (n) => Math.round(n).toLocaleString('en-US');

function clock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function tile(ctx, x, y, w, label, value, color) {
  panel(ctx, x, y, w, 84, { radius: 10, shadow: false, fill: color, edge: PALETTE.ink });
  text(ctx, label, x + w / 2, y + 28, { size: 17, color: PALETTE.cream, align: 'center', baseline: 'middle' });
  text(ctx, value, x + w / 2, y + 60, { size: 32, color: PALETTE.cream, align: 'center', baseline: 'middle' });
}

function nextGoal(summary, ledger) {
  if (!summary.won) return `NEXT GOAL: reach further than ${summary.reached}`;
  if (summary.difficulty === 'novice') return 'NEXT GOAL: save the manuscript on SCRIBE';
  if (summary.difficulty === 'scribe') return 'NEXT GOAL: win on ABBOT';
  const missing = FEATS.find((f) => !ledger.feats.includes(f.id));
  return missing ? `NEXT GOAL: ${missing.text}` : 'Every feat is yours. Chase an S grade!';
}

export function drawResults(ctx, ui, summary, record, ledger, time) {
  ctx.fillStyle = 'rgba(40, 25, 10, 0.45)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  const won = summary.won;
  panel(ctx, 34, 24, 1212, 112, { radius: 16, edge: won ? PALETTE.gold : PALETTE.vermilion, fill: won ? '#fbf0c8' : PALETTE.panel });
  text(ctx, won ? 'THE MANUSCRIPT IS SAVED' : 'THE HARE HAS FALLEN', 640, 84, {
    size: 70,
    color: won ? PALETTE.gold : PALETTE.vermilion,
    align: 'center',
    baseline: 'middle',
    outline: PALETTE.ink,
    outlineWidth: 8,
  });

  // Left: the knight and the rubrics it carried
  panel(ctx, 34, 154, 360, 620, { radius: 16 });
  const glow = ctx.createRadialGradient(214, 300, 10, 214, 300, 130);
  glow.addColorStop(0, won ? 'rgba(247, 215, 106, 0.9)' : 'rgba(196, 53, 28, 0.25)');
  glow.addColorStop(1, 'rgba(247, 215, 106, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(84, 170, 260, 260);
  drawHare(ctx, { x: 214, y: 320, facing: 0, stride: time * 2, hop: 0, invulnerable: 0, throwAnim: won ? 0.1 : 0, hurtFlash: 0 }, time, 3.2);
  text(ctx, won ? 'All three Grotesques blotted' : `Fell at ${summary.reached}`, 214, 430, { size: 21, align: 'center' });
  if (!won && summary.killer) text(ctx, `undone by ${summary.killer}`, 214, 458, { size: 18, align: 'center', italic: true, weight: 'normal' });
  text(ctx, `${DIFFICULTIES[summary.difficulty].label} - ${clock(summary.time)}`, 214, 488, { size: 18, align: 'center', color: PALETTE.inkSoft });
  text(ctx, `RUBRICS (${summary.rubrics.length})`, 62, 530, { size: 18, color: PALETTE.inkSoft });
  const counts = {};
  for (const id of summary.rubrics) counts[id] = (counts[id] || 0) + 1;
  Object.keys(counts)
    .slice(0, 10)
    .forEach((id, i) => {
      const r = rubricById(id);
      const x = 62 + (i % 2) * 166;
      const y = 560 + Math.floor(i / 2) * 40;
      drawIcon(ctx, r.icon, x + 12, y, 24, r.color);
      text(ctx, `${r.name}${counts[id] > 1 ? ` x${counts[id]}` : ''}`, x + 30, y + 6, { size: 15, maxWidth: 134 });
    });

  // Right: grade, score, tally, feats, buttons
  panel(ctx, 412, 154, 834, 620, { radius: 16 });
  ctx.fillStyle = won ? PALETTE.gold : PALETTE.lapis;
  ctx.beginPath();
  ctx.arc(510, 248, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, summary.grade, 510, 252, { size: 84, color: PALETTE.cream, align: 'center', baseline: 'middle', outline: PALETTE.ink, outlineWidth: 6 });
  text(ctx, 'SCORE', 600, 206, { size: 18, color: PALETTE.inkSoft });
  text(ctx, fmt(summary.score), 598, 278, { size: 76, color: PALETTE.ink });
  if (record.newBest) {
    ctx.fillStyle = PALETTE.verdigris;
    roundRect(ctx, 990, 214, 220, 48, 10);
    ctx.fill();
    text(ctx, 'NEW BEST!', 1100, 240, { size: 28, color: PALETTE.cream, align: 'center', baseline: 'middle' });
  } else text(ctx, `best ${fmt(record.previous)}`, 1210, 240, { size: 22, align: 'right', color: PALETTE.inkSoft });
  if (summary.heartsBonus) text(ctx, `includes +${fmt(summary.heartsBonus)} for hearts kept`, 600, 306, { size: 17, italic: true, weight: 'normal' });

  const w = 186;
  tile(ctx, 440, 330, w, 'FOES BLOTTED', fmt(summary.kills), PALETTE.inkSoft);
  tile(ctx, 440 + (w + 10), 330, w, 'ILLUMINATED', fmt(summary.illuminated), PALETTE.gold);
  tile(ctx, 440 + (w + 10) * 2, 330, w, 'BEST LOOP', `${summary.bestLoop} foes`, PALETTE.vermilion);
  tile(ctx, 440 + (w + 10) * 3, 330, w, 'FLOURISH', `x${summary.bestFlourish}`, PALETTE.lapis);
  tile(ctx, 440, 426, w, 'LOOPS DRAWN', fmt(summary.loops), PALETTE.verdigris);
  tile(ctx, 440 + (w + 10), 426, w, 'HEARTS', `${summary.hearts}/${summary.maxHearts}`, PALETTE.rose);
  tile(ctx, 440 + (w + 10) * 2, 426, w, 'LEVEL', `${summary.level}`, PALETTE.gold);
  tile(ctx, 440 + (w + 10) * 3, 426, w, 'TIME', clock(summary.time), PALETTE.inkSoft);

  const earned = summary.feats;
  text(ctx, `FEATS ${ledger.feats.length}/${FEATS.length}`, 440, 546, { size: 18, color: PALETTE.inkSoft });
  FEATS.forEach((feat, i) => {
    const got = earned.includes(feat.id);
    const fresh = record.newFeats.includes(feat.id);
    const x = 440 + (i % 4) * 196;
    const y = 560 + Math.floor(i / 4) * 40;
    ctx.fillStyle = got ? (fresh ? PALETTE.goldLight : '#efe3bf') : 'rgba(28,24,38,0.06)';
    roundRect(ctx, x, y, 186, 32, 8);
    ctx.fill();
    ctx.strokeStyle = got ? PALETTE.gold : 'rgba(28,24,38,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, `${fresh ? 'NEW: ' : ''}${feat.name}`, x + 93, y + 17, { size: 15, align: 'center', baseline: 'middle', color: got ? PALETTE.ink : 'rgba(28,24,38,0.4)', maxWidth: 176 });
  });

  button(ctx, ui, 'again', 440, 664, 440, 82, 'R - RUN AGAIN', { primary: true, size: 36 });
  button(ctx, ui, 'menu', 900, 664, 318, 38, 'ESC - TITLE PAGE', { size: 20 });
  text(ctx, nextGoal(summary, ledger), 1059, 730, { size: 18, align: 'center', color: PALETTE.vermilion, maxWidth: 330 });
}
