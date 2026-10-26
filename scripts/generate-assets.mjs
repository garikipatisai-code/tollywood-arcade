#!/usr/bin/env node
/**
 * Generates the Egara art and audio. Everything here is original work released
 * under CC0-1.0, so the game ships with no third-party asset obligations.
 *
 * Run: node scripts/generate-assets.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'assets', 'egara');

const PALETTE = {
  '.': [0, 0, 0, 0],
  k: [0x14, 0x10, 0x1c, 255],
  a: [0xe8, 0xb0, 0x4b, 255],
  A: [0xf7, 0xd9, 0x8b, 255],
  w: [0xf3, 0xec, 0xdd, 255],
  r: [0xd0, 0x5a, 0x5a, 255],
  t: [0x6e, 0xc6, 0xb8, 255],
  p: [0x9b, 0x6e, 0xd8, 255],
  g: [0x8a, 0x85, 0x98, 255],
  d: [0x5a, 0x54, 0x68, 255]
};

const FRAMES = [
  [
    '................',
    '................',
    '....k......k....',
    '...kak....kak...',
    '..kaak....kaak..',
    '...kkaakkaakk...',
    '.....kwwwwk.....',
    '.....kwkkwk.....',
    '......kkkk......',
    '....kkkkkkkk....',
    '...kkaaaaaakk...',
    '..k..kkkkkk..k..',
    '..k..........k..',
    '................',
    '................',
    '................'
  ],
  [
    '................',
    '.....rrrrrr.....',
    '....rrrrrrrr....',
    '...rrrrrrrrrr...',
    '...rrrrrrrrrr...',
    '...rrrrrrrrrr...',
    '....rrrrrrrr....',
    '.....rrrrrr.....',
    '......rrrr......',
    '.......rr.......',
    '.......gg.......',
    '.......gg.......',
    '.......gg.......',
    '......gggg......',
    '................',
    '................'
  ],
  [
    '................',
    '.......kk.......',
    '......kttk......',
    '.....kkkkkk.....',
    '.....kttttk.....',
    '.....kttttk.....',
    '.....kttttk.....',
    '.....kttttk.....',
    '.....kttttk.....',
    '.....kttttk.....',
    '.....kwwwwk.....',
    '.....kttttk.....',
    '.....kkkkkk.....',
    '................',
    '................',
    '................'
  ],
  [
    '................',
    '..k..........k..',
    '...k...kk...k...',
    '....k.kppk.k....',
    '.....kkppkk.....',
    '..k..kppppk..k..',
    '...k.kppppk.k...',
    '....kppppppk....',
    '...k.kppppk.k...',
    '..k..kppppk..k..',
    '.....kkppkk.....',
    '....k.kppk.k....',
    '...k...kk...k...',
    '..k..........k..',
    '................',
    '................'
  ],
  [
    '................',
    '....gggggggg....',
    '..ggrrrrrrrrgg..',
    '..grrrrrrrrrrg..',
    '..grrrrrrrrrrg..',
    '..grrrrrrrrrrg..',
    '..grrrrrrrrrrg..',
    '..grrrrrrrrrrg..',
    '..grrrrrrrrrrg..',
    '..grrrrrrrrrrg..',
    '..ggrrrrrrrrgg..',
    '....gggggggg....',
    '......gggg......',
    '.......gg.......',
    '.......gg.......',
    '................'
  ]
];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function buildSpriteSheet() {
  const tile = 16;
  const width = tile * FRAMES.length;
  const height = tile;
  const rgba = Buffer.alloc(width * height * 4);

  FRAMES.forEach((rows, frame) => {
    if (rows.length !== tile) throw new Error(`frame ${frame}: expected 16 rows, got ${rows.length}`);
    rows.forEach((row, y) => {
      if (row.length !== tile) throw new Error(`frame ${frame} row ${y}: expected 16 chars, got ${row.length}`);
      [...row].forEach((symbol, x) => {
        const colour = PALETTE[symbol];
        if (!colour) throw new Error(`frame ${frame}: unknown palette symbol "${symbol}"`);
        const offset = (y * width + frame * tile + x) * 4;
        rgba[offset] = colour[0];
        rgba[offset + 1] = colour[1];
        rgba[offset + 2] = colour[2];
        rgba[offset + 3] = colour[3];
      });
    });
  });

  return encodePng(width, height, rgba);
}

const RATE = 22050;

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function renderTones(tones) {
  const total = Math.max(...tones.map((tone) => (tone.start ?? 0) + tone.duration));
  const samples = new Float32Array(Math.ceil(total * RATE));

  for (const tone of tones) {
    const start = Math.floor((tone.start ?? 0) * RATE);
    const count = Math.floor(tone.duration * RATE);
    const rng = mulberry32(tone.seed ?? 7);

    for (let i = 0; i < count; i++) {
      const t = i / RATE;
      const progress = i / count;
      const sweep = tone.from + (tone.to - tone.from) * progress;
      const phase = 2 * Math.PI * sweep * t;

      let value;
      if (tone.noise) {
        value = rng() * 2 - 1;
      } else if (tone.type === 'square') {
        value = Math.sin(phase) >= 0 ? 1 : -1;
      } else {
        value = Math.sin(phase);
      }

      const attack = Math.min(1, i / (0.004 * RATE));
      const decay = Math.pow(1 - progress, tone.decay ?? 2);
      samples[start + i] += value * attack * decay * (tone.gain ?? 0.35);
    }
  }

  return samples;
}

function encodeWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    data.writeInt16LE(Math.round(clamped * 32767), index * 2);
  });

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

const SOUNDS = {
  sting: [
    { from: 900, to: 1500, duration: 0.07, gain: 0.22, type: 'square', decay: 3 }
  ],
  hit: [
    { from: 300, to: 80, duration: 0.12, gain: 0.4, noise: true, decay: 4, seed: 11 }
  ],
  boss: [
    { from: 70, to: 45, duration: 0.5, gain: 0.5, type: 'sine', decay: 2 },
    { from: 140, to: 90, duration: 0.5, gain: 0.2, type: 'square', decay: 3 }
  ],
  win: [
    { from: 523, to: 523, duration: 0.12, gain: 0.25, type: 'square', start: 0 },
    { from: 659, to: 659, duration: 0.12, gain: 0.25, type: 'square', start: 0.12 },
    { from: 784, to: 784, duration: 0.28, gain: 0.25, type: 'square', start: 0.24 }
  ],
  lose: [
    { from: 392, to: 392, duration: 0.14, gain: 0.25, type: 'square', start: 0 },
    { from: 330, to: 330, duration: 0.14, gain: 0.25, type: 'square', start: 0.14 },
    { from: 262, to: 200, duration: 0.34, gain: 0.25, type: 'square', start: 0.28 }
  ]
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sprites.png'), buildSpriteSheet());

for (const [name, tones] of Object.entries(SOUNDS)) {
  writeFileSync(join(outDir, `${name}.wav`), encodeWav(renderTones(tones)));
}

console.log(`Wrote ${FRAMES.length} frames and ${Object.keys(SOUNDS).length} sounds to ${outDir}`);
