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
  d: [0x5a, 0x54, 0x68, 255],
  B: [0x4a, 0x2f, 0x1d, 255],
  b: [0x7a, 0x52, 0x30, 255],
  H: [0xc9, 0x8a, 0x2e, 255],
  o: [0xe0, 0x7b, 0x39, 255],
  y: [0xff, 0xd9, 0x4d, 255],
  W: [0xff, 0xff, 0xff, 255],
  R: [0x8e, 0x2f, 0x2f, 255],
  T: [0x2e, 0x6e, 0x64, 255],
  C: [0xa8, 0xe6, 0xe0, 255],
  c: [0xcf, 0xe8, 0xef, 255],
  E: [0x3f, 0xa7, 0xd6, 255],
  D: [0x1d, 0x5f, 0x7e, 255],
  V: [0x5a, 0x3a, 0x8e, 255],
  S: [0xc9, 0xc4, 0xd4, 255],
  G: [0x2e, 0x2a, 0x38, 255],
  N: [0x23, 0x20, 0x38, 255],
  s: [0x5a, 0x73, 0x98, 255],
  e: [0xff, 0x9a, 0x3d, 255]
};

const TILE = 24;

/** Tiny procedural pixel canvas with mirror symmetry. */
function makeCanvas() {
  const px = new Map();
  const set = (x, y, color) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
    if (color === '.') px.delete(`${x},${y}`);
    else px.set(`${x},${y}`, color);
  };
  const sym = (x, y, color) => {
    set(x, y, color);
    set(TILE - 1 - x, y, color);
  };
  const ellipse = (cx, cy, rx, ry, color, mirror = false) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          if (mirror) sym(x, y, color);
          else set(x, y, color);
        }
      }
    }
  };
  const ring = (cx, cy, rx, ry, color, mirror = false) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const q = dx * dx + dy * dy;
        if (q <= 1 && q >= 0.55) {
          if (mirror) sym(x, y, color);
          else set(x, y, color);
        }
      }
    }
  };
  const rect = (x0, y0, x1, y1, color) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, color);
  };
  const line = (x0, y0, x1, y1, color) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      set(Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps), color);
    }
  };
  /** Translucent checker dither inside an ellipse (wings, mist). */
  const ditherEllipse = (cx, cy, rx, ry, color, mirror = false) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1 && (x + y) % 2 === 0) {
          if (mirror) sym(x, y, color);
          else set(x, y, color);
        }
      }
    }
  };
  return { px, set, sym, ellipse, ring, rect, line, ditherEllipse };
}

function drawGali(c, pose) {
  const lift = pose === 'hoverB' ? 1 : 0;
  const flash = pose === 'hurt';
  const body = flash ? 'W' : 'a';
  const shade = flash ? 'w' : 'H';
  const light = flash ? 'W' : 'A';

  const wingY = pose === 'dash' ? 9 : pose === 'hoverB' ? 7 : 5;
  c.ditherEllipse(5, wingY + lift, 4.4, 3, 'c', true);
  c.ring(5, wingY + lift, 4.4, 3, 's', true);
  if (pose === 'dash') {
    c.line(1, 10 + lift, 4, 10 + lift, 'C');
    c.line(0, 13 + lift, 4, 13 + lift, 'c');
    c.line(1, 16 + lift, 4, 16 + lift, 'C');
  }

  for (const [ly, len] of [[13, 3], [15, 4], [17, 3]]) {
    c.line(7, ly + lift, 7 - len, ly + lift + 1, 'k');
    c.line(16, ly + lift, 16 + len, ly + lift + 1, 'k');
  }

  c.ellipse(11.5, 14 + lift, 4.6, 5.4, 'k');
  c.ellipse(11.5, 14 + lift, 3.8, 4.6, shade);
  c.ellipse(11.5, 13 + lift, 3.4, 4.2, body);
  c.ellipse(10.5, 12 + lift, 1.8, 2.6, light);
  c.rect(8, 14 + lift, 15, 14 + lift, 'B');
  c.rect(8, 16 + lift, 15, 16 + lift, 'B');

  c.ellipse(11.5, 8 + lift, 3.6, 3, 'k');
  c.ellipse(11.5, 8 + lift, 2.9, 2.4, body);

  if (pose === 'hurt') {
    c.line(7, 7 + lift, 10, 9 + lift, 'D');
    c.line(7, 9 + lift, 10, 7 + lift, 'D');
    c.line(13, 7 + lift, 16, 9 + lift, 'D');
    c.line(13, 9 + lift, 16, 7 + lift, 'D');
  } else {
    c.ellipse(8.6, 8 + lift, 2.2, 2.6, 'k');
    c.ellipse(14.4, 8 + lift, 2.2, 2.6, 'k');
    c.ellipse(8.6, 8 + lift, 1.7, 2.1, 'E');
    c.ellipse(14.4, 8 + lift, 1.7, 2.1, 'E');
    c.ellipse(8.6, 8.6 + lift, 1.1, 1.4, 'D');
    c.ellipse(14.4, 8.6 + lift, 1.1, 1.4, 'D');
    c.set(8, 7 + lift, 'W');
    c.set(14, 7 + lift, 'W');
  }

  c.line(10, 5 + lift, 8, 3 + lift, 'k');
  c.line(13, 5 + lift, 15, 3 + lift, 'k');
  c.set(8, 3 + lift, 'y');
  c.set(15, 3 + lift, 'y');
  c.line(11, 19 + lift, 11, 21 + lift, 'B');
  c.line(12, 19 + lift, 12, 21 + lift, 'B');

  if (pose === 'win') {
    c.set(3, 2, 'y');
    c.set(20, 3, 'W');
    c.set(18, 1, 'y');
    c.set(5, 20, 'W');
  }
}

function drawSwatter(c) {
  c.ellipse(11.5, 8, 7.4, 6.4, 'k');
  c.ellipse(11.5, 8, 6.6, 5.6, 'r');
  for (let y = 3; y <= 13; y += 2) {
    for (let x = 6; x <= 17; x += 2) {
      const dx = (x - 11.5) / 6.6;
      const dy = (y - 8) / 5.6;
      if (dx * dx + dy * dy <= 0.8) c.set(x, y, '.');
    }
  }
  c.ellipse(11.5, 8, 6.6, 5.6, 'R');
  c.rect(8, 6, 10, 8, 'W');
  c.rect(13, 6, 15, 8, 'W');
  c.set(9, 7, 'k');
  c.set(14, 7, 'k');
  c.line(7, 4, 11, 5, 'k');
  c.line(16, 4, 12, 5, 'k');
  c.rect(10, 14, 13, 21, 'k');
  c.rect(11, 14, 12, 21, 'g');
  c.set(11, 15, 'S');
  c.rect(9, 21, 14, 22, 'B');
}

function drawSpray(c) {
  c.ditherEllipse(15, 3, 4, 2.4, 'w');
  c.ditherEllipse(16, 2, 2.4, 1.6, 'C');
  c.rect(10, 4, 13, 6, 'k');
  c.rect(11, 4, 12, 6, 'd');
  c.rect(8, 6, 15, 8, 'R');
  c.ellipse(11.5, 15, 5.4, 7.4, 'k');
  c.ellipse(11.5, 15, 4.6, 6.6, 't');
  c.rect(8, 10, 9, 20, 'C');
  c.rect(10, 9, 13, 9, 'T');
  c.rect(7, 14, 16, 17, 'R');
  c.rect(7, 15, 16, 16, 'r');
  c.set(9, 15, 'W');
  c.set(11, 16, 'W');
  c.set(13, 15, 'W');
  c.rect(8, 21, 15, 22, 'T');
  c.set(14, 12, 'W');
  c.set(14, 13, 'W');
}

function drawSpider(c) {
  for (const [sx, sy, ex, ey] of [
    [7, 10, 2, 6], [7, 13, 1, 13], [7, 16, 2, 20], [8, 18, 5, 22],
    [16, 10, 21, 6], [16, 13, 22, 13], [16, 16, 21, 20], [15, 18, 18, 22]
  ]) {
    c.line(sx, sy, (sx + ex) / 2, (sy + ey) / 2 - 1, 'V');
    c.line((sx + ex) / 2, (sy + ey) / 2 - 1, ex, ey, 'k');
  }
  c.ellipse(11.5, 14, 5.6, 6, 'k');
  c.ellipse(11.5, 14, 4.8, 5.2, 'V');
  c.ellipse(10.4, 12.6, 2.6, 3, 'p');
  c.ellipse(11.5, 7.4, 3.4, 2.8, 'k');
  c.ellipse(11.5, 7.4, 2.7, 2.1, 'V');
  c.set(9, 6, 'r');
  c.set(11, 6, 'r');
  c.set(13, 6, 'r');
  c.set(10, 8, 'e');
  c.set(12, 8, 'e');
  c.set(11, 7, 'W');
  c.line(9, 9, 8, 11, 'w');
  c.line(14, 9, 15, 11, 'w');
  c.set(10, 20, 's');
  c.set(13, 20, 's');
}

function drawBoss(c) {
  // Twin nozzle stacks with embers, separated from the hull.
  c.rect(5, 1, 7, 6, 'k');
  c.rect(16, 1, 18, 6, 'k');
  c.rect(5, 5, 7, 6, 'S');
  c.rect(16, 5, 18, 6, 'S');
  c.set(6, 0, 'y');
  c.set(17, 0, 'y');
  c.ellipse(6, 1.6, 1.2, 1, 'e');
  c.ellipse(17, 1.6, 1.2, 1, 'e');
  // Tank hull: lit slate with dark shadow side.
  c.ellipse(11.5, 14, 8.8, 8.2, 'k');
  c.ellipse(11.5, 14, 8, 7.4, 'G');
  c.ellipse(10.6, 13.2, 7, 6.4, 's');
  c.ellipse(9.8, 12.2, 4.6, 4.2, 'g');
  c.rect(4, 8, 19, 9, 'S');
  // Glowing eye slit.
  c.rect(5, 12, 18, 14, 'k');
  c.rect(6, 12, 17, 14, 'R');
  c.ellipse(11.5, 13, 4.4, 1, 'e');
  c.set(10, 13, 'y');
  c.set(12, 13, 'y');
  c.set(14, 13, 'W');
  // Gauge.
  c.ellipse(11.5, 17.4, 2.6, 2.4, 'k');
  c.ellipse(11.5, 17.4, 2, 1.8, 'w');
  c.line(11.5, 17.4, 13, 16.4, 'R');
  // Hazard stripes + rivets.
  for (let x = 4; x <= 19; x++) {
    c.set(x, 21, x % 2 === 0 ? 'y' : 'k');
    c.set(x, 20, x % 2 === 0 ? 'k' : 'o');
  }
  for (const [rx, ry] of [[4, 10], [19, 10], [4, 19], [19, 19]]) c.set(rx, ry, 'W');
}

// Frame indices 0-4 preserved: 0 Gali, 1 swatter, 2 spray, 3 spider, 4 boss.
const FRAME_DRAWERS = [
  (c) => drawGali(c, 'hoverA'),
  (c) => drawSwatter(c),
  (c) => drawSpray(c),
  (c) => drawSpider(c),
  (c) => drawBoss(c),
  (c) => drawGali(c, 'hoverB'),
  (c) => drawGali(c, 'dash'),
  (c) => drawGali(c, 'hurt')
];

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
  const tile = TILE;
  const width = tile * FRAME_DRAWERS.length;
  const height = tile;
  const rgba = Buffer.alloc(width * height * 4);

  FRAME_DRAWERS.forEach((draw, frame) => {
    const canvas = makeCanvas();
    draw(canvas);
    for (const [key, symbol] of canvas.px) {
      const [x, y] = key.split(',').map(Number);
      const colour = PALETTE[symbol];
      if (!colour) throw new Error(`frame ${frame}: unknown palette symbol "${symbol}"`);
      const offset = (y * width + frame * tile + x) * 4;
      rgba[offset] = colour[0];
      rgba[offset + 1] = colour[1];
      rgba[offset + 2] = colour[2];
      rgba[offset + 3] = colour[3];
    }
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
  ],  hit: [
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
  ],
  buzz: [
    { from: 85, to: 85, duration: 1.0, gain: 0.4, type: 'sine', decay: 0, start: 0 },
    { from: 170, to: 170, duration: 1.0, gain: 0.15, type: 'sine', decay: 0, start: 0 }
  ],
  shard: [
    { from: 1320, to: 1320, duration: 0.06, gain: 0.25, type: 'sine', start: 0 },
    { from: 1760, to: 1760, duration: 0.12, gain: 0.25, type: 'sine', start: 0.06 }
  ],
  thud: [
    { from: 120, to: 50, duration: 0.15, gain: 0.5, type: 'sine', decay: 4, start: 0 }
  ]
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'sprites.png'), buildSpriteSheet());

for (const [name, tones] of Object.entries(SOUNDS)) {
  writeFileSync(join(outDir, `${name}.wav`), encodeWav(renderTones(tones)));
}

console.log(`Wrote ${FRAME_DRAWERS.length} frames and ${Object.keys(SOUNDS).length} sounds to ${outDir}`);
