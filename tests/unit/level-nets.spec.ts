import { describe, expect, it } from 'vitest';
import {
  createWorld,
  hashWorld,
  placeSlowZones,
  stepWorld,
  type SimInput,
  type Tuning
} from '../../src/engines/shooter/sim';

const tuning: Tuning = {
  width: 400,
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

const right: SimInput = { x: 1, y: 0, sting: false };

describe('fume slow zones', () => {
  it('scales input speed by the zone factor', () => {
    const free = createWorld(71, tuning);
    const slow = createWorld(71, tuning);
    placeSlowZones(slow, [{ id: 'fume', x: 200, y: 150, r: 400, factor: 0.5 }]);
    for (let i = 0; i < 60; i++) {
      stepWorld(free, right);
      stepWorld(slow, right);
    }
    expect(slow.player.x).toBeLessThan(free.player.x);
    expect(slow.player.x - 200).toBeCloseTo((free.player.x - 200) * 0.5, 0);
  });

  it('stacks overlapping zones by the minimum factor', () => {
    const world = createWorld(72, tuning);
    placeSlowZones(world, [
      { id: 'a', x: 200, y: 150, r: 400, factor: 0.5 },
      { id: 'b', x: 200, y: 150, r: 400, factor: 0.25 }
    ]);
    const before = world.player.x;
    for (let i = 0; i < 60; i++) stepWorld(world, right);
    expect(world.player.x - before).toBeCloseTo(120 * 0.25, 0);
  });

  it('ignores movement outside zones', () => {
    const world = createWorld(73, tuning);
    placeSlowZones(world, [{ id: 'far', x: 0, y: 0, r: 10, factor: 0.1 }]);
    const before = world.player.x;
    for (let i = 0; i < 60; i++) stepWorld(world, right);
    expect(world.player.x - before).toBeCloseTo(120, 0);
  });

  it('stays deterministic', () => {
    const make = () => {
      const world = createWorld(74, tuning);
      placeSlowZones(world, [{ id: 'f', x: 200, y: 150, r: 150, factor: 0.45 }]);
      return world;
    };
    const a = make();
    const b = make();
    for (let i = 0; i < 300; i++) {
      stepWorld(a, right);
      stepWorld(b, right);
    }
    expect(hashWorld(a)).toBe(hashWorld(b));
  });
});
