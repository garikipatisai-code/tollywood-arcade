/**
 * Render-side game feel. Pure state, no DOM, no Phaser: the scene polls these
 * every frame and the deterministic sim never reads them.
 */
export class ScreenShake {
  private trauma = 0;

  constructor(private readonly maxPixels = 10) {}

  add(amount: number): void {
    this.trauma = Math.max(0, Math.min(1, this.trauma + amount));
  }

  update(dt: number): void {
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
  }

  offset(): { x: number; y: number } {
    if (this.trauma <= 0) return { x: 0, y: 0 };
    const magnitude = Math.min(this.trauma * this.trauma * this.maxPixels, this.maxPixels);
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * magnitude;
    const y = Math.sin(angle) * magnitude;
    // hypot() rounding can land 1 ulp over the ceiling; rescale to guarantee it.
    const length = Math.hypot(x, y);
    if (length <= this.maxPixels) return { x, y };
    return { x: (x / length) * this.maxPixels, y: (y / length) * this.maxPixels };
  }

  get active(): boolean {
    return this.trauma > 0;
  }
}

/** Hit-stop: freeze sim steps for N frames while render continues. */
export class HitStop {
  private frames = 0;

  trigger(frames: number): void {
    this.frames = Math.max(this.frames, Math.floor(frames));
  }

  /** Returns true while a step should be skipped. */
  consume(): boolean {
    if (this.frames <= 0) return false;
    this.frames--;
    return true;
  }
}

export interface BuzzMix {
  /** Playback rate multiplier for the buzz layer. */
  rate: number;
  /** Gain 0-1. Zero means the layer stays silent. */
  gain: number;
}

/** Adaptive buzz: silent when calm, rising pitch and volume with danger. */
export function buzzMix(paranoia: number, danger: number): BuzzMix {
  const heat = Math.max(0, Math.min(1, paranoia / 100)) * 0.6
    + Math.max(0, Math.min(1, danger)) * 0.4;
  if (heat <= 0) return { rate: 1, gain: 0 };
  return { rate: 1 + heat * 0.8, gain: Math.min(1, heat * 0.7) };
}
