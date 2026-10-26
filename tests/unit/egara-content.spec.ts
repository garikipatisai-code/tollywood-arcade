import { describe, expect, it } from 'vitest';
import { createDirector, stepDirector } from '../../src/engines/shooter/director';
import { createWorld, stepWorld } from '../../src/engines/shooter/sim';
import { EGARA_TUNING, EGARA_WAVES } from '../../src/games/egara/content';

const idle = { x: 0, y: 0, sting: false };

describe('Egara content', () => {
  it('finishes every wave before the run ends', () => {
    const last = Math.max(...EGARA_WAVES.map((wave) => wave.atSeconds));
    expect(last).toBeLessThan(EGARA_TUNING.runSeconds);
  });

  it('has a boss at 60 seconds', () => {
    const boss = EGARA_WAVES.find((wave) => wave.kind === 'boss');
    expect(boss).toBeDefined();
    expect(boss!.atSeconds).toBe(60);
  });

  it('spawns the whole slate without dropping any enemy', () => {
    const world = createWorld(11, EGARA_TUNING);
    const director = createDirector(EGARA_WAVES);
    world.lives = 999;

    const frames = EGARA_TUNING.runSeconds * 60 + 2;
    for (let i = 0; i < frames; i++) {
      stepWorld(world, idle);
      stepDirector(world, director);
    }

    const expected = EGARA_WAVES.reduce((total, wave) => total + wave.count, 0);
    expect(director.spawned).toBe(expected);
    expect(director.dropped).toBe(0);
    expect(world.outcome).toBe('won');
  });
});
