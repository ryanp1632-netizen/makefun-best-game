// Paints one frame of the page in layer order: parchment, stains, puddles, warnings, ink, gold,
// pick-ups, foes (back to front), the Grotesque, the hare, darts, spit, seal, particles and text.
import { pageArt } from './parchment.js';
import { drawFoe } from './foeArt.js';
import { drawBoss } from './bossArt.js';
import { drawHare } from './hare.js';
import { drawDarts, drawGlobs, drawHazards, drawIlluminations, drawPickups, drawPuddles, drawSealMarks, drawStrokes } from './inkArt.js';
import { drawParticles, drawPopups, shakeOffset } from './effects.js';

export function drawWorld(ctx, run, fx, time) {
  const shake = shakeOffset(fx, time);
  ctx.save();
  ctx.translate(shake.x, shake.y);
  ctx.drawImage(pageArt(run.folio), 0, 0);
  ctx.drawImage(fx.stains.canvas, 0, 0);
  drawPuddles(ctx, run.puddles, time);
  drawHazards(ctx, run.hazards, time);
  drawIlluminations(ctx, run.ink, time);
  drawStrokes(ctx, run.ink, time);
  drawPickups(ctx, run.pickups, time);
  const foes = run.foes.filter((f) => !f.dead && !f.boss).sort((a, b) => a.y - b.y);
  for (const foe of foes) drawFoe(ctx, foe, time, run.player);
  if (run.boss && !run.boss.dead) drawBoss(ctx, run.boss, time, run.player);
  if (!run.lost) drawHare(ctx, run.player, time);
  drawDarts(ctx, run.darts);
  drawGlobs(ctx, run.globs, time);
  drawSealMarks(ctx, run.sealMarks);
  drawParticles(ctx, fx);
  drawPopups(ctx, fx);
  ctx.restore();
}
