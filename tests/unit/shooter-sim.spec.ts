import { describe, expect, it } from 'vitest';
import {
  advance,
  createWorld,
  hashWorld,
  spawnEnemy,
  stepWorld,
  type SimInput,
  type Tuning,
  type World
} from '../../src/engines/shooter/sim';

const tuning: Tuning = {
  width: 200,
  height: 300,
  runSeconds: 90,
  player: { speed: 120, radius: 6, lives: 3, invulnFrames: 30 },
  bullet: { speed: 600, radius: 3, lifeFrames: 60, cooldownFrames: 1, damage: 1 },
  enemies: {
    swatter: { hp: 1, radius: 8, speed: 40, score: 10 },
    spray: { hp: 1, radius: 8, speed: 40, score: 20 },
    spider: { hp: 2, radius: 8, speed: 20, score: 30 },
    boss: { hp: 5, radius: 12, speed: 15, score: 500 }
  },
  pools: { enemies: 8, bullets: 64 }
};

const idle: SimInput = { x: 0, y: 0, sting: false };

function run(world: World, frames: number, input: SimInput = idle): void {
  for (let i = 0; i < frames; i++) stepWorld(world, input);
}

describe('shooter sim', () => {
  it('is deterministic for the same seed and input log', () => {
    const inputs: SimInput[] = Array.from({ length: 400 }, (_, i) => ({
      x: i % 7 === 0 ? 1 : i % 11 === 0 ? -1 : 0,
      y: 0,
      sting: i % 3 === 0
    }));

    const a = createWorld(42, tuning);
    const b = createWorld(42, tuning);
    inputs.forEach((input) => {
      stepWorld(a, input);
      stepWorld(b, input);
    });

    expect(hashWorld(a)).toBe(hashWorld(b));
    expect(a).not.toBe(b);
  });

  it('diverges when inputs differ', () => {
    const a = createWorld(42, tuning);
    const b = createWorld(42, tuning);
    run(a, 120, { x: 1, y: 0, sting: true });
    run(b, 120, { x: -1, y: 0, sting: false });
    expect(hashWorld(a)).not.toBe(hashWorld(b));
  });

  it('clamps the accumulator and never spirals', () => {
    const world = createWorld(1, tuning);
    const result = advance(world, idle, 1, 0);
    expect(result.steps).toBeLessThanOrEqual(5);
    expect(result.acc).toBeLessThanOrEqual(0.25);
  });

  it('keeps pools fixed instead of growing', () => {
    const world = createWorld(7, tuning);
    run(world, 200, { x: 0, y: 0, sting: true });
    expect(world.bullets).toHaveLength(tuning.pools.bullets);
    expect(world.enemies).toHaveLength(tuning.pools.enemies);
    expect(world.bullets.filter((b) => b.alive).length).toBeLessThanOrEqual(tuning.pools.bullets);
  });

  it('reuses dead bullets', () => {
    const world = createWorld(7, tuning);
    run(world, 2, { x: 0, y: 0, sting: true });
    const first = world.bullets.find((b) => b.alive);
    expect(first).toBeDefined();

    first!.alive = false;
    run(world, 2, { x: 0, y: 0, sting: true });

    const reused = world.bullets.filter((b) => b.alive);
    expect(reused.length).toBeGreaterThan(0);
  });

  it('scores a kill and removes the enemy', () => {
    const world = createWorld(3, tuning);
    const enemy = spawnEnemy(world, 'swatter', world.player.x, world.player.y - 60);
    expect(enemy).not.toBeNull();

    run(world, 30, { x: 0, y: 0, sting: true });

    expect(enemy!.alive).toBe(false);
    expect(world.score).toBe(tuning.enemies.swatter.score);
  });

  it('takes a life on contact and grants invulnerability', () => {
    const world = createWorld(5, tuning);
    spawnEnemy(world, 'spider', world.player.x, world.player.y);

    stepWorld(world, idle);
    expect(world.lives).toBe(2);
    expect(world.player.invulnFrames).toBeGreaterThan(0);

    stepWorld(world, idle);
    expect(world.lives).toBe(2);

    world.player.invulnFrames = 0;
    spawnEnemy(world, 'spider', world.player.x, world.player.y);
    stepWorld(world, idle);
    expect(world.lives).toBe(1);
  });

  it('stops the run at the frame budget', () => {
    const world = createWorld(9, { ...tuning, runSeconds: 1 });
    run(world, 61);
    expect(world.runFrames).toBeGreaterThanOrEqual(60);
    expect(world.player.alive).toBe(false);
  });
});
