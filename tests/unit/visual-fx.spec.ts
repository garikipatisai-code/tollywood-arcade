import { describe, expect, it } from 'vitest';
import { FxPool } from '../../src/render/fx';

describe('fx pool', () => {
  it('caps particles at capacity and reuses dead slots', () => {
    const pool = new FxPool(4);
    for (let i = 0; i < 10; i++) pool.spawn('a', i, i, 0, 0, 1, 4);
    expect(pool.aliveCount).toBe(4);

    pool.update(1.1);
    expect(pool.aliveCount).toBe(0);

    pool.spawn('b', 1, 1, 0, 0, 1, 4);
    expect(pool.aliveCount).toBe(1);
  });

  it('decays life and applies gravity', () => {
    const pool = new FxPool(2);
    pool.spawn('a', 0, 0, 10, 0, 1, 4, 100);
    pool.update(0.5);
    const part = pool.parts[0];
    expect(part.alive).toBe(true);
    expect(part.x).toBeCloseTo(5);
    expect(part.vy).toBeCloseTo(50);
    pool.update(0.6);
    expect(part.alive).toBe(false);
  });

  it('bursts stay within budget', () => {
    const pool = new FxPool(160);
    pool.burst('a', 0, 0, 30, 200, 0.5, 8);
    expect(pool.aliveCount).toBe(30);
  });
});
