// The heads-up display around the page: hearts and ink (left), folio, verse and boss (centre),
// score, best and Flourish (right); level, rubrics, the win/lose rule and cooldowns (bottom).
import { HUD, PAGE, PALETTE, SEAL, VIEW } from '../config.js';
import { FOE_KINDS } from '../sim/foes.js';
import { drawFoe } from '../art/foeArt.js';
import { FOLIOS, NUMERALS } from '../sim/director.js';
import { BOSSES } from '../sim/bosses.js';
import { FLOURISH_WINDOW } from '../sim/scoring.js';
import { RUBRICS, rubricById } from '../sim/rubrics.js';
import { hopCooldown } from '../sim/player.js';
import { drawHeartShape } from '../art/inkArt.js';
import { drawIcon } from '../art/icons.js';
import { bar, keyCap, panel, roundRect, text } from './widgets.js';

const fmt = (n) => Math.round(n).toLocaleString('en-US');

// The HUD is the manuscript's leather binding: dark tooled bands with gold rules and light lettering.
const CREAM = '#fff3d6';
const MUTED = '#d9c49a';
const BRIGHT_RED = '#ff8a66';
const TROUGH = 'rgba(0, 0, 0, 0.45)';
const RULE = 'rgba(247, 215, 106, 0.75)';
const darkBar = (ctx, x, y, w, h, frac, color) => bar(ctx, x, y, w, h, frac, color, TROUGH, RULE);

/** A recessed panel in the binding. */
function inset(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(247, 215, 106, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function binding(ctx, y0, y1, ruleY) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#4a2f1d');
  g.addColorStop(1, '#2b1a10');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, VIEW.w, y1 - y0);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, ruleY);
  ctx.lineTo(VIEW.w, ruleY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(247, 215, 106, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, ruleY + (ruleY > y0 + 10 ? -6 : 6));
  ctx.lineTo(VIEW.w, ruleY + (ruleY > y0 + 10 ? -6 : 6));
  ctx.stroke();
}

function drawHeartsAndInk(ctx, run, time) {
  const p = run.player;
  for (let i = 0; i < p.maxHearts; i += 1) {
    const full = i < p.hearts;
    const beat = full && i === p.hearts - 1 && p.hearts <= 2 ? 1 + Math.sin(time * 10) * 0.12 : 1;
    drawHeartShape(ctx, 34 + i * 34, 30, 13 * beat, full ? PALETTE.vermilion : 'rgba(255,243,214,0.1)', full ? CREAM : 'rgba(255,243,214,0.45)');
  }
  const ink = run.ink;
  drawIcon(ctx, 'well', 32, 64, 26, PALETTE.lapisLight);
  const dry = ink.dryFlash > 0 && Math.floor(time * 10) % 2 === 0;
  darkBar(ctx, 52, 55, 200, 18, ink.level / ink.max, dry ? PALETTE.vermilion : PALETTE.lapisLight);
  text(ctx, `INK ${Math.floor(ink.level)}`, 262, 70, { size: 18, color: dry ? BRIGHT_RED : CREAM });
}

function drawFolioLine(ctx, run) {
  const folio = FOLIOS[run.folio];
  const cx = VIEW.w / 2;
  text(ctx, `FOLIO ${NUMERALS[run.folio]}: ${folio.title.toUpperCase()}`, cx, 30, { size: 25, color: PALETTE.goldLight, align: 'center' });
  if ((run.stage === 'boss' || run.stage === 'bossIntro') && run.boss) {
    const boss = run.boss;
    const def = BOSSES[boss.kind];
    text(ctx, def.name + (boss.armored && boss.crack <= 0 ? '  (SHELL: loop it!)' : boss.phase2 ? '  (ENRAGED)' : ''), cx, 54, { size: 17, color: BRIGHT_RED, align: 'center' });
    darkBar(ctx, cx - 250, 62, 500, 16, boss.hp / boss.maxHp, PALETTE.vermilion);
  } else if (run.stage === 'bossIntro') {
    text(ctx, 'A GROTESQUE APPROACHES', cx, 62, { size: 20, color: BRIGHT_RED, align: 'center' });
  } else {
    const verseLength = folio.verses[run.verse].length;
    const pips = folio.verses.length + 1;
    const w = 112;
    const x0 = cx - (pips * w) / 2;
    for (let i = 0; i < pips; i += 1) {
      const isBoss = i === pips - 1;
      const done = i < run.verse || run.stage === 'folioDone';
      const now = i === run.verse && run.stage === 'verse';
      const x = x0 + i * w + 4;
      ctx.fillStyle = done ? PALETTE.gold : now ? PALETTE.goldPale : 'rgba(255,243,214,0.08)';
      roundRect(ctx, x, 44, w - 8, 30, 7);
      ctx.fill();
      ctx.strokeStyle = now || done ? PALETTE.goldLight : 'rgba(247,215,106,0.5)';
      ctx.lineWidth = now ? 2.6 : 1.4;
      ctx.stroke();
      if (now) {
        ctx.fillStyle = 'rgba(211, 155, 23, 0.55)';
        roundRect(ctx, x, 44, (w - 8) * Math.min(1, run.verseTime / verseLength), 30, 7);
        ctx.fill();
      }
      text(ctx, isBoss ? 'GROTESQUE' : `VERSE ${NUMERALS[i]}`, x + (w - 8) / 2, 60, { size: isBoss ? 14 : 16, color: isBoss ? (done || now ? PALETTE.vermilion : BRIGHT_RED) : done || now ? PALETTE.ink : CREAM, align: 'center', baseline: 'middle' });
    }
  }
}

function drawScore(ctx, run, best, time) {
  const right = VIEW.w - 24;
  text(ctx, 'SCORE', right - 220, 24, { size: 15, color: MUTED });
  text(ctx, fmt(run.score), right, 40, { size: 36, align: 'right', color: CREAM });
  text(ctx, `BEST ${fmt(Math.max(best, run.score))}`, right - 220, 46, { size: 15, color: MUTED });
  const f = run.flourish;
  const live = f.timer > 0;
  const mult = `FLOURISH x${f.mult}`;
  const pulse = live && f.mult > 1 ? 1 + Math.sin(time * 12) * 0.05 : 1;
  text(ctx, mult, right, 72, { size: Math.round(22 * pulse), align: 'right', color: f.mult > 1 ? BRIGHT_RED : live ? CREAM : 'rgba(255,243,214,0.4)' });
  if (live) darkBar(ctx, right - 330, 62, 120, 10, f.timer / FLOURISH_WINDOW, PALETTE.gold);
}

function drawBottom(ctx, run, time) {
  const y = HUD.bottomBand;
  // level medallion and gold leaf
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(42, y + 30, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  text(ctx, `${run.level}`, 42, y + 31, { size: 24, align: 'center', baseline: 'middle' });
  text(ctx, 'ILLUMINATION', 76, y + 20, { size: 15, color: MUTED });
  darkBar(ctx, 76, y + 28, 176, 14, run.xp / run.xpNext, PALETTE.goldLight);
  text(ctx, `leaf ${run.xp}/${run.xpNext}`, 260, y + 41, { size: 14, color: MUTED, weight: 'normal' });
  // rubric strip
  let x = 80;
  const owned = RUBRICS.filter((r) => run.rubrics[r.id]);
  for (const r of owned) {
    ctx.fillStyle = 'rgba(255, 243, 214, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y + 54, 10.5, 0, Math.PI * 2);
    ctx.fill();
    drawIcon(ctx, r.icon, x, y + 54, 16, r.color);
    if (run.rubrics[r.id] > 1) text(ctx, `${run.rubrics[r.id]}`, x + 9, y + 63, { size: 11, color: CREAM });
    x += 24;
    if (x > 380) break;
  }
  // win / lose rule
  const cx = VIEW.w / 2;
  panel(ctx, cx - 262, y + 2, 524, 60, { radius: 9, shadow: false, fill: 'rgba(255, 247, 226, 0.85)' });
  text(ctx, 'WIN: blot all 3 Grotesques', cx, y + 27, { size: 23, color: PALETTE.verdigris, align: 'center' });
  text(ctx, "LOSE: the hare's hearts run out", cx, y + 54, { size: 23, color: PALETTE.vermilion, align: 'center' });
  // cooldowns
  const sealReady = run.seal.cooldown <= 0;
  chip(ctx, 'seal', 'SEAL', 'SPACE', 910, y + 8, sealReady ? 1 : 1 - run.seal.cooldown / SEAL.cooldown, PALETTE.vermilion, time);
  const p = run.player;
  chip(ctx, 'hare', 'HOP', 'SHIFT', 1094, y + 8, p.hopCooldown <= 0 ? 1 : 1 - p.hopCooldown / hopCooldown(run), PALETTE.verdigris, time);
}

function chip(ctx, icon, label, key, x, y, ready, color, time) {
  const full = ready >= 1;
  ctx.fillStyle = full ? 'rgba(255, 247, 226, 0.95)' : 'rgba(255, 247, 226, 0.6)';
  roundRect(ctx, x, y, 170, 50, 9);
  ctx.fill();
  ctx.strokeStyle = full ? color : 'rgba(28,24,38,0.4)';
  ctx.lineWidth = full ? 3 : 1.5;
  ctx.stroke();
  drawIcon(ctx, icon, x + 26, y + 25, 30, full ? color : '#b9ab90');
  text(ctx, label, x + 50, y + 22, { size: 18, color: full ? PALETTE.ink : PALETTE.inkSoft });
  keyCap(ctx, key, x + 50, y + 43, 12);
  if (!full) bar(ctx, x + 112, y + 36, 50, 8, ready, color);
  else text(ctx, 'READY', x + 160, y + 22, { size: 13, color, align: 'right' });
}

/** The big centred announcement on a ribbon. */
export function drawBanner(ctx, run) {
  const b = run.banner;
  if (!b) return;
  const t = 1 - b.time / b.total;
  const alpha = t < 0.12 ? t / 0.12 : b.time < 0.4 ? b.time / 0.4 : 1;
  const cx = VIEW.w / 2;
  const cy = 250;
  ctx.save();
  ctx.globalAlpha = alpha;
  const w = 700;
  ctx.fillStyle = 'rgba(60, 35, 10, 0.25)';
  roundRect(ctx, cx - w / 2 + 5, cy - 58, w, b.subtitle ? 118 : 86, 14);
  ctx.fill();
  panel(ctx, cx - w / 2, cy - 62, w, b.subtitle ? 118 : 86, { radius: 14, shadow: false, edge: PALETTE.vermilion });
  text(ctx, b.title, cx, cy - 10, { size: 46, color: PALETTE.vermilion, align: 'center', baseline: 'middle', outline: PALETTE.cream, outlineWidth: 6 });
  if (b.subtitle) text(ctx, b.subtitle, cx, cy + 32, { size: 22, color: PALETTE.ink, align: 'center', baseline: 'middle', italic: true, weight: 'normal' });
  ctx.restore();
}

/** Until the first foe is Illuminated, a ribbon on the page shows how: a dotted loop drawing itself. */
function drawFirstLoopHint(ctx, run, time) {
  if (run.folio !== 0 || run.stats.illuminated > 0 || run.stage !== 'verse' || run.banner) return;
  const cx = VIEW.w / 2;
  const y = 650;
  panel(ctx, cx - 360, y - 30, 720, 58, { radius: 12, shadow: false, fill: 'rgba(255, 247, 226, 0.92)', edge: PALETTE.gold });
  const spin = (time * 1.6) % 1;
  ctx.save();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(cx - 318, y, 18, -Math.PI / 2, -Math.PI / 2 + spin * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(cx - 318, y, 4, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'Hold the LEFT MOUSE BUTTON and draw a circle around the blots', cx + 24, y + 7, { size: 19, align: 'center' });
}

const ROLES = {
  blotling: ['swarms in packs', '#d9c49a'],
  wasp: ['flies over ink', '#ffd75e'],
  snail: ['shelled: loop it', '#9db8ff'],
  spitter: ['spits ink puddles', '#ff8a66'],
  worm: ['loop its middle', '#e8d9a0'],
  blotch: ['splits in three', '#c9a8ff'],
};

/** The roll of foes on the page, by kind, with what each does and what comes next. */
function drawRoster(ctx, run, time) {
  if (run.offer || run.stage === 'won' || run.stage === 'lost') return;
  const counts = {};
  let total = 0;
  for (const f of run.foes) {
    if (f.dead || f.boss || !ROLES[f.kind]) continue;
    counts[f.kind] = (counts[f.kind] || 0) + 1;
    total += 1;
  }
  const kinds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const x = PAGE.right - 236;
  const y = PAGE.top + 8;
  const w = 226;
  const owned = RUBRICS.filter((r) => run.rubrics[r.id]);
  const shown = owned.slice(0, 6);
  const listH = 72 + kinds.length * 36;
  const h = listH + (owned.length ? 34 + shown.length * 26 + (owned.length > shown.length ? 20 : 0) : 0);
  const p = run.player;
  const near = (p.x > x - 50 && p.y < y + h + 50) || (run.ink.current && run.ink.current.maxX > x - 10 && run.ink.current.minY < y + h);
  ctx.save();
  ctx.globalAlpha = near ? 0.3 : 1;
  ctx.fillStyle = 'rgba(36, 22, 14, 0.84)';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(247, 215, 106, 0.85)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'ON THE PAGE', x + 12, y + 24, { size: 18, color: PALETTE.goldLight });
  text(ctx, `${total}`, x + w - 12, y + 24, { size: 20, color: CREAM, align: 'right' });
  kinds.forEach((kind, i) => {
    const ry = y + 52 + i * 36;
    const def = FOE_KINDS[kind];
    ctx.save();
    ctx.translate(x + 22, ry);
    ctx.scale(0.75, 0.75);
    drawFoe(ctx, { kind, x: 0, y: 0, r: Math.min(def.r, 18), vx: 0, vy: 0, hp: 1, maxHp: 1, emerge: 0, stun: 0, flash: 0, crack: 0, slow: 0, gild: 0, timer: 2, phase: i, facing: 0, segments: null }, time + i, { x: 0, y: 120 });
    ctx.restore();
    text(ctx, def.name.replace('Gargoyle ', '').replace('Scribble ', ''), x + 46, ry - 2, { size: 17, color: ROLES[kind][1] });
    text(ctx, ROLES[kind][0], x + 46, ry + 13, { size: 13, color: MUTED, weight: 'normal', italic: true });
    text(ctx, `x${counts[kind]}`, x + w - 12, ry + 5, { size: 19, color: CREAM, align: 'right' });
  });
  const folio = FOLIOS[run.folio];
  let next;
  if (run.stage === 'boss' || run.stage === 'bossIntro') next = 'GROTESQUE ON THE PAGE';
  else if (run.verse + 1 < folio.verses.length) next = `NEXT: VERSE ${NUMERALS[run.verse + 1]}`;
  else next = `NEXT: ${BOSSES[folio.boss].name}`;
  text(ctx, next, x + 12, y + listH - 11, { size: 14, color: BRIGHT_RED });
  if (owned.length) {
    const top = y + listH;
    ctx.strokeStyle = 'rgba(247, 215, 106, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 10, top + 2);
    ctx.lineTo(x + w - 10, top + 2);
    ctx.stroke();
    text(ctx, 'YOUR RUBRICS', x + 12, top + 24, { size: 16, color: PALETTE.goldLight });
    text(ctx, `${owned.length}`, x + w - 12, top + 24, { size: 18, color: CREAM, align: 'right' });
    shown.forEach((r, i) => {
      const ry = top + 46 + i * 26;
      ctx.fillStyle = 'rgba(255, 243, 214, 0.92)';
      ctx.beginPath();
      ctx.arc(x + 22, ry, 10, 0, Math.PI * 2);
      ctx.fill();
      drawIcon(ctx, r.icon, x + 22, ry, 15, r.color);
      text(ctx, r.name, x + 40, ry + 5, { size: 15, color: CREAM });
      for (let k = 0; k < r.max; k += 1) {
        ctx.fillStyle = k < run.rubrics[r.id] ? PALETTE.goldLight : 'rgba(255, 243, 214, 0.18)';
        ctx.beginPath();
        ctx.arc(x + w - 16 - (r.max - 1 - k) * 11, ry, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    if (owned.length > shown.length) text(ctx, `+ ${owned.length - shown.length} more`, x + 40, y + h - 8, { size: 13, color: MUTED, weight: 'normal', italic: true });
  }
  ctx.restore();
}

export function drawHud(ctx, run, best, time) {
  drawRoster(ctx, run, time);
  binding(ctx, 0, HUD.topBand, HUD.topBand - 2);
  binding(ctx, HUD.bottomBand, VIEW.h, HUD.bottomBand + 2);
  inset(ctx, 8, 6, 352, HUD.topBand - 14);
  inset(ctx, 920, 6, 352, HUD.topBand - 14);
  drawHeartsAndInk(ctx, run, time);
  drawFolioLine(ctx, run);
  drawScore(ctx, run, best, time);
  drawBottom(ctx, run, time);
  drawFirstLoopHint(ctx, run, time);
  drawBanner(ctx, run);
}

export { rubricById };
