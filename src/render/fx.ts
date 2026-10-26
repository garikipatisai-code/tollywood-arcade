import type Phaser from 'phaser';

export interface Particle {
  alive: boolean;
  tex: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;
  fade: boolean;
}

/**
 * Fixed-pool CPU particles. Pure state — the scene mirrors alive entries
 * onto pooled Images. Visual-only: randomness here never touches the sim.
 */
export class FxPool {
  readonly parts: Particle[] = [];

  constructor(readonly capacity = 160) {
    for (let i = 0; i < capacity; i++) {
      this.parts.push({
        alive: false, tex: 'fx-circle', x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1, size: 4, gravity: 0, fade: true
      });
    }
  }

  get aliveCount(): number {
    let n = 0;
    for (const part of this.parts) if (part.alive) n++;
    return n;
  }

  spawn(
    tex: string, x: number, y: number, vx: number, vy: number,
    life: number, size: number, gravity = 0
  ): void {
    const slot = this.parts.find((part) => !part.alive);
    if (!slot) return;
    slot.alive = true;
    slot.tex = tex;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.life = life;
    slot.maxLife = life;
    slot.size = size;
    slot.gravity = gravity;
    slot.fade = true;
  }

  burst(tex: string, x: number, y: number, count: number, speed: number, life: number, size: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.4 + Math.random() * 0.6);
      this.spawn(tex, x, y, Math.cos(angle) * velocity, Math.sin(angle) * velocity, life * (0.7 + Math.random() * 0.6), size, 160);
    }
  }

  update(dt: number): void {
    for (const part of this.parts) {
      if (!part.alive) continue;
      part.life -= dt;
      if (part.life <= 0) {
        part.alive = false;
        continue;
      }
      part.vy += part.gravity * dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
    }
  }
}

export interface Fx {
  update(dt: number): void;
  applyQuality(rate: number, zoomPunches: boolean): void;
  killBurst(x: number, y: number, big: boolean): void;
  hitSpark(x: number, y: number): void;
  trail(x: number, y: number): void;
  stingPuff(x: number, y: number): void;
  punch(): void;
  bossIntro(): void;
}

/** Vendor particle textures. Called from the scene preload. */
export function fxPreload(load: Phaser.Loader.LoaderPlugin): void {
  load.setPath(`${import.meta.env.BASE_URL}assets/vendor/kenney/particles`);
  const files: Record<string, string> = {
    'fx-circle': 'circle_01.png',
    'fx-spark': 'spark_01.png',
    'fx-spark3': 'spark_03.png',
    'fx-smoke': 'smoke_02.png',
    'fx-flame': 'flame_02.png',
    'fx-trace': 'trace_02.png',
    'fx-slash': 'slash_02.png'
  };
  for (const [key, file] of Object.entries(files)) load.image(key, file);
}

/** Scene adapter: mirrors the pool onto Images, owns camera punches. */
export function createFx(
  scene: Phaser.Scene,
  opts: { pool?: FxPool; rate?: number; zoomPunches?: boolean } = {}
): Fx {
  const pool = opts.pool ?? new FxPool();
  let rate = opts.rate ?? 1;
  let zoomPunches = opts.zoomPunches ?? true;
  const views = pool.parts.map(() =>
    scene.add.image(-100, -100, 'fx-circle').setVisible(false).setDepth(8)
  );
  let zoomBusy = false;

  const show = (part: Particle, view: Phaser.GameObjects.Image) => {
    const t = part.life / part.maxLife;
    view
      .setVisible(true)
      .setTexture(part.tex)
      .setPosition(part.x, part.y)
      .setScale((part.size * (0.5 + t * 0.5)) / 32)
      .setAlpha(part.fade ? t * 0.9 : 0.9)
      .setBlendMode('ADD');
  };

  return {
    update(dt: number): void {
      pool.update(dt);
      pool.parts.forEach((part, index) => {
        const view = views[index];
        if (part.alive) show(part, view);
        else view.setVisible(false);
      });
    },
    applyQuality(nextRate: number, nextZoom: boolean): void {
      rate = nextRate;
      zoomPunches = nextZoom;
    },
    killBurst(x: number, y: number, big: boolean): void {
      const n = Math.max(2, Math.round((big ? 16 : 9) * rate));
      pool.burst('fx-spark', x, y, n, big ? 260 : 190, 0.55, big ? 10 : 7);
      pool.burst('fx-smoke', x, y, Math.max(1, Math.round((big ? 6 : 3) * rate)), 60, 0.9, big ? 16 : 11);
      pool.burst('fx-slash', x, y, 1, 40, 0.3, big ? 22 : 15);
    },
    hitSpark(x: number, y: number): void {
      if (Math.random() > rate) return;
      pool.burst('fx-spark3', x, y, 3, 150, 0.3, 6);
    },
    trail(x: number, y: number): void {
      if (Math.random() > rate) return;
      pool.spawn('fx-trace', x, y, (Math.random() - 0.5) * 20, 20 + Math.random() * 20, 0.5, 7);
    },
    stingPuff(x: number, y: number): void {
      if (Math.random() > rate) return;
      pool.burst('fx-circle', x, y, 2, 60, 0.25, 5);
    },
    punch(): void {
      if (zoomBusy || !zoomPunches) return;
      const camera = scene.cameras.main;
      if (camera.zoom !== 1) return;
      zoomBusy = true;
      const back = (_c: Phaser.Cameras.Scene2D.Camera, done: number) => {
        if (done >= 1) zoomBusy = false;
      };
      camera.zoomTo(1.07, 110, 'Sine.easeOut', undefined, (_cam, progress) => {
        if (progress >= 1) camera.zoomTo(1, 220, 'Sine.easeInOut', undefined, back);
      });
    },
    bossIntro(): void {
      if (zoomBusy || !zoomPunches) return;
      const camera = scene.cameras.main;
      zoomBusy = true;
      const back = (_c: Phaser.Cameras.Scene2D.Camera, done: number) => {
        if (done >= 1) zoomBusy = false;
      };
      camera.zoomTo(1.14, 700, 'Sine.easeInOut', undefined, (_cam, progress) => {
        if (progress >= 1) camera.zoomTo(1, 500, 'Sine.easeInOut', undefined, back);
      });
    }
  };
}
