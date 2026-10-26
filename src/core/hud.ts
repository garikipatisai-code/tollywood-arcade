export interface HudLabels {
  score: string;
  lives: string;
  time: string;
  pause: string;
  resume: string;
  retry: string;
  back: string;
  mute: string;
  unmute: string;
  controls: string;
  change: string;
  capturing: string;
}

export interface ControlRow {
  action: string;
  label: string;
  keys: string[];
}

export interface Hud {
  root: HTMLDivElement;
  menu: HTMLDivElement;
  pauseButton: HTMLButtonElement;
  setScore(score: number): void;
  setLives(lives: number): void;
  setTime(seconds: number): void;
  setMuted(muted: boolean): void;
  showMenu(title: string, body: string, canResume: boolean): void;
  hideMenu(): void;
  renderControls(rows: ControlRow[], onChange: (action: string) => void): void;
  setCapturing(action: string | null): void;
  onPause(handler: () => void): void;
  onResume(handler: () => void): void;
  onRetry(handler: () => void): void;
  onMute(handler: () => void): void;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

/** DOM HUD and menu. Canvas never carries text the screen reader needs. */
export function createHud(labels: HudLabels): Hud {
  const root = element('div', 'ta-hud');
  const stats = element('div', 'ta-hud__stats');

  const makeStat = (label: string) => {
    const wrap = element('span', 'ta-hud__stat');
    const caption = element('span', 'ta-hud__label');
    caption.textContent = label;
    const value = element('span', 'ta-hud__value');
    value.textContent = '0';
    wrap.append(caption, value);
    stats.append(wrap);
    return value;
  };

  const score = makeStat(labels.score);
  const lives = makeStat(labels.lives);
  const time = makeStat(labels.time);

  const hudActions = element('div', 'ta-hud__actions');
  const muteButton = element('button', 'ta-hud__button');
  muteButton.type = 'button';
  muteButton.setAttribute('aria-pressed', 'false');
  muteButton.textContent = labels.mute;

  const pauseButton = element('button', 'ta-hud__button');
  pauseButton.type = 'button';
  pauseButton.textContent = labels.pause;
  hudActions.append(muteButton, pauseButton);

  const menu = element('div', 'ta-menu');
  menu.hidden = true;
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');

  const title = element('h2', 'ta-menu__title');
  const body = element('p', 'ta-menu__body');

  const controls = element('section', 'ta-controls');
  const controlsTitle = element('h3', 'ta-controls__title');
  controlsTitle.textContent = labels.controls;
  const controlsList = element('ul', 'ta-controls__list');
  controls.append(controlsTitle, controlsList);

  const actions = element('div', 'ta-menu__actions');
  const resume = element('button', 'ta-button');
  resume.type = 'button';
  resume.textContent = labels.resume;

  const retry = element('button', 'ta-button');
  retry.type = 'button';
  retry.textContent = labels.retry;

  const back = element('a', 'ta-button ta-button--ghost');
  back.href = '../../';
  back.textContent = labels.back;

  actions.append(resume, retry, back);
  menu.append(title, body, controls, actions);
  root.append(stats, hudActions);

  const container = document.getElementById('game-container') ?? document.body;
  container.append(root, menu);

  return {
    root,
    menu,
    pauseButton,
    setScore(value: number) {
      score.textContent = String(value);
    },
    setLives(value: number) {
      lives.textContent = '♥'.repeat(Math.max(0, value));
      lives.setAttribute('aria-label', `${labels.lives}: ${value}`);
    },
    setTime(seconds: number) {
      const safe = Math.max(0, Math.ceil(seconds));
      time.textContent = `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
    },
    setMuted(muted: boolean) {
      muteButton.textContent = muted ? labels.unmute : labels.mute;
      muteButton.setAttribute('aria-pressed', String(muted));
    },
    showMenu(menuTitle: string, menuBody: string, canResume: boolean) {
      title.textContent = menuTitle;
      body.textContent = menuBody;
      body.hidden = menuBody.length === 0;
      resume.hidden = !canResume;
      controls.hidden = !canResume;
      menu.hidden = false;
      (canResume ? resume : retry).focus();
    },
    hideMenu() {
      menu.hidden = true;
      pauseButton.focus();
    },
    renderControls(rows: ControlRow[], onChange: (action: string) => void) {
      controlsList.replaceChildren();

      for (const row of rows) {
        const item = element('li', 'ta-controls__row');
        const name = element('span', 'ta-controls__name');
        name.textContent = row.label;

        const keys = element('kbd', 'ta-controls__keys');
        keys.textContent = row.keys.join(' / ');

        const change = element('button', 'ta-controls__change');
        change.type = 'button';
        change.textContent = labels.change;
        change.dataset.action = row.action;
        change.addEventListener('click', () => onChange(row.action));

        item.append(name, keys, change);
        controlsList.append(item);
      }
    },
    setCapturing(action: string | null) {
      for (const button of controlsList.querySelectorAll<HTMLButtonElement>('button[data-action]')) {
        const capturing = button.dataset.action === action;
        button.textContent = capturing ? labels.capturing : labels.change;
        button.disabled = action !== null && !capturing;
      }
    },
    onPause(handler: () => void) {
      pauseButton.onclick = handler;
    },
    onResume(handler: () => void) {
      resume.onclick = handler;
    },
    onRetry(handler: () => void) {
      retry.onclick = handler;
    },
    onMute(handler: () => void) {
      muteButton.onclick = handler;
    }
  };
}
