import { describe, expect, it } from 'vitest';
import {
  createWorld,
  hashWorld,
  placeShards,
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

describe('crash scene mechanics', () => {
  it('retakes a respawning shard, then takes it finally', () => {
    const world = createWorld(111, tuning);
    world.shardSlots = 8;
    placeShards(world, [{ id: 'eye', x: world.player.x, y: world.player.y, respawns: 2 }]);
    stepWorld(world, idle);
    expect(world.shards[0].taken).toBe(false);
    expect(world.shards[0].respawns).toBe(1);
    expect(world.score).toBe(0);

    for (let i = 0; i < 89; i++) stepWorld(world, idle);
    expect(world.shards[0].taken).toBe(false);
    stepWorld(world, idle);
    expect(world.shards[0].respawns).toBe(0);
    expect(world.shards[0].taken).toBe(false);

    for (let i = 0; i < 90; i++) stepWorld(world, idle);
    stepWorld(world, idle);
    expect(world.shards[0].taken).toBe(true);
    expect(world.score).toBe(250);
  });

  it('enforces gate order', () => {
    const shut = createWorld(112, tuning);
    shut.shardSlots = 8;
    placeShards(shut, [{ id: 'b', x: shut.player.x, y: shut.player.y, lockedBy: 'a' }]);
    for (let i = 0; i < 10; i++) stepWorld(shut, idle);
    expect(shut.shards[0].taken).toBe(false);

    const open = createWorld(112, tuning);
    open.shardSlots = 8;
    placeShards(open, [
      { id: 'a', x: open.player.x, y: open.player.y },
      { id: 'b', x: open.player.x, y: open.player.y, lockedBy: 'a' }
    ]);
    stepWorld(open, idle);
    expect(open.shards.every((s) => s.taken)).toBe(true);
  });

  it('stays deterministic with retakes and locks', () => {
    const make = () => {
      const world = createWorld(113, tuning);
      placeShards(world, [
        { id: 'eye', x: 100, y: 100, respawns: 2 },
        { id: 'l1', x: 150, y: 150, lockedBy: 'eye' }
      ]);
      world.shardSlots = 8;
      return world;
    };
    const a = make();
    const b = make();
    for (let i = 0; i < 200; i++) {
      const input = { x: i % 2 === 0 ? 1 : 0, y: 0, sting: false };
      stepWorld(a, input);
      stepWorld(b, input);
    }
    expect(hashWorld(a)).toBe(hashWorld(b));
  });
});
