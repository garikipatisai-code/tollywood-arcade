import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BINDINGS,
  applyDeadzone,
  bindingsFrom,
  mergeAxes,
  pointerAxis,
  resolveAction
} from '../../src/core/input';

describe('input', () => {
  it('resolves default keys', () => {
    expect(resolveAction('ArrowLeft', DEFAULT_BINDINGS)).toBe('left');
    expect(resolveAction('Space', DEFAULT_BINDINGS)).toBe('sting');
    expect(resolveAction('Escape', DEFAULT_BINDINGS)).toBe('pause');
  });

  it('prefers a remapped key over the default', () => {
    const bindings = bindingsFrom({ left: ['KeyA'], sting: ['KeyJ'] });
    expect(resolveAction('KeyA', bindings)).toBe('left');
    expect(resolveAction('KeyJ', bindings)).toBe('sting');
    expect(resolveAction('ArrowLeft', bindings)).toBe('left');
  });

  it('returns null for unbound keys', () => {
    expect(resolveAction('KeyZ', DEFAULT_BINDINGS)).toBeNull();
  });

  it('zeroes the axis inside the deadzone', () => {
    expect(applyDeadzone({ x: 0.1, y: -0.1 }, 0.25)).toEqual({ x: 0, y: 0 });
  });

  it('rescales just outside the deadzone', () => {
    const out = applyDeadzone({ x: 0.5, y: 0 }, 0.25);
    expect(out.x).toBeGreaterThan(0);
    expect(out.x).toBeLessThan(0.5);
    expect(out.y).toBe(0);
  });

  it('sums devices and clamps to unit length', () => {
    const merged = mergeAxes([
      { x: 1, y: 0 },
      { x: 1, y: 0 }
    ]);
    expect(merged.x).toBeCloseTo(1);
    expect(Math.hypot(merged.x, merged.y)).toBeCloseTo(1);
  });

  it('keeps small combined axes intact', () => {
    const merged = mergeAxes([
      { x: 0.2, y: 0 },
      { x: 0.3, y: 0.1 }
    ]);
    expect(merged.x).toBeCloseTo(0.5);
    expect(merged.y).toBeCloseTo(0.1);
  });

  it('turns a pointer drag into a clamped axis', () => {
    const out = pointerAxis(30, -40, 50);
    expect(out.x).toBeCloseTo(0.6);
    expect(out.y).toBeCloseTo(-0.8);
    expect(pointerAxis(0, 0, 50)).toEqual({ x: 0, y: 0 });
    expect(pointerAxis(500, 0, 50).x).toBe(1);
  });
});
