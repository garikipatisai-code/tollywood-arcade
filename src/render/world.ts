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
    skyTop: 0x1d3a4e,
    skyBottom: 0x4a8e8e,
    ground: 0x14202e,
    floorTint: 0x5a7a72,
    grass: false,
    trees: [{ tex: 'tree-4', x: 480, y: 320, scale: 3, tint: 0x2e6e66, alpha: 0.5 }],
    castles: false,
    props: [],
    clouds: 3,
    glows: [{ x: 480, y: 250, color: 0xa8e6e0, scale: 2 }],
    torchAtGlows: false
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
    torchAtGlows: true
  },
  ch4: {
    skyTop: 0x4e1d2e,
    skyBottom: 0xe05a4e,
    ground: 0x38141e,
    floorTint: 0xc08878,
    grass: false,
    trees: [
      { tex: 'tree-1', x: 100, y: 330, scale: 2.4, tint: 0x8e3a3a, alpha: 0.6 },
      { tex: 'tree-5', x: 860, y: 330, scale: 2.4, tint: 0x8e3a3a, alpha: 0.6 }
    ],
    castles: false,
    props: [
      { tex: 'dung-68', x: 480, y: 470, scale: 3, tint: BERING },
      { tex: 'dung-29', x: 480, y: 180, scale: 3, tint: BERING }
    ],
    clouds: 2,
    glows: [{ x: 480, y: 180, color: 0xffb060, scale: 3 }],
    torchAtGlows: false
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
    glows: [{ x: 480, y: 460, color: 0x90ff60, scale: 2 }],
    torchAtGlows: false
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
      { x: 720, y: 270, color: 0xb06aff, scale: 2.6 }
    ],
    torchAtGlows: true
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
      { x: 630, y: 430, color: 0xffb060, scale: 1.8 }
    ],
    torchAtGlows: true
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
}

export interface WorldView {
  update(dt: number): void;
  setGlows(on: boolean): void;
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
  return {
    update(dt: number): void {
      time += dt;
      for (const drifter of drifters) {
        let x = drifter.obj.x + drifter.speed * dt;
        if (x > drifter.maxX) x = drifter.minX;
        drifter.obj.setX(x);
      }
      for (const flicker of flickers) {
        if (!flicker.obj.visible) continue;
        flicker.obj.setAlpha(flicker.base + Math.sin(time * flicker.speed + flicker.phase) * 0.18);
      }
    },
    setGlows
  };
}
