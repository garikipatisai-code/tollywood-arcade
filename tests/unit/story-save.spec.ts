import { describe, expect, it } from 'vitest';
import {
  SAVE_KEY,
  defaultSave,
  loadSave,
  parseSave,
  withAmulet,
  withChapter,
  withShard,
  withUnlock
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

const V1_FIXTURE = JSON.stringify({
  v: 1,
  lang: 'te',
  muted: true,
  best: { egara: 900 },
  remaps: { sting: ['KeyJ'] }
});

describe('story saves', () => {
  it('defaults to a v2 save with empty story state', () => {
    const save = defaultSave();
    expect(save.v).toBe(2);
    expect(save.chapters).toEqual({});
    expect(save.shards).toEqual([]);
    expect(save.unlocks).toEqual({ needle: true, armor: false, cannon: false });
    expect(save.amulet).toBe(false);
  });

  it('migrates v1 without losing anything', () => {
    const save = parseSave(V1_FIXTURE);
    expect(save.v).toBe(2);
    expect(save.lang).toBe('te');
    expect(save.muted).toBe(true);
    expect(save.best).toEqual({ egara: 900 });
    expect(save.remaps).toEqual({ sting: ['KeyJ'] });
    expect(save.chapters).toEqual({});
    expect(save.shards).toEqual([]);
    expect(save.amulet).toBe(false);
  });

  it('migrates the legacy v0 shape', () => {
    const save = parseSave(JSON.stringify({ language: 'te', muted: true, highScore: 400 }));
    expect(save.v).toBe(2);
    expect(save.lang).toBe('te');
    expect(save.best.egara).toBe(400);
    expect(save.unlocks.needle).toBe(true);
  });

  it('survives corrupt data', () => {
    expect(parseSave('{nope')).toEqual(defaultSave());
    expect(parseSave('[]')).toEqual(defaultSave());
  });

  it('round-trips story state through storage', () => {
    const storage = new MemoryStorage();
    let save = defaultSave();
    save = withChapter(save, 'ch1', 1200);
    save = withShard(save, 'ch2-s1');
    save = withShard(save, 'ch2-s1');
    save = withUnlock(save, 'armor', true);
    save = withAmulet(save, true);
    storage.setItem(SAVE_KEY, JSON.stringify(save));

    const loaded = loadSave(storage);
    expect(loaded.chapters.ch1).toEqual({ unlocked: true, best: 1200 });
    expect(loaded.shards).toEqual(['ch2-s1']);
    expect(loaded.unlocks.armor).toBe(true);
    expect(loaded.amulet).toBe(true);
  });

  it('keeps the best chapter score only', () => {
    let save = withChapter(defaultSave(), 'ch1', 500);
    save = withChapter(save, 'ch1', 200);
    expect(save.chapters.ch1.best).toBe(500);
    save = withChapter(save, 'ch1', 900);
    expect(save.chapters.ch1.best).toBe(900);
  });

  it('does not mutate inputs', () => {
    const base = defaultSave();
    withUnlock(base, 'cannon', true);
    withShard(base, 'x');
    expect(base.unlocks.cannon).toBe(false);
    expect(base.shards).toEqual([]);
  });
});
