import type { Lang } from './i18n';

export interface SaveData {
  v: 1;
  lang: Lang;
  muted: boolean;
  best: Record<string, number>;
  remaps: Record<string, string[]>;
}

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const SAVE_KEY = 'tollywood-arcade.save';

export function defaultSave(): SaveData {
  return { v: 1, lang: 'en', muted: false, best: {}, remaps: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toLang(value: unknown): Lang {
  if (value === 'te' || value === 'telugu') return 'te';
  return 'en';
}

function toScoreMap(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};

  const scores: Record<string, number> = {};
  for (const [game, score] of Object.entries(value)) {
    if (typeof score === 'number' && Number.isFinite(score) && score >= 0) {
      scores[game] = Math.floor(score);
    }
  }
  return scores;
}

function toRemaps(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) return {};

  const remaps: Record<string, string[]> = {};
  for (const [action, keys] of Object.entries(value)) {
    if (Array.isArray(keys) && keys.every((key) => typeof key === 'string')) {
      remaps[action] = [...keys];
    }
  }
  return remaps;
}

function fromLegacy(raw: Record<string, unknown>): SaveData {
  const save = defaultSave();
  save.lang = toLang(raw.language ?? raw.lang);
  save.muted = raw.muted === true;

  if (typeof raw.highScore === 'number' && Number.isFinite(raw.highScore) && raw.highScore >= 0) {
    save.best.egara = Math.floor(raw.highScore);
  }
  return save;
}

/** Pure, tolerant parser: bad or old data never throws and never bricks a run. */
export function parseSave(raw: string | null): SaveData {
  if (!raw) return defaultSave();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultSave();
  }

  if (!isRecord(parsed)) return defaultSave();

  if (parsed.v === 1) {
    const save = defaultSave();
    save.lang = toLang(parsed.lang);
    save.muted = parsed.muted === true;
    save.best = toScoreMap(parsed.best);
    save.remaps = toRemaps(parsed.remaps);
    return save;
  }

  if ('language' in parsed || 'highScore' in parsed) {
    return fromLegacy(parsed);
  }

  return defaultSave();
}

export function loadSave(storage?: StorageLike): SaveData {
  try {
    const store = storage ?? globalThis.localStorage;
    return parseSave(store.getItem(SAVE_KEY));
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: SaveData, storage?: StorageLike): void {
  try {
    const store = storage ?? globalThis.localStorage;
    store.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // Private mode or a full quota: the game keeps running unsaved.
  }
}

export function withLang(save: SaveData, lang: Lang): SaveData {
  return { ...save, lang };
}

export function withMuted(save: SaveData, muted: boolean): SaveData {
  return { ...save, muted };
}

export function withBest(save: SaveData, game: string, score: number): SaveData {
  if (!Number.isFinite(score) || score < 0) return save;

  const next = Math.floor(score);
  const current = save.best[game] ?? 0;
  if (next <= current) return save;

  return { ...save, best: { ...save.best, [game]: next } };
}

export function withRemap(save: SaveData, action: string, keys: string[]): SaveData {
  return { ...save, remaps: { ...save.remaps, [action]: [...keys] } };
}
