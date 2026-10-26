import { translate, type Lang, type MessageKey } from './core/i18n';
import { loadSave, persistSave, withLang } from './core/save';

let save = loadSave();
let lang: Lang = save.lang;

function apply(next: Lang): void {
  lang = next;
  document.documentElement.lang = next;

  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = node.dataset.i18n as MessageKey;
    node.textContent = translate(next, key);
  }

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
