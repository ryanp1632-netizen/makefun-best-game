// Seeded random numbers (mulberry32), so a run and every screenshot scene can be replayed exactly.

export function createRng(seed) {
  let a = seed >>> 0 || 0x9e3779b9;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (lo, hi) => lo + (hi - lo) * next(),
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (p) => next() < p,
  };
}

/** Choose a key of `weights` ({key: weight}) with probability proportional to its weight. */
export function pickWeighted(rng, weights) {
  let total = 0;
  for (const key in weights) total += weights[key];
  let roll = rng.next() * total;
  for (const key in weights) {
    roll -= weights[key];
    if (roll <= 0) return key;
  }
  return Object.keys(weights)[0];
}
