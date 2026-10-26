import { describe, expect, it } from 'vitest';
import { HitStop, ScreenShake, buzzMix } from '../../src/core/feel';
import {
  createWorld,
  placeShards,
  spawnEnemy,
  stepWorld,
  type Tuning
} from '../../src/engines/shooter/sim';

const tuning: Tuning = {
  width: 200,
  height: 300,
  runSeconds: 90,
  player: { speed: 120, radius: 6, lives: 3, invulnFrames: 30 },
  bullet: { speed: 600, radius: 3, lifeFrames: 60, cooldownFrames: 1, damage: 1 },
  enemies: {
    swatter: { hp: 1, radius: 8, speed: 40, score: 10 },
    spray: { hp: 1, radius: 8, speed: 40, score: 20 },
    spider: { hp: 2, radius: 8, speed: 20, score: 30 },
    boss: { hp: 8, radius: 14, speed: 12, score: 500 }
  },
  pools: { enemies: 16, bullets: 16 }
};

const idle = { x: 0, y: 0, sting: false };

describe('feel kit', () => {
  it('shake offset decays to zero', () => {
    const shake = new ScreenShake();
    shake.add(1);
    const first = Math.hypot(shake.offset().x, shake.offset().y);
    expect(first).toBeGreaterThan(0);

    for (let i = 0; i < 120; i++) shake.update(1 / 60);
    const last = shake.offset();
    expect(last.x).toBe(0);
    expect(last.y).toBe(0);
  });

  it('shake never exceeds its ceiling', () => {
    const shake = new ScreenShake(12);
    shake.add(5);
    for (let i = 0; i < 10; i++) {
      const { x, y } = shake.offset();
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(12);
      shake.update(1 / 60);
    }
  });

  it('hit-stop freezes the sim for exactly N steps', () => {
    const stop = new HitStop();
    stop.trigger(3);
    expect([stop.consume(), stop.consume(), stop.consume(), stop.consume()]).toEqual([
      true,
      true,
      true,
      false
    ]);
  });

  it('magnet pulls a nearby shard in', () => {
    const world = createWorld(11, tuning);
    placeShards(world, [{ id: 'm1', x: world.player.x + 50, y: world.player.y }]);
    for (let i = 0; i < 60; i++) stepWorld(world, idle);
    expect(world.shards[0].taken).toBe(true);
    expect(world.events).toHaveLength(1);
    expect(world.events[0]).toEqual({ tick: expect.any(Number), type: 'shard', id: 'm1' });
  });

  it('a far shard stays put without magnet range', () => {
    const world = createWorld(12, tuning);
    placeShards(world, [{ id: 'f1', x: world.player.x + 150, y: world.player.y - 100 }]);
    const before = { ...world.shards[0] };
    for (let i = 0; i < 30; i++) stepWorld(world, idle);
    expect(world.shards[0].taken).toBe(false);
    expect(world.shards[0].x).toBe(before.x);
    expect(world.shards[0].y).toBe(before.y);
  });

  it('a graze triggers slow-mo without damage', () => {
    const world = createWorld(13, tuning);
    const grazeDistance = tuning.player.radius + tuning.enemies.swatter.radius + 6;
    spawnEnemy(world, 'swatter', world.player.x + grazeDistance, world.player.y);
    stepWorld(world, idle);
    expect(world.lives).toBe(3);
    expect(world.slowmoFrames).toBeGreaterThan(0);
  });

  it('bullet hits knock enemies back along the shot', () => {
    const world = createWorld(14, tuning);
    spawnEnemy(world, 'spider', world.player.x, world.player.y - 60);
    stepWorld(world, { x: 0, y: 0, sting: true });
    for (let i = 0; i < 11; i++) stepWorld(world, idle);
    const spider = world.enemies[0];
    expect(spider.hp).toBeLessThan(tuning.enemies.spider.hp);
    expect(spider.vy).toBeLessThan(0);
  });

  it('buzz mix rises with paranoia and danger', () => {
    const calm = buzzMix(0, 0);
    const tense = buzzMix(50, 0.5);
    const panic = buzzMix(100, 1);
    expect(calm.gain).toBe(0);
    expect(tense.gain).toBeGreaterThan(0);
    expect(panic.gain).toBeGreaterThan(tense.gain);
    expect(panic.rate).toBeGreaterThan(tense.rate);
  });
});
