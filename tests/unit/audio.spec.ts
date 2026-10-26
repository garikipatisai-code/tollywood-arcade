import { describe, expect, it, vi } from 'vitest';
import { AudioController, bindUnlock } from '../../src/core/audio';

function fakePort() {
  const played: string[] = [];
  const muteStates: boolean[] = [];
  return {
    played,
    muteStates,
    play: (key: string) => played.push(key),
    setMute: (muted: boolean) => muteStates.push(muted)
  };
}

describe('audio', () => {
  it('does not play before the first gesture', () => {
    const port = fakePort();
    const audio = new AudioController(port);
    audio.play('sting');
    expect(port.played).toEqual([]);
  });

  it('plays after unlock', () => {
    const port = fakePort();
    const audio = new AudioController(port);
    audio.unlock();
    audio.play('sting');
    expect(port.played).toEqual(['sting']);
  });

  it('stays silent while muted and reports the change', () => {
    const port = fakePort();
    const onMute = vi.fn();
    const audio = new AudioController(port, { muted: false, onMute });
    audio.unlock();

    expect(audio.toggleMute()).toBe(true);
    audio.play('sting');
    expect(port.played).toEqual([]);
    expect(onMute).toHaveBeenCalledWith(true);

    expect(audio.toggleMute()).toBe(false);
    audio.play('sting');
    expect(port.played).toEqual(['sting']);
  });

  it('starts muted from a saved value', () => {
    const port = fakePort();
    const audio = new AudioController(port, { muted: true });
    audio.unlock();
    audio.play('sting');
    expect(audio.isMuted()).toBe(true);
    expect(port.played).toEqual([]);
  });

  it('unlocks once on the first gesture', () => {
    const target = new EventTarget();
    const unlock = vi.fn();
    const detach = bindUnlock(target, unlock);

    target.dispatchEvent(new Event('pointerdown'));
    target.dispatchEvent(new Event('keydown'));
    expect(unlock).toHaveBeenCalledTimes(1);

    detach();
    target.dispatchEvent(new Event('pointerdown'));
    expect(unlock).toHaveBeenCalledTimes(1);
  });
});
