/**
 * Generative music: a tiny deterministic sequencer. No audio files, no
 * downloads — a few KB of code plays endless per-chapter beds that thicken
 * with the paranoia meter. WebAudio only touches the engine class below;
 * everything else is pure and unit-tested.
 */

export interface Mood {
  bpm: number;
  /** MIDI note of the scale root. */
  root: number;
  /** Semitone offsets forming the scale. */
  scale: number[];
  /** 0-1: fraction of arp slots that sound. */
  density: number;
  bass: boolean;
}

export const MOODS: Record<string, Mood> = {
  sabotage: { bpm: 120, root: 57, scale: [0, 3, 5, 7, 10], density: 0.5, bass: true },
  ch1: { bpm: 100, root: 60, scale: [0, 2, 4, 7, 9], density: 0.4, bass: false },
  ch2: { bpm: 84, root: 62, scale: [0, 3, 5, 7, 10], density: 0.35, bass: true },
  ch3: { bpm: 112, root: 55, scale: [0, 2, 4, 7, 9], density: 0.5, bass: true },
  ch4: { bpm: 126, root: 52, scale: [0, 3, 5, 7, 10], density: 0.6, bass: true },
  ch5: { bpm: 132, root: 54, scale: [0, 3, 5, 7, 10], density: 0.65, bass: true },
  ch6: { bpm: 90, root: 48, scale: [0, 1, 5, 7, 8], density: 0.5, bass: true },
  ch7: { bpm: 96, root: 57, scale: [0, 3, 5, 7, 10], density: 0.45, bass: true },
  ch8: { bpm: 140, root: 52, scale: [0, 1, 5, 7, 8], density: 0.8, bass: true }
};

export interface NoteEvent {
  /** Beats from the bar start. */
  at: number;
  midi: number;
  beats: number;
  kind: 'arp' | 'bass' | 'pad';
}

function hashBar(seed: number, bar: number, slot: number): number {
  let h = (seed ^ Math.imul(bar + 1, 0x9e3779b9) ^ Math.imul(slot + 1, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * One bar of music, fully determined by (seed, bar, heat). Same inputs play
 * the same notes on every device — a replayable score.
 */
export function composeBar(seed: number, bar: number, mood: Mood, heat: number): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const density = Math.max(0, Math.min(1, mood.density + heat * 0.25));
  const slots = 8;

  for (let slot = 0; slot < slots; slot++) {
    if (hashBar(seed, bar, slot) > density) continue;
    const degree = Math.floor(hashBar(seed + 7, bar, slot) * mood.scale.length * 2);
    const octave = Math.floor(degree / mood.scale.length);
    const midi = mood.root + 12 + mood.scale[degree % mood.scale.length] + octave * 12;
    notes.push({ at: slot * 0.5, midi, beats: 0.5, kind: 'arp' });
  }

  if (mood.bass) {
    const walk = hashBar(seed + 13, bar, 0) > 0.6 ? 7 : 0;
    notes.push({ at: 0, midi: mood.root - 12 + walk, beats: 1.5, kind: 'bass' });
    notes.push({ at: 2, midi: mood.root - 12, beats: 1.5, kind: 'bass' });
  }

  notes.push({ at: 0, midi: mood.root, beats: 4, kind: 'pad' });
  notes.push({ at: 0, midi: mood.root + mood.scale[2 % mood.scale.length], beats: 4, kind: 'pad' });

  return notes.sort((a, b) => a.at - b.at);
}

/** Schedules composed bars on a WebAudio clock. Created after a gesture. */
export class MusicEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextBarAt = 0;
  private bar = 0;
  private heat = 0;
  private muted = false;

  constructor(
    private readonly mood: Mood,
    private readonly seed = 1
  ) {}

  get running(): boolean {
    return this.timer !== null;
  }

  start(): void {
    if (this.timer) return;
    const Ctor = globalThis.AudioContext;
    if (!Ctor) return;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.14;
    this.master.connect(this.context.destination);
    this.nextBarAt = this.context.currentTime + 0.1;
    this.bar = 0;
    this.timer = setInterval(() => this.schedule(), 90);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    void this.context?.close();
    this.context = null;
    this.master = null;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.context) {
      this.master.gain.setValueAtTime(muted ? 0 : 0.14, this.context.currentTime);
    }
  }

  setHeat(heat: number): void {
    this.heat = Math.max(0, Math.min(1, heat));
  }

  private schedule(): void {
    if (!this.context || !this.master) return;
    const beat = 60 / this.mood.bpm;
    while (this.nextBarAt < this.context.currentTime + 0.35) {
      const start = this.nextBarAt;
      for (const note of composeBar(this.seed, this.bar, this.mood, this.heat)) {
        this.voice(note, start + note.at * beat, beat);
      }
      this.nextBarAt += 4 * beat;
      this.bar++;
    }
  }

  private voice(note: NoteEvent, when: number, beat: number): void {
    if (!this.context || !this.master) return;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = note.kind === 'bass' ? 'triangle' : note.kind === 'pad' ? 'sine' : 'square';
    osc.frequency.value = midiToFreq(note.midi);
    const peak = note.kind === 'pad' ? 0.16 : note.kind === 'bass' ? 0.5 : 0.22;
    const dur = note.beats * beat;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }
}
