// The Bestiary plate on the title page: every foe and Grotesque drawn with the game's own painters,
// each with its name, so a new player sees the whole cast before the first verse.
import { PALETTE } from '../config.js';
import { FOE_KINDS } from '../sim/foes.js';
import { BOSSES } from '../sim/bosses.js';
import { drawFoe } from './foeArt.js';
import { drawBoss } from './bossArt.js';
import { text } from '../ui/widgets.js';

const FOE_ORDER = ['blotling', 'wasp', 'snail', 'spitter', 'worm', 'blotch'];
const BOSS_ORDER = ['gastropod', 'wyrm', 'blot'];

/** A specimen that stands still for its portrait. */
function specimen(kind, x, y, r, extra = {}) {
  return { kind, x, y, r, vx: 0, vy: 0, hp: 1, maxHp: 1, emerge: 0, stun: 0, flash: 0, crack: 0, slow: 0, gild: 0, timer: 2, phase: x * 0.1, facing: 0, segments: null, ...extra };
}

function wormSegments(x, y, count, spacing) {
  const segs = [];
  for (let i = 1; i <= count; i += 1) segs.push({ x: x - i * spacing, y: y + Math.sin(i * 0.9) * 5 });
  return segs;
}

export function drawBestiary(ctx, x, y, w, time) {
  const slot = (w * 0.56) / 6;
  const bossSlot = (w * 0.44) / 3;
  const eye = { x: x + w / 2, y: y + 200 };
  FOE_ORDER.forEach((kind, i) => {
    const cx = x + slot * i + slot / 2;
    const cy = y + 34;
    const def = FOE_KINDS[kind];
    const foe = specimen(kind, kind === 'worm' ? cx + 22 : cx, cy, def.r, kind === 'worm' ? { segments: wormSegments(cx + 22, cy, 4, 12) } : {});
    drawFoe(ctx, foe, time + i, eye);
    text(ctx, def.name.replace('Gargoyle ', '').replace('Scribble ', ''), cx, y + 82, { size: 14, align: 'center', color: PALETTE.ink });
  });
  BOSS_ORDER.forEach((kind, i) => {
    const cx = x + slot * 6 + bossSlot * i + bossSlot / 2;
    const cy = y + 36;
    const scale = kind === 'blot' ? 0.3 : 0.4;
    const def = BOSSES[kind];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    const boss = specimen(kind, 0, 0, def.r, {
      boss: true,
      state: 'move',
      phase2: false,
      aimX: 1,
      aimY: 0,
      vx: kind === 'gastropod' ? 1 : 0,
      segR: 18,
      segments: kind === 'wyrm' ? wormSegments(70, 0, 5, 26) : null,
    });
    if (kind === 'wyrm') boss.x = 70;
    drawBoss(ctx, boss, time + i, { x: 0, y: 300 });
    ctx.restore();
    text(ctx, def.name.replace('THE ', '').replace('SIR ', ''), cx, y + 82, { size: 14, align: 'center', color: PALETTE.vermilion });
  });
}
