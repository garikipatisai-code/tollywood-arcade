import { describe, expect, it } from 'vitest';
import { MOODS, MusicEngine, composeBar, midiToFreq } from '../../src/core/music';

describe('generative music', () => {
  it('covers every chapter plus sabotage', () => {
    for (const id of ['sabotage', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8']) {
      const mood = MOODS[id];
      expect(mood.bpm).toBeGreaterThanOrEqual(80);
      expect(mood.scale.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('composes the same bar twice', () => {
    const a = composeBar(7, 12, MOODS.ch4, 0.5);
    const b = composeBar(7, 12, MOODS.ch4, 0.5);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('stays inside the scale', () => {
    const mood = MOODS.ch6;
    for (const note of composeBar(3, 40, mood, 1)) {
      if (note.kind !== 'arp') continue;
      const offset = (((note.midi - mood.root - 12) % 12) + 12) % 12;
      expect(mood.scale).toContain(offset);
    }
  });

  it('thickens with heat', () => {
    const calm = composeBar(9, 5, MOODS.ch5, 0);
    const panic = composeBar(9, 5, MOODS.ch5, 1);
    expect(panic.filter((n) => n.kind === 'arp').length).toBeGreaterThanOrEqual(
      calm.filter((n) => n.kind === 'arp').length
    );
  });

  it('tunes A4 to 440 Hz', () => {
    expect(midiToFreq(69)).toBeCloseTo(440);
  });

  it('stays stopped without an audio device', () => {
    const engine = new MusicEngine(MOODS.ch1);
    expect(engine.running).toBe(false);
  });
});
