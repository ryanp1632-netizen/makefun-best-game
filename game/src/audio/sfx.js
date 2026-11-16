// Every sound is synthesised with the Web Audio API at run time (no sound files): the quill's
// scratch, a rising bell peal for each Illumination, darts, splats, the seal's thump and more.

let ac = null;
let master = null;
let sfxBus = null;
let musicBus = null;
let noiseBuffer = null;
let quill = null;
let muted = false;
const lastPlayed = {};

/** Start audio (browsers allow it only after a click or key press). */
export function initAudio() {
  if (ac) {
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  ac = new Ctor();
  master = ac.createGain();
  master.gain.value = muted ? 0 : 0.8;
  master.connect(ac.destination);
  sfxBus = ac.createGain();
  sfxBus.gain.value = 0.7;
  sfxBus.connect(master);
  musicBus = ac.createGain();
  musicBus.gain.value = 0.32;
  musicBus.connect(master);
  noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  let seed = 12345;
  for (let i = 0; i < data.length; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    data[i] = (seed / 0x7fffffff) * 2 - 1;
  }
  return ac;
}

export function audioReady() {
  return !!ac;
}

export function getMusicBus() {
  return { ac, bus: musicBus };
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, ac.currentTime, 0.05);
}

export function isMuted() {
  return muted;
}

function throttle(key, ms) {
  const now = performance.now();
  if (lastPlayed[key] && now - lastPlayed[key] < ms) return false;
  lastPlayed[key] = now;
  return true;
}

export function tone({ freq, type = 'sine', attack = 0.005, decay = 0.25, gain = 0.2, slide = 0, when = 0, bus = sfxBus }) {
  if (!ac) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + attack + decay);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  osc.connect(g);
  g.connect(bus);
  osc.start(t);
  osc.stop(t + attack + decay + 0.05);
}

export function noise({ duration = 0.15, gain = 0.2, freq = 1200, q = 1, kind = 'lowpass', when = 0, bus = sfxBus }) {
  if (!ac) return;
  const t = ac.currentTime + when;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ac.createBiquadFilter();
  filter.type = kind;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(bus);
  src.start(t, Math.random() * 0.5);
  src.stop(t + duration + 0.05);
}

const MODE = [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19];
const midi = (n) => 440 * 2 ** ((n - 69) / 12);

/** A bell peal that climbs one step for every foe caught in the loop. */
function bellPeal(count) {
  const notes = Math.min(9, Math.max(1, count));
  for (let i = 0; i < notes; i += 1) {
    const f = midi(62 + MODE[i]);
    tone({ freq: f, type: 'sine', decay: 0.9, gain: 0.16, when: i * 0.055 });
    tone({ freq: f * 2.76, type: 'sine', decay: 0.4, gain: 0.04, when: i * 0.055 });
  }
  if (count >= 4) tone({ freq: midi(74), type: 'triangle', attack: 0.05, decay: 1.4, gain: 0.08, when: notes * 0.055 });
}

/** The quill's scratch: a looping filtered noise whose loudness follows the pen's speed. */
export function setQuill(active, speed = 0) {
  if (!ac) return;
  if (!quill) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3200;
    filter.Q.value = 0.9;
    const g = ac.createGain();
    g.gain.value = 0;
    src.connect(filter);
    filter.connect(g);
    g.connect(sfxBus);
    src.start();
    quill = { g, filter };
  }
  const target = active ? Math.min(0.09, 0.015 + speed * 0.00012) : 0;
  quill.g.gain.setTargetAtTime(target, ac.currentTime, 0.03);
  quill.filter.frequency.setTargetAtTime(2600 + Math.min(2400, speed * 3), ac.currentTime, 0.05);
}

/** Play the sound for one run event. */
export function soundFor(e) {
  if (!ac) return;
  switch (e.type) {
    case 'loop':
      if (e.n > 0) bellPeal(e.n);
      else tone({ freq: 330, type: 'triangle', decay: 0.15, gain: 0.06 });
      break;
    case 'dart':
      if (throttle('dart', 60)) noise({ duration: 0.06, gain: 0.08, freq: 4000, kind: 'highpass' });
      break;
    case 'hit':
      if (throttle('hit', 45)) tone({ freq: 180, type: 'square', decay: 0.05, gain: 0.05, slide: 0.6 });
      break;
    case 'kill':
      if (throttle('kill', 40)) {
        noise({ duration: 0.16, gain: e.gilded ? 0.12 : 0.18, freq: 700 });
        if (e.gilded) tone({ freq: 1320 + Math.random() * 200, decay: 0.2, gain: 0.05 });
      }
      break;
    case 'seal':
      tone({ freq: 110, type: 'sine', decay: 0.4, gain: 0.4, slide: 0.5 });
      noise({ duration: 0.3, gain: 0.25, freq: 500 });
      break;
    case 'hurt':
      tone({ freq: 440, type: 'sawtooth', decay: 0.35, gain: 0.14, slide: 0.4 });
      noise({ duration: 0.2, gain: 0.15, freq: 900 });
      break;
    case 'pickup':
      if (e.kind === 'leaf') {
        if (throttle('leaf', 55)) tone({ freq: 1760 + Math.random() * 300, decay: 0.08, gain: 0.03 });
      } else tone({ freq: e.kind === 'heart' ? 660 : 990, type: 'triangle', decay: 0.25, gain: 0.1, slide: 1.5 });
      break;
    case 'levelup':
      [0, 4, 7, 12].forEach((n, i) => tone({ freq: midi(62 + n), type: 'triangle', attack: 0.04, decay: 1.2, gain: 0.09, when: i * 0.07 }));
      break;
    case 'rubric':
      tone({ freq: midi(74), type: 'triangle', decay: 0.4, gain: 0.12 });
      tone({ freq: midi(81), type: 'sine', decay: 0.6, gain: 0.08, when: 0.08 });
      break;
    case 'hop':
      tone({ freq: 300, type: 'triangle', decay: 0.12, gain: 0.08, slide: 2 });
      break;
    case 'crack':
      noise({ duration: 0.25, gain: 0.3, freq: 2500, kind: 'highpass' });
      tone({ freq: 900, type: 'square', decay: 0.1, gain: 0.06, slide: 0.5 });
      break;
    case 'glob':
      if (throttle('glob', 120)) tone({ freq: 220, type: 'sine', decay: 0.18, gain: 0.08, slide: 0.5 });
      break;
    case 'splash':
      if (throttle('splash', 70)) noise({ duration: 0.25, gain: 0.18, freq: 500 });
      break;
    case 'charge':
    case 'surge':
    case 'rain':
      tone({ freq: 90, type: 'sawtooth', attack: 0.05, decay: 0.7, gain: 0.12, slide: 1.6 });
      break;
    case 'bossIntro':
    case 'phase2':
      tone({ freq: 55, type: 'sawtooth', attack: 0.2, decay: 1.6, gain: 0.2, slide: 1.5 });
      noise({ duration: 1.2, gain: 0.1, freq: 300 });
      break;
    case 'bossDown':
      bellPeal(9);
      noise({ duration: 0.8, gain: 0.3, freq: 600 });
      break;
    case 'folioDone':
    case 'won':
      [0, 7, 12, 16, 19, 24].forEach((n, i) => tone({ freq: midi(62 + n), type: 'triangle', attack: 0.03, decay: 1.5, gain: 0.1, when: i * 0.12 }));
      break;
    case 'lost':
      [12, 10, 7, 3, 0].forEach((n, i) => tone({ freq: midi(50 + n), type: 'triangle', attack: 0.03, decay: 0.9, gain: 0.12, when: i * 0.22 }));
      break;
    case 'inkDry':
      if (throttle('dry', 400)) tone({ freq: 160, type: 'square', decay: 0.12, gain: 0.06 });
      break;
    case 'click':
      tone({ freq: 880, type: 'triangle', decay: 0.07, gain: 0.07 });
      break;
    default:
      break;
  }
}
