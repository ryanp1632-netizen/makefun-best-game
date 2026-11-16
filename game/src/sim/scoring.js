// Score, the Flourish multiplier (chained loops), grades and feats.
import { GRADES } from '../config.js';
import { popup } from './events.js';

export const FLOURISH_WINDOW = 4;
export const FLOURISH_MAX = 5;

/** Add points at a place on the page; `flourished` applies the current Flourish multiplier. */
export function addScore(run, base, x, y, flourished = true, label = '') {
  const mult = flourished ? run.flourish.mult : 1;
  const points = Math.round(base * mult * run.diff.score);
  run.score += points;
  if (label) popup(run, x, y, label.replace('#', points.toLocaleString('en-US')), '#a5760c', 22);
  return points;
}

/** A loop that caught foes raises the Flourish (up to x5) and restarts its clock. */
export function bumpFlourish(run) {
  if (run.flourish.timer > 0) run.flourish.mult = Math.min(FLOURISH_MAX, run.flourish.mult + 1);
  run.flourish.timer = FLOURISH_WINDOW;
  run.stats.bestFlourish = Math.max(run.stats.bestFlourish, run.flourish.mult);
}

export function updateFlourish(run, dt) {
  if (run.flourish.timer > 0) {
    run.flourish.timer -= dt;
    if (run.flourish.timer <= 0) run.flourish.mult = 1;
  }
}

export function gradeFor(score) {
  return GRADES.find((g) => score >= g.min).grade;
}

export const FEATS = [
  { id: 'gild8', name: 'Gild Eight', text: 'Illuminate 8 foes in one loop', test: (run) => run.stats.bestLoop >= 8 },
  { id: 'flourish', name: 'Full Flourish', text: 'Reach Flourish x5', test: (run) => run.stats.bestFlourish >= 5 },
  { id: 'snail', name: 'Unshelled', text: 'Defeat Sir Gastropod', test: (run) => run.stats.bosses >= 1 },
  { id: 'wyrm', name: 'Wyrm Bound', text: 'Defeat the Bookwyrm', test: (run) => run.stats.bosses >= 2 },
  { id: 'win', name: 'The Blot Blotted', text: 'Save the manuscript', test: (run) => run.won },
  { id: 'unhurt', name: 'Unblemished', text: 'Finish a folio without a wound', test: (run) => run.stats.cleanFolios > 0 },
  { id: 'hundred', name: 'Hundredfold', text: 'Illuminate 100 foes in a run', test: (run) => run.stats.illuminated >= 100 },
  { id: 'abbot', name: "Abbot's Blessing", text: 'Win on ABBOT', test: (run) => run.won && run.diff.key === 'abbot' },
];

/** Everything the results screen and the ledger need from a finished run. */
export function summarizeRun(run) {
  const heartsBonus = run.won ? run.player.hearts * 500 : 0;
  const score = run.score + heartsBonus;
  return {
    won: run.won,
    score,
    heartsBonus,
    grade: gradeFor(score),
    difficulty: run.diff.key,
    reached: run.won ? 'All 3 folios' : `Folio ${['I', 'II', 'III'][run.folio]}, ${run.stage === 'boss' ? 'boss' : `verse ${run.verse + 1}`}`,
    time: run.time,
    kills: run.stats.kills,
    illuminated: run.stats.illuminated,
    loops: run.stats.loops,
    bestLoop: run.stats.bestLoop,
    bestFlourish: run.stats.bestFlourish,
    hearts: run.player.hearts,
    maxHearts: run.player.maxHearts,
    level: run.level,
    rubrics: run.rubricOrder.slice(),
    feats: FEATS.filter((f) => f.test(run)).map((f) => f.id),
    killer: run.killer,
  };
}
