import { describe, expect, it } from 'vitest';
import { messages, translate } from '../../src/core/i18n';

describe('i18n', () => {
  it('has the same keys in English and Telugu', () => {
    expect(Object.keys(messages.te).sort()).toEqual(Object.keys(messages.en).sort());
  });

  it('translates a plain key', () => {
    expect(translate('en', 'hub.play')).toBe('Play');
    expect(translate('te', 'hub.play')).toBe('ఆడండి');
  });

  it('interpolates variables', () => {
    expect(translate('en', 'game.best', { score: 1200 })).toBe('Best: 1200');
  });

  it('falls back to English for an unknown language', () => {
    expect(translate('fr' as 'en', 'hub.play')).toBe('Play');
  });
});
