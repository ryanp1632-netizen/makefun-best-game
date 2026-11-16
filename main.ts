// MARGINALIA hand-in program (Node 22, standard library only).
// The game is the static folder game/ (index.html + ES modules, no build step, no network).
// This program copies game/ and screenshots/ to the output folder and writes dossier.json
// with the kit's unchanged vendor/makefun-game.ts, exactly as the grader expects.
//
// Play locally:  node serve.ts   then open http://localhost:8080
// Hand in:       mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const SHOT_LIMIT_BYTES = 262144;

/** Copy one folder of the repository into the output folder. */
function copyFolder(name: string): void {
  const from = join(ROOT, name);
  const to = join(OUTPUT, name);
  mkdirSync(to, { recursive: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

/** Fail early, with a readable message, when a screenshot would break the gate. */
function checkScreenshots(): void {
  const dir = join(ROOT, 'screenshots');
  const shots = readdirSync(dir).filter((name) => !name.startsWith('.')).sort();
  if (shots.length < 3 || shots.length > 4) throw new Error(`need 3-4 screenshots, found ${shots.length}`);
  for (const name of shots) {
    const size = statSync(join(dir, name)).size;
    if (size > SHOT_LIMIT_BYTES) throw new Error(`${name} is ${size} bytes, over ${SHOT_LIMIT_BYTES}`);
  }
}

checkScreenshots();
mkdirSync(OUTPUT, { recursive: true });
copyFolder('game');
copyFolder('screenshots');

writeFileSync(
  join(OUTPUT, 'dossier.json'),
  buildDossier(OUTPUT, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: SHOT_LIMIT_BYTES },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
