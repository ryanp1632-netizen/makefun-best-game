// One run of MARGINALIA: creating it, and advancing every system by one fixed step in order.
import { DIFFICULTIES, INK, PAGE } from '../config.js';
import { createRng } from '../rng.js';
import { createInk, endStroke, extendStroke, updateInk } from './ink.js';
import { createPlayer, hurtPlayer, updatePlayer } from './player.js';
import { updateFoes, foeCircles } from './foes.js';
import { updateBoss } from './bosses.js';
import { startFolio, updateDirector } from './director.js';
import { castSeal, updateDarts } from './weapons.js';
import { leafForLevel, updatePickups } from './pickups.js';
import { updateFlourish } from './scoring.js';
import { offerRubrics, takeRubric } from './rubrics.js';
import { BOSSES } from './bosses.js';
import { FOE_KINDS } from './foes.js';
import { emit } from './events.js';

export function createRun({ seed = 1, difficulty = 'scribe' } = {}) {
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.scribe;
  const run = {
    seed,
    rng: createRng(seed),
    diff,
    time: 0,
    stage: 'intro',
    stageTime: 0,
    folio: 0,
    verse: 0,
    verseTime: 0,
    folioWounds: 0,
    spawnBudget: 0,
    player: createPlayer(diff),
    ink: createInk(INK.max),
    foes: [],
    darts: [],
    globs: [],
    puddles: [],
    hazards: [],
    pickups: [],
    sealMarks: [],
    seal: { cooldown: 0 },
    dartTimer: 0.8,
    boss: null,
    rubrics: {},
    rubricOrder: [],
    offer: null,
    pendingPicks: 0,
    xp: 0,
    level: 1,
    xpNext: leafForLevel(1),
    score: 0,
    flourish: { mult: 1, timer: 0 },
    banner: null,
    events: [],
    won: false,
    lost: false,
    killer: '',
    stats: { kills: 0, illuminated: 0, loops: 0, bestLoop: 0, bestFlourish: 1, wounds: 0, seals: 0, hops: 0, inkUsed: 0, leaf: 0, bosses: 0, cleanFolios: 0 },
  };
  startFolio(run, 0);
  return run;
}

/** Is the run waiting for something other than time (a rubric pick, or its end)? */
export function isFrozen(run) {
  return !!run.offer || run.won || run.lost;
}

/** Choose one of the offered rubrics (index 0-2). */
export function chooseRubric(run, index) {
  if (!run.offer || !run.offer[index]) return;
  takeRubric(run, run.offer[index]);
  emit(run, 'rubric', { id: run.offer[index] });
  run.pendingPicks -= 1;
  run.offer = null;
  // another Illumination may already be waiting: offer the next three at once
  if (run.pendingPicks > 0) {
    const next = offerRubrics(run);
    if (next.length > 0) run.offer = next;
    else run.pendingPicks = 0;
  }
}

/**
 * Advance the run by `dt` seconds. `controls` = { move: {x, y}, hop, pen: {down, x, y}, seal: {x, y} | null }.
 * The same controls on the same seed always give the same run.
 */
export function stepRun(run, controls, dt) {
  if (run.offer || run.won || run.lost) {
    if (run.ink.current) endStroke(run);
    return;
  }
  run.time += dt;
  if (run.banner) {
    run.banner.time -= dt;
    if (run.banner.time <= 0) run.banner = null;
  }
  run.seal.cooldown = Math.max(0, run.seal.cooldown - dt);

  updatePlayer(run, controls, dt);
  const pen = controls.pen;
  if (pen) {
    // every pointer position since the last step, then where the pen is now
    for (const point of pen.path || []) extendStroke(run, point.x, point.y);
    if (pen.down) extendStroke(run, pen.x, pen.y);
    else if (run.ink.current) endStroke(run);
  }
  if (controls.seal) castSeal(run, controls.seal.x, controls.seal.y);

  updateDirector(run, dt);
  updateFoes(run, dt);
  updateBoss(run, dt);
  updateInk(run, dt);
  updateDarts(run, dt);
  updateGlobs(run, dt);
  updateHazards(run, dt);
  updatePickups(run, dt);
  updateFlourish(run, dt);
  touchPlayer(run);
  for (const mark of run.sealMarks) mark.age += dt;
  run.sealMarks = run.sealMarks.filter((m) => m.age < 0.8);
  run.foes = run.foes.filter((f) => !f.dead || f === run.boss);
}

/** Gargoyle spit and Bookwyrm page shards fly, then splash into slowing puddles. */
function updateGlobs(run, dt) {
  const p = run.player;
  for (const glob of run.globs) {
    glob.life -= dt;
    glob.x += glob.vx * dt;
    glob.y += glob.vy * dt;
    if (Math.hypot(glob.x - p.x, glob.y - p.y) < glob.r + p.r - 3) {
      hurtPlayer(run, glob.x, glob.y, glob.page ? 'a page shard' : 'gargoyle spit');
      glob.life = 0;
      glob.spent = true;
    }
    if (glob.x < PAGE.left || glob.x > PAGE.right || glob.y < PAGE.top || glob.y > PAGE.bottom) {
      glob.life = 0;
      glob.spent = true;
    }
    if (glob.life <= 0 && !glob.spent && !glob.page) run.puddles.push({ x: glob.x, y: glob.y, r: 40, life: 5, age: 0 });
  }
  run.globs = run.globs.filter((g) => g.life > 0);
  for (const puddle of run.puddles) {
    puddle.age += dt;
    puddle.life -= dt;
  }
  run.puddles = run.puddles.filter((pd) => pd.life > 0);
}

/** The Great Blot's falling drops and spreading rings. */
function updateHazards(run, dt) {
  const p = run.player;
  for (const h of run.hazards) {
    if (h.kind === 'drop') {
      h.t -= dt;
      if (h.t <= 0) {
        h.done = true;
        if (Math.hypot(h.x - p.x, h.y - p.y) < h.r + p.r * 0.5) hurtPlayer(run, h.x, h.y, 'falling ink');
        run.puddles.push({ x: h.x, y: h.y, r: h.r, life: 4.5, age: 0 });
        emit(run, 'splash', { x: h.x, y: h.y });
      }
    } else if (h.kind === 'ring') {
      h.r += h.speed * dt;
      const d = Math.hypot(h.x - p.x, h.y - p.y);
      if (Math.abs(d - h.r) < 14 + p.r * 0.5 && p.hop <= 0) hurtPlayer(run, h.x, h.y, 'the ink surge');
      if (h.r > h.max) h.done = true;
    }
  }
  run.hazards = run.hazards.filter((h) => !h.done);
}

/** Contact: a foe that reaches the hare wounds it. */
function touchPlayer(run) {
  const p = run.player;
  if (p.invulnerable > 0) return;
  for (const foe of run.foes) {
    if (foe.dead || foe.emerge > 0 || foe.stun > 0.2) continue;
    for (const c of foeCircles(foe)) {
      if (Math.hypot(c.x - p.x, c.y - p.y) < c.r + p.r - 4) {
        hurtPlayer(run, c.x, c.y, foe.boss ? BOSSES[foe.kind].name : `a ${FOE_KINDS[foe.kind].name}`);
        return;
      }
    }
  }
}

