import { describe, expect, it } from 'vitest';
import {
  createDirector,
  stepDirector
} from '../../src/engines/shooter/director';
import {
  createWorld,
  hashWorld,
  placeDropoffs,
  placeShards,
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

describe('screenplay verbs batch 1', () => {
  it('carries a petal instead of taking it', () => {
    const world = createWorld(81, tuning);
    placeShards(world, [{ id: 'petal', x: world.player.x, y: world.player.y, carry: true }]);
    stepWorld(world, idle);
    expect(world.shards[0].taken).toBe(false);
    expect(world.carried).toBe('petal');
    expect(world.score).toBe(0);
    expect(world.events).toContainEqual({ tick: 1, type: 'carry', id: 'petal' });
  });

  it('delivers at a dropoff for score', () => {
    const world = createWorld(82, tuning);
    const px = world.player.x;
    placeShards(world, [{ id: 'petal', x: px, y: world.player.y, carry: true }]);
    placeDropoffs(world, [{ id: 'window', x: px + 100, y: world.player.y, r: 20 }]);
    setSlots(world);
    stepWorld(world, idle);
    expect(world.carried).toBe('petal');
    for (let i = 0; i < 60; i++) stepWorld(world, right);
    expect(world.shards[0].taken).toBe(true);
    expect(world.carried).toBeNull();
    expect(world.score).toBe(250);
    const deliver = world.events.find((e) => e.type === 'deliver');
    expect(deliver?.id).toBe('petal');
  });

  it('drops the carry when hurt', () => {
    const world = createWorld(83, tuning);
    placeShards(world, [{ id: 'petal', x: world.player.x, y: world.player.y, carry: true }]);
    stepWorld(world, idle);
    expect(world.carried).toBe('petal');
    spawnEnemy(world, 'swatter', world.player.x, world.player.y);
    stepWorld(world, idle);
    expect(world.lives).toBe(2);
    expect(world.carried).toBeNull();
    expect(world.shards[0].taken).toBe(false);
    expect(world.shards[0].x).toBeCloseTo(world.player.x, 0);
  });

  it('grows swifter with every shard, capped', () => {
    const capped = (n: number) => {
      const world = createWorld(84, tuning);
      for (let i = 0; i < n; i++) {
        placeShards(world, [{ id: `s${i}`, x: world.player.x, y: world.player.y }]);
        stepWorld(world, idle);
        world.shards.length = 0;
      }
      const before = world.player.x;
      for (let i = 0; i < 60; i++) stepWorld(world, right);
      return world.player.x - before;
    };
    const base = 120;
    expect(capped(0)).toBeCloseTo(base, 0);
    expect(capped(2)).toBeCloseTo(base * 1.24, 0);
    expect(capped(20)).toBeCloseTo(base * 1.6, 0);
  });

  it('harmless dummies never wound or graze', () => {
    const world = createWorld(85, tuning);
    spawnEnemy(world, 'spider', world.player.x, world.player.y, 0, 0, undefined, { harmless: true });
    stepWorld(world, idle);
    expect(world.lives).toBe(3);
    expect(world.slowmoFrames).toBe(0);

    const killer = createWorld(86, tuning, { needle: true, armor: false, cannon: false });
    spawnEnemy(killer, 'swatter', killer.player.x, killer.player.y - 60, 0, 0, undefined, { harmless: true });
    stepWorld(killer, { x: 0, y: 0, sting: true });
    for (let i = 0; i < 11; i++) stepWorld(killer, idle);
    expect(killer.enemies[0].alive).toBe(false);
  });

  it('emits a slain banner for marked kills only', () => {
    const target = createWorld(87, tuning, { needle: true, armor: false, cannon: false });
    spawnEnemy(target, 'swatter', target.player.x, target.player.y - 60, 0, 0, 1, { marked: true });
    expect(target.enemies[0].marked).toBe(true);
    stepWorld(target, { x: 0, y: 0, sting: true });
    for (let i = 0; i < 11; i++) stepWorld(target, idle);
    const slain = target.events.find((e) => e.type === 'slain');
    expect(slain?.id).toBe('swatter');

    const plain = createWorld(88, tuning, { needle: true, armor: false, cannon: false });
    spawnEnemy(plain, 'swatter', plain.player.x, plain.player.y - 60);
    stepWorld(plain, { x: 0, y: 0, sting: true });
    for (let i = 0; i < 11; i++) stepWorld(plain, idle);
    expect(plain.events.some((e) => e.type === 'slain')).toBe(false);
  });

  it('stays deterministic with verbs combined', () => {
    const make = () => {
      const world = createWorld(89, tuning, { needle: true, armor: false, cannon: false });
      placeShards(world, [{ id: 'p', x: 100, y: 100, carry: true }]);
      placeDropoffs(world, [{ id: 'd', x: 300, y: 100, r: 20 }]);
      setSlots(world);
      spawnEnemy(world, 'spider', 200, 200, 0, 0, undefined, { harmless: true });
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

function setSlots(world: ReturnType<typeof createWorld>): void {
  world.shardSlots = 8;
}
