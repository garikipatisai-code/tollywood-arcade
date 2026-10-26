export interface SoundPort {
  play(key: string): void;
  setMute(muted: boolean): void;
}

export interface AudioOptions {
  muted?: boolean;
  onMute?: (muted: boolean) => void;
}

/** Audio starts locked; browsers only allow playback after a user gesture. */
export class AudioController {
  private unlocked = false;
  private muted: boolean;

  constructor(private readonly port: SoundPort, options: AudioOptions = {}) {
    this.muted = options.muted ?? false;
    this.onMute = options.onMute;
    this.port.setMute(this.muted);
  }

  private readonly onMute?: (muted: boolean) => void;

  unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
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
    return this.muted;
  }

  play(key: string): void {
    if (!this.unlocked || this.muted) return;
    this.port.play(key);
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
