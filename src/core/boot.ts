import Phaser from 'phaser';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export interface BootOptions {
  parent: string;
  scenes: Phaser.Types.Scenes.SceneType[];
  backgroundColor?: string;
  canvasLabel?: string;
}

/**
 * Shared Phaser bootstrap: fixed logical resolution, FIT scaling, and a loop
 * that sleeps while the tab is hidden so mobile browsers do not burn battery.
 */
export function createGame({
  parent,
  scenes,
  backgroundColor = '#0d0b12',
  canvasLabel = 'Game canvas'
}: BootOptions): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: scenes
  });

  game.canvas.setAttribute('role', 'img');
  game.canvas.setAttribute('aria-label', canvasLabel);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.loop.sleep();
    } else {
      game.loop.wake();
    }
  });

  return game;
}
