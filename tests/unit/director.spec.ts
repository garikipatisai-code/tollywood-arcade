import { describe, expect, it } from 'vitest';
import { createWorld, stepWorld, type Tuning } from '../../src/engines/shooter/sim';
import { createDirector, stepDirector, type WaveEvent } from '../../src/engines/shooter/director';

const tuning: Tuning = {
  width: 200,
  height: 300,
  runSeconds: 90,
  player: { speed: 120, radius: 6, lives: 3, invulnFrames: 30 },
  bullet: { speed: 600, radius: 3, lifeFrames: 60, cooldownFrames: 6, damage: 1 },
  enemies: {
    swatter: { hp: 1, radius: 8, speed: 40, score: 10 },
    spray: { hp: 1, radius: 8, speed: 40, score: 20 },
    spider: { hp: 2, radius: 8, speed: 20, score: 30 },
    boss: { hp: 8, radius: 14, speed: 12, score: 500 }
  },
  pools: { enemies: 16, bullets: 16 }
};

const events: WaveEvent[] = [
  { atSeconds: 0, kind: 'swatter', count: 2, pattern: 'top' },
  { atSeconds: 60, kind: 'boss', count: 1, pattern: 'top' }
];

describe('wave director', () => {
  it('fires events once, in order', () => {
    const world = createWorld(1, tuning);
    const director = createDirector(events);

    stepDirector(world, director);
    expect(director.spawned).toBe(2);
    expect(director.nextIndex).toBe(1);

    stepDirector(world, director);
    expect(director.spawned).toBe(2);

    world.lives = 999;

    for (let i = 0; i < 3600; i++) {
      stepWorld(world, { x: 0, y: 0, sting: false });
      stepDirector(world, director);
    }

    expect(director.nextIndex).toBe(2);
    expect(director.spawned).toBe(3);
  });

  it('spawns inside the playfield', () => {
    const world = createWorld(2, tuning);
    const director = createDirector(events);
    stepDirector(world, director);

    for (const enemy of world.enemies.filter((candidate) => candidate.alive)) {
      expect(enemy.x).toBeGreaterThanOrEqual(0);
      expect(enemy.x).toBeLessThanOrEqual(tuning.width);
      expect(enemy.y).toBeGreaterThanOrEqual(0);
      expect(enemy.y).toBeLessThanOrEqual(tuning.height);
    }
  });

  it('is deterministic per seed', () => {
    const a = createWorld(9, tuning);
    const b = createWorld(9, tuning);
    const da = createDirector(events);
    const db = createDirector(events);

    stepDirector(a, da);
    stepDirector(b, db);

    expect(a.enemies.map((enemy) => [enemy.alive, enemy.x, enemy.y])).toEqual(
      b.enemies.map((enemy) => [enemy.alive, enemy.x, enemy.y])
    );
  });
});
