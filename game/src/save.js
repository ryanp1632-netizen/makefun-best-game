// The scriptorium's ledger: best scores per difficulty, earned feats, the last runs and settings,
// kept in localStorage (and quietly in memory when storage is blocked).

const KEY = 'marginalia.ledger.v1';

const fresh = () => ({ best: { novice: 0, scribe: 0, abbot: 0 }, feats: [], runs: [], muted: false, difficulty: 'scribe', plays: 0 });

let memory = null;
let scratch = false;

export function loadLedger() {
  if (memory) return memory;
  try {
    const raw = window.localStorage.getItem(KEY);
    memory = raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch {
    memory = fresh();
  }
  return memory;
}

export function saveLedger(ledger) {
  memory = ledger;
  if (scratch) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ledger));
  } catch {
    // storage blocked (private window): the ledger lives in memory for this visit
  }
}

/** Use an in-memory ledger only (screenshot scenes must not depend on a browser's saved data). */
export function useScratchLedger(ledger) {
  scratch = true;
  memory = { ...fresh(), ...ledger };
}

/** File a finished run: returns {newBest, newFeats}. */
export function recordRun(ledger, summary) {
  const previous = ledger.best[summary.difficulty] || 0;
  const newBest = summary.score > previous;
  if (newBest) ledger.best[summary.difficulty] = summary.score;
  const newFeats = summary.feats.filter((id) => !ledger.feats.includes(id));
  ledger.feats.push(...newFeats);
  ledger.runs.unshift({ won: summary.won, score: summary.score, reached: summary.reached, difficulty: summary.difficulty });
  ledger.runs = ledger.runs.slice(0, 3);
  ledger.plays += 1;
  saveLedger(ledger);
  return { newBest, previous, newFeats };
}
