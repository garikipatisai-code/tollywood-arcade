import { translate, type Lang, type MessageKey } from './core/i18n';
import { loadSave, persistSave, withLang } from './core/save';
import { CHAPTERS } from './games/egara/content';

let save = loadSave();
let lang: Lang = save.lang;

function progressText(next: Lang): string {
  const done = CHAPTERS.filter((chapter) => save.chapters[chapter.id]?.unlocked).length;
  return `${translate(next, 'hub.progress')}: ${done} / ${CHAPTERS.length}`;
}

function apply(next: Lang): void {
  lang = next;
  document.documentElement.lang = next;

  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = node.dataset.i18n as MessageKey;
    node.textContent = translate(next, key);
  }

  const progress = document.getElementById('egara-progress');
  if (progress) progress.textContent = progressText(next);

  const toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.textContent = next === 'en' ? 'తెలుగు' : 'English';
    toggle.setAttribute(
      'aria-label',
      next === 'en' ? 'Switch to Telugu' : 'Switch to English'
    );
  }
}

apply(lang);

document.getElementById('lang-toggle')?.addEventListener('click', () => {
  save = withLang(save, lang === 'en' ? 'te' : 'en');
  persistSave(save);
  apply(save.lang);
});

/** Rising ember motes behind the hub. Skipped for reduced motion. */
function startEmbers(): void {
  const canvas = document.getElementById('embers') as HTMLCanvasElement | null;
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const context = canvas.getContext('2d');
  if (!context) return;

  interface Mote {
    x: number;
    y: number;
    r: number;
    speed: number;
    drift: number;
    phase: number;
    hue: number;
  }

  let motes: Mote[] = [];
  const seed = () => {
    const w = (canvas.width = Math.floor(window.innerWidth * Math.min(1.5, window.devicePixelRatio || 1)));
    const h = (canvas.height = Math.floor(window.innerHeight * Math.min(1.5, window.devicePixelRatio || 1)));
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    motes = Array.from({ length: 70 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.2,
      speed: 12 + Math.random() * 30,
      drift: (Math.random() - 0.5) * 24,
      phase: Math.random() * Math.PI * 2,
      hue: 30 + Math.random() * 20
    }));
  };
  seed();
  window.addEventListener('resize', seed);

  let last = performance.now();
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    last = performance.now();
  });

  const frame = (now: number) => {
    if (running) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = canvas.width;
      const h = canvas.height;
      context.clearRect(0, 0, w, h);
      for (const mote of motes) {
        mote.y -= mote.speed * dt;
        mote.x += Math.sin(now / 900 + mote.phase) * mote.drift * dt;
        if (mote.y < -8) {
          mote.y = h + 8;
          mote.x = Math.random() * w;
        }
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(now / 700 + mote.phase));
        context.beginPath();
        context.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
        context.fillStyle = `hsla(${mote.hue}, 90%, 62%, ${0.75 * twinkle})`;
        context.fill();
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

startEmbers();
