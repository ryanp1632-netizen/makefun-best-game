// A small procedural score in the old church modes: a drone, a plucked melody that wanders step
// by step, and a tabor beat. Each folio has its own mode; a Grotesque quickens the tempo.
import { getMusicBus, tone, noise } from './sfx.js';

const MODES = {
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  ionian: [0, 2, 4, 5, 7, 9, 11],
};

const MOODS = {
  menu: { root: 62, mode: 'ionian', bpm: 84, drums: false },
  folio0: { root: 62, mode: 'dorian', bpm: 96, drums: true },
  folio1: { root: 57, mode: 'aeolian', bpm: 100, drums: true },
  folio2: { root: 64, mode: 'phrygian', bpm: 104, drums: true },
  boss: { root: 57, mode: 'phrygian', bpm: 124, drums: true },
};

const midi = (n) => 440 * 2 ** ((n - 69) / 12);

const state = { mood: 'menu', timer: null, nextBeat: 0, beat: 0, degree: 0, seed: 7 };

function rand() {
  state.seed = (state.seed * 16807) % 2147483647;
  return state.seed / 2147483647;
}

function noteOf(mood, degree, octave = 0) {
  const scale = MODES[mood.mode];
  const d = ((degree % 7) + 7) % 7;
  const o = Math.floor(degree / 7) + octave;
  return midi(mood.root + scale[d] + o * 12);
}

function scheduleBeat(when) {
  const { ac, bus } = getMusicBus();
  const mood = MOODS[state.mood];
  const offset = when - ac.currentTime;
  const beatInBar = state.beat % 8;
  if (beatInBar === 0) {
    tone({ freq: noteOf(mood, 0, -2), type: 'triangle', attack: 0.4, decay: 3.6, gain: 0.12, when: offset, bus });
    tone({ freq: noteOf(mood, 4, -2), type: 'sine', attack: 0.5, decay: 3.4, gain: 0.07, when: offset, bus });
  }
  // melody: mostly steps, sometimes a leap, resting now and then
  if (rand() > 0.22) {
    const step = rand() < 0.75 ? (rand() < 0.5 ? -1 : 1) : rand() < 0.5 ? -3 : 2;
    state.degree = Math.max(-2, Math.min(9, state.degree + step));
    if (beatInBar === 0) state.degree = rand() < 0.5 ? 0 : 4;
    const f = noteOf(mood, state.degree, 0);
    tone({ freq: f, type: 'triangle', attack: 0.004, decay: 0.45, gain: 0.1, when: offset, bus });
    tone({ freq: f * 2, type: 'sine', attack: 0.002, decay: 0.18, gain: 0.025, when: offset, bus });
  }
  if (mood.drums) {
    if (beatInBar % 4 === 0) noise({ duration: 0.18, gain: 0.22, freq: 180, when: offset, bus });
    else if (beatInBar % 2 === 0) noise({ duration: 0.06, gain: 0.08, freq: 2400, kind: 'bandpass', q: 2, when: offset, bus });
    if (state.mood === 'boss' && beatInBar % 2 === 1) noise({ duration: 0.05, gain: 0.07, freq: 300, when: offset, bus });
  }
  state.beat += 1;
}

function pump() {
  const { ac } = getMusicBus();
  if (!ac) return;
  const mood = MOODS[state.mood];
  const beatLength = 60 / mood.bpm / 2;
  if (state.nextBeat < ac.currentTime) state.nextBeat = ac.currentTime + 0.05;
  while (state.nextBeat < ac.currentTime + 0.2) {
    scheduleBeat(state.nextBeat);
    state.nextBeat += beatLength;
  }
}

export function startMusic() {
  if (state.timer) return;
  state.timer = setInterval(pump, 50);
}

/** 'menu', 'folio0'-'folio2' or 'boss'. */
export function setMood(mood) {
  if (MOODS[mood] && state.mood !== mood) {
    state.mood = mood;
    state.beat = 0;
    state.degree = 0;
  }
}
