import { describe, expect, it } from 'vitest';
import { createDirector, stepDirector } from '../../src/engines/shooter/director';
import { createWorld, placeHazards, placeShards, placeSlowZones, placeWindZones, setParanoia, stepWorld } from '../../src/engines/shooter/sim';
import {
  CHAPTERS,
  chapterStatus,
  validateChapter,
  type Chapter,
  type SimInput
} from '../../src/games/egara/content';
import { EGARA_TUNING } from '../../src/games/egara/content';

const idle: SimInput = { x: 0, y: 0, sting: false };

function seekShards(world: ReturnType<typeof createWorld>, required: string[]): SimInput {
  const open = world.shards.filter((s) => !s.taken && required.includes(s.id));
  if (open.length === 0) return { x: 0, y: 0, sting: true };

  let best = open[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const shard of open) {
    const d = Math.hypot(shard.x - world.player.x, shard.y - world.player.y);
    if (d < bestDistance) {
      best = shard;
      bestDistance = d;
    }
  }
  if (bestDistance < 24) return { x: 0, y: 0, sting: true };
  return {
    x: (best.x - world.player.x) / bestDistance,
    y: (best.y - world.player.y) / bestDistance,
    sting: true
  };
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
  if (!nearest || bestDistance > 160) return { x: 0, y: 0, sting: true };
  return {
    x: (world.player.x - nearest.x) / bestDistance,
    y: (world.player.y - nearest.y) / bestDistance,
    sting: true
  };
}

function playInput(world: ReturnType<typeof createWorld>, chapter: Chapter): SimInput {
  const combat = ['ch3', 'ch4', 'ch5'].includes(chapter.id);
  if (!combat) return seekShards(world, chapter.requiredShards);

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
  if (nearest && bestDistance <= 200) return kite(world);
  return seekShards(world, chapter.requiredShards);
}

function playChapter(chapter: Chapter): { status: string; frames: number } {
  const world = createWorld(21, EGARA_TUNING, chapter.loadout);
  setParanoia(world, chapter.paranoia);
  placeShards(world, chapter.shards);
  placeWindZones(world, chapter.wind ?? []);
  placeSlowZones(world, chapter.slow ?? []);
  placeHazards(world, chapter.hazards ?? []);
  const director = createDirector(chapter.waves);

  const maxFrames = chapter.timeSeconds * 60 + 60;
  for (let i = 0; i < maxFrames; i++) {
    stepWorld(world, playInput(world, chapter));
    stepDirector(world, director);
    if (chapterStatus(world, director, chapter) === 'complete') {
      return { status: 'complete', frames: i };
    }
    if (world.outcome !== 'running') break;
  }
  return { status: chapterStatus(world, director, chapter), frames: maxFrames };
}

describe('chapters 1-3', () => {
  it('ships exactly ch1-ch8 with valid schemas', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual(['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8']);
    for (const chapter of CHAPTERS) {
      expect(validateChapter(chapter)).toEqual([]);
    }
  });

  it('rejects bad chapters', () => {
    const base = CHAPTERS[0];
    expect(validateChapter(null)).not.toEqual([]);
    expect(validateChapter({ ...base, id: '' })).not.toEqual([]);
    expect(validateChapter({ ...base, paranoia: 101 })).not.toEqual([]);
    expect(
      validateChapter({
        ...base,
        waves: [{ atSeconds: 999, kind: 'swatter', count: 1, pattern: 'top' }]
      })
    ).not.toEqual([]);
    expect(
      validateChapter({ ...base, waves: [{ atSeconds: 0, kind: 'dragon', count: 1, pattern: 'top' }] })
    ).not.toEqual([]);
    expect(validateChapter({ ...base, requiredShards: ['missing'] })).not.toEqual([]);
  });

  it('ch1 is a peaceful courier run: 3 petals, no waves', () => {
    const ch1 = CHAPTERS[0];
    expect(ch1.waves).toEqual([]);
    expect(ch1.requiredShards).toHaveLength(3);
    expect(ch1.loadout.needle).toBe(false);
    const result = playChapter(ch1);
    expect(result.status).toBe('complete');
  });

  it('ch2 collects 4 memory shards', () => {
    const ch2 = CHAPTERS[1];
    expect(ch2.requiredShards).toHaveLength(4);
    expect(ch2.wind.filter((z) => z.dy < 0)).toHaveLength(2);
    const result = playChapter(ch2);
    expect(result.status).toBe('complete');
  });

  it('ch3 grants the needle and demands a clear', () => {
    const ch3 = CHAPTERS[2];
    expect(ch3.loadout).toEqual({ needle: true, armor: false, cannon: false });
    expect(ch3.waves.length).toBeGreaterThan(0);
    expect(ch3.requiredShards).toEqual(['gate-1', 'gate-2']);
    const result = playChapter(ch3);
    expect(result.status).toBe('complete');
  });

  it('reports running before objectives are met', () => {
    const world = createWorld(1, EGARA_TUNING, CHAPTERS[0].loadout);
    placeShards(world, CHAPTERS[0].shards);
    const director = createDirector(CHAPTERS[0].waves);
    stepWorld(world, idle);
    expect(chapterStatus(world, director, CHAPTERS[0])).toBe('running');
  });
});

describe('chapters 4-5', () => {  it('ch4 debuts the paranoia meter with sabotage targets', () => {
    const ch4 = CHAPTERS[3];
    expect(ch4.paranoia).toBe(40);
    expect(ch4.loadout.needle).toBe(true);
    expect(ch4.requiredShards).toHaveLength(2);
    expect(ch4.hazards.filter((h) => h.kind === 'car')).toHaveLength(3);
    const result = playChapter(ch4);
    expect(result.status).toBe('complete');
  });

  it('ch5 grants armor against exterminators', () => {
    const ch5 = CHAPTERS[4];
    expect(ch5.paranoia).toBe(65);
    expect(ch5.loadout).toEqual({ needle: true, armor: true, cannon: false });
    expect(ch5.slow).toHaveLength(2);
    const result = playChapter(ch5);
    expect(result.status).toBe('complete');
  });
});

describe('chapters 6-8', () => {
  it('ch7 patrols the mansion but still clears', () => {
    const ch7 = CHAPTERS[6];
    expect(ch7.hazards.filter((h) => h.kind === 'guard')).toHaveLength(2);
    const result = playChapter(ch7);
    expect(result.status).toBe('complete');
  });

  it('ch8 vents the cannon alley but still clears', () => {
    const ch8 = CHAPTERS[7];
    expect(ch8.hazards).toHaveLength(4);
    const result = playChapter(ch8);
    expect(result.status).toBe('complete');
  });
});
