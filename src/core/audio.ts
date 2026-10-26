export interface SoundPort {
  play(key: string): void;
  setMute(muted: boolean): void;
  startLoop?(key: string, rate: number, volume: number): void;
  tuneLoop?(volume: number): void;
  stopLoop?(): void;
}

export interface AudioOptions {
  muted?: boolean;
  onMute?: (muted: boolean) => void;
}

/** Audio starts locked; browsers only allow playback after a user gesture. */
export class AudioController {
  private unlocked = false;
  private muted: boolean;
  private loopKey: string | null = null;
  private loopRate = 1;
  private loopVolume = 0;

  constructor(private readonly port: SoundPort, options: AudioOptions = {}) {
    this.muted = options.muted ?? false;
    this.onMute = options.onMute;
    this.port.setMute(this.muted);
  }

  private readonly onMute?: (muted: boolean) => void;

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.loopKey && !this.muted) {
      this.port.startLoop?.(this.loopKey, this.loopRate, this.loopVolume);
    }
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.port.setMute(this.muted);
    this.onMute?.(this.muted);
    if (this.muted) {
      this.port.stopLoop?.();
    } else if (this.loopKey && this.unlocked) {
      this.port.startLoop?.(this.loopKey, this.loopRate, this.loopVolume);
    }
    return this.muted;
  }

  play(key: string): void {
    if (!this.unlocked || this.muted) return;
    this.port.play(key);
  }

  /** Ambient layer (wing buzz). Silent until unlock; restarts after unmute. */
  startLoop(key: string, rate = 1, volume = 0.15): void {
    this.loopKey = key;
    this.loopRate = rate;
    this.loopVolume = volume;
    if (!this.unlocked || this.muted) return;
    this.port.startLoop?.(key, rate, volume);
  }

  tuneLoop(volume: number): void {
    this.loopVolume = volume;
    if (!this.unlocked || this.muted) return;
    this.port.tuneLoop?.(volume);
  }

  stopLoop(): void {
    this.loopKey = null;
    this.port.stopLoop?.();
  }
}

/** Resolve on the first pointer/key gesture, then detach both listeners. */
export function bindUnlock(
  target: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>,
  unlock: () => void
): () => void {
  let done = false;

  const handler = () => {
    if (done) return;
    done = true;
    unlock();
    detach();
  };

  const detach = () => {
    target.removeEventListener('pointerdown', handler);
    target.removeEventListener('keydown', handler);
  };

  target.addEventListener('pointerdown', handler);
  target.addEventListener('keydown', handler);

  return detach;
}
