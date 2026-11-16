// The title page: an illuminated MARGINALIA, the rules in one glance, difficulty, best scores,
// feats and the controls, over a live demo of the game playing itself.
import { DIFFICULTIES, DIFFICULTY_ORDER, PALETTE, VIEW } from '../config.js';
import { FEATS } from '../sim/scoring.js';
import { drawIcon } from '../art/icons.js';
import { drawBestiary } from '../art/bestiary.js';
import { button, dropCap, keyCap, panel, tag, text } from './widgets.js';

const RULES = [
  ['GOAL', PALETTE.lapis, 'Ink blots crawl out of the margins: blot them out'],
  ['DRAW', PALETTE.inkSoft, 'Hold the mouse to draw ink: it burns and walls foes'],
  ['LOOP', PALETTE.gold, 'Close a loop: every foe inside is ILLUMINATED'],
  ['COMBO', PALETTE.verdigris, 'More foes per loop and quick chains score far more'],
  ['GROW', PALETTE.lapisLight, 'Gold leaf levels you up: pick 1 of 3 rubrics'],
  ['WIN', PALETTE.verdigris, 'Blot the 3 Grotesques of the 3 folios'],
  ['LOSE', PALETTE.vermilion, "The hare's hearts run out"],
];

const fmt = (n) => Math.round(n).toLocaleString('en-US');

export function drawTitle(ctx, ui, ledger, time) {
  ctx.fillStyle = 'rgba(242, 228, 195, 0.62)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // Title block
  panel(ctx, 34, 28, 712, 168, { radius: 16 });
  dropCap(ctx, 'M', 54, 44, 132, time);
  text(ctx, 'ARGINALIA', 200, 122, { size: 80, color: PALETTE.ink, outline: PALETTE.goldPale, outlineWidth: 8 });
  text(ctx, "The Hare Knight's Last Folio", 208, 166, { size: 28, color: PALETTE.vermilion, italic: true, weight: 'normal' });

  // Rules
  panel(ctx, 34, 208, 712, 318, { radius: 16 });
  text(ctx, 'HOW THE MANUSCRIPT IS SAVED', 390, 240, { size: 21, color: PALETTE.vermilion, align: 'center' });
  RULES.forEach(([label, color, line], i) => {
    const y = 282 + i * 37;
    tag(ctx, label, 58, y, color, 17);
    text(ctx, line, 162, y, { size: 21, color: PALETTE.ink, weight: 'normal' });
  });

  // Bestiary
  panel(ctx, 34, 538, 712, 118, { radius: 16 });
  text(ctx, 'THE BESTIARY: 6 FOES AND 3 GROTESQUES', 390, 560, { size: 15, color: PALETTE.inkSoft, align: 'center' });
  drawBestiary(ctx, 44, 562, 692, time);

  // Controls strip
  panel(ctx, 34, 668, 1212, 104, { radius: 14 });
  const keys = [
    ['WASD', 'move'],
    ['MOUSE', 'hold to draw ink'],
    ['SPACE', 'wax seal'],
    ['SHIFT', 'hop'],
    ['1 2 3', 'pick rubric'],
    ['ESC', 'pause'],
    ['R', 'restart'],
    ['M', 'mute'],
  ];
  let x = 60;
  for (const [key, what] of keys) {
    const w = keyCap(ctx, key, x, 712, 17);
    text(ctx, what, x + w + 8, 712, { size: 17, weight: 'normal' });
    x += w + 8 + ctx.measureText(what).width + 22;
  }
  text(ctx, 'Draw a circle around a crowd of blots, close it, and watch the page turn to gold.', 640, 752, { size: 19, align: 'center', italic: true, weight: 'normal', color: PALETTE.inkSoft });

  // Play panel
  panel(ctx, 766, 28, 480, 624, { radius: 16 });
  const pulse = 1 + Math.sin(time * 4) * 0.02;
  button(ctx, ui, 'play', 796, 52, 420 * pulse, 96, 'PLAY', { primary: true, size: 52 });
  text(ctx, 'click PLAY or press ENTER', 1006, 172, { size: 18, align: 'center', color: PALETTE.inkSoft, italic: true, weight: 'normal' });

  text(ctx, 'DIFFICULTY', 796, 214, { size: 18, color: PALETTE.inkSoft });
  DIFFICULTY_ORDER.forEach((key, i) => {
    const d = DIFFICULTIES[key];
    const best = ledger.best[key] || 0;
    button(ctx, ui, `diff:${key}`, 796 + i * 142, 226, 132, 72, d.label, {
      selected: ledger.difficulty === key,
      size: 21,
      sub: best ? `best ${fmt(best)}` : d.note,
    });
  });

  const best = Math.max(...DIFFICULTY_ORDER.map((k) => ledger.best[k] || 0));
  text(ctx, 'BEST SCORE', 796, 340, { size: 18, color: PALETTE.inkSoft });
  text(ctx, best ? fmt(best) : 'no runs yet', 796, 380, { size: 38, color: PALETTE.ink });
  text(ctx, `${ledger.plays} runs`, 1216, 340, { size: 16, align: 'right', color: PALETTE.inkSoft, weight: 'normal' });

  text(ctx, `FEATS ${ledger.feats.length}/${FEATS.length}`, 796, 424, { size: 18, color: PALETTE.inkSoft });
  FEATS.forEach((feat, i) => {
    const got = ledger.feats.includes(feat.id);
    const fx = 796 + (i % 2) * 212;
    const fy = 444 + Math.floor(i / 2) * 32;
    drawIcon(ctx, got ? 'sun' : 'leaf', fx + 10, fy + 10, 20, got ? PALETTE.gold : '#d8c7a2');
    text(ctx, feat.name, fx + 26, fy + 16, { size: 17, color: got ? PALETTE.ink : 'rgba(28,24,38,0.45)', weight: got ? 'bold' : 'normal' });
  });

  text(ctx, 'LAST RUNS', 796, 600, { size: 18, color: PALETTE.inkSoft });
  if (ledger.runs.length === 0) text(ctx, 'the page awaits its first knight', 796, 630, { size: 18, italic: true, weight: 'normal' });
  ledger.runs.forEach((r, i) => {
    const cx = 796 + i * 142;
    panel(ctx, cx, 610, 132, 34, { radius: 8, shadow: false, fill: r.won ? '#e7f0d6' : '#f6dcd2', edge: r.won ? PALETTE.verdigris : PALETTE.vermilion });
    text(ctx, `${r.won ? 'WON' : 'LOST'} ${fmt(r.score)}`, cx + 66, 633, { size: 16, align: 'center', color: r.won ? PALETTE.verdigris : PALETTE.vermilion });
  });
}
