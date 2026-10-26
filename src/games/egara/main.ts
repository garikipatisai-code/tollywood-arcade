import { createGame } from '../../core/boot';
import { createHud } from '../../core/hud';
import { translate } from '../../core/i18n';
import { loadSave } from '../../core/save';
import { EgaraScene } from './scenes/EgaraScene';

const container = document.getElementById('game-container');

if (container) {
  const save = loadSave();
  const lang = save.lang;

  const hud = createHud({
    score: translate(lang, 'game.score'),
    lives: translate(lang, 'game.lives'),
    time: translate(lang, 'game.time'),
    pause: translate(lang, 'game.pause'),
    resume: translate(lang, 'game.resume'),
    retry: translate(lang, 'game.retry'),
    back: translate(lang, 'game.back'),
    mute: translate(lang, 'game.mute'),
    unmute: translate(lang, 'game.unmute'),
    controls: translate(lang, 'game.controls'),
    change: translate(lang, 'controls.change'),
    capturing: translate(lang, 'controls.capturing')
  });

  createGame({
    parent: 'game-container',
    canvasLabel: 'Egara gameplay',
    scenes: [new EgaraScene(hud)]
  });
}
