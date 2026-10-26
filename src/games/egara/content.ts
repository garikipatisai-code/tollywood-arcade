import type { SpawnPattern, WaveEvent } from '../../engines/shooter/director';
import type { EnemyKind, Tuning } from '../../engines/shooter/sim';
import raw from './tuning.json';

export const EGARA_TUNING: Tuning = raw;

export const EGARA_WAVES: WaveEvent[] = raw.waves.map((wave) => ({
  atSeconds: wave.atSeconds,
  count: wave.count,
  kind: wave.kind as EnemyKind,
  pattern: wave.pattern as SpawnPattern
}));
