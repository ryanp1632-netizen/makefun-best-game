// The three Grotesques that end each folio: Sir Gastropod (a shelled abbot you must crack with a
// loop), the Bookwyrm (a long page-eating worm) and the Great Blot (a spreading stain that rains ink).
import { PAGE } from '../config.js';
import { clamp } from './geometry.js';
import { emit, banner, popup } from './events.js';
import { spawnFoe, trailSegments } from './foes.js';
import { addPickup } from './pickups.js';
import { addScore } from './scoring.js';

export const BOSSES = {
  gastropod: { name: 'SIR GASTROPOD', title: 'the Snail Abbot', r: 56, hp: 1700, points: 1500, armored: true },
  wyrm: { name: 'THE BOOKWYRM', title: 'devourer of vellum', r: 24, hp: 1900, points: 2200, segments: 16 },
  blot: { name: 'THE GREAT BLOT', title: 'the stain that spreads', r: 74, hp: 3600, points: 3500 },
};

export function spawnBoss(run, key) {
  const def = BOSSES[key];
  const x = (PAGE.left + PAGE.right) / 2;
  const y = PAGE.top + 120;
  const boss = spawnFoe(run, 'blotling', x, y);
  const hp = def.hp * run.diff.hp;
  Object.assign(boss, {
    kind: key,
    boss: true,
    r: def.r,
    hp,
    maxHp: hp,
    speed: key === 'wyrm' ? 150 : key === 'blot' ? 42 : 44,
    emerge: 1.4,
    armored: !!def.armored,
    state: 'move',
    stateTime: 3,
    attack: 0,
    phase2: false,
    aimX: 0,
    aimY: 0,
    facing: Math.PI / 2,
    segR: 18,
    segments: null,
  });
  if (def.segments) {
    boss.segments = [];
    for (let i = 0; i < def.segments; i += 1) boss.segments.push({ x, y: y - i * 4 });
  }
  run.boss = boss;
  emit(run, 'bossIntro', { name: def.name });
  return boss;
}

function towardPlayer(run, boss) {
  const dx = run.player.x - boss.x;
  const dy = run.player.y - boss.y;
  const d = Math.hypot(dx, dy) || 1;
  return { x: dx / d, y: dy / d, d };
}

function drift(boss, dirX, dirY, speed, dt) {
  const k = Math.min(1, 3 * dt);
  boss.vx += (dirX * speed - boss.vx) * k;
  boss.vy += (dirY * speed - boss.vy) * k;
}

const BRAINS = {
  gastropod(run, boss, dt) {
    const to = towardPlayer(run, boss);
    if (boss.crack > 0) boss.crack -= dt;
    if (boss.state === 'move') {
      drift(boss, to.x, to.y, boss.speed * (boss.phase2 ? 1.3 : 1), dt);
      if (boss.stateTime <= 0) {
        boss.attack += 1;
        if (boss.attack % 3 === 0) {
          boss.state = 'summon';
          boss.stateTime = 0.8;
        } else {
          boss.state = 'aim';
          boss.stateTime = 0.9;
          boss.aimX = to.x;
          boss.aimY = to.y;
          emit(run, 'charge', { x: boss.x, y: boss.y });
        }
      }
    } else if (boss.state === 'aim') {
      boss.vx *= 0.85;
      boss.vy *= 0.85;
      if (boss.stateTime <= 0) {
        boss.state = 'charge';
        boss.stateTime = 0.95;
      }
    } else if (boss.state === 'charge') {
      boss.vx = boss.aimX * 470;
      boss.vy = boss.aimY * 470;
      if (boss.stateTime <= 0) {
        boss.state = 'dizzy';
        boss.stateTime = 1.4;
      }
    } else if (boss.state === 'dizzy') {
      boss.vx *= 0.9;
      boss.vy *= 0.9;
      if (boss.stateTime <= 0) toMove(boss, 3.2);
    } else if (boss.state === 'summon') {
      boss.vx *= 0.9;
      boss.vy *= 0.9;
      if (boss.stateTime <= 0) {
        const count = boss.phase2 ? 3 : 4;
        for (let i = 0; i < count; i += 1) {
          const a = (i / count) * Math.PI * 2;
          spawnFoe(run, boss.phase2 && i % 2 ? 'snail' : 'blotling', boss.x + Math.cos(a) * 80, boss.y + Math.sin(a) * 80);
        }
        emit(run, 'summon', { x: boss.x, y: boss.y });
        toMove(boss, 3);
      }
    }
  },
  wyrm(run, boss, dt) {
    const to = towardPlayer(run, boss);
    const want = Math.atan2(to.y, to.x) + Math.sin(run.time * 1.3) * 0.5;
    let diff = want - boss.facing;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const turn = boss.state === 'lunge' ? 1.2 : 2.3;
    boss.facing += clamp(diff, -turn * dt, turn * dt);
    const speed = boss.state === 'lunge' ? boss.speed * 2.3 : boss.state === 'coil' ? boss.speed * 0.3 : boss.speed * (boss.phase2 ? 1.2 : 1);
    boss.vx = Math.cos(boss.facing) * speed;
    boss.vy = Math.sin(boss.facing) * speed;
    if (boss.stateTime <= 0) {
      if (boss.state === 'move') {
        boss.attack += 1;
        if (boss.attack % 2 === 1) {
          const shards = boss.phase2 ? 7 : 5;
          for (let i = 0; i < shards; i += 1) {
            const a = Math.atan2(to.y, to.x) + (i - (shards - 1) / 2) * 0.22;
            run.globs.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 270, vy: Math.sin(a) * 270, life: 1.6, r: 9, page: true });
          }
          emit(run, 'glob', { x: boss.x, y: boss.y });
          toMove(boss, 3.2);
        } else {
          boss.state = 'coil';
          boss.stateTime = 0.7;
          emit(run, 'charge', { x: boss.x, y: boss.y });
        }
      } else if (boss.state === 'coil') {
        boss.state = 'lunge';
        boss.stateTime = 1.3;
      } else toMove(boss, 3.4);
    }
  },
  blot(run, boss, dt) {
    const to = towardPlayer(run, boss);
    drift(boss, to.x, to.y, boss.speed * (boss.phase2 ? 1.5 : 1), dt);
    if (boss.stateTime > 0) return;
    boss.attack += 1;
    const pick = boss.attack % 3;
    if (pick === 1) {
      const drops = boss.phase2 ? 9 : 6;
      for (let i = 0; i < drops; i += 1) {
        const near = i === 0 ? 0 : run.rng.range(40, 220);
        const a = run.rng.range(0, Math.PI * 2);
        run.hazards.push({
          kind: 'drop',
          x: clamp(run.player.x + Math.cos(a) * near, PAGE.left + 30, PAGE.right - 30),
          y: clamp(run.player.y + Math.sin(a) * near, PAGE.top + 30, PAGE.bottom - 30),
          r: 44,
          t: 1.15 + i * 0.07,
        });
      }
      emit(run, 'rain', { x: boss.x, y: boss.y });
    } else if (pick === 2) {
      for (let i = 0; i < 4; i += 1) {
        const a = run.rng.range(0, Math.PI * 2);
        spawnFoe(run, i === 0 && boss.phase2 ? 'blotch' : 'blotling', boss.x + Math.cos(a) * 90, boss.y + Math.sin(a) * 90);
      }
      emit(run, 'summon', { x: boss.x, y: boss.y });
    } else {
      run.hazards.push({ kind: 'ring', x: boss.x, y: boss.y, r: boss.r, speed: boss.phase2 ? 300 : 240, max: 520 });
      emit(run, 'surge', { x: boss.x, y: boss.y });
    }
    boss.stateTime = boss.phase2 ? 3.2 : 4.4;
  },
};

function toMove(boss, seconds) {
  boss.state = 'move';
  boss.stateTime = seconds;
}

export function updateBoss(run, dt) {
  const boss = run.boss;
  if (!boss || boss.dead) return;
  boss.flash = Math.max(0, boss.flash - dt);
  if (boss.emerge > 0) {
    boss.emerge -= dt;
    return;
  }
  if (!boss.phase2 && boss.hp < boss.maxHp * 0.5) {
    boss.phase2 = true;
    banner(run, BOSSES[boss.kind].name + ' RAGES', 'second phase: faster, fiercer', 1.8);
    emit(run, 'phase2', { x: boss.x, y: boss.y });
  }
  boss.stateTime -= dt;
  if (boss.stun > 0) {
    boss.stun -= dt;
    boss.vx *= 0.8;
    boss.vy *= 0.8;
  } else BRAINS[boss.kind](run, boss, dt);
  boss.x += boss.vx * dt;
  boss.y += boss.vy * dt;
  const r = boss.r;
  if (boss.x < PAGE.left + r || boss.x > PAGE.right - r) {
    boss.vx *= -1;
    boss.facing = Math.PI - boss.facing;
    boss.aimX *= -1;
  }
  if (boss.y < PAGE.top + r || boss.y > PAGE.bottom - r) {
    boss.vy *= -1;
    boss.facing = -boss.facing;
    boss.aimY *= -1;
  }
  boss.x = clamp(boss.x, PAGE.left + r, PAGE.right - r);
  boss.y = clamp(boss.y, PAGE.top + r, PAGE.bottom - r);
  if (boss.segments) trailSegments(boss, 26);
}

/** The Grotesque falls: a shower of gold leaf, a mended heart and a big score. */
export function defeatBoss(run) {
  const boss = run.boss;
  const def = BOSSES[boss.kind];
  run.stats.bosses += 1;
  addScore(run, def.points, boss.x, boss.y - 40, false, `${def.name} BLOTTED  +#`);
  for (let i = 0; i < 18; i += 1) addPickup(run, 'leaf', boss.x, boss.y, 1);
  addPickup(run, 'heart', boss.x, boss.y, 1);
  addPickup(run, 'ink', boss.x, boss.y, 30);
  popup(run, boss.x, boss.y + 30, 'GROTESQUE DEFEATED', '#c4351c', 30);
  emit(run, 'bossDown', { x: boss.x, y: boss.y, kind: boss.kind, r: boss.r });
}
