import { describe, expect, it } from 'vitest';
import {
  createWorld,
  hashWorld,
  placeExits,
  placeHazards,
  placeShards,
  setShardSlots,
  spawnEnemy,
  stepWorld,
  type SimInput,
  type Tuning
} from '../../src/engines/shooter/sim';

const tuning: Tuning = {
  width: 400,
  height: 300,
  runSeconds: 90,
  player: { speed: 120, radius: 6, lives: 3, invulnFrames: 30 },
  bullet: { speed: 600, radius: 3, lifeFrames: 60, cooldownFrames: 1, damage: 1 },
  enemies: {
    swatter: { hp: 1, radius: 8, speed: 40, score: 10 },
    spray: { hp: 1, radius: 8, speed: 40, score: 20 },
    spider: { hp: 2, radius: 8, speed: 20, score: 30 },
    boss: { hp: 8, radius: 14, speed: 12, score: 500 }
  },
  pools: { enemies: 16, bullets: 16 }
};

const idle: SimInput = { x: 0, y: 0, sting: false };
const right: SimInput = { x: 1, y: 0, sting: false };

describe('screenplay verbs batch 2', () => {
  it('arms a fuse on touch and detonates for score', () => {
    const world = createWorld(91, tuning);
    setShardSlots(world, 8);
    placeShards(world, [{ id: 'cash', x: world.player.x, y: world.player.y, fuse: 180 }]);
    stepWorld(world, idle);
    expect(world.shards[0].taken).toBe(false);
    expect(world.shards[0].fuseLeft).toBe(180);
    for (let i = 0; i < 180; i++) stepWorld(world, idle);
    expect(world.shards[0].taken).toBe(true);
    expect(world.score).toBe(250);
    expect(world.events.some((e) => e.type === 'detonate' && e.id === 'cash')).toBe(true);
  });

  it('burns enemies standing in active rings', () => {
    const world = createWorld(92, tuning);
    spawnEnemy(world, 'boss', 200, 150);
    placeHazards(world, [{ id: 'ring', x: 200, y: 150, r: 40 }]);
    for (let i = 0; i < 60; i++) stepWorld(world, idle);
    expect(world.enemies[0].hp).toBeLessThan(8);
    expect(world.enemies[0].hp).toBeGreaterThanOrEqual(8 - 3);
  });

  it('escorts follow and deliver at exits', () => {
    const world = createWorld(93, tuning);
    setShardSlots(world, 8);
    placeShards(world, [{ id: 'shilpi', x: world.player.x, y: world.player.y, escort: true }]);
    placeExits(world, [{ id: 'window', x: world.player.x + 120, y: world.player.y, r: 20 }]);
    stepWorld(world, idle);
    expect(world.shards[0].taken).toBe(false);

    for (let i = 0; i < 30; i++) stepWorld(world, right);
    const trailing = Math.hypot(
      world.shards[0].x - world.player.x,
      world.shards[0].y - world.player.y
    );
    expect(trailing).toBeLessThan(120);
    for (let i = 0; i < 60; i++) stepWorld(world, right);
    expect(world.shards[0].taken).toBe(true);
    expect(world.events.some((e) => e.type === 'deliver' && e.id === 'shilpi')).toBe(true);
  });

  it('martyrs blast everything and win', () => {
    const world = createWorld(94, tuning, { needle: true, armor: false, cannon: true });
    spawnEnemy(world, 'swatter', 50, 50);
    spawnEnemy(world, 'spider', 300, 100);
    placeShards(world, [{ id: 'cannon', x: world.player.x, y: world.player.y, martyr: true }]);
    stepWorld(world, idle);
    expect(world.outcome).toBe('won');
    expect(world.player.alive).toBe(false);
    expect(world.enemies.every((e) => !e.alive)).toBe(true);
    expect(world.score).toBe(10 + 30);
    expect(world.events.some((e) => e.type === 'martyr')).toBe(true);
  });

  it('enrages bosses as they bleed', () => {
    const world = createWorld(95, tuning, { needle: true, armor: false, cannon: false });
    spawnEnemy(world, 'spider', world.player.x, world.player.y - 60, 40, 0, undefined, { enraged: true });
    const calm = createWorld(95, tuning, { needle: true, armor: false, cannon: false });
    spawnEnemy(calm, 'spider', calm.player.x, calm.player.y - 60, 40, 0);
    stepWorld(world, { x: 0, y: 0, sting: true });
    stepWorld(calm, { x: 0, y: 0, sting: true });
    for (let i = 0; i < 11; i++) {
      stepWorld(world, idle);
      stepWorld(calm, idle);
    }
    expect(world.enemies[0].hp).toBe(1);
    expect(world.enemies[0].vx).toBeGreaterThan(calm.enemies[0].vx);
  });

  it('stays deterministic with batch 2 combined', () => {
    const make = () => {
      const world = createWorld(96, tuning, { needle: true, armor: false, cannon: true });
      placeShards(world, [
        { id: 'f', x: 100, y: 100, fuse: 120 },
        { id: 'e', x: 150, y: 150, escort: true }
      ]);
      placeExits(world, [{ id: 'x', x: 350, y: 150, r: 20 }]);
      placeHazards(world, [{ id: 'r', x: 200, y: 200, r: 40 }]);
      spawnEnemy(world, 'boss', 200, 200, 30, 0, undefined, { enraged: true });
      setShardSlots(world, 8);
      return world;
    };
    const a = make();
    const b = make();
    for (let i = 0; i < 200; i++) {
      const input = { x: i % 2 === 0 ? 1 : 0, y: 0, sting: i % 5 === 0 };
      stepWorld(a, input);
      stepWorld(b, input);
    }
    expect(hashWorld(a)).toBe(hashWorld(b));
  });
});
