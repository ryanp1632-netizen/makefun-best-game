// Screenshot scenes behind ?shot=play|title|pick|results&seed=N. Nothing is staged by hand: each
// scene plays real runs forward with the autopilot on a fixed seed (filling a scratch ledger the way
// a player's earlier runs would), stops at the moment named, and draws that one frame.
import { STEP, VIEW } from './config.js';
import { loadLedger, recordRun, useScratchLedger } from './save.js';
import { chooseRubric, createRun, stepRun } from './sim/run.js';
import { createPilot, pilotControls, pilotPick } from './sim/autopilot.js';
import { summarizeRun } from './sim/scoring.js';
import { absorbEvents, createEffects, drawOverlays, updateEffects } from './art/effects.js';
import { drawWorld } from './art/scene.js';
import { drawQuill } from './art/inkArt.js';
import { drawHud } from './ui/hud.js';
import { drawTitle } from './ui/titleScreen.js';
import { drawRubricPick } from './ui/rubricScreen.js';
import { drawResults } from './ui/resultsScreen.js';
import { createUi } from './ui/widgets.js';

/**
 * Step a run with the autopilot until `stop(run, events)` says so or `maxSeconds` pass.
 * `pickWhen(run)` decides whether an offered rubric is taken at once (default: always).
 */
function playUntil(game, stop, maxSeconds, pickWhen = () => true) {
  const { run, pilot, fx } = game;
  const end = run.time + maxSeconds;
  while (run.time < end && !run.won && !run.lost) {
    if (run.offer) {
      if (!pickWhen(run)) return true;
      chooseRubric(run, pilotPick(run));
    }
    stepRun(run, pilotControls(run, pilot, STEP), STEP);
    const events = run.events.slice();
    if (fx) {
      absorbEvents(fx, run.events);
      updateEffects(fx, STEP);
    }
    run.events.length = 0;
    if (stop(run, events)) return true;
  }
  return false;
}

function newGame(seed, difficulty, withFx = true, minCrowd = 2) {
  return { run: createRun({ seed, difficulty }), pilot: createPilot(1, 2, minCrowd), fx: withFx ? createEffects() : null };
}

/** Earlier runs of the same autopilot, so the ledger holds real bests, feats and recent runs. */
function earlierRuns(ledger, seeds, difficulty) {
  for (const seed of seeds) {
    const game = newGame(seed, difficulty, false);
    playUntil(game, () => false, 900);
    recordRun(ledger, summarizeRun(game.run));
  }
}

const SCENES = {
  play(ctx, seed, ledger) {
    earlierRuns(ledger, [seed + 100], 'scribe');
    // a patient hand (it waits for a crowd of six before it draws) keeps ink in the well, so the
    // cover catches a big loop through a crowded page with ink to spare and a Flourish chain running
    // from this seed on, the first run whose page holds that moment with a crowd still around it
    const crowded = (run) => run.foes.filter((f) => !f.dead).length;
    const good = (run, events) => run.time >= 130 && crowded(run) >= 20 && run.ink.level >= run.ink.max * 0.4 && run.flourish.mult >= 2 && events.some((e) => e.type === 'loop' && e.n >= 7 && Math.abs(e.x - 640) < 280 && Math.abs(e.y - 410) < 170);
    let game = null;
    let found = false;
    for (let s = seed; s < seed + 12 && !found; s += 1) {
      game = newGame(s, 'scribe', true, 6);
      found = playUntil(game, good, 420);
    }
    if (!found) {
      game = newGame(seed, 'scribe');
      playUntil(game, (run) => run.time >= 168, 400);
      playUntil(game, (run, events) => crowded(run) >= 22 && events.some((e) => e.type === 'loop' && e.n >= 5), 120);
    }
    playUntil(game, () => false, 0.12);
    const { run, fx, pilot } = game;
    drawWorld(ctx, run, fx, run.time);
    drawHud(ctx, run, ledger.best.scribe, run.time);
    drawOverlays(ctx, fx);
    drawQuill(ctx, pilot.aimX, pilot.aimY, !!run.ink.current, false);
  },
  boss(ctx, seed, ledger) {
    earlierRuns(ledger, [seed + 100], 'scribe');
    const game = newGame(seed, 'scribe');
    const folio = Number(new URLSearchParams(window.location.search).get('folio') || 1);
    playUntil(game, (run) => run.folio === folio && run.stage === 'boss' && run.boss && run.boss.emerge <= 0 && run.boss.hp < run.boss.maxHp * 0.7, 900);
    playUntil(game, (run, events) => events.some((e) => e.type === 'loop' && e.n >= 1), 20);
    playUntil(game, () => false, 0.12);
    const { run, fx, pilot } = game;
    drawWorld(ctx, run, fx, run.time);
    drawHud(ctx, run, ledger.best.scribe, run.time);
    drawOverlays(ctx, fx);
    drawQuill(ctx, pilot.aimX, pilot.aimY, !!run.ink.current, false);
  },
  early(ctx, seed, ledger) {
    const game = newGame(seed, 'scribe');
    game.pilot.rest = 999;
    playUntil(game, (run) => run.time >= 9, 20);
    const { run, fx } = game;
    drawWorld(ctx, run, fx, run.time);
    drawHud(ctx, run, ledger.best.scribe, run.time);
  },
  title(ctx, seed, ledger) {
    earlierRuns(ledger, [seed + 200, seed + 201, seed + 202], 'scribe');
    ledger.difficulty = 'scribe';
    const game = newGame(seed, 'novice');
    playUntil(game, (run) => run.time >= 24, 60);
    playUntil(game, (run, events) => events.some((e) => e.type === 'loop' && e.n >= 3), 20);
    drawWorld(ctx, game.run, game.fx, game.run.time);
    const ui = createUi();
    ui.mouse = { x: 1000, y: 100 };
    drawTitle(ctx, ui, ledger, 0.4);
  },
  pick(ctx, seed, ledger) {
    earlierRuns(ledger, [seed + 300], 'scribe');
    const game = newGame(seed, 'scribe');
    playUntil(game, () => false, 600, (run) => run.level < 8);
    const { run, fx } = game;
    drawWorld(ctx, run, fx, run.time);
    drawHud(ctx, run, ledger.best.scribe, run.time);
    const ui = createUi();
    ui.mouse = { x: 640, y: 420 };
    drawRubricPick(ctx, ui, run, 1.2);
  },
  results(ctx, seed, ledger) {
    earlierRuns(ledger, [seed + 400, seed + 401], 'scribe');
    // the colophon of the first run, from this seed on, that saved the manuscript (every run is played in full)
    let game = null;
    for (let s = seed; s < seed + 8; s += 1) {
      game = newGame(s, 'scribe');
      playUntil(game, () => false, 900);
      if (game.run.won) break;
      recordRun(ledger, summarizeRun(game.run));
    }
    const summary = summarizeRun(game.run);
    const record = recordRun(ledger, summary);
    playUntil(game, () => false, 0);
    drawWorld(ctx, game.run, game.fx, game.run.time);
    const ui = createUi();
    ui.mouse = { x: 600, y: 700 };
    drawResults(ctx, ui, summary, record, ledger, 0.6);
  },
};

export function renderShot(ctx, name, seed) {
  useScratchLedger({});
  const ledger = loadLedger();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  const scene = SCENES[name] || SCENES.play;
  scene(ctx, seed, ledger);
  document.title = 'SHOT READY';
  window.shotReady = true;
}
