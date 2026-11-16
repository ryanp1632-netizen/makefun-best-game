// MARGINALIA: boots the page, runs the fixed-step game loop and moves between the screens
// (title -> play <-> pause / rubric pick -> results -> play again).
import { DIFFICULTY_ORDER, PAGE, STEP, VIEW } from './config.js';
import { createInput, endFrame, isHeld, moveAxis, takeTrail, wasPressed } from './input.js';
import { loadLedger, recordRun, saveLedger } from './save.js';
import { createRun, chooseRubric, stepRun } from './sim/run.js';
import { createPilot, pilotControls, pilotPick } from './sim/autopilot.js';
import { summarizeRun } from './sim/scoring.js';
import { absorbEvents, createEffects, drawOverlays, updateEffects } from './art/effects.js';
import { drawWorld } from './art/scene.js';
import { drawQuill } from './art/inkArt.js';
import { drawHud } from './ui/hud.js';
import { drawTitle } from './ui/titleScreen.js';
import { drawRubricPick } from './ui/rubricScreen.js';
import { drawPause } from './ui/pauseScreen.js';
import { drawResults } from './ui/resultsScreen.js';
import { beginUi, createUi, hitButton } from './ui/widgets.js';
import { initAudio, isMuted, setMuted, setQuill, soundFor } from './audio/sfx.js';
import { setMood, startMusic } from './audio/music.js';
import { renderShot } from './shots.js';

const canvas = document.getElementById('page');
const ctx = canvas.getContext('2d');

/** Keep the 1280x800 page as large as the window allows, sharp on high-density screens. */
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.w, window.innerHeight / VIEW.h);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = `${Math.floor(VIEW.w * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.h * scale)}px`;
  canvas.width = Math.floor(VIEW.w * scale * dpr);
  canvas.height = Math.floor(VIEW.h * scale * dpr);
  ctx.setTransform(canvas.width / VIEW.w, 0, 0, canvas.height / VIEW.h, 0, 0);
}

const params = new URLSearchParams(window.location.search);
if (params.has('shot')) {
  document.getElementById('hint')?.remove();
  renderShot(ctx, params.get('shot'), Number(params.get('seed') || 1));
} else {
  window.addEventListener('resize', fitCanvas);
  fitCanvas();
  startGame();
}

function startGame() {
  const input = createInput(canvas);
  const ledger = loadLedger();
  setMuted(!!ledger.muted);
  const app = {
    screen: 'title',
    input,
    ledger,
    ui: createUi(),
    run: null,
    fx: createEffects(),
    demo: null,
    summary: null,
    record: null,
    endDelay: 0,
    time: 0,
    accumulator: 0,
    penBlocked: false,
    lastPen: null,
  };
  newDemo(app);
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    app.time += dt;
    tick(app, dt);
    render(app);
    endFrame(input);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function newDemo(app) {
  const seed = 1 + Math.floor(Math.random() * 9999);
  app.demo = { run: createRun({ seed, difficulty: 'novice' }), pilot: createPilot(1), fx: createEffects() };
}

function startRun(app) {
  initAudio();
  startMusic();
  const seed = (Date.now() % 1000000) + 1;
  app.run = createRun({ seed, difficulty: app.ledger.difficulty });
  app.fx = createEffects();
  app.screen = 'play';
  app.endDelay = 0;
  app.penBlocked = true;
  soundFor({ type: 'click' });
}

function toggleMute(app) {
  initAudio();
  setMuted(!isMuted());
  app.ledger.muted = isMuted();
  saveLedger(app.ledger);
}

function tick(app, dt) {
  const { input } = app;
  if (input.gesture) {
    initAudio();
    startMusic();
  }
  if (wasPressed(input, 'm')) toggleMute(app);
  beginUi(app.ui, input.mouse);
  if (!input.mouse.down) app.penBlocked = false;

  if (app.screen === 'title') tickTitle(app, dt);
  else if (app.screen === 'play') tickPlay(app, dt);
  else if (app.screen === 'pick') tickPick(app);
  else if (app.screen === 'pause') tickPause(app);
  else if (app.screen === 'results') tickResults(app, dt);
}

/** The demo page behind the title plays itself. */
function tickTitle(app, dt) {
  setMood('menu');
  const demo = app.demo;
  app.accumulator += dt;
  while (app.accumulator >= STEP) {
    app.accumulator -= STEP;
    if (demo.run.offer) chooseRubric(demo.run, pilotPick(demo.run));
    stepRun(demo.run, pilotControls(demo.run, demo.pilot, STEP), STEP);
    absorbEvents(demo.fx, demo.run.events);
    demo.run.events.length = 0;
    updateEffects(demo.fx, STEP);
  }
  if (demo.run.lost || demo.run.won || demo.run.time > 150) newDemo(app);
  const { input, ledger } = app;
  const clicked = input.mouse.clicked ? hitButton(app.lastUi || app.ui, input.mouse.x, input.mouse.y) : null;
  if (wasPressed(input, 'Enter', ' ') || clicked === 'play') startRun(app);
  else if (clicked && clicked.startsWith('diff:')) {
    ledger.difficulty = clicked.slice(5);
    saveLedger(ledger);
    soundFor({ type: 'click' });
  } else if (wasPressed(input, 'ArrowLeft', 'ArrowRight')) {
    const i = DIFFICULTY_ORDER.indexOf(ledger.difficulty);
    ledger.difficulty = DIFFICULTY_ORDER[(i + (wasPressed(input, 'ArrowRight') ? 1 : 2)) % 3];
    saveLedger(ledger);
  }
}

function playControls(app) {
  const { input } = app;
  const m = input.mouse;
  const onPage = m.x >= PAGE.left - 20 && m.x <= PAGE.right + 20 && m.y >= PAGE.top - 20 && m.y <= PAGE.bottom + 20;
  const penDown = m.down && !app.penBlocked && (onPage || !!app.run.ink.current);
  return {
    move: moveAxis(input),
    hop: wasPressed(input, 'Shift') || isHeld(input, 'Shift'),
    pen: { down: penDown, x: m.x, y: m.y, path: [] },
    seal: wasPressed(input, ' ') || m.rightClicked ? { x: m.x, y: m.y } : null,
  };
}

function tickPlay(app, dt) {
  const { input, run } = app;
  setMood(run.stage === 'boss' || run.stage === 'bossIntro' ? 'boss' : `folio${run.folio}`);
  if (wasPressed(input, 'Escape', 'p')) {
    app.screen = 'pause';
    setQuill(false);
    return;
  }
  if (wasPressed(input, 'r')) {
    startRun(app);
    return;
  }
  const controls = playControls(app);
  let first = true;
  app.accumulator += dt;
  while (app.accumulator >= STEP) {
    app.accumulator -= STEP;
    // one-shot presses (hop, seal) count once per frame
    // the pointer trail since the last step is drawn in full on the first step
    const trail = takeTrail(input);
    const pen = { ...controls.pen, path: app.penBlocked ? [] : trail };
    stepRun(run, first ? { ...controls, pen } : { ...controls, hop: isHeld(input, 'Shift'), seal: null, pen }, STEP);
    first = false;
    for (const e of run.events) soundFor(e);
    absorbEvents(app.fx, run.events);
    run.events.length = 0;
    updateEffects(app.fx, STEP);
  }
  const pen = controls.pen;
  const speed = app.lastPen ? Math.hypot(pen.x - app.lastPen.x, pen.y - app.lastPen.y) / Math.max(dt, 0.001) : 0;
  setQuill(!!run.ink.current, speed);
  app.lastPen = { x: pen.x, y: pen.y };
  if (run.offer) {
    app.screen = 'pick';
    setQuill(false);
  }
  if (run.won || run.lost) {
    setQuill(false);
    app.endDelay += dt;
    if (app.endDelay > 1.6) finishRun(app);
  }
}

function finishRun(app) {
  app.summary = summarizeRun(app.run);
  app.record = recordRun(app.ledger, app.summary);
  app.screen = 'results';
}

function tickPick(app) {
  const { input, run } = app;
  let choice = -1;
  if (wasPressed(input, '1')) choice = 0;
  if (wasPressed(input, '2')) choice = 1;
  if (wasPressed(input, '3')) choice = 2;
  if (input.mouse.clicked) {
    const id = hitButton(app.lastUi || app.ui, input.mouse.x, input.mouse.y);
    if (id && id.startsWith('pick:')) choice = Number(id.slice(5));
  }
  if (choice >= 0 && run.offer && choice < run.offer.length) {
    chooseRubric(run, choice);
    for (const e of run.events) soundFor(e);
    absorbEvents(app.fx, run.events);
    run.events.length = 0;
    if (!run.offer) {
      app.screen = 'play';
      app.penBlocked = true;
    }
  }
}

function tickPause(app) {
  const { input } = app;
  const clicked = input.mouse.clicked ? hitButton(app.lastUi || app.ui, input.mouse.x, input.mouse.y) : null;
  if (wasPressed(input, 'Escape', 'p') || clicked === 'resume') {
    app.screen = 'play';
    app.penBlocked = true;
  } else if (wasPressed(input, 'r') || clicked === 'restart') startRun(app);
  else if (clicked === 'menu') app.screen = 'title';
  else if (clicked === 'mute') toggleMute(app);
}

function tickResults(app, dt) {
  const { input } = app;
  updateEffects(app.fx, dt);
  const clicked = input.mouse.clicked ? hitButton(app.lastUi || app.ui, input.mouse.x, input.mouse.y) : null;
  if (wasPressed(input, 'r', 'Enter') || clicked === 'again') startRun(app);
  else if (wasPressed(input, 'Escape') || clicked === 'menu') {
    app.screen = 'title';
    newDemo(app);
  }
}

function render(app) {
  const { ui, time } = app;
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  if (app.screen === 'title') {
    drawWorld(ctx, app.demo.run, app.demo.fx, time);
    drawTitle(ctx, ui, app.ledger, time);
  } else {
    const run = app.run;
    drawWorld(ctx, run, app.fx, time);
    drawHud(ctx, run, app.ledger.best[run.diff.key] || 0, time);
    drawOverlays(ctx, app.fx);
    if (app.screen === 'play') {
      const m = app.input.mouse;
      if (m.y > 80 && m.y < 740) drawQuill(ctx, m.x, m.y, !!run.ink.current, run.ink.level < 3);
    } else if (app.screen === 'pick') drawRubricPick(ctx, ui, run, time);
    else if (app.screen === 'pause') drawPause(ctx, ui, isMuted());
    else if (app.screen === 'results') drawResults(ctx, ui, app.summary, app.record, app.ledger, time);
  }
  app.lastUi = { buttons: ui.buttons.slice() };
}
