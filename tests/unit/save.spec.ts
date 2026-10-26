import { describe, expect, it } from 'vitest';
import {
  SAVE_KEY,
  defaultSave,
  loadSave,
  parseSave,
  persistSave,
  withBest,
  withLang,
  withMuted
} from '../../src/core/save';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('save', () => {
  it('returns defaults when nothing is stored', () => {
    const save = loadSave(new MemoryStorage());
    expect(save).toEqual(defaultSave());
    expect(save.lang).toBe('en');
    expect(save.muted).toBe(false);
    expect(save.best).toEqual({});
  });

  it('migrates the legacy v0 shape to v2', () => {
    const legacy = JSON.stringify({ language: 'te', muted: true, highScore: 900 });
    const save = parseSave(legacy);
    expect(save.v).toBe(2);
    expect(save.lang).toBe('te');
    expect(save.muted).toBe(true);
    expect(save.best.egara).toBe(900);
    expect(save.chapters).toEqual({});
    expect(save.amulet).toBe(false);
  });

  it('survives corrupt JSON', () => {
    expect(parseSave('{not json')).toEqual(defaultSave());
    expect(parseSave('null')).toEqual(defaultSave());
    expect(parseSave('"text"')).toEqual(defaultSave());
  });

  it('drops unknown languages and negative scores', () => {
    const raw = JSON.stringify({ v: 1, lang: 'xx', muted: 'yes', best: { egara: -5 } });
    const save = parseSave(raw);
    expect(save.lang).toBe('en');
    expect(save.muted).toBe(false);
    expect(save.best).toEqual({});
  });

  it('round-trips through storage', () => {
    const storage = new MemoryStorage();
    const save = withBest(withLang(withMuted(defaultSave(), true), 'te'), 'egara', 321);
    persistSave(save, storage);
    expect(storage.getItem(SAVE_KEY)).toBeTruthy();
    expect(loadSave(storage)).toEqual(save);
  });

  it('keeps the highest score only', () => {
    const once = withBest(defaultSave(), 'egara', 100);
    const lower = withBest(once, 'egara', 50);
    const higher = withBest(lower, 'egara', 300);
    expect(lower.best.egara).toBe(100);
    expect(higher.best.egara).toBe(300);
  });

  it('does not mutate the input when updating', () => {
    const base = defaultSave();
    withLang(base, 'te');
    expect(base.lang).toBe('en');
  });
});
