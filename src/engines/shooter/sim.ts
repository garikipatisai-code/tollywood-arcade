export const STEP = 1 / 60;
export const MAX_STEPS = 5;
export const MAX_FRAME_DELTA = 0.25;

export type EnemyKind = 'swatter' | 'spray' | 'spider' | 'boss';
export type Outcome = 'running' | 'won' | 'lost';

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
}

export interface Bullet {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  radius: number;
}

export interface Player {
  x: number;
  y: number;
  alive: boolean;
  invulnFrames: number;
  cooldownFrames: number;
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
    score: 0
  };
}

function emptyBullet(): Bullet {
  return { alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, radius: 0 };
}

export function createWorld(seed: number, tuning: Tuning): World {
  return {
    tuning,
    seed,
    rng: (seed >>> 0) || 0x9e3779b9,
    tick: 0,
    runFrames: 0,
    runFramesMax: Math.round(tuning.runSeconds * 60),
    score: 0,
    lives: tuning.player.lives,
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
  vy = 0
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
  slot.hp = stats.hp;
  slot.radius = stats.radius;
  slot.score = stats.score;
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

  player.x = clamp(player.x + input.x * tuning.player.speed * STEP, radius, tuning.width - radius);
  player.y = clamp(player.y + input.y * tuning.player.speed * STEP, radius, tuning.height - radius);

  if (player.invulnFrames > 0) player.invulnFrames--;
  if (player.cooldownFrames > 0) player.cooldownFrames--;

  if (!input.sting || player.cooldownFrames > 0) return;

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

      bullet.alive = false;
      enemy.hp -= tuning.bullet.damage;

      if (enemy.hp <= 0) {
        enemy.alive = false;
        world.score += enemy.score;
      }
      break;
    }
  }

  if (!player.alive || player.invulnFrames > 0) return;

  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const reach = tuning.player.radius + enemy.radius;
    if (dx * dx + dy * dy > reach * reach) continue;

    enemy.alive = false;
    world.lives--;
    player.invulnFrames = tuning.player.invulnFrames;

    if (world.lives <= 0) {
      world.lives = 0;
      player.alive = false;
      world.outcome = 'lost';
    }
    break;
  }
}

export function stepWorld(world: World, input: SimInput): void {
  if (world.outcome !== 'running') return;

  world.tick++;
  fixToArray(world, input);
  stepBullets(world);
  stepEnemies(world);
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
  }
  for (const bullet of world.bullets) {
    parts.push(bullet.alive ? 1 : 0, q(bullet.x), q(bullet.y), bullet.life);
  }

  let hash = 0x811c9dc5;
  for (const part of parts) {
    hash ^= part | 0;
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}
