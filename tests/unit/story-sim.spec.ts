import { describe, expect, it } from 'vitest';
import { createDirector, stepDirector } from '../../src/engines/shooter/director';
import {
  createWorld,
  hashWorld,
  placeShards,
  setParanoia,
  setShardSlots,
  spawnEnemy,
  stepWorld,
  type Tuning
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
    boss: { hp: 8, radius: 14, speed: 12, score: 500 }
  },
  pools: { enemies: 16, bullets: 16 }
};

const idle = { x: 0, y: 0, sting: false };

describe('story sim inputs', () => {
  it('scores shard pickups only while slots remain', () => {
    const world = createWorld(41, tuning, { needle: false, armor: false, cannon: false });
    setShardSlots(world, 1);
    placeShards(world, [
      { id: 'a', x: world.player.x, y: world.player.y },
      { id: 'b', x: world.player.x, y: world.player.y }
    ]);
    stepWorld(world, idle);
    expect(world.events).toHaveLength(2);
    expect(world.shardsUsed).toBe(1);
    expect(world.score).toBe(250);
  });

  it('stays deterministic with slots, hazards and shards combined', () => {
    const make = () => {
      const world = createWorld(42, tuning, { needle: true, armor: false, cannon: true });
      setParanoia(world, 75);
      return world;
    };
    const a = make();
    const b = make();
    for (let i = 0; i < 200; i++) {
      const input = { x: i % 2 === 0 ? 1 : 0, y: 0, sting: i % 4 === 0 };
      stepWorld(a, input);
      stepWorld(b, input);
    }
    expect(hashWorld(a)).toBe(hashWorld(b));
  });

  it('spawns at least twice as many enemies at paranoia 100 as at 0', () => {
    const waves = [{ atSeconds: 0, kind: 'swatter' as const, count: 2, pattern: 'top' as const }];

    const calm = createWorld(5, tuning);
    const calmDirector = createDirector(waves);
    stepDirector(calm, calmDirector);

    const panic = createWorld(5, tuning);
    setParanoia(panic, 100);
    const panicDirector = createDirector(waves);
    stepDirector(panic, panicDirector);

    expect(calmDirector.spawned).toBe(2);
    expect(panicDirector.spawned).toBeGreaterThanOrEqual(4);
  });

  it('clamps paranoia to 0-100', () => {
    const world = createWorld(1, tuning);
    setParanoia(world, 250);
    expect(world.paranoia).toBe(100);
    setParanoia(world, -10);
    expect(world.paranoia).toBe(0);
  });

  it('fires no bullets without the needle unlock', () => {
    const world = createWorld(3, tuning, { needle: false, armor: false, cannon: false });
    for (let i = 0; i < 10; i++) stepWorld(world, { x: 0, y: 0, sting: true });
    expect(world.bullets.filter((b) => b.alive).length).toBe(0);
  });

  it('armor absorbs one hit without losing a life', () => {
    const world = createWorld(4, tuning, { needle: false, armor: true, cannon: false });
    spawnEnemy(world, 'swatter', world.player.x, world.player.y);
    stepWorld(world, idle);

    expect(world.lives).toBe(3);
    expect(world.armorSpent).toBe(true);

    world.player.invulnFrames = 0;
    spawnEnemy(world, 'swatter', world.player.x, world.player.y);
    stepWorld(world, idle);
    expect(world.lives).toBe(2);
  });

  it('cannon shots pierce instead of dying on first kill', () => {
    const plain = createWorld(6, tuning, { needle: true, armor: false, cannon: false });
    const piercing = createWorld(6, tuning, { needle: true, armor: false, cannon: true });

    for (const world of [plain, piercing]) {
      spawnEnemy(world, 'swatter', world.player.x, world.player.y - 60);
      stepWorld(world, { x: 0, y: 0, sting: true });
    }

    for (let i = 0; i < 11; i++) {
      stepWorld(plain, idle);
      stepWorld(piercing, idle);
    }

    expect(plain.enemies[0].alive).toBe(false);
    expect(plain.bullets.filter((b) => b.alive).length).toBe(0);
    expect(piercing.enemies[0].alive).toBe(false);
    expect(piercing.bullets.filter((b) => b.alive).length).toBe(1);
  });

  it('emits a shard event on pickup', () => {
    const world = createWorld(7, tuning);
    placeShards(world, [{ id: 's1', x: world.player.x, y: world.player.y }]);
    stepWorld(world, idle);

    expect(world.shards[0].taken).toBe(true);
    expect(world.events).toContainEqual({ tick: 1, type: 'shard', id: 's1' });
  });

  it('emits an objective event per fired wave', () => {
    const world = createWorld(8, tuning);
    const director = createDirector([
      { atSeconds: 0, kind: 'swatter', count: 1, pattern: 'top' }
    ]);
    stepDirector(world, director);

    expect(world.events).toContainEqual({ tick: 0, type: 'objective', id: 'wave-0' });
  });
});
