// Headless balance test: the autopilot plays whole runs in Node (the simulation needs no browser).
// node tools/simtest.mjs [seeds=5] [difficulty=scribe]
import { createRun, stepRun } from '../game/src/sim/run.js';
import { createPilot, pilotControls, pilotPick } from '../game/src/sim/autopilot.js';
import { chooseRubric } from '../game/src/sim/run.js';
import { summarizeRun } from '../game/src/sim/scoring.js';
import { STEP } from '../game/src/config.js';

const seeds = Number(process.argv[2] || 5);
const difficulty = process.argv[3] || 'scribe';
for (let seed = 1; seed <= seeds; seed += 1) {
  const started = Date.now();
  const run = createRun({ seed, difficulty });
  const pilot = createPilot(1);
  let steps = 0;
  const stageLog = [];
  let lastStage = '';
  while (!run.won && !run.lost && steps < 60 * 60 * 15) {
    if (run.offer) chooseRubric(run, pilotPick(run));
    stepRun(run, pilotControls(run, pilot, STEP), STEP);
    run.events.length = 0;
    const tag = `${run.folio}:${run.stage}`;
    if (tag !== lastStage) {
      stageLog.push(`${tag}@${run.time.toFixed(0)}s`);
      lastStage = tag;
    }
    steps += 1;
  }
  const s = summarizeRun(run);
  console.log(
    `seed ${seed}: ${s.won ? 'WON ' : 'LOST'} score ${s.score} grade ${s.grade} t=${run.time.toFixed(0)}s reached ${s.reached} kills ${s.kills} illum ${s.illuminated} loops ${s.loops} best ${s.bestLoop} lvl ${s.level} hearts ${s.hearts} killer=${s.killer} (${Date.now() - started} ms)`,
  );
  console.log('   ', stageLog.join(' '));
}
