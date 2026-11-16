// Rubrics: the upgrades offered at every Illumination (level up). Each can be taken up to `max` times;
// the systems read their level with rubricLevel(run, id).
import { PALETTE } from '../config.js';

export const RUBRICS = [
  { id: 'vermilion', name: 'Vermilion Ink', text: 'Strokes burn foes 50% harder', max: 3, color: PALETTE.vermilion, icon: 'flame' },
  { id: 'lapis', name: 'Lapis Wash', text: 'Foes touching wet ink slow by 35%', max: 2, color: PALETTE.lapis, icon: 'drop' },
  { id: 'inkwell', name: 'Deep Inkwell', text: '+35 ink capacity, filled at once', max: 3, color: PALETTE.inkSoft, icon: 'well' },
  { id: 'quill', name: 'Swift Quill', text: 'Ink flows back 50% faster', max: 3, color: PALETTE.verdigris, icon: 'quill' },
  { id: 'echo', name: 'Rubric of Echoes', text: 'Illumination strikes 40% harder', max: 3, color: PALETTE.gold, icon: 'sun' },
  { id: 'gilt', name: 'Gilded Margins', text: 'Loops shed 50% more gold leaf', max: 2, color: PALETTE.gold, icon: 'leaf' },
  { id: 'twin', name: 'Twin Darts', text: '+1 dart in every volley', max: 3, color: PALETTE.lapis, icon: 'darts' },
  { id: 'barbs', name: 'Barbed Darts', text: 'Darts pierce 1 more foe, +3 damage', max: 2, color: PALETTE.vermilion, icon: 'barb' },
  { id: 'haste', name: "Hare's Haste", text: '+12% speed, hop recharges faster', max: 2, color: PALETTE.verdigris, icon: 'hare' },
  { id: 'dropcap', name: 'Drop Capital', text: 'A loop of 4+ foes stamps a free seal', max: 1, color: PALETTE.vermilion, icon: 'seal' },
  { id: 'patience', name: 'Patient Hand', text: 'Ink lines linger 60% longer', max: 2, color: PALETTE.inkSoft, icon: 'hourglass' },
  { id: 'wax', name: 'Wax Reserve', text: 'Seal recharges 30% faster, 20% wider', max: 2, color: PALETTE.vermilion, icon: 'seal' },
  { id: 'mail', name: 'Chainmail Hide', text: '+1 heart and mend 1 heart', max: 2, color: PALETTE.rose, icon: 'heart' },
  { id: 'saint', name: "Saints' Glow", text: 'Illuminated foes spill ink (+3 each)', max: 1, color: PALETTE.goldLight, icon: 'halo' },
  { id: 'lodestone', name: 'Lodestone Margin', text: 'Pick-ups drift to you from 70% farther', max: 1, color: PALETTE.lapisLight, icon: 'magnet' },
];

const BY_ID = Object.fromEntries(RUBRICS.map((r) => [r.id, r]));

export function rubricById(id) {
  return BY_ID[id];
}

export function rubricLevel(run, id) {
  return run.rubrics[id] || 0;
}

/** Three different rubrics the hare may still take, drawn with the run's random numbers. */
export function offerRubrics(run, count = 3) {
  const open = RUBRICS.filter((r) => rubricLevel(run, r.id) < r.max).map((r) => r.id);
  const offer = [];
  while (offer.length < count && open.length > 0) {
    const index = Math.floor(run.rng.next() * open.length);
    offer.push(open.splice(index, 1)[0]);
  }
  return offer;
}

/** Take a rubric: raise its level and apply what happens at once (hearts, ink). */
export function takeRubric(run, id) {
  run.rubrics[id] = rubricLevel(run, id) + 1;
  run.rubricOrder.push(id);
  const p = run.player;
  if (id === 'mail') {
    p.maxHearts += 1;
    p.hearts = Math.min(p.maxHearts, p.hearts + 2);
  }
  if (id === 'inkwell') {
    run.ink.max += 35;
    run.ink.level = run.ink.max;
  }
}
