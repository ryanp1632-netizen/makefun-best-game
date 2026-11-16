// The heads-up display around the page: hearts and ink (left), folio, verse and boss (centre),
// score, best and Flourish (right); level, rubrics, the win/lose rule and cooldowns (bottom).
import { HUD, PALETTE, SEAL, VIEW } from '../config.js';
import { FOLIOS, NUMERALS } from '../sim/director.js';
import { BOSSES } from '../sim/bosses.js';
import { FLOURISH_WINDOW } from '../sim/scoring.js';
import { RUBRICS, rubricById } from '../sim/rubrics.js';
import { hopCooldown } from '../sim/player.js';
import { drawHeartShape } from '../art/inkArt.js';
import { drawIcon } from '../art/icons.js';
import { bar, keyCap, panel, roundRect, text } from './widgets.js';

const fmt = (n) => Math.round(n).toLocaleString('en-US');

function drawHeartsAndInk(ctx, run, time) {
  const p = run.player;
  for (let i = 0; i < p.maxHearts; i += 1) {
    const full = i < p.hearts;
    const beat = full && i === p.hearts - 1 && p.hearts <= 2 ? 1 + Math.sin(time * 10) * 0.12 : 1;
    drawHeartShape(ctx, 34 + i * 34, 30, 13 * beat, full ? PALETTE.vermilion : 'rgba(28,24,38,0.12)', full ? PALETTE.ink : 'rgba(28,24,38,0.4)');
  }
  const ink = run.ink;
  drawIcon(ctx, 'well', 32, 64, 26, PALETTE.lapis);
  const dry = ink.dryFlash > 0 && Math.floor(time * 10) % 2 === 0;
  bar(ctx, 52, 55, 200, 18, ink.level / ink.max, dry ? PALETTE.vermilion : PALETTE.lapis);
  text(ctx, `INK ${Math.floor(ink.level)}`, 262, 70, { size: 18, color: dry ? PALETTE.vermilion : PALETTE.ink });
}

function drawFolioLine(ctx, run) {
  const folio = FOLIOS[run.folio];
  const cx = VIEW.w / 2;
  text(ctx, `FOLIO ${NUMERALS[run.folio]}: ${folio.title.toUpperCase()}`, cx, 30, { size: 25, color: PALETTE.ink, align: 'center' });
  if ((run.stage === 'boss' || run.stage === 'bossIntro') && run.boss) {
    const boss = run.boss;
    const def = BOSSES[boss.kind];
    text(ctx, def.name + (boss.armored && boss.crack <= 0 ? '  (SHELL: loop it!)' : boss.phase2 ? '  (ENRAGED)' : ''), cx, 54, { size: 17, color: PALETTE.vermilion, align: 'center' });
    bar(ctx, cx - 250, 62, 500, 16, boss.hp / boss.maxHp, PALETTE.vermilion);
  } else if (run.stage === 'bossIntro') {
    text(ctx, 'A GROTESQUE APPROACHES', cx, 62, { size: 20, color: PALETTE.vermilion, align: 'center' });
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
      ctx.fillStyle = done ? PALETTE.gold : now ? PALETTE.goldPale : 'rgba(28,24,38,0.08)';
      roundRect(ctx, x, 44, w - 8, 30, 7);
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = now ? 2.6 : 1.4;
      ctx.stroke();
      if (now) {
        ctx.fillStyle = 'rgba(211, 155, 23, 0.55)';
        roundRect(ctx, x, 44, (w - 8) * Math.min(1, run.verseTime / verseLength), 30, 7);
        ctx.fill();
      }
      text(ctx, isBoss ? 'GROTESQUE' : `VERSE ${NUMERALS[i]}`, x + (w - 8) / 2, 60, { size: isBoss ? 14 : 16, color: isBoss ? PALETTE.vermilion : PALETTE.ink, align: 'center', baseline: 'middle' });
    }
  }
}

function drawScore(ctx, run, best, time) {
  const right = VIEW.w - 24;
  text(ctx, 'SCORE', right - 220, 24, { size: 15, color: PALETTE.inkSoft });
  text(ctx, fmt(run.score), right, 40, { size: 36, align: 'right', color: PALETTE.ink });
  text(ctx, `BEST ${fmt(Math.max(best, run.score))}`, right - 220, 46, { size: 15, color: PALETTE.inkSoft });
  const f = run.flourish;
  const live = f.timer > 0;
  const mult = `FLOURISH x${f.mult}`;
  const pulse = live && f.mult > 1 ? 1 + Math.sin(time * 12) * 0.05 : 1;
  text(ctx, mult, right, 72, { size: Math.round(22 * pulse), align: 'right', color: f.mult > 1 ? PALETTE.vermilion : 'rgba(28,24,38,0.4)' });
  if (live) bar(ctx, right - 330, 62, 120, 10, f.timer / FLOURISH_WINDOW, PALETTE.gold);
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
  text(ctx, 'ILLUMINATION', 76, y + 20, { size: 15, color: PALETTE.inkSoft });
  bar(ctx, 76, y + 28, 200, 14, run.xp / run.xpNext, PALETTE.gold);
  text(ctx, `gold leaf ${run.xp}/${run.xpNext}`, 286, y + 41, { size: 14, color: PALETTE.inkSoft, weight: 'normal' });
  // rubric strip
  let x = 80;
  const owned = RUBRICS.filter((r) => run.rubrics[r.id]);
  for (const r of owned) {
    drawIcon(ctx, r.icon, x, y + 54, 18, r.color);
    if (run.rubrics[r.id] > 1) text(ctx, `${run.rubrics[r.id]}`, x + 9, y + 62, { size: 11 });
    x += 24;
    if (x > 380) break;
  }
  // win / lose rule
  const cx = VIEW.w / 2;
  panel(ctx, cx - 250, y + 4, 500, 54, { radius: 9, shadow: false, fill: 'rgba(255, 247, 226, 0.85)' });
  text(ctx, 'WIN: blot all 3 Grotesques', cx, y + 26, { size: 19, color: PALETTE.verdigris, align: 'center' });
  text(ctx, "LOSE: the hare's hearts run out", cx, y + 48, { size: 19, color: PALETTE.vermilion, align: 'center' });
  // cooldowns
  const sealReady = run.seal.cooldown <= 0;
  chip(ctx, 'seal', 'SEAL', 'SPACE', 900, y + 8, sealReady ? 1 : 1 - run.seal.cooldown / SEAL.cooldown, PALETTE.vermilion, time);
  const p = run.player;
  chip(ctx, 'hare', 'HOP', 'SHIFT', 1090, y + 8, p.hopCooldown <= 0 ? 1 : 1 - p.hopCooldown / hopCooldown(run), PALETTE.verdigris, time);
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

export function drawHud(ctx, run, best, time) {
  ctx.fillStyle = 'rgba(242, 228, 195, 0.55)';
  ctx.fillRect(0, 0, VIEW.w, HUD.topBand - 2);
  ctx.fillRect(0, HUD.bottomBand, VIEW.w, VIEW.h - HUD.bottomBand);
  drawHeartsAndInk(ctx, run, time);
  drawFolioLine(ctx, run);
  drawScore(ctx, run, best, time);
  drawBottom(ctx, run, time);
  drawBanner(ctx, run);
}

export { rubricById };
