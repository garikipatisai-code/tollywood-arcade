import type { Director, SpawnPattern, WaveEvent } from '../../engines/shooter/director';
import type { EnemyKind, Hazard, Loadout, Tuning, World } from '../../engines/shooter/sim';
import raw from './tuning.json';
import ch1 from './chapters/ch1.json';
import ch2 from './chapters/ch2.json';
import ch3 from './chapters/ch3.json';
import ch4 from './chapters/ch4.json';
import ch5 from './chapters/ch5.json';
import ch6 from './chapters/ch6.json';
import ch7 from './chapters/ch7.json';
import ch8 from './chapters/ch8.json';

export const EGARA_TUNING: Tuning = raw;

export const EGARA_WAVES: WaveEvent[] = raw.waves.map((wave) => ({
  atSeconds: wave.atSeconds,
  count: wave.count,
  kind: wave.kind as EnemyKind,
  pattern: wave.pattern as SpawnPattern
}));

export type { SimInput } from '../../engines/shooter/sim';

export interface ChapterShard {
  id: string;
  x: number;
  y: number;
}

export interface Chapter {
  id: string;
  nameKey: string;
  goalKey: string;
  paranoia: number;
  loadout: Loadout;
  timeSeconds: number;
  minFrames: number;
  /** Escape chapters complete at this frame without clearing enemies. */
  escapeAfter?: number;
  /** Optional sprite tint for chapter identity (0xffffff = unchanged). */
  tint?: number;
  requiredShards: string[];
  waves: WaveEvent[];
  shards: ChapterShard[];
  hazards: Hazard[];
}

const ENEMY_KINDS: EnemyKind[] = ['swatter', 'spray', 'spider', 'boss'];
const PATTERNS: SpawnPattern[] = ['top', 'sides', 'random'];

function toChapter(rawChapter: unknown): Chapter {
  const c = rawChapter as Record<string, never>;
  return {
    id: String((c as Record<string, unknown>).id ?? ''),
    nameKey: String((c as Record<string, unknown>).nameKey ?? ''),
    goalKey: String((c as Record<string, unknown>).goalKey ?? ''),
    paranoia: Number((c as Record<string, unknown>).paranoia ?? 0),
    loadout: (c as Record<string, unknown>).loadout as Loadout,
    timeSeconds: Number((c as Record<string, unknown>).timeSeconds ?? 0),
    minFrames: Number((c as Record<string, unknown>).minFrames ?? 0),
    escapeAfter:
      (c as Record<string, unknown>).escapeAfter === undefined
        ? undefined
        : Number((c as Record<string, unknown>).escapeAfter),
    tint:
      (c as Record<string, unknown>).tint === undefined
        ? undefined
        : Number((c as Record<string, unknown>).tint),
    requiredShards: ((c as Record<string, unknown>).requiredShards ?? []) as string[],
    waves: ((c as Record<string, unknown>).waves ?? []) as WaveEvent[],
    shards: ((c as Record<string, unknown>).shards ?? []) as ChapterShard[],
    hazards: (((c as Record<string, unknown>).hazards ?? []) as Omit<Hazard, 'period' | 'on'>[]).map(
      (hazard) => ({ period: 0, on: 0, ...hazard })
    )
  };
}

export const CHAPTERS: Chapter[] = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8].map(toChapter);

/** Schema check for chapter data. Returns a list of problems, empty when valid. */
export function validateChapter(raw: unknown): string[] {
  const errors: string[] = [];
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return ['chapter must be an object'];
  }
  const chapter = toChapter(raw);

  if (!chapter.id) errors.push('id is required');
  if (!/^story\.ch\d+\.name$/.test(chapter.nameKey)) errors.push(`bad nameKey ${chapter.nameKey}`);
  if (!/^story\.ch\d+\.goal$/.test(chapter.goalKey)) errors.push(`bad goalKey ${chapter.goalKey}`);
  if (!Number.isFinite(chapter.paranoia) || chapter.paranoia < 0 || chapter.paranoia > 100) {
    errors.push('paranoia must be 0-100');
  }
  for (const key of ['needle', 'armor', 'cannon'] as const) {
    if (typeof chapter.loadout?.[key] !== 'boolean') errors.push(`loadout.${key} must be boolean`);
  }
  if (!Number.isFinite(chapter.timeSeconds) || chapter.timeSeconds <= 0) {
    errors.push('timeSeconds must be positive');
  }
  if (!Number.isFinite(chapter.minFrames) || chapter.minFrames < 0) {
    errors.push('minFrames must be non-negative');
  }

  const shardIds = new Set<string>();
  for (const shard of chapter.shards ?? []) {
    if (!shard || typeof shard.id !== 'string' || !Number.isFinite(shard.x) || !Number.isFinite(shard.y)) {
      errors.push('shards need id, x, y');
      continue;
    }
    shardIds.add(shard.id);
  }
  for (const id of chapter.requiredShards ?? []) {
    if (!shardIds.has(id)) errors.push(`required shard ${id} is not placed`);
  }

  if (
    chapter.escapeAfter !== undefined &&
    (!Number.isFinite(chapter.escapeAfter) ||
      chapter.escapeAfter < 0 ||
      chapter.escapeAfter > chapter.timeSeconds * 60)
  ) {
    errors.push('escapeAfter must fit the time budget');
  }

  if (
    chapter.tint !== undefined &&
    (!Number.isInteger(chapter.tint) || chapter.tint < 0 || chapter.tint > 0xffffff)
  ) {
    errors.push('tint must be a hex color');
  }

  for (const hazard of chapter.hazards ?? []) {
    if (!hazard || typeof hazard.id !== 'string' || !Number.isFinite(hazard.x) || !Number.isFinite(hazard.y)) {
      errors.push('hazards need id, x, y');
    }
    if (!hazard || !Number.isFinite(hazard.r) || hazard.r <= 0) {
      errors.push(`hazard ${hazard?.id} needs a positive radius`);
    }
    if (!hazard || !Number.isFinite(hazard.period) || hazard.period < 0 || !Number.isFinite(hazard.on) || hazard.on < 0) {
      errors.push(`hazard ${hazard?.id} needs a valid blink cycle`);
    }
  }

  const budget = chapter.timeSeconds * 60;
  for (const wave of chapter.waves ?? []) {
    if (!wave || !ENEMY_KINDS.includes(wave.kind)) errors.push(`bad enemy kind ${wave?.kind}`);
    if (!wave || !PATTERNS.includes(wave.pattern)) errors.push(`bad pattern ${wave?.pattern}`);
    if (!wave || !Number.isFinite(wave.count) || wave.count < 1 || wave.count > 8) {
      errors.push('wave count must be 1-8');
    }
    if (
      wave?.hp !== undefined &&
      (!Number.isInteger(wave.hp) || wave.hp < 1 || wave.hp > 50)
    ) {
      errors.push('wave hp override must be 1-50');
    }
    if (!wave || !Number.isFinite(wave.atSeconds) || wave.atSeconds < 0 || wave.atSeconds * 60 > budget) {
      errors.push(`wave at ${wave?.atSeconds}s exceeds the time budget`);
    }
  }

  return errors;
}

export type ChapterState = 'running' | 'complete';

/** Pure completion predicate: time served, waves fired, skies clear, shards held. */
export function chapterStatus(world: World, director: Director, chapter: Chapter): ChapterState {
  if (world.runFrames < chapter.minFrames) return 'running';
  if (chapter.escapeAfter !== undefined && world.runFrames >= chapter.escapeAfter) {
    return shardsHeld(world, chapter) ? 'complete' : 'running';
  }
  if (director.nextIndex < director.events.length) return 'running';
  if (world.enemies.some((enemy) => enemy.alive)) return 'running';
  return shardsHeld(world, chapter) ? 'complete' : 'running';
}

function shardsHeld(world: World, chapter: Chapter): boolean {
  for (const id of chapter.requiredShards) {
    const shard = world.shards.find((s) => s.id === id);
    if (!shard?.taken) return false;
  }
  return true;
}
