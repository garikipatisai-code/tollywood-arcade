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
  story?: string;
  chapters?: string;
  quality?: string;
  controls: string;
  change: string;
  capturing: string;
}

export interface ControlRow {
  action: string;
  label: string;
  keys: string[];
}

export interface CutPanelView {
  imgUrl: string | null;
  mood: string;
  caption: string;
}

export interface Hud {
  root: HTMLDivElement;
  menu: HTMLDivElement;
  pauseButton: HTMLButtonElement;
  setScore(score: number): void;
  setLives(lives: number): void;
  setTime(seconds: number): void;
  setMuted(muted: boolean): void;
  showMenu(menuTitle: string, menuBody: string, canResume: boolean, nextLabel?: string): void;
  hideMenu(): void;
  renderControls(rows: ControlRow[], onChange: (action: string) => void): void;
  setCapturing(action: string | null): void;
  onPause(handler: () => void): void;
  onResume(handler: () => void): void;
  onRetry(handler: () => void): void;
  onNext(handler: () => void): void;
  onQuality(handler: () => void): void;
  setQualityLabel(text: string): void;
  showWelcome(title: string, ctaLabel: string, onCta: () => void): () => void;
  setObjective(text: string): void;
  flashBanner(text: string): void;
  setBoss(name: string, frac: number): void;
  hideBoss(): void;
  showCutscene(panels: CutPanelView[], skipLabel: string, nextLabel: string, onDone: () => void): void;
  renderChapterSelect(
    model: ChapterSelectModel,
    onPick: (id: string) => void,
    onNg: () => void,
    onQuick?: () => void
  ): HTMLElement;
  onMute(handler: () => void): void;
}

export interface ChapterCard {
  id: string;
  name: string;
  goal: string;
  locked: boolean;
  best: number;
  shardsTaken: number;
  shardsTotal: number;
}

export interface ChapterSelectModel {
  title: string;
  backLabel: string;
  lockedLabel: string;
  bestLabel: string;
  shardsLabel: string;
  ngLabel: string;
  ngActive: boolean;
  showNgToggle: boolean;
  quickLabel: string;
  cards: ChapterCard[];
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

  const objective = element('div', 'ta-hud__objective');
  objective.setAttribute('role', 'status');

  const hudActions = element('div', 'ta-hud__actions');
  const muteButton = element('button', 'ta-hud__button');
  muteButton.type = 'button';
  muteButton.setAttribute('aria-pressed', 'false');
  muteButton.textContent = labels.mute;

  const qualityButton = element('button', 'ta-hud__button');
  qualityButton.type = 'button';
  qualityButton.textContent = labels.quality ?? 'FX';

  const pauseButton = element('button', 'ta-hud__button');
  pauseButton.type = 'button';
  pauseButton.textContent = labels.pause;
  hudActions.append(muteButton, qualityButton, pauseButton);

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

  const next = element('button', 'ta-button');
  next.type = 'button';
  next.hidden = true;

  const back = element('a', 'ta-button ta-button--ghost');
  back.href = '../../';
  back.textContent = labels.back;

  const storyLink = element('a', 'ta-button ta-button--ghost');
  storyLink.href = './?select=1';
  storyLink.textContent = `☰ ${labels.chapters ?? 'Chapters'}`;

  actions.append(resume, retry, next, storyLink, back);
  menu.append(title, body, controls, actions);

  objective.style.cssText =
    'position:absolute;top:3.2rem;left:50%;transform:translateX(-50%);' +
    'font-family:ui-monospace,monospace;font-size:.85rem;color:#ffe9a8;' +
    'text-shadow:0 1px 2px #000;pointer-events:none;white-space:nowrap;';
  objective.hidden = true;

  const banner = element('div', 'ta-hud__banner');
  banner.setAttribute('role', 'status');

  const bossWrap = element('div', 'ta-hud__boss');
  bossWrap.style.cssText =
    'position:absolute;top:5.4rem;left:50%;transform:translateX(-50%);width:min(420px,70vw);' +
    'pointer-events:none;text-align:center;';
  bossWrap.hidden = true;
  const bossName = element('div', 'ta-hud__boss-name');
  bossName.style.cssText =
    'font-family:ui-monospace,monospace;font-size:.8rem;letter-spacing:.2em;color:#ffb0a0;' +
    'text-shadow:0 1px 2px #000;margin-bottom:2px;';
  const bossTrack = element('div', 'ta-hud__boss-track');
  bossTrack.style.cssText =
    'height:10px;border:1px solid #8e2f2f;border-radius:5px;background:rgb(13 11 18 / 70%);overflow:hidden;';
  const bossFill = element('div', 'ta-hud__boss-fill');
  bossFill.style.cssText =
    'height:100%;width:100%;background:linear-gradient(90deg,#d05a5a,#e07b39);' +
    'transition:width .2s;';
  bossTrack.append(bossFill);
  bossWrap.append(bossName, bossTrack);  banner.style.cssText =
    'position:absolute;top:38%;left:50%;transform:translate(-50%,-50%) scale(.9);' +
    'font-size:clamp(1.2rem,4vw,2rem);font-weight:800;color:#ffd94d;' +
    'text-shadow:0 2px 0 #000,0 0 24px #e07b39;opacity:0;pointer-events:none;' +
    'transition:opacity .25s,transform .25s;white-space:nowrap;z-index:4;';
  let bannerTimer: ReturnType<typeof setTimeout> | undefined;

  root.append(stats, hudActions);
  root.append(objective, banner, bossWrap);

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
    showMenu(menuTitle: string, menuBody: string, canResume: boolean, nextLabel?: string) {
      title.textContent = menuTitle;
      body.textContent = menuBody;
      body.hidden = menuBody.length === 0;
      resume.hidden = !canResume;
      controls.hidden = !canResume;
      next.hidden = !nextLabel;
      if (nextLabel) next.textContent = nextLabel;
      menu.hidden = false;
      (nextLabel ? next : canResume ? resume : retry).focus();
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
    onNext(handler: () => void) {
      next.onclick = handler;
    },
    showCutscene(panels: CutPanelView[], skipLabel: string, nextLabel: string, onDone: () => void) {
      const moods: Record<string, string> = {
        dawn: 'linear-gradient(180deg,#3a5a9e 0%,#e08a4e 100%)',
        ember: 'linear-gradient(180deg,#38140e 0%,#e06a2e 100%)',
        night: 'linear-gradient(180deg,#0e1028 0%,#3a4a7e 100%)',
        toxic: 'linear-gradient(180deg,#1e3e1e 0%,#6eae4e 100%)',
        gloom: 'linear-gradient(180deg,#140e28 0%,#4a2a6e 100%)',
        teal: 'linear-gradient(180deg,#1d3a4e 0%,#4a8e8e 100%)'
      };
      const overlay = element('div', 'ta-menu');
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      let index = 0;
      const render = () => {
        overlay.replaceChildren();
        const panel = panels[Math.min(index, panels.length - 1)];

        const card = element('div', 'ta-menu__title');
        card.textContent = '';
        card.style.cssText =
          `width:min(640px,86vw);height:300px;margin:0 auto;border-radius:12px;` +
          `border:1px solid #4a3c5e;background:${moods[panel.mood] ?? moods.night};` +
          `display:flex;align-items:flex-end;justify-content:center;overflow:hidden;position:relative;`;

        if (panel.imgUrl) {
          const img = document.createElement('img');
          img.src = panel.imgUrl;
          img.alt = '';
          img.style.cssText =
            'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.85;image-rendering:pixelated;';
          card.append(img);
        }

        const caption = element('p', 'ta-menu__body');
        caption.textContent = panel.caption;
        caption.style.cssText =
          'position:relative;z-index:1;margin:0;width:100%;padding:1.4rem 1rem 1rem;' +
          'font-size:clamp(1.05rem,3.4vw,1.5rem);font-weight:700;color:#fff;' +
          'text-shadow:0 2px 0 #000,0 0 18px #000;background:linear-gradient(transparent,rgba(5,3,10,.78));';

        const dots = element('div', 'ta-menu__actions');
        dots.textContent = `${index + 1} / ${panels.length}`;
        (dots as HTMLElement).style.cssText = 'color:#a99bb5;font-size:.85rem;';
        card.append(caption);

        const row = element('div', 'ta-menu__actions');
        const skip = element('button', 'ta-button ta-button--ghost');
        skip.type = 'button';
        skip.textContent = skipLabel;
        skip.onclick = () => {
          overlay.remove();
          onDone();
        };
        const advance = element('button', 'ta-button');
        advance.type = 'button';
        advance.textContent = nextLabel;
        advance.onclick = () => {
          index++;
          if (index >= panels.length) {
            overlay.remove();
            onDone();
          } else {
            render();
            advance.focus();
          }
        };
        row.append(skip, advance);

        overlay.append(card, dots, row);
      };

      render();
      const container = document.getElementById('game-container') ?? document.body;
      container.append(overlay);
      overlay.querySelector<HTMLButtonElement>('.ta-button:not(.ta-button--ghost)')?.focus();
    },
    renderChapterSelect(model: ChapterSelectModel, onPick: (id: string) => void, onNg: () => void, onQuick?: () => void) {
      const section = element('div', 'ta-menu');
      section.setAttribute('role', 'dialog');
      section.setAttribute('aria-label', model.title);

      const heading = element('h2', 'ta-menu__title');
      heading.textContent = model.title;

      const list = element('ul', 'ta-controls__list');
      if (onQuick) {
        const quickItem = element('li', 'ta-controls__row');
        const quick = element('button', 'ta-button');
        quick.type = 'button';
        quick.textContent = `▶ ${model.quickLabel}`;
        quick.addEventListener('click', onQuick);
        quickItem.append(quick);
        list.append(quickItem);
      }
      for (const card of model.cards) {
        const item = element('li', 'ta-controls__row');
        const pick = element('button', 'ta-button');
        pick.type = 'button';
        pick.disabled = card.locked;
        pick.dataset.chapter = card.id;
        if (card.locked) {
          pick.style.opacity = '0.55';
          pick.textContent = `🔒 ${card.name} · ${model.lockedLabel}`;
        } else {
          pick.textContent = `${card.name} — ${model.bestLabel}: ${card.best} · ${model.shardsLabel}: ${card.shardsTaken}/${card.shardsTotal}`;
        }
        pick.title = card.goal;
        pick.addEventListener('click', () => onPick(card.id));
        item.append(pick);
        list.append(item);
      }

      const footer = element('div', 'ta-menu__actions');
      const backLink = element('a', 'ta-button ta-button--ghost');
      backLink.href = '../../';
      backLink.textContent = model.backLabel;
      footer.append(backLink);

      if (model.showNgToggle) {
        const ng = element('button', 'ta-button');
        ng.type = 'button';
        ng.textContent = model.ngActive ? `${model.ngLabel} ✓` : model.ngLabel;
        ng.setAttribute('aria-pressed', String(model.ngActive));
        ng.addEventListener('click', onNg);
        footer.append(ng);
      }

      section.append(heading, list, footer);
      const container = document.getElementById('game-container') ?? document.body;
      container.append(section);
      return section;
    },
    onMute(handler: () => void) {
      muteButton.onclick = handler;
    },
    onQuality(handler: () => void) {
      qualityButton.onclick = handler;
    },
    setQualityLabel(text: string) {
      qualityButton.textContent = text;
    },
    showWelcome(title: string, ctaLabel: string, onCta: () => void) {
      const box = element('div', 'ta-welcome');
      box.style.cssText =
        'position:absolute;left:50%;bottom:1rem;transform:translateX(-50%);' +
        'display:flex;align-items:center;gap:.75rem;padding:.6rem 1rem;' +
        'background:rgb(13 11 18 / 88%);border:1px solid #e8b04b;border-radius:.75rem;' +
        'color:#f3ecdd;font:inherit;z-index:2;pointer-events:none;white-space:nowrap;';
      const label = element('span', 'ta-welcome__title');
      label.textContent = title;
      const cta = element('button', 'ta-button');
      cta.type = 'button';
      cta.textContent = ctaLabel;
      cta.style.pointerEvents = 'auto';
      cta.addEventListener('click', onCta);
      box.append(label, cta);

      let gone = false;
      const dismiss = () => {
        if (gone) return;
        gone = true;
        box.remove();
      };
      const container = document.getElementById('game-container') ?? document.body;
      container.append(box);
      setTimeout(dismiss, 8000);
      return dismiss;
    },
    setObjective(text: string) {
      objective.hidden = text.length === 0;
      if (text.length > 0) objective.textContent = text;
    },
    flashBanner(text: string) {
      banner.textContent = text;
      banner.style.opacity = '1';
      banner.style.transform = 'translate(-50%,-50%) scale(1)';
      if (bannerTimer) clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => {
        banner.style.opacity = '0';
        banner.style.transform = 'translate(-50%,-50%) scale(.9)';
      }, 1600);
    },
    setBoss(name: string, frac: number) {
      bossWrap.hidden = false;
      bossName.textContent = name;
      bossFill.style.width = `${Math.max(0, Math.min(1, frac)) * 100}%`;
    },
    hideBoss() {
      bossWrap.hidden = true;
    }
  };
}
