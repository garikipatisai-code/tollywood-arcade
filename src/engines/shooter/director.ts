import {
  nextRandom,
  spawnEnemy,
  type EnemyKind,
  type World
} from './sim';

export type SpawnPattern = 'top' | 'sides' | 'random';

export interface WaveEvent {
  atSeconds: number;
  kind: EnemyKind;
  count: number;
  pattern: SpawnPattern;
  /** Optional per-wave hp override (finale bosses, wounded foes). */
  hp?: number;
}

export interface Director {
  events: WaveEvent[];
  nextIndex: number;
  spawned: number;
  dropped: number;
}

export function createDirector(events: WaveEvent[]): Director {
  return {
    events: [...events].sort((a, b) => a.atSeconds - b.atSeconds),
    nextIndex: 0,
    spawned: 0,
    dropped: 0
  };
}

interface SpawnSpot {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function spawnSpot(world: World, pattern: SpawnPattern, index: number, kind: EnemyKind): SpawnSpot {
  const { width, height } = world.tuning;
  const radius = world.tuning.enemies[kind].radius;
  const speed = world.tuning.enemies[kind].speed;

  if (pattern === 'sides') {
    const fromLeft = index % 2 === 0;
    return {
      x: fromLeft ? radius : width - radius,
      y: 60 + nextRandom(world) * Math.max(40, height - 160),
      vx: fromLeft ? speed : -speed,
      vy: 0
    };
  }

  if (pattern === 'random') {
    const angle = nextRandom(world) * Math.PI * 2;
    return {
      x: radius + nextRandom(world) * (width - radius * 2),
      y: radius + nextRandom(world) * (height * 0.5),
      vx: Math.cos(angle) * speed,
      vy: Math.abs(Math.sin(angle)) * speed
    };
  }

  return {
    x: radius + nextRandom(world) * (width - radius * 2),
    y: radius,
    vx: 0,
    vy: speed
  };
}

/** Called every simulation step; fires any wave whose time has arrived. */
export function stepDirector(world: World, director: Director): void {
  // Paranoia adds reinforcements: +1 per wave at 50+, +2 at 100.
  const bonus = world.paranoia >= 100 ? 2 : world.paranoia >= 50 ? 1 : 0;

  while (director.nextIndex < director.events.length) {
    const event = director.events[director.nextIndex];
    if (world.runFrames < Math.round(event.atSeconds * 60)) break;

    const waveIndex = director.nextIndex;
    director.nextIndex++;
    world.events.push({ tick: world.tick, type: 'objective', id: `wave-${waveIndex}` });

    for (let i = 0; i < event.count + bonus; i++) {
      const spot = spawnSpot(world, event.pattern, i, event.kind);
      const enemy = spawnEnemy(world, event.kind, spot.x, spot.y, spot.vx, spot.vy, event.hp);
      if (enemy) director.spawned++;
      else director.dropped++;
    }
  }
}
