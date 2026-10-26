import { describe, expect, it } from 'vitest';
import { createDirector, stepDirector } from '../../src/engines/shooter/director';
import {
  createWorld,
  hashWorld,
  placeShards,
  spawnEnemy,
  stepWorld,
  type SimInput,
  type Tuning
} from '../../src/engines/shooter/sim';

const tuning: Tuning = {
  width: 600,
  height: 400,
  runSeconds: 90,
  player: { speed: 120, radius: 6, lives: 9, invulnFrames: 30 },
  bullet: { speed: 600, radius: 3, lifeFrames: 60, cooldownFrames: 1, damage: 1 },
  enemies: {
    swatter: { hp: 1, radius: 8, speed: 40, score: 10 },
    spray: { hp: 1, radius: 8, speed: 40, score: 20 },
    spider: { hp: 4, radius: 8, speed: 30, score: 30 },
    boss: { hp: 8, radius: 14, speed: 12, score: 500 }
  },
  pools: { enemies: 16, bullets: 16 }
};

const idle: SimInput = { x: 0, y: 0, sting: false };

function duelWorld() {
  const world = createWorld(101, tuning, { needle: true, armor: false, cannon: false });
  world.player.x = 100;
  world.player.y = 200;
  spawnEnemy(world, 'spider', 500, 200, 0, 0, undefined, { duelist: true });
  return world;
}

describe('needle duel', () => {
  it('cycles stalk, windup, dash, recover, stalk', () => {
    const world = duelWorld();
    expect(world.enemies[0].mode).toBe('stalk');

    for (let i = 0; i < 120; i++) stepWorld(world, idle);
    expect(world.enemies[0].mode).toBe('windup');
    expect(world.enemies[0].modeT).toBeLessThanOrEqual(40);
    const wx = world.enemies[0].vx;
    const wy = world.enemies[0].vy;
    expect(Math.hypot(wx, wy)).toBeCloseTo(0, 5);

    for (let i = 0; i < 40; i++) stepWorld(world, idle);
    expect(world.enemies[0].mode).toBe('dash');
    expect(Math.hypot(world.enemies[0].vx, world.enemies[0].vy)).toBeCloseTo(120, 0);

    for (let i = 0; i < 20; i++) stepWorld(world, idle);
    expect(world.enemies[0].mode).toBe('recover');

    for (let i = 0; i < 70; i++) stepWorld(world, idle);
    expect(world.enemies[0].mode).toBe('stalk');
  });

  it('stalks toward the player', () => {
    const world = duelWorld();
    const before = world.enemies[0].x;
    for (let i = 0; i < 60; i++) stepWorld(world, idle);
    expect(world.enemies[0].x).toBeLessThan(before);
  });

  it('deals double damage in recovery', () => {
    const soft = createWorld(102, tuning, { needle: true, armor: false, cannon: false });
    soft.player.x = 100;
    soft.player.y = 200;
    spawnEnemy(soft, 'spider', 100, 140, 0, 0, undefined, { duelist: true });
    soft.enemies[0].mode = 'recover';
    soft.enemies[0].modeT = 200;
    stepWorld(soft, { x: 0, y: 0, sting: true });
    stepWorld(soft, { x: 0, y: 0, sting: true });
    stepWorld(soft, { x: 0, y: 0, sting: true });
    for (let i = 0; i < 40; i++) stepWorld(soft, idle);
    expect(soft.enemies[0].alive).toBe(false);

    const hard = createWorld(103, tuning, { needle: true, armor: false, cannon: false });
    hard.player.x = 100;
    hard.player.y = 200;
    spawnEnemy(hard, 'spider', 100, 140, 0, 0, undefined, { harmless: true });
    hard.enemies[0].mode = 'stalk';
    hard.enemies[0].modeT = 1000;
    stepWorld(hard, { x: 0, y: 0, sting: true });
    stepWorld(hard, { x: 0, y: 0, sting: true });
    stepWorld(hard, { x: 0, y: 0, sting: true });
    for (let i = 0; i < 40; i++) stepWorld(hard, idle);
    expect(hard.enemies[0].alive).toBe(true);
    expect(hard.enemies[0].hp).toBe(1);
  });

  it('stays deterministic through duels', () => {
    const a = duelWorld();
    const b = duelWorld();
    for (let i = 0; i < 300; i++) {
      const input = { x: i % 2 === 0 ? 1 : 0, y: 0, sting: i % 4 === 0 };
      stepWorld(a, input);
      stepWorld(b, input);
    }
    expect(hashWorld(a)).toBe(hashWorld(b));
  });

  it('clips the wing at half health and slows Gali', () => {
    const world = createWorld(104, tuning, { needle: true, armor: false, cannon: false });
    world.player.x = 100;
    world.player.y = 200;
    spawnEnemy(world, 'spider', 100, 140, 0, 0, undefined, { duelist: true });
    const before = world.player.x;
    stepWorld(world, { x: 0, y: 0, sting: true });
    stepWorld(world, { x: 0, y: 0, sting: true });
    stepWorld(world, { x: 0, y: 0, sting: true });
    for (let i = 0; i < 40; i++) stepWorld(world, idle);
    expect(world.enemies[0].winged).toBe(true);
    expect(world.clipped).toBe(true);
    expect(world.events.some((e) => e.type === 'winged')).toBe(true);

    const from = world.player.x;
    for (let i = 0; i < 60; i++) stepWorld(world, { x: 1, y: 0, sting: false });
    expect(world.player.x - from).toBeCloseTo(120 * 0.75, 0);
    expect(before).toBe(100);
  });

  it('gates waves behind shard conditions', () => {
    const waves = [{ atSeconds: 0, kind: 'swatter' as const, count: 2, pattern: 'top' as const, after: 'gate' }];
    const shut = createWorld(105, tuning);
    placeShards(shut, [{ id: 'gate', x: 10, y: 10 }]);
    const shutDirector = createDirector(waves);
    for (let i = 0; i < 120; i++) {
      stepWorld(shut, idle);
      stepDirector(shut, shutDirector);
    }
    expect(shutDirector.spawned).toBe(0);

    const open = createWorld(105, tuning);
    placeShards(open, [{ id: 'gate', x: open.player.x, y: open.player.y }]);
    const openDirector = createDirector(waves);
    stepWorld(open, idle);
    stepDirector(open, openDirector);
    expect(openDirector.spawned).toBe(2);
  });
});
