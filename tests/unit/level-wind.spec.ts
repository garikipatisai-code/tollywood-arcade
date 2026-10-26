import { describe, expect, it } from 'vitest';
import {
  createWorld,
  hashWorld,
  placeWindZones,
  stepWorld,
  type SimInput,
  type Tuning
} from '../../src/engines/shooter/sim';

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

const idle: SimInput = { x: 0, y: 0, sting: false };

describe('wind zones', () => {
  it('pushes an idle player downwind', () => {
    const world = createWorld(51, tuning);
    const startX = world.player.x;
    placeWindZones(world, [{ id: 'gust', x: world.player.x, y: world.player.y, r: 100, dx: 90, dy: 0 }]);
    for (let i = 0; i < 60; i++) stepWorld(world, idle);
    expect(world.player.x).toBeGreaterThan(startX + 60);
    expect(world.player.y).toBeCloseTo(278, 0);
  });

  it('obeys blink periods', () => {
    const on = createWorld(52, tuning);
    const off = createWorld(52, tuning);
    placeWindZones(on, [{ id: 'g', x: 100, y: 278, r: 200, dx: 90, dy: 0, period: 120, on: 60 }]);
    placeWindZones(off, [{ id: 'g', x: 100, y: 278, r: 200, dx: 90, dy: 0, period: 120, on: 0 }]);
    for (let i = 0; i < 60; i++) {
      stepWorld(on, idle);
      stepWorld(off, idle);
    }
    expect(on.player.x).toBeGreaterThan(off.player.x);
  });

  it('clamps drift inside the playfield', () => {
    const world = createWorld(53, tuning);
    placeWindZones(world, [{ id: 'g', x: 100, y: 150, r: 400, dx: 900, dy: 900 }]);
    for (let i = 0; i < 600; i++) stepWorld(world, idle);
    expect(world.player.x).toBeLessThanOrEqual(tuning.width - tuning.player.radius);
    expect(world.player.y).toBeLessThanOrEqual(tuning.height - tuning.player.radius);
  });

  it('stays deterministic', () => {
    const make = () => {
      const world = createWorld(54, tuning);
      placeWindZones(world, [{ id: 'g', x: 100, y: 150, r: 150, dx: 70, dy: -30, period: 90, on: 45 }]);
      return world;
    };
    const a = make();
    const b = make();
    for (let i = 0; i < 300; i++) {
      const input = { x: i % 3 === 0 ? 1 : 0, y: 0, sting: false };
      stepWorld(a, input);
      stepWorld(b, input);
    }
    expect(hashWorld(a)).toBe(hashWorld(b));
  });
});
