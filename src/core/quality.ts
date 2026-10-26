export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  /** Particle spawn multiplier. */
  particles: number;
  glows: boolean;
  trail: boolean;
  zoomPunches: boolean;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: { particles: 1, glows: true, trail: true, zoomPunches: true },
  medium: { particles: 0.5, glows: true, trail: true, zoomPunches: false },
  low: { particles: 0.25, glows: false, trail: false, zoomPunches: false }
};

const ORDER: QualityTier[] = ['high', 'medium', 'low'];
const KEY = 'tollywood-arcade.quality';

/** Auto tier from observed fps; low-memory devices cap at medium. */
export function pickTier(emaFps: number, deviceMemoryGb?: number): QualityTier {
  const cap: QualityTier = deviceMemoryGb !== undefined && deviceMemoryGb <= 2 ? 'low' : deviceMemoryGb !== undefined && deviceMemoryGb <= 4 ? 'medium' : 'high';
  const capIndex = ORDER.indexOf(cap);
  let want: QualityTier = 'high';
  if (emaFps < 30) want = 'low';
  else if (emaFps < 55) want = 'medium';
  return ORDER[Math.max(ORDER.indexOf(want), capIndex)];
}

export function nextTier(tier: QualityTier): QualityTier {
  return ORDER[(ORDER.indexOf(tier) + 1) % ORDER.length];
}

export function loadQuality(): QualityTier {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;
  } catch {
    // No storage: fall through to default.
  }
  return 'high';
}

export function persistQuality(tier: QualityTier): void {
  try {
    globalThis.localStorage?.setItem(KEY, tier);
  } catch {
    // Private mode: quality simply doesn't persist.
  }
}

/** Starting tier before any fps samples: memory-aware, optimistic otherwise. */
export function initialTier(): QualityTier {
  try {
    const stored = globalThis.localStorage?.getItem(KEY);
    if (stored === 'high' || stored === 'medium' || stored === 'low') return stored;
    const memory = (globalThis.navigator as Navigator & { deviceMemory?: number })?.deviceMemory;
    if (memory !== undefined && memory <= 2) return 'low';
    if (memory !== undefined && memory <= 4) return 'medium';
  } catch {
    // Ignore and default.
  }
  return 'high';
}
