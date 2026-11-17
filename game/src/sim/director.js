// The order of service: three folios of three verses each, a Grotesque at the end of every folio,
// and the spawning of foes, which grows with every verse.
import { pickWeighted } from '../rng.js';
import { banner, emit } from './events.js';
import { spawnPack } from './foes.js';
import { BOSSES, defeatBoss, spawnBoss } from './bosses.js';
import { addScore } from './scoring.js';

export const NUMERALS = ['I', 'II', 'III'];

/** Foes per second are each verse's rate times this: the margins should feel crowded. */
const SPAWN_SCALE = 1.7;

export const FOLIOS = [
  {
    title: 'The Garden Margin',
    boss: 'gastropod',
    verses: [
      { length: 30, rate: 0.95, mix: { blotling: 1 } },
      { length: 32, rate: 1.15, mix: { blotling: 3, wasp: 1 } },
      { length: 34, rate: 1.3, mix: { blotling: 3, wasp: 1, snail: 1 } },
    ],
  },
  {
    title: 'The Bestiary',
    boss: 'wyrm',
    verses: [
      { length: 32, rate: 1.25, mix: { blotling: 3, snail: 1, spitter: 1 } },
      { length: 34, rate: 1.45, mix: { blotling: 2, wasp: 2, spitter: 1, blotch: 1 } },
      { length: 36, rate: 1.6, mix: { blotling: 2, wasp: 2, snail: 1, spitter: 1, worm: 1, blotch: 1 } },
    ],
  },
  {
    title: 'The Last Leaf',
    boss: 'blot',
    verses: [
      { length: 34, rate: 1.65, mix: { blotling: 3, wasp: 2, worm: 1, blotch: 2 } },
      { length: 36, rate: 1.85, mix: { blotling: 2, wasp: 2, snail: 2, spitter: 2, worm: 1, blotch: 2 } },
      { length: 38, rate: 2.05, mix: { blotling: 3, wasp: 3, snail: 2, spitter: 2, worm: 2, blotch: 2 } },
    ],
  },
];

export function startFolio(run, index) {
  run.folio = index;
  run.verse = 0;
  run.verseTime = 0;
  run.stage = 'intro';
  run.stageTime = 2.6;
  run.folioWounds = 0;
  run.boss = null;
  banner(run, `FOLIO ${NUMERALS[index]}`, FOLIOS[index].title, 2.6);
  emit(run, 'folio', { index });
}

function aliveCap(run) {
  return 60 + run.folio * 15;
}

function spawnFromMix(run, mix, rate, dt) {
  run.spawnBudget += rate * SPAWN_SCALE * run.diff.spawn * dt;
  let alive = 0;
  for (const foe of run.foes) if (!foe.dead && !foe.boss) alive += 1;
  while (run.spawnBudget >= 1 && alive < aliveCap(run)) {
    const made = spawnPack(run, pickWeighted(run.rng, mix));
    run.spawnBudget -= made;
    alive += made;
  }
  if (alive >= aliveCap(run)) run.spawnBudget = Math.min(run.spawnBudget, 1);
}

/** Advance the folio / verse / boss schedule by one step. */
export function updateDirector(run, dt) {
  const folio = FOLIOS[run.folio];
  if (run.stage === 'intro') {
    run.stageTime -= dt;
    if (run.stageTime <= 0) {
      run.stage = 'verse';
      run.verseTime = 0;
    }
  } else if (run.stage === 'verse') {
    const verse = folio.verses[run.verse];
    run.verseTime += dt;
    if (run.verseTime > 1.2) spawnFromMix(run, verse.mix, verse.rate, dt);
    if (run.verseTime >= verse.length) {
      if (run.verse < folio.verses.length - 1) {
        run.verse += 1;
        run.verseTime = 0;
        banner(run, `VERSE ${NUMERALS[run.verse]}`, versePrompt(run), 1.8);
      } else {
        run.stage = 'bossIntro';
        run.stageTime = 2.8;
        const def = BOSSES[folio.boss];
        banner(run, 'A GROTESQUE APPROACHES', `${def.name}, ${def.title}`, 2.8);
      }
    }
  } else if (run.stage === 'bossIntro') {
    run.stageTime -= dt;
    if (run.stageTime <= 0) {
      spawnBoss(run, folio.boss);
      run.stage = 'boss';
    }
  } else if (run.stage === 'boss') {
    const last = folio.verses[folio.verses.length - 1];
    spawnFromMix(run, last.mix, last.rate * 0.3, dt);
    if (run.boss && run.boss.dead) {
      defeatBoss(run);
      finishFolio(run);
    }
  } else if (run.stage === 'folioDone') {
    run.stageTime -= dt;
    if (run.stageTime <= 0) {
      if (run.folio < FOLIOS.length - 1) startFolio(run, run.folio + 1);
      else {
        run.won = true;
        run.stage = 'won';
        emit(run, 'won', {});
      }
    }
  }
}

/** Short hint shown under each verse banner, teaching one idea at a time. */
export function versePrompt(run) {
  const hints = [
    ['Loop several blots at once for a bigger strike', 'Wasps fly over ink: dart them or loop them', 'Snail shells shrug off darts: loop to crack them'],
    ['Gargoyles spit ink puddles that slow you', 'A Blotch splits in three: catch the brood', 'Bookworms are long: loop their middle'],
    ['The last leaf: every foe returns', 'Chain loops within 4 s to raise the Flourish', 'Hold the line: the Great Blot is near'],
  ];
  return hints[run.folio][run.verse];
}

/** A Grotesque has fallen: clear the page, reward a clean folio and turn the page. */
function finishFolio(run) {
  run.stage = 'folioDone';
  run.stageTime = 3.4;
  for (const foe of run.foes) {
    if (!foe.dead && !foe.boss) {
      foe.dead = true;
      emit(run, 'kill', { x: foe.x, y: foe.y, kind: foe.kind, r: foe.r, gilded: true });
    }
  }
  run.globs = [];
  run.hazards = [];
  const clean = run.folioWounds === 0;
  if (clean) run.stats.cleanFolios += 1;
  const bonus = addScore(run, clean ? 3000 : 1000, 640, 300, false);
  const p = run.player;
  p.hearts = Math.min(p.maxHearts, p.hearts + 1);
  banner(run, `FOLIO ${NUMERALS[run.folio]} ILLUMINATED`, clean ? `Unblemished! +${bonus.toLocaleString('en-US')}` : `+${bonus.toLocaleString('en-US')} and a heart mended`, 3.2);
  emit(run, 'folioDone', { index: run.folio });
}
