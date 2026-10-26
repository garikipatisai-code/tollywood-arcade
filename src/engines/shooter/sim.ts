export const STEP = 1 / 60;
export const MAX_STEPS = 5;
export const MAX_FRAME_DELTA = 0.25;
export const BASE_SHARD_SLOTS = 2;
export const MAGNET_RADIUS = 70;

/** How many shard pickups per run grant score. Extra shards still count. */
export function setShardSlots(world: World, slots: number): void {
  world.shardSlots = Math.max(0, Math.floor(slots));
}
export const MAGNET_SPEED = 130;
export const GRAZE_EXTRA = 12;
export const SLOWMO_FRAMES = 24;
export const SLOWMO_SCALE = 0.35;
export const KNOCKBACK = 0.02;

export type EnemyKind = 'swatter' | 'spray' | 'spider' | 'boss';
export type Outcome = 'running' | 'won' | 'lost';
export type DuelMode = 'stalk' | 'windup' | 'dash' | 'recover';

export const DUEL_STALK = 120;
export const DUEL_WINDUP = 40;
export const DUEL_DASH = 20;
export const DUEL_RECOVER = 70;
export const DUEL_DASH_MULT = 4;

export interface SimInput {
  x: number;
  y: number;
  sting: boolean;
}

export interface EnemyTuning {
  hp: number;
  radius: number;
  speed: number;
  score: number;
}

export interface Tuning {
  width: number;
  height: number;
  runSeconds: number;
  player: { speed: number; radius: number; lives: number; invulnFrames: number };
  bullet: { speed: number; radius: number; lifeFrames: number; cooldownFrames: number; damage: number };
  /** Score per slotted shard; defaults to 250 when omitted (v1 tunings). */
  shardScore?: number;
  enemies: Record<EnemyKind, EnemyTuning>;
  pools: { enemies: number; bullets: number };
}

export interface Enemy {
  alive: boolean;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  radius: number;
  score: number;
  harmless: boolean;
  marked: boolean;
  enraged: boolean;
  burnCd: number;
  duelist: boolean;
  mode: DuelMode;
  modeT: number;
  maxHp: number;
  winged: boolean;
}

export interface Bullet {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  radius: number;
  pierce: boolean;
}

export interface Player {
  x: number;
  y: number;
  alive: boolean;
  invulnFrames: number;
  cooldownFrames: number;
}

export interface Loadout {
  needle: boolean;
  armor: boolean;
  cannon: boolean;
}

export const FULL_LOADOUT: Loadout = { needle: true, armor: true, cannon: true };

/** v1 behavior exactly: sting only, no armor, no piercing. */
export const DEFAULT_LOADOUT: Loadout = { needle: true, armor: false, cannon: false };

export type SimEventType = 'shard' | 'objective' | 'carry' | 'deliver' | 'detonate' | 'slain' | 'martyr' | 'winged';

export interface SimEvent {
  tick: number;
  type: SimEventType;
  id: string;
}

export interface Shard {
  id: string;
  x: number;
  y: number;
  r: number;
  taken: boolean;
  /** Deliver to a dropoff instead of taking on touch. */
  carry: boolean;
  /** Countdown frames once armed; -1 = plain. */
  fuse: number;
  /** Follows the player once touched. */
  escort: boolean;
  /** Touching detonates victory. */
  martyr: boolean;
  fuseLeft: number;
  escorting: boolean;
}

export interface Dropoff {
  id: string;
  x: number;
  y: number;
  r: number;
}

export interface ExitZone {
  id: string;
  x: number;
  y: number;
  r: number;
}

export interface Hazard {
  id: string;
  x: number;
  y: number;
  r: number;
  /** Blink cycle in frames; period 0 means always on. */
  period: number;
  on: number;
  /** Drift velocity in px/s; wraps around the extended bounds. */
  vx: number;
  vy: number;
  kind: 'ring' | 'car' | 'guard';
}

export interface WindZone {
  id: string;
  x: number;
  y: number;
  r: number;
  /** Push velocity in px/s while active. */
  dx: number;
  dy: number;
  period: number;
  on: number;
}

export interface SlowZone {
  id: string;
  x: number;
  y: number;
  r: number;
  /** Input speed multiplier inside the fumes. */
  factor: number;
}

export interface World {
  tuning: Tuning;
  seed: number;
  rng: number;
  tick: number;
  runFrames: number;
  runFramesMax: number;
  score: number;
  lives: number;
  paranoia: number;
  loadout: Loadout;
  armorSpent: boolean;
  slowmoFrames: number;
  clipped: boolean;
  shards: Shard[];  hazards: Hazard[];
  wind: WindZone[];
  slow: SlowZone[];
  dropoffs: Dropoff[];
  carried: string | null;
  swift: number;
  exits: ExitZone[];
  /** Scored shard slots (base 2, +1 with the wing amulet). */
  shardSlots: number;
  shardsUsed: number;
  events: SimEvent[];
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  outcome: Outcome;
}

const KIND_ORDER: EnemyKind[] = ['swatter', 'spray', 'spider', 'boss'];

function emptyEnemy(): Enemy {
  return {
    alive: false,
    kind: 'swatter',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    hp: 0,
    radius: 0,
    score: 0,
    harmless: false,
    marked: false,
    enraged: false,
    burnCd: 0,
    duelist: false,
    mode: 'stalk',
    modeT: 0,
    maxHp: 0,
    winged: false
  };
}

function emptyBullet(): Bullet {
  return { alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, radius: 0, pierce: false };
}

export function createWorld(seed: number, tuning: Tuning, loadout: Loadout = DEFAULT_LOADOUT): World {
  return {
    tuning,
    seed,
    rng: (seed >>> 0) || 0x9e3779b9,
    tick: 0,
    runFrames: 0,
    runFramesMax: Math.round(tuning.runSeconds * 60),
    score: 0,
    lives: tuning.player.lives,
    paranoia: 0,
    loadout: { ...loadout },
    armorSpent: false,
    slowmoFrames: 0,
    clipped: false,
    shards: [],
    hazards: [],
    wind: [],
    slow: [],
    dropoffs: [],
    carried: null,
    swift: 0,
    exits: [],
    shardSlots: 0,
    shardsUsed: 0,
    events: [],
    outcome: 'running',
    player: {
      x: tuning.width / 2,
      y: tuning.height - tuning.player.radius - 16,
      alive: true,
      invulnFrames: 0,
      cooldownFrames: 0
    },
    enemies: Array.from({ length: tuning.pools.enemies }, emptyEnemy),
    bullets: Array.from({ length: tuning.pools.bullets }, emptyBullet)
  };
}

/** Paranoia 0-100: the story escalation dial. Clamped, deterministic. */
export function setParanoia(world: World, value: number): void {
  world.paranoia = Math.max(0, Math.min(100, Math.round(value)));
}

export function placeShards(
  world: World,
  shards: {
    id: string;
    x: number;
    y: number;
    r?: number;
    carry?: boolean;
    fuse?: number;
    escort?: boolean;
    martyr?: boolean;
  }[]
): void {
  world.shards = shards.map((shard) => ({
    carry: false,
    fuse: -1,
    escort: false,
    martyr: false,
    ...shard,
    r: shard.r ?? 10,
    taken: false,
    fuseLeft: -1,
    escorting: false
  }));
}

export function placeExits(world: World, spots: { id: string; x: number; y: number; r?: number }[]): void {
  world.exits = spots.map((spot) => ({ ...spot, r: spot.r ?? 24 }));
}

export function placeDropoffs(world: World, spots: { id: string; x: number; y: number; r?: number }[]): void {
  world.dropoffs = spots.map((spot) => ({ ...spot, r: spot.r ?? 16 }));
}

export const SWIFT_STEP = 0.12;
export const SWIFT_CAP = 5;

/** Ritual rings, exterminator fields, and other static dangers. */
export function placeHazards(
  world: World,
  hazards: {
    id: string;
    x: number;
    y: number;
    r: number;
    period?: number;
    on?: number;
    vx?: number;
    vy?: number;
    kind?: Hazard['kind'];
  }[]
): void {
  world.hazards = hazards.map((hazard) => ({
    period: 0,
    on: 0,
    vx: 0,
    vy: 0,
    kind: 'ring' as const,
    ...hazard
  }));
}

/** Deterministic blink: derived from the tick, so replays agree. */
export function hazardActive(hazard: Pick<Hazard, 'period' | 'on'>, tick: number): boolean {
  if (hazard.period <= 0) return true;
  return tick % hazard.period < hazard.on;
}

/** Wind gusts: blink-active push fields. Placed per chapter. */
export function placeWindZones(
  world: World,
  zones: { id: string; x: number; y: number; r: number; dx: number; dy: number; period?: number; on?: number }[]
): void {
  world.wind = zones.map((zone) => ({ period: 0, on: 0, ...zone }));
}

/** Fume banks: speed-factor fields. Placed per chapter. */
export function placeSlowZones(
  world: World,
  zones: { id: string; x: number; y: number; r: number; factor: number }[]
): void {
  world.slow = zones.map((zone) => ({ ...zone }));
}
/** Deterministic PRNG. State lives in the world so a replay can reproduce it. */
export function nextRandom(world: World): number {
  world.rng = (world.rng + 0x6d2b79f5) >>> 0;
  let t = world.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function spawnEnemy(
  world: World,
  kind: EnemyKind,
  x: number,
  y: number,
  vx = 0,
  vy = 0,
  hp?: number,
  flags?: { harmless?: boolean; marked?: boolean; enraged?: boolean; duelist?: boolean }
): Enemy | null {
  const slot = world.enemies.find((enemy) => !enemy.alive);
  if (!slot) return null;

  const stats = world.tuning.enemies[kind];
  slot.alive = true;
  slot.kind = kind;
  slot.x = x;
  slot.y = y;
  slot.vx = vx;
  slot.vy = vy;
  slot.hp = hp ?? stats.hp;
  slot.radius = stats.radius;
  slot.score = stats.score;
  slot.harmless = flags?.harmless ?? false;
  slot.marked = flags?.marked ?? false;
  slot.enraged = flags?.enraged ?? false;
  slot.burnCd = 0;
  slot.duelist = flags?.duelist ?? false;
  slot.mode = 'stalk';
  slot.modeT = DUEL_STALK;
  slot.maxHp = slot.hp;
  slot.winged = false;
  return slot;
}

function spawnBullet(world: World, x: number, y: number, vx: number, vy: number): Bullet | null {
  const slot = world.bullets.find((bullet) => !bullet.alive);
  if (!slot) return null;

  slot.alive = true;
  slot.x = x;
  slot.y = y;
  slot.vx = vx;
  slot.vy = vy;
  slot.life = world.tuning.bullet.lifeFrames;
  slot.radius = world.tuning.bullet.radius;
  slot.pierce = world.loadout.cannon;
  return slot;
}

function nearestEnemy(world: World): Enemy | null {
  let best: Enemy | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    const dx = enemy.x - world.player.x;
    const dy = enemy.y - world.player.y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      best = enemy;
      bestDistance = distance;
    }
  }

  return best;
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

function fixToArray(world: World, input: SimInput): void {
  const { player, tuning } = world;
  const radius = tuning.player.radius;

  let grip = 1;
  for (const zone of world.slow) {
    const dx = player.x - zone.x;
    const dy = player.y - zone.y;
    if (dx * dx + dy * dy > zone.r * zone.r) continue;
    grip = Math.min(grip, zone.factor);
  }

  const pace = tuning.player.speed * (1 + SWIFT_STEP * Math.min(world.swift, SWIFT_CAP)) * (world.clipped ? 0.75 : 1);
  player.x = clamp(player.x + input.x * pace * grip * STEP, radius, tuning.width - radius);
  player.y = clamp(player.y + input.y * pace * grip * STEP, radius, tuning.height - radius);

  for (const zone of world.wind) {
    if (!hazardActive(zone, world.tick)) continue;
    const dx = player.x - zone.x;
    const dy = player.y - zone.y;
    if (dx * dx + dy * dy > zone.r * zone.r) continue;
    player.x = clamp(player.x + zone.dx * STEP, radius, tuning.width - radius);
    player.y = clamp(player.y + zone.dy * STEP, radius, tuning.height - radius);
  }

  if (player.invulnFrames > 0) player.invulnFrames--;
  if (player.cooldownFrames > 0) player.cooldownFrames--;

  if (!input.sting || !world.loadout.needle || player.cooldownFrames > 0) return;

  const target = nearestEnemy(world);
  let dx = 0;
  let dy = -1;
  if (target) {
    const length = Math.hypot(target.x - player.x, target.y - player.y) || 1;
    dx = (target.x - player.x) / length;
    dy = (target.y - player.y) / length;
  }

  const speed = tuning.bullet.speed;
  spawnBullet(world, player.x + dx * radius, player.y + dy * radius, dx * speed, dy * speed);
  player.cooldownFrames = tuning.bullet.cooldownFrames;
}

function stepBullets(world: World): void {
  for (const bullet of world.bullets) {
    if (!bullet.alive) continue;

    bullet.x += bullet.vx * STEP;
    bullet.y += bullet.vy * STEP;
    bullet.life--;

    if (
      bullet.life <= 0 ||
      bullet.x < -bullet.radius ||
      bullet.x > world.tuning.width + bullet.radius ||
      bullet.y < -bullet.radius ||
      bullet.y > world.tuning.height + bullet.radius
    ) {
      bullet.alive = false;
    }
  }
}

function stepEnemies(world: World): void {
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    if (enemy.burnCd > 0) enemy.burnCd--;

    if (enemy.duelist) {
      duelStep(world, enemy);
      continue;
    }

    enemy.x += enemy.vx * STEP;
    enemy.y += enemy.vy * STEP;

    if (enemy.x < enemy.radius || enemy.x > world.tuning.width - enemy.radius) {
      enemy.vx = -enemy.vx;
      enemy.x = clamp(enemy.x, enemy.radius, world.tuning.width - enemy.radius);
    }
    if (enemy.y < enemy.radius || enemy.y > world.tuning.height - enemy.radius) {
      enemy.vy = -enemy.vy;
      enemy.y = clamp(enemy.y, enemy.radius, world.tuning.height - enemy.radius);
    }
  }
}

function collide(world: World): void {
  const { player, tuning } = world;

  for (const bullet of world.bullets) {
    if (!bullet.alive) continue;

    for (const enemy of world.enemies) {
      if (!enemy.alive) continue;

      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const reach = bullet.radius + enemy.radius;
      if (dx * dx + dy * dy > reach * reach) continue;

      if (!bullet.pierce) bullet.alive = false;
      enemy.hp -= enemy.mode === 'recover' ? tuning.bullet.damage * 2 : tuning.bullet.damage;
      enemy.vx += bullet.vx * KNOCKBACK;
      enemy.vy += bullet.vy * KNOCKBACK;
      if (enemy.enraged && enemy.hp > 0) {
        const speed = Math.hypot(enemy.vx, enemy.vy);
        if (speed > 0 && speed < 400) {
          enemy.vx *= 1.15;
          enemy.vy *= 1.15;
        }
      }

      if (enemy.hp <= 0) {
        enemy.alive = false;
        world.score += enemy.score;
        if (enemy.marked) {
          world.events.push({ tick: world.tick, type: 'slain', id: enemy.kind });
        }
      } else if (enemy.duelist && !enemy.winged && enemy.hp <= enemy.maxHp / 2) {
        enemy.winged = true;
        world.clipped = true;
        world.events.push({ tick: world.tick, type: 'winged', id: enemy.kind });
      }
      break;
    }
  }

  if (!player.alive || player.invulnFrames > 0) return;

  for (const enemy of world.enemies) {
    if (!enemy.alive || enemy.harmless) continue;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const reach = tuning.player.radius + enemy.radius;
    if (distance > reach) {
      if (distance <= reach + GRAZE_EXTRA && world.slowmoFrames <= 0) {
        world.slowmoFrames = SLOWMO_FRAMES;
      }
      continue;
    }

    enemy.alive = false;
    hurtPlayer(world);
    dropCarry(world);
    if (!player.alive || player.invulnFrames > 0) return;
    break;
  }

  if (!player.alive || player.invulnFrames > 0) return;

  for (const hazard of world.hazards) {
    if (!hazardActive(hazard, world.tick)) continue;
    const dx = player.x - hazard.x;
    const dy = player.y - hazard.y;
    if (dx * dx + dy * dy > (tuning.player.radius + hazard.r) ** 2) continue;
    hurtPlayer(world);
    dropCarry(world);
    break;
  }

  for (const enemy of world.enemies) {
    if (!enemy.alive || enemy.burnCd > 0) continue;
    for (const hazard of world.hazards) {
      if (!hazardActive(hazard, world.tick)) continue;
      const dx = enemy.x - hazard.x;
      const dy = enemy.y - hazard.y;
      const reach = enemy.radius + hazard.r;
      if (dx * dx + dy * dy > reach * reach) continue;
      enemy.hp -= 1;
      enemy.burnCd = 20;
      if (enemy.hp <= 0) {
        enemy.alive = false;
        world.score += enemy.score;
        if (enemy.marked) {
          world.events.push({ tick: world.tick, type: 'slain', id: enemy.kind });
        }
      }
      break;
    }
  }

  if (player.alive) {
    for (const shard of world.shards) {
      if (shard.taken) continue;
      const dx = player.x - shard.x;
      const dy = player.y - shard.y;
      const reach = tuning.player.radius + shard.r;
      if (dx * dx + dy * dy > reach * reach) continue;

      if (shard.martyr) {
        detonateMartyr(world, shard);
        continue;
      }
      if (shard.fuse >= 0) {
        if (shard.fuseLeft < 0) shard.fuseLeft = shard.fuse;
        continue;
      }
      if (shard.escort) {
        shard.escorting = true;
        continue;
      }
      if (shard.carry) {
        if (world.carried !== null) continue;
        world.carried = shard.id;
        world.events.push({ tick: world.tick, type: 'carry', id: shard.id });
        continue;
      }

      takeShard(world, shard);
    }

    if (world.carried !== null) {
      for (const spot of world.dropoffs) {
        const dx = player.x - spot.x;
        const dy = player.y - spot.y;
        if (dx * dx + dy * dy > (tuning.player.radius + spot.r) ** 2) continue;
        const shard = world.shards.find((s) => s.id === world.carried);
        world.carried = null;
        if (shard && !shard.taken) {
          takeShard(world, shard);
          world.events.push({ tick: world.tick, type: 'deliver', id: shard.id });
        }
        break;
      }
    }

    for (const shard of world.shards) {
      if (shard.taken || !shard.escorting) continue;
      for (const exit of world.exits) {
        const dx = player.x - exit.x;
        const dy = player.y - exit.y;
        if (dx * dx + dy * dy > (tuning.player.radius + exit.r) ** 2) continue;
        shard.escorting = false;
        takeShard(world, shard);
        world.events.push({ tick: world.tick, type: 'deliver', id: shard.id });
        break;
      }
    }
  }
}

/** The cannon dive: everything burns, Gali falls, the run is won. */
function detonateMartyr(world: World, shard: Shard): void {
  shard.taken = true;
  world.events.push({ tick: world.tick, type: 'martyr', id: shard.id });
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    enemy.alive = false;
    world.score += enemy.score;
    if (enemy.marked) {
      world.events.push({ tick: world.tick, type: 'slain', id: enemy.kind });
    }
  }
  world.carried = null;
  world.player.alive = false;
  world.outcome = 'won';
}

/** A hit drops whatever Gali carries at the impact point. */
function dropCarry(world: World): void {
  if (world.carried !== null) {
    const shard = world.shards.find((s) => s.id === world.carried);
    world.carried = null;
    if (shard && !shard.taken) {
      shard.x = world.player.x;
      shard.y = world.player.y;
    }
  }
  for (const shard of world.shards) {
    if (shard.escorting && !shard.taken) shard.escorting = false;
  }
}

function takeShard(world: World, shard: Shard): void {
  shard.taken = true;
  world.swift = Math.min(world.swift + 1, SWIFT_CAP);
  if (world.shardsUsed < world.shardSlots) {
    world.shardsUsed++;
    world.score += world.tuning.shardScore ?? 250;
  }
  world.events.push({ tick: world.tick, type: 'shard', id: shard.id });
}

function hurtPlayer(world: World): void {
  const { player, tuning } = world;

  if (world.loadout.armor && !world.armorSpent) {
    world.armorSpent = true;
  } else {
    world.lives--;
    if (world.lives <= 0) {
      world.lives = 0;
      player.alive = false;
      world.outcome = 'lost';
    }
  }
  player.invulnFrames = tuning.player.invulnFrames;
}

/** Needle-duel brain: stalk, telegraph, dash, recover. Pure timers. */
function duelStep(world: World, enemy: Enemy): void {
  const speed = world.tuning.enemies[enemy.kind].speed;
  enemy.modeT--;

  if (enemy.mode === 'stalk') {
    const dx = world.player.x - enemy.x;
    const dy = world.player.y - enemy.y;
    const d = Math.hypot(dx, dy) || 1;
    enemy.vx = (dx / d) * speed;
    enemy.vy = (dy / d) * speed;
    enemy.x += enemy.vx * STEP;
    enemy.y += enemy.vy * STEP;
    if (enemy.modeT <= 0) {
      enemy.mode = 'windup';
      enemy.modeT = DUEL_WINDUP;
      enemy.vx = 0;
      enemy.vy = 0;
    }
    return;
  }

  if (enemy.mode === 'windup') {
    if (enemy.modeT <= 0) {
      const dx = world.player.x - enemy.x;
      const dy = world.player.y - enemy.y;
      const d = Math.hypot(dx, dy) || 1;
      enemy.vx = (dx / d) * speed * DUEL_DASH_MULT;
      enemy.vy = (dy / d) * speed * DUEL_DASH_MULT;
      enemy.mode = 'dash';
      enemy.modeT = DUEL_DASH;
    }
    return;
  }

  if (enemy.mode === 'dash') {
    enemy.x += enemy.vx * STEP;
    enemy.y += enemy.vy * STEP;
    if (enemy.modeT <= 0) {
      enemy.vx *= 0.2;
      enemy.vy *= 0.2;
      enemy.mode = 'recover';
      enemy.modeT = DUEL_RECOVER;
    }
    return;
  }

  enemy.vx *= 0.95;
  enemy.vy *= 0.95;
  enemy.x += enemy.vx * STEP;
  enemy.y += enemy.vy * STEP;
  if (enemy.modeT <= 0) {
    enemy.mode = 'stalk';
    enemy.modeT = DUEL_STALK;
  }
}

function stepHazards(world: World): void {
  const spanX = world.tuning.width + 200;
  const spanY = world.tuning.height + 200;
  for (const hazard of world.hazards) {
    if (hazard.vx === 0 && hazard.vy === 0) continue;
    hazard.x += hazard.vx * STEP;
    hazard.y += hazard.vy * STEP;
    if (hazard.x > world.tuning.width + 100) hazard.x -= spanX;
    if (hazard.x < -100) hazard.x += spanX;
    if (hazard.y > world.tuning.height + 100) hazard.y -= spanY;
    if (hazard.y < -100) hazard.y += spanY;
  }
}

export const ESCORT_SPEED = 200;

function stepShards(world: World): void {  for (const shard of world.shards) {
    if (shard.taken) continue;
    if (shard.escorting) {
      const dx = world.player.x - shard.x;
      const dy = world.player.y - shard.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 26) {
        const pull = Math.min(distance - 20, ESCORT_SPEED * STEP);
        shard.x += (dx / distance) * pull;
        shard.y += (dy / distance) * pull;
      }
      continue;
    }
    const dx = world.player.x - shard.x;
    const dy = world.player.y - shard.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0 || distance > MAGNET_RADIUS) continue;
    const pull = Math.min(distance, MAGNET_SPEED * STEP);
    shard.x += (dx / distance) * pull;
    shard.y += (dy / distance) * pull;
  }
}

function stepFuses(world: World): void {
  for (const shard of world.shards) {
    if (shard.taken || shard.fuseLeft < 0) continue;
    shard.fuseLeft--;
    if (shard.fuseLeft > 0) continue;
    takeShard(world, shard);
    world.events.push({ tick: world.tick, type: 'detonate', id: shard.id });
  }
}

export function stepWorld(world: World, input: SimInput): void {
  if (world.outcome !== 'running') return;

  world.tick++;
  if (world.slowmoFrames > 0) world.slowmoFrames--;
  fixToArray(world, input);
  stepBullets(world);
  stepEnemies(world);
  stepHazards(world);
  stepShards(world);
  stepFuses(world);
  collide(world);

  world.runFrames++;

  if (world.outcome === 'running' && world.runFrames >= world.runFramesMax) {
    world.player.alive = false;
    world.outcome = 'won';
  }
}

export interface AdvanceResult {
  acc: number;
  steps: number;
}

/** Fixed-step accumulator, clamped so a stalled tab cannot fast-forward. */
export function advance(world: World, input: SimInput, dt: number, acc: number): AdvanceResult {
  let next = Math.min(acc + Math.max(0, dt), MAX_FRAME_DELTA);
  let steps = 0;

  while (next >= STEP && steps < MAX_STEPS) {
    stepWorld(world, input);
    next -= STEP;
    steps++;
  }

  return { acc: next, steps };
}

const OUTCOME_CODE: Record<Outcome, number> = { running: 0, won: 1, lost: 2 };

/** Replay/render independent fingerprint used by determinism tests. */
export function hashWorld(world: World): string {
  const q = (value: number) => Math.round(value * 1000);
  const parts: number[] = [
    world.tick,
    world.runFrames,
    world.score,
    world.lives,
    world.rng,
    OUTCOME_CODE[world.outcome],
    world.player.alive ? 1 : 0,
    q(world.player.x),
    q(world.player.y),
    world.player.invulnFrames,
    world.player.cooldownFrames
  ];

  for (const enemy of world.enemies) {
    parts.push(enemy.alive ? 1 : 0, KIND_ORDER.indexOf(enemy.kind), q(enemy.x), q(enemy.y), enemy.hp);
    parts.push(enemy.mode === 'stalk' ? 0 : enemy.mode === 'windup' ? 1 : enemy.mode === 'dash' ? 2 : 3, enemy.modeT);
  }
  for (const bullet of world.bullets) {
    parts.push(
      bullet.alive ? 1 : 0,
      bullet.pierce ? 1 : 0,
      q(bullet.x),
      q(bullet.y),
      bullet.life
    );
  }
  parts.push(world.paranoia, world.armorSpent ? 1 : 0, world.slowmoFrames, world.shardSlots, world.shardsUsed, world.events.length);
  parts.push(world.clipped ? 1 : 0);
  parts.push(world.swift, world.carried ? world.carried.length : 0);
  if (world.carried) {
    for (const char of world.carried) parts.push(char.charCodeAt(0));
  }
  for (const shard of world.shards) {
    parts.push(shard.taken ? 1 : 0, shard.fuseLeft, shard.escorting ? 1 : 0);
  }
  for (const enemy of world.enemies) {
    parts.push(enemy.burnCd);
  }
  for (const shard of world.shards) {
    parts.push(shard.taken ? 1 : 0);
  }
  for (const hazard of world.hazards) {
    parts.push(q(hazard.x), q(hazard.y));
  }

  let hash = 0x811c9dc5;
  for (const part of parts) {
    hash ^= part | 0;
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}
