import Phaser from 'phaser';

export interface GlowSpot {
  x: number;
  y: number;
  color: number;
  scale: number;
}

export interface Prop {
  tex: string;
  x: number;
  y: number;
  scale: number;
  tint: number;
  alpha?: number;
}

export interface Shopfront {
  x: number;
  w: number;
  wall: number;
  awningA: number;
  awningB: number;
  sign: string;
  signBg: number;
}

export interface BookSpine {
  x: number;
  w: number;
  h: number;
  color: number;
}

export interface WorldTheme {
  skyTop: number;
  skyBottom: number;
  ground: number;
  floorTint: number;
  grass: boolean;
  trees: Prop[];
  castles: boolean;
  props: Prop[];
  clouds: number;
  glows: GlowSpot[];
  torchAtGlows: boolean;
  shops?: Shopfront[];
  wires?: { x0: number; y0: number; x1: number; y1: number; sag: number }[];
  crows?: { x: number; y: number }[];
  swags?: { x0: number; y0: number; x1: number; y1: number }[];
  auto?: boolean;
  locketWindow?: { x: number; y: number };
  workshop?: boolean;
  highway?: boolean;
  mansion?: boolean;
  sanctum?: boolean;
  ash?: number;
  nets?: { x: number; w: number; h: number }[];
  coils?: { x: number; y: number }[];
  vaporizers?: { x: number; y: number }[];
  placard?: { x: number; y: number };
  books?: BookSpine[];
  cupLake?: { x: number; y: number; rx: number; ry: number };
  lamp?: { x: number; y: number };
  nightWindow?: { x: number; y: number; w: number; h: number };
  rain?: number;
  locket?: { x: number; y: number; s: number };
}

const BERING = 0xffffff;

export const THEMES: Record<string, WorldTheme> = {
  sabotage: {
    skyTop: 0x2a3a5e,
    skyBottom: 0x7ab8d8,
    ground: 0x1d2438,
    floorTint: 0xc9a06a,
    grass: false,
    trees: [
      { tex: 'tree-2', x: 90, y: 330, scale: 2.2, tint: 0x3e6e3e, alpha: 0.55 },
      { tex: 'tree-5', x: 870, y: 340, scale: 2.6, tint: 0x2e5e46, alpha: 0.55 }
    ],
    castles: false,
    props: [
      { tex: 'dung-69', x: 70, y: 470, scale: 3, tint: BERING },
      { tex: 'dung-68', x: 890, y: 470, scale: 3, tint: BERING }
    ],
    clouds: 4,
    glows: [],
    torchAtGlows: false
  },
  ch1: {
    skyTop: 0x3a5a9e,
    skyBottom: 0xe8a860,
    ground: 0x2a4a2e,
    floorTint: 0xd8b078,
    grass: true,
    trees: [
      { tex: 'tree-1', x: 120, y: 320, scale: 2.6, tint: 0x4e9e4e, alpha: 0.6 },
      { tex: 'tree-3', x: 840, y: 330, scale: 3, tint: 0x3e8e46, alpha: 0.6 },
      { tex: 'tree-6', x: 480, y: 300, scale: 2, tint: 0x5eae5a, alpha: 0.4 }
    ],
    castles: false,
    props: [],
    clouds: 5,
    glows: [{ x: 480, y: 110, color: 0xfff2b0, scale: 2.6 }],
    torchAtGlows: false,
    shops: [
      { x: 20, w: 290, wall: 0x2e8e8e, awningA: 0xe8b04b, awningB: 0xf3ecdd, sign: 'పూలు', signBg: 0x8e2f2f },
      { x: 330, w: 300, wall: 0xd8d0b8, awningA: 0x2e8e8e, awningB: 0xf3ecdd, sign: 'టీ స్టాల్', signBg: 0x2e4a2e },
      { x: 650, w: 290, wall: 0xb86e4e, awningA: 0x8e2f2f, awningB: 0xf3ecdd, sign: 'కిరాణా', signBg: 0x2e2a3e }
    ],
    wires: [
      { x0: 0, y0: 60, x1: 480, y1: 90, sag: 26 },
      { x0: 480, y0: 90, x1: 960, y1: 55, sag: 30 }
    ],
    crows: [{ x: 200, y: 78 }, { x: 640, y: 92 }, { x: 830, y: 68 }],
    swags: [
      { x0: 60, y0: 150, x1: 330, y1: 150 },
      { x0: 630, y0: 150, x1: 900, y1: 150 }
    ],
    auto: true,
    locketWindow: { x: 760, y: 150 }
  },
  ch2: {
    skyTop: 0x0e1028,
    skyBottom: 0x2a3a5e,
    ground: 0x141020,
    floorTint: 0x6e4a2e,
    grass: false,
    trees: [],
    castles: false,
    props: [],
    clouds: 1,
    glows: [
      { x: 140, y: 130, color: 0xffd98b, scale: 2.6 },
      { x: 760, y: 120, color: 0x6a8ac0, scale: 1.6 }
    ],
    torchAtGlows: false,
    books: [
      { x: 36, w: 46, h: 150, color: 0x8e2f4e },
      { x: 86, w: 40, h: 120, color: 0x2e5e8e },
      { x: 834, w: 44, h: 140, color: 0x4e7e2e },
      { x: 882, w: 42, h: 110, color: 0x8e6e2e }
    ],
    cupLake: { x: 480, y: 472, rx: 120, ry: 26 },
    lamp: { x: 140, y: 120 },
    nightWindow: { x: 760, y: 120, w: 150, h: 130 },
    rain: 40,
    locket: { x: 480, y: 200, s: 2.2 }
  },
  ch3: {
    skyTop: 0x3e2a4e,
    skyBottom: 0xe08a4e,
    ground: 0x2e1d28,
    floorTint: 0xb08858,
    grass: false,
    trees: [{ tex: 'tree-2', x: 850, y: 340, scale: 2.4, tint: 0x6e4a2e, alpha: 0.6 }],
    castles: false,
    props: [
      { tex: 'dung-74', x: 130, y: 450, scale: 3, tint: BERING },
      { tex: 'dung-69', x: 830, y: 470, scale: 3, tint: BERING }
    ],
    clouds: 3,
    glows: [
      { x: 130, y: 400, color: 0xff9a3d, scale: 2.2 },
      { x: 830, y: 420, color: 0xff9a3d, scale: 2.2 }
    ],
    torchAtGlows: true,
    workshop: true
  },
  ch4: {
    skyTop: 0x0a0e24,
    skyBottom: 0x3a3a5e,
    ground: 0x14141e,
    floorTint: 0x3a3e4e,
    grass: false,
    trees: [
      { tex: 'tree-1', x: 60, y: 300, scale: 2.2, tint: 0x14241e, alpha: 0.8 },
      { tex: 'tree-5', x: 900, y: 300, scale: 2.2, tint: 0x14241e, alpha: 0.8 }
    ],
    castles: false,
    props: [],
    clouds: 2,
    glows: [
      { x: 160, y: 290, color: 0xfff2cc, scale: 2.2 },
      { x: 480, y: 290, color: 0xfff2cc, scale: 2.2 },
      { x: 800, y: 290, color: 0xfff2cc, scale: 2.2 }
    ],
    torchAtGlows: false,
    highway: true
  },
  ch5: {
    skyTop: 0x1e3e1e,
    skyBottom: 0x6eae4e,
    ground: 0x142a12,
    floorTint: 0xa8c078,
    grass: true,
    trees: [
      { tex: 'tree-3', x: 140, y: 320, scale: 2.8, tint: 0x2e7e2e, alpha: 0.6 },
      { tex: 'tree-6', x: 820, y: 320, scale: 2.8, tint: 0x2e7e2e, alpha: 0.6 }
    ],
    castles: false,
    props: [{ tex: 'dung-56', x: 480, y: 480, scale: 3, tint: BERING }],
    clouds: 3,
    glows: [
      { x: 300, y: 400, color: 0xffb060, scale: 1.6 },
      { x: 660, y: 400, color: 0xffb060, scale: 1.6 },
      { x: 480, y: 460, color: 0x90ff60, scale: 2 }
    ],
    torchAtGlows: false,
    nets: [
      { x: 180, w: 150, h: 250 },
      { x: 630, w: 150, h: 250 }
    ],
    coils: [
      { x: 300, y: 452 },
      { x: 660, y: 452 }
    ],
    vaporizers: [
      { x: 90, y: 300 },
      { x: 870, y: 300 }
    ],
    placard: { x: 480, y: 110 }
  },
  ch6: {
    skyTop: 0x140e28,
    skyBottom: 0x4a2a6e,
    ground: 0x0e0a1e,
    floorTint: 0x5a4a72,
    grass: false,
    trees: [
      { tex: 'tree-4', x: 90, y: 330, scale: 2.6, tint: 0x3a2a5e, alpha: 0.7 },
      { tex: 'tree-4', x: 870, y: 330, scale: 2.6, tint: 0x3a2a5e, alpha: 0.7 }
    ],
    castles: false,
    props: [
      { tex: 'dung-124', x: 240, y: 330, scale: 3, tint: BERING },
      { tex: 'dung-125', x: 720, y: 330, scale: 3, tint: BERING }
    ],
    clouds: 2,
    glows: [
      { x: 240, y: 270, color: 0xb06aff, scale: 2.6 },
      { x: 720, y: 270, color: 0xb06aff, scale: 2.6 },
      { x: 340, y: 330, color: 0xffb060, scale: 1.1 },
      { x: 620, y: 330, color: 0xffb060, scale: 1.1 },
      { x: 340, y: 470, color: 0xffb060, scale: 1.1 },
      { x: 620, y: 470, color: 0xffb060, scale: 1.1 }
    ],
    torchAtGlows: true,
    sanctum: true,
    ash: 8
  },
  ch7: {
    skyTop: 0x0e1438,
    skyBottom: 0x3a4a7e,
    ground: 0x0e1028,
    floorTint: 0x5a5a78,
    grass: false,
    trees: [],
    castles: true,
    props: [{ tex: 'dung-41', x: 480, y: 380, scale: 4, tint: BERING }],
    clouds: 2,
    glows: [
      { x: 330, y: 430, color: 0xffb060, scale: 1.8 },
      { x: 630, y: 430, color: 0xffb060, scale: 1.8 },
      { x: 480, y: 150, color: 0xffe9a8, scale: 2.2 },
      { x: 120, y: 410, color: 0xffb060, scale: 1.6 },
      { x: 300, y: 110, color: 0xd03a3a, scale: 0.7 },
      { x: 660, y: 110, color: 0xd03a3a, scale: 0.7 }
    ],
    torchAtGlows: true,
    mansion: true
  },
  ch8: {
    skyTop: 0x38140e,
    skyBottom: 0xe06a2e,
    ground: 0x280e08,
    floorTint: 0x9e5a42,
    grass: false,
    trees: [{ tex: 'tree-2', x: 480, y: 330, scale: 3, tint: 0x5e2a1e, alpha: 0.6 }],
    castles: false,
    props: [
      { tex: 'dung-56', x: 150, y: 480, scale: 3, tint: BERING },
      { tex: 'dung-69', x: 810, y: 470, scale: 3, tint: BERING }
    ],
    clouds: 1,
    glows: [
      { x: 240, y: 400, color: 0xff6a2e, scale: 3 },
      { x: 480, y: 120, color: 0xffd94d, scale: 2.4 },
      { x: 720, y: 400, color: 0xff6a2e, scale: 3 }
    ],
    torchAtGlows: false
  }
};

const SAND_TILES = ['dung-48', 'dung-49', 'dung-50'];

/** Every vendor texture the world needs. Called from the scene preload. */
export function worldPreload(load: Phaser.Loader.LoaderPlugin): void {
  load.setPath(`${import.meta.env.BASE_URL}assets/vendor/kenney`);
  for (let i = 1; i <= 4; i++) load.image(`cloud-${i}`, `bg/cloud${i}.png`);
  for (let i = 1; i <= 6; i++) load.image(`tree-${i}`, `bg/tree0${i}.png`);
  load.image('castle-beige', 'bg/castle_beige.png');
  load.image('castle-grey', 'bg/castle_grey.png');
  for (const n of [48, 49, 50, 41, 56, 68, 69, 73, 74, 124, 125, 126, 127, 29]) {
    load.image(`dung-${n}`, `dungeon/tile_${String(n).padStart(4, '0')}.png`);
  }
  for (let i = 1; i <= 5; i++) load.image(`grass-${i}`, `bg/grass${i}.png`);
  load.image('glow-light', 'particles/light_01.png');
  load.image('glow-flame', 'particles/flame_01.png');
  load.image('rain-drop', 'particles/trace_02.png');
  load.image('ash-puff', 'particles/smoke_01.png');
}

export interface WorldView {
  update(dt: number): void;
  setGlows(on: boolean): void;
  /** Soft decals marking wind zones so gusts read before they push. */
  showWind(zones: { x: number; y: number; r: number }[], tint?: number): void;
}

interface Drifter {
  obj: Phaser.GameObjects.Image;
  speed: number;
  minX: number;
  maxX: number;
}

interface Flicker {
  obj: Phaser.GameObjects.Image;
  phase: number;
  speed: number;
  base: number;
}

/** Builds the parallax household behind the sim. Pure backdrop: reads nothing. */
export function buildWorld(scene: Phaser.Scene, themeKey: string, opts: { glows?: boolean } = {}): WorldView {
  const theme = THEMES[themeKey] ?? THEMES.sabotage;
  const W = 960;
  const H = 540;

  const sky = scene.add.graphics().setDepth(-10);
  sky.fillGradientStyle(theme.skyTop, theme.skyTop, theme.skyBottom, theme.skyBottom, 1);
  sky.fillRect(0, 0, W, H);
  sky.fillStyle(theme.ground, 1);
  sky.fillRect(0, H - 120, W, 120);

  for (const tree of theme.trees) {
    scene.add
      .image(tree.x, tree.y, tree.tex)
      .setScale(tree.scale)
      .setTint(tree.tint)
      .setAlpha(tree.alpha ?? 1)
      .setDepth(-9);
  }

  if (theme.castles) {
    scene.add.image(150, 330, 'castle-grey').setScale(2).setTint(0x1a2040).setAlpha(0.9).setDepth(-9);
    scene.add.image(810, 340, 'castle-beige').setScale(2.4).setTint(0x1a2040).setAlpha(0.9).setDepth(-9);
  }

  const deco = scene.add.graphics().setDepth(-9);
  if (theme.shops) {
    for (const shop of theme.shops) {
      deco.fillStyle(shop.wall, 1);
      deco.fillRect(shop.x, 120, shop.w, 150);
      deco.fillStyle(0x1d1430, 1);
      deco.fillRect(shop.x, 262, shop.w, 8);
      const stripes = 10;
      for (let i = 0; i < stripes; i++) {
        deco.fillStyle(i % 2 === 0 ? shop.awningA : shop.awningB, 1);
        const sx = shop.x + (shop.w / stripes) * i;
        deco.fillTriangle(sx, 118, sx + shop.w / stripes, 118, sx + shop.w / stripes / 2, 152);
      }
      deco.fillStyle(shop.signBg, 1);
      deco.fillRect(shop.x + 24, 168, shop.w - 48, 46);
      deco.lineStyle(2, 0xf3ecdd, 0.8);
      deco.strokeRect(shop.x + 24, 168, shop.w - 48, 46);
      scene.add
        .text(shop.x + shop.w / 2, 191, shop.sign, {
          fontFamily: '"Noto Sans Telugu", "Noto Sans", system-ui, sans-serif',
          fontSize: '26px',
          color: '#f3ecdd'
        })
        .setOrigin(0.5)
        .setDepth(-9);
      deco.fillStyle(0x241a20, 1);
      deco.fillRect(shop.x + shop.w / 2 - 26, 222, 52, 48);
      deco.fillStyle(0xffd98b, 0.9);
      deco.fillRect(shop.x + 30, 226, 44, 34);
      deco.fillRect(shop.x + shop.w - 74, 226, 44, 34);
    }
  }

  if (theme.wires) {
    deco.lineStyle(2, 0x14101c, 1);
    for (const wire of theme.wires) {
      let prevX = wire.x0;
      let prevY = wire.y0;
      for (let i = 1; i <= 16; i++) {
        const t = i / 16;
        const x = wire.x0 + (wire.x1 - wire.x0) * t;
        const y = wire.y0 + (wire.y1 - wire.y0) * t + wire.sag * 4 * t * (1 - t);
        deco.lineBetween(prevX, prevY, x, y);
        prevX = x;
        prevY = y;
      }
    }
  }

  if (theme.crows) {
    deco.fillStyle(0x14101c, 1);
    for (const crow of theme.crows) {
      deco.fillEllipse(crow.x, crow.y, 16, 10);
      deco.fillCircle(crow.x + 8, crow.y - 3, 5);
      deco.fillTriangle(crow.x + 12, crow.y - 4, crow.x + 17, crow.y - 2, crow.x + 12, crow.y);
      deco.fillTriangle(crow.x - 8, crow.y, crow.x - 14, crow.y - 5, crow.x - 13, crow.y + 1);
    }
  }

  if (theme.swags) {
    for (const swag of theme.swags) {
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const x = swag.x0 + (swag.x1 - swag.x0) * t;
        const y = swag.y0 + (swag.y1 - swag.y0) * t + 26 * 4 * t * (1 - t);
        deco.fillStyle(i % 2 === 0 ? 0xe07b39 : 0xffd94d, 1);
        deco.fillCircle(x, y, 4);
      }
    }
  }

  if (theme.locketWindow) {
    const { x, y } = theme.locketWindow;
    deco.fillStyle(0x2e1a2e, 1);
    deco.fillRect(x - 34, y - 44, 68, 88);
    deco.fillStyle(0xffd98b, 1);
    deco.fillRect(x - 26, y - 36, 52, 72);
    deco.lineStyle(4, 0x2e1a2e, 1);
    deco.lineBetween(x, y - 36, x, y + 36);
    deco.lineBetween(x - 26, y, x + 26, y);
    deco.fillStyle(0xe05a7a, 1);
    deco.fillCircle(x - 6, y - 6, 9);
    deco.fillCircle(x + 6, y - 6, 9);
    deco.fillTriangle(x - 14, y - 1, x + 14, y - 1, x, y + 14);
  }

  if (theme.books) {
    const floorTop = H - 64;
    for (const book of theme.books) {
      deco.fillStyle(0x100c18, 1);
      deco.fillRect(book.x - 3, floorTop - book.h - 3, book.w + 6, book.h + 3);
      deco.fillStyle(book.color, 1);
      deco.fillRect(book.x, floorTop - book.h, book.w, book.h);
      deco.fillStyle(0xf3ecdd, 0.85);
      deco.fillRect(book.x + 5, floorTop - book.h + 10, book.w - 10, 8);
      deco.fillStyle(0x100c18, 0.6);
      deco.fillRect(book.x, floorTop - book.h, 4, book.h);
    }
  }

  if (theme.cupLake) {
    const cup = theme.cupLake;
    deco.fillStyle(0xe8ded0, 1);
    deco.fillEllipse(cup.x, cup.y, cup.rx * 2, cup.ry * 2);
    deco.fillStyle(0x8e4e2e, 1);
    deco.fillEllipse(cup.x, cup.y - 3, cup.rx * 1.7, cup.ry * 1.6);
    deco.fillStyle(0xffffff, 0.5);
    deco.fillEllipse(cup.x - cup.rx * 0.4, cup.y - 8, cup.rx * 0.5, 6);
  }

  if (theme.lamp) {
    const lamp = theme.lamp;
    deco.lineStyle(6, 0x2e2a38, 1);
    deco.lineBetween(lamp.x - 40, 300, lamp.x, lamp.y + 20);
    deco.fillStyle(0x2e2a38, 1);
    deco.fillTriangle(lamp.x - 34, lamp.y - 8, lamp.x + 34, lamp.y - 8, lamp.x, lamp.y + 26);
    deco.fillStyle(0xffd98b, 1);
    deco.fillTriangle(lamp.x - 24, lamp.y - 4, lamp.x + 24, lamp.y - 4, lamp.x, lamp.y + 20);
    deco.fillStyle(0xffd98b, 0.06);
    deco.fillTriangle(lamp.x - 22, lamp.y + 20, lamp.x + 22, lamp.y + 20, lamp.x + 90, 470);
    deco.fillTriangle(lamp.x - 22, lamp.y + 20, lamp.x + 22, lamp.y + 20, lamp.x - 90, 470);
  }

  if (theme.nightWindow) {
    const win = theme.nightWindow;
    deco.fillStyle(0x1d1430, 1);
    deco.fillRect(win.x - win.w / 2 - 8, win.y - win.h / 2 - 8, win.w + 16, win.h + 16);
    deco.fillStyle(0x0e1a3e, 1);
    deco.fillRect(win.x - win.w / 2, win.y - win.h / 2, win.w, win.h);
    deco.fillStyle(0xf3ecdd, 0.95);
    deco.fillCircle(win.x + win.w / 4, win.y - win.h / 4, 10);
    deco.fillStyle(0x0e1a3e, 1);
    deco.fillCircle(win.x + win.w / 4 + 4, win.y - win.h / 4 - 4, 8);
    deco.lineStyle(5, 0x1d1430, 1);
    deco.lineBetween(win.x, win.y - win.h / 2, win.x, win.y + win.h / 2);
    deco.lineBetween(win.x - win.w / 2, win.y, win.x + win.w / 2, win.y);
  }

  if (theme.locket) {
    const lock = theme.locket;
    const s = lock.s;
    deco.fillStyle(0xe05a7a, 1);
    deco.fillCircle(lock.x - 6 * s, lock.y - 6 * s, 9 * s);
    deco.fillCircle(lock.x + 6 * s, lock.y - 6 * s, 9 * s);
    deco.fillTriangle(lock.x - 14 * s, lock.y - s, lock.x + 14 * s, lock.y - s, lock.x, lock.y + 14 * s);
    deco.fillStyle(0xffffff, 0.55);
    deco.fillCircle(lock.x - 9 * s, lock.y - 9 * s, 3 * s);
  }

  if (theme.nets) {
    for (const net of theme.nets) {
      deco.fillStyle(0xf3ecdd, 0.16);
      deco.fillRect(net.x, 0, net.w, net.h);
      deco.lineStyle(1, 0xf3ecdd, 0.35);
      for (let lx = net.x + 12; lx < net.x + net.w; lx += 14) {
        deco.lineBetween(lx, 0, lx, net.h);
      }
      for (let ly = 14; ly < net.h; ly += 16) {
        deco.lineBetween(net.x, ly, net.x + net.w, ly);
      }
      deco.fillStyle(0xf3ecdd, 0.5);
      deco.fillRect(net.x, net.h - 8, net.w, 8);
      deco.fillStyle(0x8a8598, 1);
      deco.fillRect(net.x + net.w / 2 - 4, 0, 8, 18);
    }
  }

  if (theme.coils) {
    for (const coil of theme.coils) {
      deco.fillStyle(0x2e2a38, 1);
      deco.fillEllipse(coil.x, coil.y, 56, 20);
      deco.lineStyle(4, 0x8a7a4a, 1);
      deco.strokeCircle(coil.x, coil.y - 12, 12);
      deco.strokeCircle(coil.x, coil.y - 12, 6);
      deco.fillStyle(0xe07b39, 1);
      deco.fillCircle(coil.x, coil.y - 12, 3);
    }
  }

  if (theme.vaporizers) {
    for (const vap of theme.vaporizers) {
      deco.fillStyle(0x2e8e9e, 1);
      deco.fillRoundedRect(vap.x - 20, vap.y - 30, 40, 56, 6);
      deco.fillStyle(0xf3ecdd, 1);
      deco.fillRect(vap.x - 12, vap.y - 20, 24, 18);
      deco.fillStyle(0x3fa7d6, 1);
      deco.fillCircle(vap.x, vap.y + 16, 5);
      deco.fillStyle(0x14101c, 1);
      deco.fillRect(vap.x - 3, vap.y - 44, 6, 14);
    }
  }

  if (theme.placard) {
    const pl = theme.placard;
    deco.fillStyle(0x8e2f2f, 1);
    deco.fillRect(pl.x - 110, pl.y - 34, 220, 68);
    deco.lineStyle(3, 0xf3ecdd, 1);
    deco.strokeRect(pl.x - 110, pl.y - 34, 220, 68);
    deco.fillStyle(0x2e2a38, 1);
    deco.fillRect(pl.x - 80, pl.y + 34, 10, 50);
    deco.fillRect(pl.x + 70, pl.y + 34, 10, 50);
    scene.add
      .text(pl.x, pl.y - 8, '⚠ PEST CONTROL', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffd94d'
      })
      .setOrigin(0.5)
      .setDepth(-9);
    scene.add
      .text(pl.x, pl.y + 16, 'జాగ్రత్త', {
        fontFamily: '"Noto Sans Telugu", "Noto Sans", system-ui, sans-serif',
        fontSize: '18px',
        color: '#f3ecdd'
      })
      .setOrigin(0.5)
      .setDepth(-9);
  }

  if (theme.sanctum) {
    const cx = 480;
    const cy = 400;
    // Kalam rangoli: black base, five powder colors.
    deco.fillStyle(0x0e0a14, 1);
    deco.fillCircle(cx, cy, 120);
    deco.lineStyle(4, 0xf3ecdd, 1);
    deco.strokeCircle(cx, cy, 112);
    deco.lineStyle(5, 0xd05a5a, 1);
    deco.strokeCircle(cx, cy, 92);
    deco.lineStyle(5, 0xe8b93d, 1);
    deco.strokeCircle(cx, cy, 72);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = cx + Math.cos(angle) * 52;
      const py = cy + Math.sin(angle) * 52;
      deco.fillStyle(i % 2 === 0 ? 0x4e9e4e : 0xf3ecdd, 1);
      deco.fillEllipse(px, py, 30, 16);
    }
    deco.fillStyle(0xe8b93d, 1);
    deco.fillCircle(cx, cy, 14);
    // Corner diyas.
    for (const [dx, dy] of [[340, 330], [620, 330], [340, 470], [620, 470]] as const) {
      deco.fillStyle(0x8a5a30, 1);
      deco.fillEllipse(dx, dy, 26, 12);
      deco.fillStyle(0xe07b39, 1);
      deco.fillEllipse(dx, dy - 8, 10, 12);
      deco.fillStyle(0xffd94d, 1);
      deco.fillEllipse(dx, dy - 10, 5, 7);
    }
    // Banana-leaf offering trays.
    for (const ox of [150, 810]) {
      deco.fillStyle(0x2e7e2e, 1);
      deco.fillRoundedRect(ox - 55, 452, 110, 30, 8);
      deco.fillStyle(0x8a5a30, 1);
      deco.fillCircle(ox - 28, 462, 11);
      deco.fillStyle(0xe8d94d, 1);
      deco.fillEllipse(ox + 8, 464, 34, 12);
      deco.fillStyle(0x8e2f2f, 1);
      deco.fillRect(ox + 30, 456, 16, 16);
    }
    // Robed silhouette with fire bowl.
    deco.fillStyle(0x0e0a14, 1);
    deco.fillTriangle(440, 190, 520, 190, 480, 60);
    deco.fillCircle(480, 52, 16);
    deco.fillTriangle(468, 62, 492, 62, 480, 84);
    deco.fillStyle(0x8e2f2f, 1);
    for (let i = 0; i < 5; i++) deco.fillCircle(468 + i * 6, 120 + (i % 2) * 8, 2.5);
    deco.fillStyle(0x3e2a1e, 1);
    deco.fillEllipse(540, 130, 44, 18);
    deco.fillStyle(0xe07b39, 1);
    deco.fillEllipse(540, 120, 26, 18);
    deco.fillStyle(0xffd94d, 1);
    deco.fillEllipse(540, 116, 12, 10);
  }

  if (theme.mansion) {
    // Pillar colonnade across the back.
    for (let i = 0; i < 6; i++) {
      const px = 80 + i * 160;
      deco.fillStyle(0x8a8a9a, 1);
      deco.fillRect(px - 22, 120, 44, 150);
      deco.fillStyle(0xb0b0c0, 1);
      deco.fillRect(px - 22, 120, 14, 150);
      deco.fillStyle(0x6a6a7a, 1);
      deco.fillRect(px - 30, 108, 60, 14);
      deco.fillRect(px - 30, 268, 60, 14);
    }
    // Chandelier: chain, arms, candles.
    deco.lineStyle(4, 0x2e2a38, 1);
    deco.lineBetween(480, 0, 480, 96);
    deco.fillStyle(0x8a6a2a, 1);
    deco.fillCircle(480, 120, 10);
    for (const ax of [430, 455, 505, 530]) {
      deco.lineStyle(3, 0x8a6a2a, 1);
      deco.lineBetween(480, 118, ax, 140);
      deco.fillStyle(0xf3ecdd, 1);
      deco.fillRect(ax - 3, 128, 6, 14);
      deco.fillStyle(0xffd94d, 1);
      deco.fillCircle(ax, 126, 4);
    }
    // Marble checker floor.
    for (let mx = 0; mx < 960; mx += 48) {
      for (let my = 360; my < 476; my += 48) {
        const even = (mx / 48 + my / 48) % 2 === 0;
        deco.fillStyle(even ? 0xd8d0c0 : 0x2e2e3e, 1);
        deco.fillRect(mx, my, 48, 44);
      }
    }
    // Pooja corner: brass stand, idol glow, diyas.
    deco.fillStyle(0x8a6a2a, 1);
    deco.fillRect(88, 400, 64, 10);
    deco.fillRect(116, 340, 8, 60);
    deco.fillStyle(0xe8b93d, 1);
    deco.fillEllipse(120, 330, 30, 40);
    deco.fillStyle(0xfff2b0, 1);
    deco.fillCircle(120, 322, 6);
    for (const [dx, dy] of [[96, 392], [144, 392]] as const) {
      deco.fillStyle(0x8a5a30, 1);
      deco.fillEllipse(dx, dy, 18, 9);
      deco.fillStyle(0xffd94d, 1);
      deco.fillEllipse(dx, dy - 7, 7, 9);
    }
    // CCTV domes with red eyes.
    for (const cx of [300, 660]) {
      deco.fillStyle(0x1d1d28, 1);
      deco.fillCircle(cx, 96, 16);
      deco.fillStyle(0x2e2e3e, 1);
      deco.fillRect(cx - 16, 78, 32, 8);
      deco.fillStyle(0xd03a3a, 1);
      deco.fillCircle(cx, 100, 4);
    }
    // Lawn strip with pool shimmer.
    deco.fillStyle(0x1e4e1e, 1);
    deco.fillRect(0, 300, 90, 60);
    deco.fillStyle(0x3fa7d6, 1);
    deco.fillEllipse(45, 330, 66, 30);
    deco.fillStyle(0xa8e6f0, 0.8);
    deco.fillEllipse(36, 326, 30, 8);
  }

  if (theme.highway) {    // City-glow horizon + asphalt with lane dashes.    // City-glow horizon + asphalt with lane dashes.
    deco.fillStyle(0xe08a4e, 0.22);
    deco.fillRect(0, 250, 960, 50);
    deco.fillStyle(0x1d1d28, 1);
    deco.fillRect(0, 300, 960, 240);
    deco.fillStyle(0xe8b93d, 1);
    for (let x = 20; x < 960; x += 90) deco.fillRect(x, 396, 46, 6);
    deco.fillStyle(0xf3ecdd, 0.7);
    for (let x = 20; x < 960; x += 90) deco.fillRect(x, 336, 46, 4);
    deco.fillRect(0, 306, 960, 4);
    // Guard rails.
    deco.fillStyle(0x8a8598, 1);
    deco.fillRect(0, 288, 960, 5);
    for (let x = 40; x < 960; x += 80) deco.fillRect(x, 268, 7, 24);
    // Streetlight poles under the glow pools.
    deco.fillStyle(0x2e2a38, 1);
    for (const lx of [160, 480, 800]) {
      deco.fillRect(lx - 4, 170, 8, 120);
      deco.fillRect(lx - 4, 170, 60, 8);
      deco.fillStyle(0xfff2cc, 1);
      deco.fillCircle(lx + 52, 182, 7);
      deco.fillStyle(0x2e2a38, 1);
    }
    // Airport sign, English + Telugu.
    deco.fillStyle(0x1d3a2e, 1);
    deco.fillRect(700, 96, 220, 76);
    deco.lineStyle(3, 0xf3ecdd, 0.9);
    deco.strokeRect(700, 96, 220, 76);
    deco.fillStyle(0x2e2a38, 1);
    deco.fillRect(720, 172, 10, 60);
    deco.fillRect(890, 172, 10, 60);
    scene.add
      .text(810, 122, '✈ Airport', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        color: '#f3ecdd'
      })
      .setOrigin(0.5)
      .setDepth(-9);
    scene.add
      .text(810, 150, 'విమానాశ్రయం', {
        fontFamily: '"Noto Sans Telugu", "Noto Sans", system-ui, sans-serif',
        fontSize: '20px',
        color: '#e8b04b'
      })
      .setOrigin(0.5)
      .setDepth(-9);
  }

  if (theme.workshop) {
    // Pegboard wall with hanging tools.
    deco.fillStyle(0x6e4a2e, 1);
    deco.fillRect(60, 60, 840, 130);
    deco.fillStyle(0x4a2f1d, 1);
    for (let gx = 80; gx < 880; gx += 28) {
      for (let gy = 78; gy < 178; gy += 24) deco.fillCircle(gx, gy, 2.5);
    }
    deco.lineStyle(5, 0xc9c4d4, 1);
    deco.lineBetween(200, 90, 200, 160);
    deco.lineBetween(740, 90, 760, 160);
    deco.fillStyle(0xd05a5a, 1);
    deco.fillCircle(200, 168, 9);
    deco.fillRect(752, 160, 16, 16);

    // Blueprint papers: needle + cannon sketches.
    for (const [bx, by] of [[70, 210], [790, 210]]) {
      deco.fillStyle(0xe8ded0, 1);
      deco.fillRect(bx, by, 100, 70);
      deco.lineStyle(2, 0x2e4a6e, 1);
      deco.lineBetween(bx + 12, by + 35, bx + 88, by + 35);
      deco.lineBetween(bx + 50, by + 12, bx + 50, by + 58);
      deco.strokeCircle(bx + 72, by + 48, 10);
    }

    // Thread spools.
    for (const [sx, sy, col] of [[130, 400, 0xd05a5a], [200, 415, 0x2e8e8e]] as const) {
      deco.fillStyle(0x8a5a30, 1);
      deco.fillRect(sx - 20, sy - 44, 40, 56);
      deco.fillStyle(col, 1);
      deco.fillRect(sx - 20, sy - 36, 40, 40);
      deco.fillStyle(0x5a3a20, 1);
      deco.fillRect(sx - 26, sy - 50, 52, 8);
      deco.fillRect(sx - 26, sy + 12, 52, 8);
    }

    // Thimble dome.
    deco.fillStyle(0x8a8598, 1);
    deco.fillEllipse(480, 330, 90, 64);
    deco.fillStyle(0xc9c4d4, 1);
    deco.fillEllipse(474, 322, 70, 46);
    deco.fillStyle(0x5a5468, 1);
    for (let dx = -24; dx <= 24; dx += 12) {
      for (let dy = -12; dy <= 12; dy += 12) deco.fillCircle(474 + dx, 322 + dy, 2);
    }

    // Pincushion with needle rack.
    deco.fillStyle(0x8e2f2f, 1);
    deco.fillEllipse(770, 420, 110, 56);
    deco.fillStyle(0xd05a5a, 1);
    deco.fillEllipse(764, 412, 90, 40);
    deco.lineStyle(4, 0xc9c4d4, 1);
    for (const [nx, lean] of [[730, -14], [755, -6], [782, 4], [806, 12]] as const) {
      deco.lineBetween(nx, 400, nx + lean, 300);
      deco.strokeCircle(nx + lean, 296, 5);
    }

    // Treadmill belt with rollers.
    deco.fillStyle(0x2e2a38, 1);
    deco.fillRoundedRect(360, 452, 240, 30, 14);
    deco.fillStyle(0x8a8598, 1);
    deco.fillCircle(372, 467, 12);
    deco.fillCircle(588, 467, 12);
    deco.fillStyle(0x2e2a38, 1);
    deco.fillCircle(372, 467, 5);
    deco.fillCircle(588, 467, 5);
    deco.lineStyle(3, 0xc9c4d4, 1);
    deco.lineBetween(360, 444, 600, 444);

    // Dumbbells.
    for (const dx of [300, 660]) {
      deco.fillStyle(0x5a5468, 1);
      deco.fillRect(dx - 34, 446, 68, 8);
      deco.fillStyle(0x2e2a38, 1);
      deco.fillRect(dx - 40, 436, 12, 28);
      deco.fillRect(dx + 28, 436, 12, 28);
    }

    // Covered cannon in the corner (foreshadowing).
    deco.fillStyle(0x3e4a3e, 1);
    deco.fillTriangle(852, 230, 928, 230, 918, 120);
    deco.fillTriangle(852, 230, 890, 120, 918, 120);
    deco.fillStyle(0x2e382e, 1);
    deco.fillRect(848, 226, 84, 10);
    deco.lineStyle(3, 0x8a7a4a, 1);
    deco.lineBetween(870, 228, 878, 160);
    deco.lineBetween(910, 228, 902, 160);
  }

  for (let i = 0; i < 15; i++) {
    scene.add
      .image(i * 64 + 32, H - 32, SAND_TILES[i % SAND_TILES.length])
      .setScale(4)
      .setTint(theme.floorTint)
      .setDepth(-8);
  }

  if (theme.grass) {
    for (let i = 0; i < 12; i++) {
      scene.add
        .image(40 + i * 80, H - 70 - (i % 3) * 10, `grass-${(i % 5) + 1}`)
        .setScale(2)
        .setDepth(-7);
    }
  }

  for (const prop of theme.props) {
    scene.add
      .image(prop.x, prop.y, prop.tex)
      .setScale(prop.scale)
      .setTint(prop.tint)
      .setAlpha(prop.alpha ?? 1)
      .setDepth(-7);
  }

  const drifters: Drifter[] = [];
  for (let i = 0; i < theme.clouds; i++) {
    const cloud = scene.add
      .image(Phaser.Math.Between(0, W), 50 + ((i * 67) % 180), `cloud-${(i % 4) + 1}`)
      .setScale(0.4 + (i % 3) * 0.15)
      .setAlpha(0.7)
      .setDepth(-6);
    drifters.push({ obj: cloud, speed: 5 + (i % 3) * 4, minX: -160, maxX: W + 160 });
  }

  if (theme.auto) {
    if (!scene.textures.exists('auto-rickshaw')) {
      const g = scene.add.graphics();
      g.fillStyle(0x14101c, 1);
      g.fillCircle(28, 56, 10);
      g.fillCircle(92, 56, 10);
      g.fillCircle(60, 58, 8);
      g.fillStyle(0x1d1d28, 1);
      g.fillRect(14, 26, 92, 28);
      g.fillStyle(0xe8b93d, 1);
      g.fillRect(14, 40, 92, 14);
      g.fillStyle(0x24242e, 1);
      g.fillRect(20, 8, 80, 20);
      g.fillStyle(0xe8b93d, 1);
      g.fillRect(20, 8, 80, 6);
      g.fillStyle(0xffd98b, 0.9);
      g.fillRect(78, 14, 22, 16);
      g.fillStyle(0x14101c, 1);
      g.fillCircle(52, 22, 8);
      g.fillRect(44, 28, 16, 14);
      g.fillStyle(0xfff2b0, 1);
      g.fillCircle(108, 42, 4);
      g.generateTexture('auto-rickshaw', 120, 70);
      g.destroy();
    }
    const auto = scene.add.image(-220, 452, 'auto-rickshaw').setScale(2).setDepth(-7);
    drifters.push({ obj: auto, speed: 70, minX: -220, maxX: W + 220 });
  }

  const flickers: Flicker[] = [];
  theme.glows.forEach((glow, index) => {
    if (theme.torchAtGlows) {
      scene.add
        .image(glow.x, glow.y + 34, 'dung-126')
        .setScale(3)
        .setDepth(-7);
    }
    const tex = index % 2 === 0 ? 'glow-light' : 'glow-flame';
    const obj = scene.add
      .image(glow.x, glow.y, tex)
      .setScale(glow.scale)
      .setTint(glow.color)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.8)
      .setDepth(-6);
    flickers.push({ obj, phase: index * 1.7, speed: 3 + (index % 3), base: 0.8 });
  });

  let time = 0;
  const setGlows = (on: boolean) => {
    for (const flicker of flickers) flicker.obj.setVisible(on);
  };
  setGlows(opts.glows ?? true);
  const windLayer = scene.add.graphics().setDepth(-6);
  const decals: { zones: { x: number; y: number; r: number }[]; tint: number }[] = [];
  const showWind = (zones: { x: number; y: number; r: number }[], tint = 0xa8e6e0) => {
    decals.push({ zones, tint });
    windLayer.clear();
    for (const decal of decals) {
      for (const zone of decal.zones) {
        windLayer.fillStyle(decal.tint, 0.07);
        windLayer.fillEllipse(zone.x, zone.y, zone.r * 2, zone.r * 2);
        windLayer.fillStyle(decal.tint, 0.1);
        windLayer.fillEllipse(zone.x, zone.y, zone.r * 1.2, zone.r * 1.2);
      }
    }
  };
  const rain: { obj: Phaser.GameObjects.Image; speed: number }[] = [];
  if (theme.rain) {
    for (let i = 0; i < theme.rain; i++) {
      const drop = scene.add
        .image(Phaser.Math.Between(0, W), Phaser.Math.Between(-H, H), 'rain-drop')
        .setScale(0.8)
        .setAlpha(0.45)
        .setTint(0x8ab8d8)
        .setRotation(-0.12)
        .setDepth(-5);
      rain.push({ obj: drop, speed: 480 + (i % 5) * 40 });
    }
  }
  if (theme.ash) {
    for (let i = 0; i < theme.ash; i++) {
      const puff = scene.add
        .image(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), 'ash-puff')
        .setScale(0.9 + (i % 3) * 0.3)
        .setAlpha(0.28)
        .setTint(0xb0a0c0)
        .setDepth(-5);
      rain.push({ obj: puff, speed: 14 + (i % 4) * 5 });
    }
  }
  return {
    update(dt: number): void {
      time += dt;
      for (const drifter of drifters) {
        let x = drifter.obj.x + drifter.speed * dt;
        if (x > drifter.maxX) x = drifter.minX;
        drifter.obj.setX(x);
      }
      for (const drop of rain) {
        let y = drop.obj.y + drop.speed * dt;
        if (y > H + 20) {
          y = -20;
          drop.obj.setX(Phaser.Math.Between(0, W));
        }
        drop.obj.setY(y);
      }
      for (const flicker of flickers) {
        if (!flicker.obj.visible) continue;
        flicker.obj.setAlpha(flicker.base + Math.sin(time * flicker.speed + flicker.phase) * 0.18);
      }
    },
    setGlows,
    showWind
  };
}
