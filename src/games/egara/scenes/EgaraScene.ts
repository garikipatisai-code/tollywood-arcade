import Phaser from 'phaser';
import { AudioController, bindUnlock } from '../../../core/audio';
import type { Hud } from '../../../core/hud';
import {
  InputMap,
  bindingsFrom,
  gamepadAxis,
  mergeAxes,
  pointerAxis,
  type Action,
  type Axis
} from '../../../core/input';
import { translate, type MessageKey } from '../../../core/i18n';
import { loadSave, persistSave, withBest, withMuted, withRemap } from '../../../core/save';
import { createDirector, stepDirector, type Director } from '../../../engines/shooter/director';
import {
  MAX_STEPS,
  STEP,
  createWorld,
  stepWorld,
  type EnemyKind,
  type SimInput,
  type World
} from '../../../engines/shooter/sim';
import { EGARA_TUNING, EGARA_WAVES } from '../content';

const COLORS = {
  bg: 0x120f18,
  grid: 0x241b33,
  bullet: 0xffe9a8
};

const FRAME: Record<EnemyKind, number> = { swatter: 1, spray: 2, spider: 3, boss: 4 };
const SOUND_KEYS = ['sting', 'hit', 'boss', 'win', 'lose'] as const;

export class EgaraScene extends Phaser.Scene {
  private world!: World;
  private director!: Director;
  private graphics!: Phaser.GameObjects.Graphics;
  private audio!: AudioController;
  private inputMap!: InputMap;
  private save = loadSave();
  private acc = 0;
  private paused = false;
  private ended = false;
  private frames = 0;
  private dragOrigin: { x: number; y: number } | null = null;
  private drag: Axis = { x: 0, y: 0 };
  private prevPlayer = { x: 0, y: 0 };
  private prevEnemies: { x: number; y: number }[] = [];
  private prevBullets: { x: number; y: number }[] = [];
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprites: Phaser.GameObjects.Image[] = [];
  private bossSeen = false;
  private capturing: Action | null = null;
  private keyDetach?: () => void;
  private detach: (() => void)[] = [];

  constructor(private readonly hud: Hud) {
    super('Egara');
  }

  preload(): void {
    this.load.setPath(`${import.meta.env.BASE_URL}assets/egara`);
    this.load.spritesheet('sprites', 'sprites.png', { frameWidth: 16, frameHeight: 16 });
    for (const key of SOUND_KEYS) this.load.audio(key, `${key}.wav`);
  }

  create(): void {
    this.save = loadSave();
    this.inputMap = new InputMap(bindingsFrom(this.save.remaps));
    this.world = createWorld(randomSeed(), EGARA_TUNING);
    this.director = createDirector(EGARA_WAVES);
    this.acc = 0;
    this.paused = false;
    this.ended = false;
    this.bossSeen = false;
    this.frames = 0;

    this.prevPlayer = { x: this.world.player.x, y: this.world.player.y };
    this.prevEnemies = Array.from({ length: EGARA_TUNING.pools.enemies }, () => ({ x: 0, y: 0 }));
    this.prevBullets = Array.from({ length: EGARA_TUNING.pools.bullets }, () => ({ x: 0, y: 0 }));

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.graphics = this.add.graphics();

    this.playerSprite = this.add
      .image(0, 0, 'sprites', 0)
      .setOrigin(0.5)
      .setVisible(false);
    this.enemySprites = Array.from({ length: EGARA_TUNING.pools.enemies }, () =>
      this.add.image(0, 0, 'sprites', 1).setOrigin(0.5).setVisible(false)
    );

    this.audio = new AudioController(
      {
        play: (key) => {
          if (this.cache.audio.exists(key)) this.sound.play(key, { volume: 0.35 });
        },
        setMute: (muted) => {
          this.sound.mute = muted;
        }
      },
      {
        muted: this.save.muted,
        onMute: (muted) => {
          this.save = withMuted(this.save, muted);
          persistSave(this.save);
        }
      }
    );

    this.hud.hideMenu();
    this.hud.pauseButton.hidden = false;
    this.hud.setMuted(this.save.muted);
    this.hud.onPause(() => this.togglePause());
    this.hud.onResume(() => this.togglePause());
    this.hud.onRetry(() => this.scene.restart());
    this.hud.onMute(() => {
      const muted = this.audio.toggleMute();
      this.hud.setMuted(muted);
    });

    const unlock = bindUnlock(window, () => this.audio.unlock());
    this.detach.push(unlock, () => this.keyDetach?.(), () => this.stopCapture());
    this.attachKeys();

    this.bindPointer();
    this.bindPauseKey();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  update(_time: number, delta: number): void {
    this.frames++;

    if (!this.paused && !this.ended) {
      this.simulate(Math.min(delta / 1000, 0.25), this.readInput());
    }

    this.render(this.acc / STEP);
    this.refreshHud();
    this.checkEnd();

    if (this.paused) this.hud.setTime((this.world.runFramesMax - this.world.runFrames) / 60);
  }

  private simulate(dt: number, input: SimInput): void {
    const scoreBefore = this.world.score;
    const stingReady = input.sting && this.world.player.cooldownFrames === 0;
    let acc = Math.min(this.acc + dt, 0.25);
    let steps = 0;

    while (acc >= STEP && steps < MAX_STEPS && this.world.outcome === 'running') {
      this.capturePrevious();
      stepWorld(this.world, input);
      stepDirector(this.world, this.director);
      acc -= STEP;
      steps++;
    }

    this.acc = acc;

    if (stingReady && steps > 0) this.audio.play('sting');
    if (this.world.score > scoreBefore) this.audio.play('hit');

    if (!this.bossSeen && this.world.enemies.some((enemy) => enemy.alive && enemy.kind === 'boss')) {
      this.bossSeen = true;
      this.audio.play('boss');
    }
  }

  private capturePrevious(): void {
    this.prevPlayer.x = this.world.player.x;
    this.prevPlayer.y = this.world.player.y;

    this.world.enemies.forEach((enemy, index) => {
      this.prevEnemies[index].x = enemy.x;
      this.prevEnemies[index].y = enemy.y;
    });
    this.world.bullets.forEach((bullet, index) => {
      this.prevBullets[index].x = bullet.x;
      this.prevBullets[index].y = bullet.y;
    });
  }

  private readInput(): SimInput {
    const keyboard = this.inputMap.keyboardAxis();
    const touch = this.dragOrigin ? this.drag : { x: 0, y: 0 };
    const axis = mergeAxes([keyboard, touch, this.readGamepad()]);
    const sting = this.inputMap.isDown('sting') || this.dragOrigin !== null;

    return { x: axis.x, y: axis.y, sting };
  }

  private readGamepad(): Axis {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (pad) return gamepadAxis(pad);
    }
    return { x: 0, y: 0 };
  }

  private bindPointer(): void {
    const down = (pointer: Phaser.Input.Pointer) => {
      this.dragOrigin = { x: pointer.x, y: pointer.y };
      this.drag = { x: 0, y: 0 };
    };
    const move = (pointer: Phaser.Input.Pointer) => {
      if (!this.dragOrigin) return;
      this.drag = pointerAxis(pointer.x - this.dragOrigin.x, pointer.y - this.dragOrigin.y, 48);
    };
    const up = () => {
      this.dragOrigin = null;
      this.drag = { x: 0, y: 0 };
    };

    this.input.on('pointerdown', down);
    this.input.on('pointermove', move);
    this.input.on('pointerup', up);
    this.input.on('pointerupoutside', up);
  }

  private bindPauseKey(): void {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape' && event.code !== 'KeyP') return;
      event.preventDefault();
      this.togglePause();
    };
    window.addEventListener('keydown', onKey);
    this.detach.push(() => window.removeEventListener('keydown', onKey));
  }

  private togglePause(): void {
    if (this.ended) return;

    this.paused = !this.paused;
    if (this.paused) {
      this.renderControls();
      this.hud.showMenu(translate(this.save.lang, 'game.pause'), '', true);
    } else {
      this.stopCapture();
      this.hud.hideMenu();
    }
  }

  private attachKeys(): void {
    this.keyDetach?.();
    this.keyDetach = this.inputMap.attach(window);
  }

  private renderControls(): void {
    const actions = Object.keys(this.inputMap.bindings) as Action[];
    this.hud.renderControls(
      actions.map((action) => ({
        action,
        label: translate(this.save.lang, `controls.${action}` as MessageKey),
        keys: this.inputMap.bindings[action].map(keyLabel)
      })),
      (action) => this.startCapture(action as Action)
    );
  }

  private startCapture(action: Action): void {
    this.stopCapture();
    this.capturing = action;
    this.hud.setCapturing(action);
    window.addEventListener('keydown', this.onCaptureKey, true);
  }

  private stopCapture(): void {
    if (!this.capturing) return;
    this.capturing = null;
    this.hud.setCapturing(null);
    window.removeEventListener('keydown', this.onCaptureKey, true);
  }

  private readonly onCaptureKey = (event: KeyboardEvent) => {
    const action = this.capturing;
    if (!action) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.code === 'Escape') {
      this.stopCapture();
      return;
    }

    this.save = withRemap(this.save, action, [event.code]);
    persistSave(this.save);
    this.inputMap = new InputMap(bindingsFrom(this.save.remaps));
    this.attachKeys();
    this.stopCapture();
    this.renderControls();
  };

  private refreshHud(): void {
    if (this.frames % 6 !== 0 && !this.ended) return;

    this.hud.setScore(this.world.score);
    this.hud.setLives(this.world.lives);
    this.hud.setTime((this.world.runFramesMax - this.world.runFrames) / 60);
  }

  private checkEnd(): void {
    if (this.ended || this.world.outcome === 'running') return;

    this.ended = true;
    this.hud.pauseButton.hidden = true;

    const won = this.world.outcome === 'won';
    this.save = withBest(this.save, 'egara', this.world.score);
    persistSave(this.save);
    this.audio.play(won ? 'win' : 'lose');

    const best = this.save.best.egara ?? this.world.score;
    this.hud.showMenu(
      translate(this.save.lang, won ? 'game.win' : 'game.lose'),
      `${translate(this.save.lang, 'game.score')}: ${this.world.score} · ${translate(this.save.lang, 'game.best', { score: best })}`,
      false
    );
  }

  private render(alpha: number): void {
    const g = this.graphics;
    const { width, height } = EGARA_TUNING;
    const blend = Phaser.Math.Clamp(alpha, 0, 1);

    g.clear();
    g.fillStyle(COLORS.bg, 1);
    g.fillRect(0, 0, width, height);

    g.lineStyle(1, COLORS.grid, 0.8);
    for (let x = 0; x <= width; x += 48) g.lineBetween(x, 0, x, height);
    for (let y = 0; y <= height; y += 48) g.lineBetween(0, y, width, y);

    this.world.bullets.forEach((bullet, index) => {
      if (!bullet.alive) return;
      const prev = this.prevBullets[index];
      g.fillStyle(COLORS.bullet, 1);
      g.fillCircle(lerp(prev.x, bullet.x, blend), lerp(prev.y, bullet.y, blend), bullet.radius);
    });

    this.world.enemies.forEach((enemy, index) => {
      const sprite = this.enemySprites[index];
      if (!enemy.alive) {
        sprite.setVisible(false);
        return;
      }

      const prev = this.prevEnemies[index];
      sprite
        .setVisible(true)
        .setFrame(FRAME[enemy.kind])
        .setPosition(lerp(prev.x, enemy.x, blend), lerp(prev.y, enemy.y, blend))
        .setDisplaySize(enemy.radius * 2, enemy.radius * 2);
    });

    const player = this.world.player;
    const px = lerp(this.prevPlayer.x, player.x, blend);
    const py = lerp(this.prevPlayer.y, player.y, blend);
    const blink = player.invulnFrames > 0 && Math.floor(this.frames / 4) % 2 === 0;

    this.playerSprite
      .setVisible(player.alive && !blink)
      .setPosition(px, py)
      .setDisplaySize(EGARA_TUNING.player.radius * 2.4, EGARA_TUNING.player.radius * 2.4);
  }

  private teardown(): void {
    this.stopCapture();
    for (const off of this.detach) off();
    this.detach = [];
  }
}

function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);

  const names: Record<string, string> = {
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    ArrowDown: '↓',
    Space: 'Space',
    Escape: 'Esc',
    Enter: 'Enter'
  };
  return names[code] ?? code;
}

function randomSeed(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}
