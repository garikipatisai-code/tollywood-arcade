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
import { HitStop, ScreenShake, buzzMix } from '../../../core/feel';
import {
  QUALITY,
  initialTier,
  nextTier,
  persistQuality,
  pickTier,
  type QualityTier
} from '../../../core/quality';
import {
  loadSave,
  persistSave,
  withAmulet,
  withBest,
  withChapter,
  withMuted,
  withRemap,
  withShard,
  withUnlock,
  type SaveData
} from '../../../core/save';
import { createDirector, stepDirector, type Director } from '../../../engines/shooter/director';
import {
  BASE_SHARD_SLOTS,
  MAX_STEPS,
  SLOWMO_SCALE,
  STEP,
  createWorld,
  hazardActive,
  placeHazards,
  placeShards,
  placeSlowZones,
  placeWindZones,
  setParanoia,
  setShardSlots,
  stepWorld,
  type EnemyKind,
  type Loadout,
  type SimInput,
  type World
} from '../../../engines/shooter/sim';
import { CHAPTERS, CUTSCENES, CUT_ART, EGARA_TUNING, EGARA_WAVES, chapterStatus, type Chapter } from '../content';
import { MOODS, MusicEngine } from '../../../core/music';
import { createFx, fxPreload, type Fx } from '../../../render/fx';
import { buildWorld, worldPreload, type WorldView } from '../../../render/world';

const CHAPTER_UNLOCKS: Record<string, (keyof Loadout)[]> = {
  ch3: ['needle'],
  ch5: ['armor'],
  ch8: ['cannon']
};

const CHAPTER_GRADES: Record<string, string> = {
  ch1: 'saturate(1.15)',
  ch2: 'saturate(1.1) hue-rotate(10deg)',
  ch3: 'saturate(1.2) sepia(0.15)',
  ch4: 'saturate(1.25) hue-rotate(-10deg)',
  ch5: 'saturate(1.2)',
  ch6: 'saturate(1.1) hue-rotate(-25deg) brightness(0.95)',
  ch7: 'saturate(0.9) brightness(0.9) hue-rotate(15deg)',
  ch8: 'saturate(1.3) sepia(0.2)'
};

const COLORS = {
  bg: 0x120f18,
  grid: 0x241b33,
  bullet: 0xffe9a8,
  ring: 0xd05a5a
};

const FRAME: Record<EnemyKind, number> = { swatter: 1, spray: 2, spider: 3, boss: 4 };
const SOUND_KEYS = ['sting', 'hit', 'boss', 'win', 'lose', 'buzz', 'shard', 'thud'] as const;

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
  private readonly shake = new ScreenShake();
  private readonly hitStop = new HitStop();
  private chapter: Chapter | null = null;
  private ngplus = false;
  private chapterDone = false;
  private buzz: Phaser.Sound.BaseSound | null = null;
  private lastSpeed = 0;
  private worldView: WorldView | null = null;
  private fx: Fx | null = null;
  private music: MusicEngine | null = null;
  private seenEvents = 0;
  private tier: QualityTier = 'high';
  private autoQuality = true;
  private emaFps = 60;
  private memGb: number | undefined;
  private prevHp: number[] = [];
  private popUntil: number[] = [];

  constructor(private readonly hud: Hud) {
    super('Egara');
  }

  preload(): void {
    this.load.setPath(`${import.meta.env.BASE_URL}assets/egara`);
    this.load.spritesheet('sprites', 'sprites.png', { frameWidth: 24, frameHeight: 24 });
    for (const key of SOUND_KEYS) this.load.audio(key, `${key}.wav`);
    worldPreload(this.load);
    fxPreload(this.load);
  }

  create(): void {
    this.save = loadSave();
    this.inputMap = new InputMap(bindingsFrom(this.save.remaps));
    this.chapter = this.resolveChapter();
    this.ngplus = this.save.amulet && new URLSearchParams(window.location.search).get('ng') === '1';

    if (this.chapter) {
      this.world = createWorld(randomSeed(), EGARA_TUNING, this.chapter.loadout);
      setParanoia(this.world, this.chapter.paranoia);
      placeShards(this.world, this.chapter.shards);
      placeHazards(this.world, this.chapter.hazards ?? []);
      placeWindZones(this.world, this.chapter.wind ?? []);
      placeSlowZones(this.world, this.chapter.slow ?? []);
      setShardSlots(this.world, BASE_SHARD_SLOTS + (this.ngplus ? 1 : 0));
      this.director = createDirector(this.chapter.waves);
    } else {
      this.world = createWorld(randomSeed(), EGARA_TUNING);
      this.director = createDirector(EGARA_WAVES);
    }
    this.acc = 0;
    this.paused = false;
    this.ended = false;
    this.bossSeen = false;
    this.chapterDone = false;
    this.frames = 0;

    this.prevPlayer = { x: this.world.player.x, y: this.world.player.y };
    this.prevEnemies = Array.from({ length: EGARA_TUNING.pools.enemies }, () => ({ x: 0, y: 0 }));
    this.prevBullets = Array.from({ length: EGARA_TUNING.pools.bullets }, () => ({ x: 0, y: 0 }));

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.graphics = this.add.graphics();
    this.tier = initialTier();
    this.autoQuality = true;
    this.emaFps = 60;
    this.memGb = (globalThis.navigator as Navigator & { deviceMemory?: number })?.deviceMemory;
    const settings = QUALITY[this.tier];
    this.worldView = buildWorld(this, this.chapter ? this.chapter.id : 'sabotage', { glows: settings.glows });
    this.fx = createFx(this, { rate: settings.particles, zoomPunches: settings.zoomPunches });
    this.prevHp = this.world.enemies.map((enemy) => enemy.hp);
    this.popUntil = this.world.enemies.map(() => 0);
    const grade = this.chapter ? CHAPTER_GRADES[this.chapter.id] ?? '' : '';
    this.game.canvas.style.filter = grade;

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
        },
        startLoop: (key, rate, volume) => {
          this.stopBuzz();
          if (!this.cache.audio.exists(key)) return;
          this.buzz = this.sound.add(key);
          this.buzz.play({ loop: true, rate, volume });
        },
        tuneLoop: (volume) => {
          const node = this.buzz as unknown as { volumeNode?: { gain: { value: number } } } | null;
          if (node?.volumeNode) node.volumeNode.gain.value = volume;
        },
        stopLoop: () => this.stopBuzz()
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
    this.hud.onNext(() => this.goNextChapter());
    this.hud.onMute(() => {
      const muted = this.audio.toggleMute();
      this.hud.setMuted(muted);
      this.music?.setMuted(muted);
    });
    this.hud.setQualityLabel(`FX: ${this.tier[0].toUpperCase()}${this.tier.slice(1)}`);
    this.hud.onQuality(() => this.cycleQuality());

    const chapterIndex = this.chapter ? CHAPTERS.findIndex((c) => c.id === this.chapter!.id) : -1;
    this.music = new MusicEngine(MOODS[this.chapter ? this.chapter.id : 'sabotage'] ?? MOODS.sabotage, chapterIndex + 2);
    this.music.setMuted(this.save.muted);

    const unlock = bindUnlock(window, () => {
      this.audio.unlock();
      this.music?.start();
    });
    this.detach.push(unlock, () => this.keyDetach?.(), () => this.stopCapture());
    this.attachKeys();

    this.bindPointer();
    this.bindPauseKey();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
    this.audio.startLoop('buzz', 1, 0);

    if (this.chapter) {
      this.world.runFramesMax = this.chapter.timeSeconds * 60;
      this.worldView?.showWind(this.chapter.wind ?? []);
      if ((this.chapter.slow ?? []).length > 0) {
        this.worldView?.showWind(
          this.chapter.slow.map((zone) => ({ x: zone.x, y: zone.y, r: zone.r })),
          0xd8a04b
        );
      }
      this.paused = true;
      const cut = CUTSCENES.find((c) => c.id === this.chapter!.id);
      const base = `${import.meta.env.BASE_URL}assets/vendor/kenney`;
      const briefing = () => {
        this.hud.showMenu(
          translate(this.save.lang, this.chapter!.nameKey as MessageKey),
          translate(this.save.lang, this.chapter!.goalKey as MessageKey),
          true
        );
      };
      if (cut) {
        this.hud.showCutscene(
          cut.panels.map((panel) => ({
            imgUrl: panel.img ? `${base}/${CUT_ART[panel.img]}` : null,
            mood: panel.mood,
            caption: translate(this.save.lang, panel.caption as MessageKey)
          })),
          translate(this.save.lang, 'story.skip'),
          translate(this.save.lang, 'story.continue'),
          briefing
        );
      } else {
        briefing();
      }
    } else if (new URLSearchParams(window.location.search).get('select') === '1') {
      this.paused = true;
      this.hud.pauseButton.hidden = true;
      this.showSelect();
    }
  }

  private resolveChapter(): Chapter | null {
    const id = new URLSearchParams(window.location.search).get('ch');
    if (!id) return null;
    const index = CHAPTERS.findIndex((chapter) => chapter.id === id);
    if (index < 0) return null;
    if (index > 0 && !this.save.chapters[CHAPTERS[index - 1].id]?.unlocked) return null;
    return CHAPTERS[index];
  }

  private showSelect(): void {
    const lang = this.save.lang;
    const params = new URLSearchParams(window.location.search);
    const ngActive = params.get('ng') === '1' && this.save.amulet;

    this.hud.renderChapterSelect(
      {
        title: translate(lang, 'story.select'),
        backLabel: translate(lang, 'game.back'),
        lockedLabel: translate(lang, 'hub.locked'),
        bestLabel: translate(lang, 'game.score'),
        shardsLabel: translate(lang, 'story.shards'),
        ngLabel: translate(lang, 'story.ngplus'),
        ngActive,
        showNgToggle: this.save.amulet,
        cards: CHAPTERS.map((chapter, index) => ({
          id: chapter.id,
          name: translate(lang, chapter.nameKey as MessageKey),
          goal: translate(lang, chapter.goalKey as MessageKey),
          locked: index > 0 && !this.save.chapters[CHAPTERS[index - 1].id]?.unlocked,
          best: this.save.chapters[chapter.id]?.best ?? 0,
          shardsTaken: chapter.shards.filter((shard) => this.save.shards.includes(shard.id)).length,
          shardsTotal: chapter.shards.length
        }))
      },
      (id) => {
        window.location.search = `?ch=${id}${ngActive ? '&ng=1' : ''}`;
      },
      () => {
        window.location.search = ngActive ? '?select=1' : '?select=1&ng=1';
      }
    );
  }

  private goNextChapter(): void {
    if (!this.chapter) return;
    const index = CHAPTERS.findIndex((chapter) => chapter.id === this.chapter!.id);
    const next = CHAPTERS[index + 1];
    const ng = this.ngplus ? '&ng=1' : '';
    window.location.search = next ? `?ch=${next.id}${ng}` : '?select=1';
  }

  private onChapterComplete(): void {
    const chapter = this.chapter;
    if (!chapter || this.chapterDone) return;
    this.chapterDone = true;
    this.ended = true;
    this.hud.pauseButton.hidden = true;

    let save: SaveData = withChapter(this.save, chapter.id, this.world.score);
    for (const shard of this.world.shards) {
      if (shard.taken) save = withShard(save, shard.id);
    }
    for (const key of CHAPTER_UNLOCKS[chapter.id] ?? []) {
      save = withUnlock(save, key, true);
    }
    const index = CHAPTERS.findIndex((c) => c.id === chapter.id);
    const next = CHAPTERS[index + 1];
    if (next) save = withChapter(save, next.id, 0);

    let bonus = '';
    if (chapter.id === 'ch8') {
      save = withAmulet(save, true);
      bonus = ` · ${translate(save.lang, 'story.amulet.name')}`;
    }
    this.save = save;
    persistSave(save);
    this.audio.play('win');

    const best = save.chapters[chapter.id]?.best ?? this.world.score;
    this.hud.showMenu(
      translate(save.lang, 'story.complete'),
      `${translate(save.lang, 'game.score')}: ${this.world.score} · ${translate(save.lang, 'game.best', { score: best })}${bonus}`,
      false,
      next ? translate(save.lang, 'story.next') : undefined
    );
  }

  private cycleQuality(): void {
    this.autoQuality = false;
    this.applyTier(nextTier(this.tier));
    persistQuality(this.tier);
  }

  private applyTier(tier: QualityTier): void {
    this.tier = tier;
    const settings = QUALITY[tier];
    this.worldView?.setGlows(settings.glows);
    this.fx?.applyQuality(settings.particles, settings.zoomPunches);
    this.hud.setQualityLabel(`FX: ${tier[0].toUpperCase()}${tier.slice(1)}`);
  }

  update(_time: number, delta: number): void {
    this.frames++;
    const dt = Math.min(delta / 1000, 0.25);
    this.shake.update(dt);
    this.worldView?.update(dt);

    if (dt > 0) this.emaFps += (1 / dt - this.emaFps) * 0.05;
    if (this.autoQuality && this.frames % 240 === 0 && this.frames > 0) {
      const want = pickTier(this.emaFps, this.memGb);
      if (want !== this.tier) this.applyTier(want);
    }

    if (!this.paused && !this.ended) {
      this.simulate(dt, this.readInput());
      if (QUALITY[this.tier].trail && this.world.player.alive && this.lastSpeed > 0.3) {
        this.fx?.trail(this.world.player.x, this.world.player.y + 10);
      }
    }
    this.fx?.update(this.paused || this.ended ? 0 : dt);

    this.render(this.acc / STEP);
    this.refreshHud();

    if (this.chapter && !this.ended && !this.chapterDone && this.frames % 30 === 0) {
      if (chapterStatus(this.world, this.director, this.chapter) === 'complete') {
        this.onChapterComplete();
      }
    }
    this.checkEnd();

    if (this.paused) this.hud.setTime((this.world.runFramesMax - this.world.runFrames) / 60);
  }

  private simulate(dt: number, input: SimInput): void {
    const scoreBefore = this.world.score;
    const livesBefore = this.world.lives;
    const stingReady = input.sting && this.world.player.cooldownFrames === 0;
    const aliveBefore = this.world.enemies.map((enemy) => enemy.alive);
    const posBefore = this.world.enemies.map((enemy) => ({ x: enemy.x, y: enemy.y }));

    if (this.hitStop.consume()) return;

    const scaled = this.world.slowmoFrames > 0 ? dt * SLOWMO_SCALE : dt;
    let acc = Math.min(this.acc + scaled, 0.25);
    let steps = 0;

    while (acc >= STEP && steps < MAX_STEPS && this.world.outcome === 'running') {
      this.capturePrevious();
      stepWorld(this.world, input);
      stepDirector(this.world, this.director);
      acc -= STEP;
      steps++;
    }

    this.acc = acc;

    if (stingReady && steps > 0) {
      this.audio.play('sting');
      this.fx?.stingPuff(this.world.player.x, this.world.player.y - 24);
    }
    this.world.enemies.forEach((enemy, index) => {
      if (aliveBefore[index] && !enemy.alive) {
        this.fx?.killBurst(posBefore[index].x, posBefore[index].y, enemy.kind === 'boss');
        this.fx?.punch();
      } else if (enemy.alive && enemy.hp < this.prevHp[index]) {
        this.fx?.hitSpark(enemy.x, enemy.y);
        this.popUntil[index] = this.frames + 4;
      }
      this.prevHp[index] = enemy.hp;
    });
    if (this.world.score > scoreBefore) {
      this.audio.play('hit');
      this.shake.add(0.35);
      this.hitStop.trigger(3);
    }
    if (this.world.lives < livesBefore) {
      this.audio.play('thud');
      this.shake.add(0.6);
      this.hitStop.trigger(6);
    }

    if (!this.bossSeen && this.world.enemies.some((enemy) => enemy.alive && enemy.kind === 'boss')) {
      this.bossSeen = true;
      this.audio.play('boss');
      this.fx?.bossIntro();
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
    this.lastSpeed = Math.hypot(axis.x, axis.y);

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

    const alive = this.world.enemies.filter((enemy) => enemy.alive).length;
    const mix = buzzMix(this.world.paranoia, Math.min(1, alive / 8));
    this.audio.tuneLoop(mix.gain * 0.5);
    this.music?.setHeat(Math.max(this.world.paranoia / 100, Math.min(1, alive / 8)));

    const fresh = this.world.events.slice(this.seenEvents);
    this.seenEvents = this.world.events.length;
    for (const event of fresh) {
      if (event.type === 'shard') this.audio.play('shard');
    }
  }

  private checkEnd(): void {
    if (this.ended || this.world.outcome === 'running') return;

    if (this.chapter && !this.chapterDone) {
      this.ended = true;
      this.hud.pauseButton.hidden = true;
      this.audio.play('lose');
      this.hud.showMenu(
        translate(this.save.lang, 'game.lose'),
        translate(this.save.lang, this.chapter.goalKey as MessageKey),
        false
      );
      return;
    }

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
    const blend = Phaser.Math.Clamp(alpha, 0, 1);
    const { x: ox, y: oy } = this.shake.offset();

    g.clear();

    this.world.bullets.forEach((bullet, index) => {
      if (!bullet.alive) return;
      const prev = this.prevBullets[index];
      g.fillStyle(COLORS.bullet, 1);
      g.fillCircle(lerp(prev.x, bullet.x, blend) + ox, lerp(prev.y, bullet.y, blend) + oy, bullet.radius);
    });

    this.world.shards.forEach((shard, index) => {
      if (shard.taken) return;
      const bob = Math.sin((this.frames + index * 17) / 20) * 3;
      g.fillStyle(0xe8b04b, 1);
      g.fillCircle(shard.x + ox, shard.y + bob + oy, 7);
      g.fillStyle(0xfff6d8, 1);
      g.fillCircle(shard.x + ox, shard.y + bob + oy, 3);
    });

    for (const hazard of this.world.hazards) {
      if (!hazardActive(hazard, this.world.tick)) continue;
      if (hazard.kind === 'car') {
        this.drawCar(g, hazard.x + ox, hazard.y + oy, hazard.r, hazard.vx >= 0 ? 1 : -1);
        continue;
      }
      g.lineStyle(3, COLORS.ring, 0.9);
      g.strokeCircle(hazard.x + ox, hazard.y + oy, hazard.r);
      g.lineStyle(1, COLORS.ring, 0.35);
      g.strokeCircle(hazard.x + ox, hazard.y + oy, hazard.r * 0.7);
    }

    this.world.enemies.forEach((enemy, index) => {
      const sprite = this.enemySprites[index];
      if (!enemy.alive) {
        sprite.setVisible(false);
        return;
      }

      const prev = this.prevEnemies[index];
      const pop = this.frames < this.popUntil[index] ? 1.3 : 1;
      const size = enemy.radius * 2 * pop;
      sprite
        .setVisible(true)
        .setFrame(FRAME[enemy.kind])
        .setTint(this.chapter?.tint ?? 0xffffff)
        .setPosition(lerp(prev.x, enemy.x, blend) + ox, lerp(prev.y, enemy.y, blend) + oy)
        .setDisplaySize(size, size);
    });

    const player = this.world.player;
    const px = lerp(this.prevPlayer.x, player.x, blend);
    const py = lerp(this.prevPlayer.y, player.y, blend);
    const blink = player.invulnFrames > 0 && Math.floor(this.frames / 4) % 2 === 0;
    const frame = player.invulnFrames > 0 ? 7 : this.lastSpeed > 0.6 ? 6 : Math.floor(this.frames / 10) % 2 === 0 ? 0 : 5;

    this.playerSprite
      .setVisible(player.alive && !blink)
      .setFrame(frame)
      .setPosition(px + ox, py + oy)
      .setDisplaySize(EGARA_TUNING.player.radius * 2.4, EGARA_TUNING.player.radius * 2.4);
  }

  private drawCar(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number, dir: number): void {
    const w = r * 2.6;
    const h = r * 1.15;
    g.fillStyle(0x141420, 1);
    g.fillCircle(x - (w / 2 - 10) * dir, y + h / 2 - 4, 8);
    g.fillCircle(x + (w / 2 - 10) * dir, y + h / 2 - 4, 8);
    g.fillStyle(0x2a3a5e, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    g.fillStyle(0x3a4e72, 1);
    g.fillRoundedRect(x - w / 2 + 8, y - h / 2 + 6, w - 16, h / 2 - 4, 5);
    g.fillStyle(0x9fd8f0, 0.95);
    const shieldX = x + ((w / 2 - 26) * dir);
    g.fillRoundedRect(shieldX - 9, y - h / 2 + 8, 18, 10, 3);
    g.fillStyle(0xfff2b0, 1);
    g.fillCircle(x + (w / 2) * dir, y - 2, 4);
    g.fillCircle(x + (w / 2) * dir, y + 8, 4);
    g.fillStyle(0xd05a5a, 1);
    g.fillCircle(x - (w / 2) * dir, y - 2, 3.5);
    g.fillCircle(x - (w / 2) * dir, y + 8, 3.5);
  }

  private teardown(): void {    this.stopCapture();
    this.audio.stopLoop();
    this.music?.stop();
    this.game.canvas.style.filter = '';
    for (const off of this.detach) off();
    this.detach = [];
  }

  private stopBuzz(): void {
    this.buzz?.stop();
    this.buzz = null;
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
