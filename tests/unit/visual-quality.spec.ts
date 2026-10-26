import { describe, expect, it } from 'vitest';
import { QUALITY, initialTier, loadQuality, nextTier, pickTier } from '../../src/core/quality';

describe('quality tiers', () => {
  it('orders particle budgets downward', () => {
    expect(QUALITY.high.particles).toBe(1);
    expect(QUALITY.medium.particles).toBeLessThan(1);
    expect(QUALITY.low.particles).toBeLessThan(QUALITY.medium.particles);
    expect(QUALITY.low.glows).toBe(false);
    expect(QUALITY.low.zoomPunches).toBe(false);
  });

  it('picks tiers from fps', () => {
    expect(pickTier(60)).toBe('high');
    expect(pickTier(40)).toBe('medium');
    expect(pickTier(20)).toBe('low');
  });

  it('caps weak devices', () => {
    expect(pickTier(60, 2)).toBe('low');
    expect(pickTier(60, 4)).toBe('medium');
    expect(pickTier(60, 8)).toBe('high');
  });

  it('cycles tiers manually', () => {
    expect(nextTier('high')).toBe('medium');
    expect(nextTier('medium')).toBe('low');
    expect(nextTier('low')).toBe('high');
  });

  it('defaults to high without storage', () => {
    expect(loadQuality()).toBe('high');
    expect(initialTier()).toBe('high');
  });
});
