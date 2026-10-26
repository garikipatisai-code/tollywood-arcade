import type { Director, SpawnPattern, WaveEvent } from '../../engines/shooter/director';
import type { EnemyKind, Hazard, Loadout, SlowZone, Tuning, WindZone, World } from '../../engines/shooter/sim';
import raw from './tuning.json';
import ch1 from './chapters/ch1.json';
import ch2 from './chapters/ch2.json';
import ch3 from './chapters/ch3.json';
import ch4 from './chapters/ch4.json';
import ch5 from './chapters/ch5.json';
import ch6 from './chapters/ch6.json';
import ch7 from './chapters/ch7.json';
import ch8 from './chapters/ch8.json';
import cut1 from './cutscenes/ch1.json';
import cut2 from './cutscenes/ch2.json';
import cut3 from './cutscenes/ch3.json';
import cut4 from './cutscenes/ch4.json';
import cut5 from './cutscenes/ch5.json';
import cut6 from './cutscenes/ch6.json';
import cut7 from './cutscenes/ch7.json';
import cut8 from './cutscenes/ch8.json';

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
  wind: WindZone[];
  slow: SlowZone[];
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
    wind: (((c as Record<string, unknown>).wind ?? []) as Omit<WindZone, 'period' | 'on'>[]).map(
      (zone) => ({ period: 0, on: 0, ...zone })
    ),
    slow: (((c as Record<string, unknown>).slow ?? []) as SlowZone[]).map((zone) => ({ ...zone })),
    hazards: (
      ((c as Record<string, unknown>).hazards ?? []) as Omit<Hazard, 'period' | 'on' | 'vx' | 'vy' | 'kind'>[]
    ).map((hazard) => ({ period: 0, on: 0, vx: 0, vy: 0, kind: 'ring' as const, ...hazard }))
  };
}

export const CHAPTERS: Chapter[] = [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8].map(toChapter);

export type CutMood = 'dawn' | 'ember' | 'night' | 'toxic' | 'gloom' | 'teal';

export interface CutPanel {
  img: string | null;
  mood: CutMood;
  caption: string;
}

export interface Cutscene {
  id: string;
  panels: CutPanel[];
}

/** Vendor art allowed in comic panels (key → path under assets/vendor/kenney). */
export const CUT_ART: Record<string, string> = {
  'cloud-1': 'bg/cloud1.png',
  'cloud-2': 'bg/cloud2.png',
  'cloud-3': 'bg/cloud3.png',
  'cloud-4': 'bg/cloud4.png',
  'grass-1': 'bg/grass1.png',
  'tree-3': 'bg/tree03.png',
  'tree-4': 'bg/tree04.png',
  'castle-grey': 'bg/castle_grey.png',
  'castle-beige': 'bg/castle_beige.png',
  'glow-light': 'particles/light_01.png',
  'glow-flame': 'particles/flame_01.png'
};

const CUT_MOODS: CutMood[] = ['dawn', 'ember', 'night', 'toxic', 'gloom', 'teal'];

export const CUTSCENES: Cutscene[] = [cut1, cut2, cut3, cut4, cut5, cut6, cut7, cut8].map(
  (raw) => ({
    id: String((raw as Record<string, unknown>).id ?? ''),
    panels: ((raw as Record<string, unknown>).panels ?? []) as CutPanel[]
  })
);

/** Schema check for cutscene data. Empty list = valid. */
export function validateCutscene(raw: unknown): string[] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return ['cutscene must be an object'];
  }
  const cut = raw as Partial<Cutscene>;
  const errors: string[] = [];
  if (!cut.id) errors.push('id is required');
  if (!Array.isArray(cut.panels) || cut.panels.length < 2 || cut.panels.length > 4) {
    errors.push(`${cut.id || '?'}: panels must number 2-4`);
    return errors;
  }
  cut.panels.forEach((panel, index) => {
    const at = `${cut.id || '?'} panel ${index}`;
    if (!panel || typeof panel !== 'object') {
      errors.push(`${at}: must be an object`);
      return;
    }
    if (panel.img !== null && !(panel.img in CUT_ART)) errors.push(`${at}: unknown art ${panel.img}`);
    if (!CUT_MOODS.includes(panel.mood)) errors.push(`${at}: bad mood ${panel.mood}`);
    if (typeof panel.caption !== 'string' || !/^cut\.ch\d+\.p\d+$/.test(panel.caption)) {
      errors.push(`${at}: bad caption key ${panel.caption}`);
    }
  });
  return errors;
}

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
    if (hazard && hazard.kind !== undefined && hazard.kind !== 'ring' && hazard.kind !== 'car' && hazard.kind !== 'guard') {
      errors.push(`hazard ${hazard.id} needs a known kind`);
    }
    if (
      hazard &&
      ((hazard.vx !== undefined && !Number.isFinite(hazard.vx)) ||
        (hazard.vy !== undefined && !Number.isFinite(hazard.vy)) ||
        Math.abs(hazard.vx ?? 0) > 600 ||
        Math.abs(hazard.vy ?? 0) > 600)
    ) {
      errors.push(`hazard ${hazard.id} needs a sane velocity`);
    }
  }

  for (const zone of chapter.wind ?? []) {
    if (!zone || typeof zone.id !== 'string' || !Number.isFinite(zone.x) || !Number.isFinite(zone.y)) {
      errors.push('wind zones need id, x, y');
    }
    if (!zone || !Number.isFinite(zone.r) || zone.r <= 0 || zone.r > 600) {
      errors.push(`wind ${zone?.id} needs a sane radius`);
    }
    if (!zone || !Number.isFinite(zone.dx) || !Number.isFinite(zone.dy) || Math.hypot(zone.dx, zone.dy) > 400) {
      errors.push(`wind ${zone?.id} needs a sane force`);
    }
  }

  for (const zone of chapter.slow ?? []) {
    if (!zone || typeof zone.id !== 'string' || !Number.isFinite(zone.x) || !Number.isFinite(zone.y)) {
      errors.push('slow zones need id, x, y');
    }
    if (!zone || !Number.isFinite(zone.r) || zone.r <= 0 || zone.r > 600) {
      errors.push(`slow ${zone?.id} needs a sane radius`);
    }
    if (!zone || !Number.isFinite(zone.factor) || zone.factor < 0.1 || zone.factor > 0.9) {
      errors.push(`slow ${zone?.id} needs a factor 0.1-0.9`);
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
