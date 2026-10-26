import { describe, expect, it } from 'vitest';
import { createDirector, stepDirector } from '../../src/engines/shooter/director';
import {
  createWorld,
  hazardActive,
  placeHazards,
  placeShards,
  setParanoia,
  stepWorld,
  type SimInput
} from '../../src/engines/shooter/sim';
import {
  CHAPTERS,
  chapterStatus,
  validateChapter,
  type Chapter
} from '../../src/games/egara/content';
import { EGARA_TUNING } from '../../src/games/egara/content';

const idle: SimInput = { x: 0, y: 0, sting: false };

function nearestEnemy(world: ReturnType<typeof createWorld>): { x: number; y: number; d: number } | null {
  let best: { x: number; y: number; d: number } | null = null;
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    const d = Math.hypot(enemy.x - world.player.x, enemy.y - world.player.y);
    if (!best || d < best.d) best = { x: enemy.x, y: enemy.y, d };
  }
  return best;
}

function hunt(world: ReturnType<typeof createWorld>, required: string[]): SimInput {
  const foe = nearestEnemy(world);
  if (foe && foe.d <= 220) {
    return {
      x: (world.player.x - foe.x) / foe.d,
      y: (world.player.y - foe.y) / foe.d,
      sting: true
    };
  }
  const open = world.shards.filter((s) => !s.taken && required.includes(s.id));
  let goal: { x: number; y: number; d: number } | null = null;
  for (const shard of open) {
    const d = Math.hypot(shard.x - world.player.x, shard.y - world.player.y);
    if (!goal || d < goal.d) goal = { x: shard.x, y: shard.y, d };
  }
  if (goal && goal.d >= 24) {
    return { x: (goal.x - world.player.x) / goal.d, y: (goal.y - world.player.y) / goal.d, sting: true };
  }
  return { x: 0, y: 0, sting: true };
}

function kite(world: ReturnType<typeof createWorld>): SimInput {
  let nearest = null as null | { x: number; y: number };
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    const d = Math.hypot(enemy.x - world.player.x, enemy.y - world.player.y);
    if (d < bestDistance) {
      bestDistance = d;
      nearest = enemy;
    }
  }
  if (!nearest || bestDistance > 200) return { x: 0, y: 0, sting: true };
  return {
    x: (world.player.x - nearest.x) / bestDistance,
    y: (world.player.y - nearest.y) / bestDistance,
    sting: true
  };
}

describe('exorcist boss', () => {
  it('ritual rings wound on contact', () => {
    const world = createWorld(31, EGARA_TUNING);
    placeHazards(world, [{ id: 'ring-1', x: world.player.x, y: world.player.y, r: 30 }]);
    stepWorld(world, idle);
    expect(world.lives).toBe(2);
  });

  it('armor absorbs a ring hit', () => {
    const world = createWorld(32, EGARA_TUNING, { needle: true, armor: true, cannon: false });
    placeHazards(world, [{ id: 'ring-1', x: world.player.x, y: world.player.y, r: 30 }]);
    stepWorld(world, idle);
    expect(world.lives).toBe(3);
    expect(world.armorSpent).toBe(true);
  });

  it('pulsing rings follow their period deterministically', () => {
    const ring = { id: 'pulse', x: 0, y: 0, r: 10, period: 60, on: 30 };
    expect(hazardActive(ring, 0)).toBe(true);
    expect(hazardActive(ring, 29)).toBe(true);
    expect(hazardActive(ring, 30)).toBe(false);
    expect(hazardActive(ring, 59)).toBe(false);
    expect(hazardActive(ring, 60)).toBe(true);
    expect(hazardActive({ ...ring, period: 0 }, 45)).toBe(true);
  });

  it('ch6 validates and escapes the exorcist headless', () => {    const ch6 = CHAPTERS.find((c) => c.id === 'ch6');
    expect(ch6).toBeDefined();
    expect(validateChapter(ch6)).toEqual([]);

    const world = createWorld(33, EGARA_TUNING, ch6!.loadout);
    setParanoia(world, ch6!.paranoia);
    placeShards(world, ch6!.shards);
    placeHazards(world, ch6!.hazards ?? []);
    const director = createDirector(ch6!.waves);

    let status: string = 'running';
    const maxFrames = ch6!.timeSeconds * 60 + 60;
    for (let i = 0; i < maxFrames; i++) {
      stepWorld(world, kite(world));
      stepDirector(world, director);
      status = chapterStatus(world, director, ch6!);
      if (status === 'complete' || world.outcome !== 'running') break;
    }
    expect(status).toBe('complete');
  });
});

describe('mansion and finale', () => {
  it('ch7 validates and reaches Shilpi headless', () => {
    const ch7 = CHAPTERS.find((c) => c.id === 'ch7');
    expect(ch7).toBeDefined();
    expect(validateChapter(ch7)).toEqual([]);

    const world = createWorld(34, EGARA_TUNING, ch7!.loadout);
    setParanoia(world, ch7!.paranoia);
    placeShards(world, ch7!.shards);
    placeHazards(world, ch7!.hazards ?? []);
    const director = createDirector(ch7!.waves);

    let status: string = 'running';
    const maxFrames = ch7!.timeSeconds * 60 + 60;
    for (let i = 0; i < maxFrames; i++) {
      stepWorld(world, hunt(world, ch7!.requiredShards));
      stepDirector(world, director);
      status = chapterStatus(world, director, ch7!);
      if (status === 'complete' || world.outcome !== 'running') break;
    }
    expect(status).toBe('complete');
  });

  it('ch8 validates and finishes the cannon run headless', () => {
    const ch8 = CHAPTERS.find((c) => c.id === 'ch8');
    expect(ch8).toBeDefined();
    expect(validateChapter(ch8)).toEqual([]);
    expect(ch8!.loadout).toEqual({ needle: true, armor: true, cannon: true });

    const world = createWorld(35, EGARA_TUNING, ch8!.loadout);
    setParanoia(world, ch8!.paranoia);
    placeShards(world, ch8!.shards);
    const director = createDirector(ch8!.waves);

    let status: string = 'running';
    const maxFrames = ch8!.timeSeconds * 60 + 60;
    for (let i = 0; i < maxFrames; i++) {
      stepWorld(world, hunt(world, ch8!.requiredShards));
      stepDirector(world, director);
      status = chapterStatus(world, director, ch8!);
      if (status === 'complete' || world.outcome !== 'running') break;
    }
    expect(status).toBe('complete');
  });

  it('wave hp overrides weaken the finale boss deterministically', () => {
    const a = createWorld(36, EGARA_TUNING);
    const b = createWorld(36, EGARA_TUNING);
    const mk = (world: ReturnType<typeof createWorld>) => {
      const director = createDirector([
        { atSeconds: 0, kind: 'boss' as const, count: 1, pattern: 'top' as const, hp: 3 }
      ]);
      stepDirector(world, director);
    };
    mk(a);
    mk(b);
    expect(a.enemies[0].hp).toBe(3);
    expect(a.enemies[0].hp).toBe(b.enemies[0].hp);
  });
});
