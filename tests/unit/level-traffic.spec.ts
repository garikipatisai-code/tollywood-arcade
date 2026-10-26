import { describe, expect, it } from 'vitest';
import {
  createWorld,
  hazardActive,
  hashWorld,
  placeHazards,
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

describe('traffic hazards', () => {
  it('moves hazards by velocity each step', () => {
    const world = createWorld(61, tuning);
    placeHazards(world, [{ id: 'car', x: 0, y: 150, r: 20, vx: 120 }]);
    for (let i = 0; i < 30; i++) stepWorld(world, idle);
    expect(world.hazards[0].x).toBeCloseTo(60, 0);
  });

  it('wraps hazards around the extended bounds', () => {
    const world = createWorld(62, tuning);
    placeHazards(world, [{ id: 'car', x: 295, y: 150, r: 10, vx: 600 }]);
    stepWorld(world, idle);
    expect(world.hazards[0].x).toBeLessThan(0);
    for (let i = 0; i < 60; i++) stepWorld(world, idle);
    expect(world.hazards[0].x).toBeGreaterThanOrEqual(-100);
    expect(world.hazards[0].x).toBeLessThanOrEqual(tuning.width + 100);
  });

  it('still wounds on contact while moving', () => {
    const world = createWorld(63, tuning);
    placeHazards(world, [{ id: 'car', x: world.player.x, y: world.player.y, r: 30, vx: 50 }]);
    stepWorld(world, idle);
    expect(world.lives).toBe(2);
  });

  it('guards patrol, wrap and wound', () => {
    const world = createWorld(65, tuning);
    placeHazards(world, [{ id: 'guard', x: 0, y: 150, r: 22, vx: 120, kind: 'guard' }]);
    expect(world.hazards[0].kind).toBe('guard');
    for (let i = 0; i < 30; i++) stepWorld(world, idle);
    expect(world.hazards[0].x).toBeCloseTo(60, 0);

    const victim = createWorld(66, tuning);
    placeHazards(victim, [{ id: 'guard', x: victim.player.x, y: victim.player.y, r: 30, kind: 'guard' }]);
    stepWorld(victim, idle);
    expect(victim.lives).toBe(2);
  });

  it('keeps blink behavior on moving hazards', () => {
    expect(hazardActive({ period: 60, on: 30 }, 10)).toBe(true);
    expect(hazardActive({ period: 60, on: 30 }, 45)).toBe(false);
  });

  it('stays deterministic with traffic', () => {
    const make = () => {
      const world = createWorld(64, tuning);
      placeHazards(world, [
        { id: 'a', x: 0, y: 100, r: 20, vx: 130 },
        { id: 'b', x: 200, y: 200, r: 20, vx: -160, period: 90, on: 45 }
      ]);
      return world;
    };
    const a = make();
    const b = make();
    for (let i = 0; i < 300; i++) {
      stepWorld(a, idle);
      stepWorld(b, idle);
    }
    expect(hashWorld(a)).toBe(hashWorld(b));
  });
});
