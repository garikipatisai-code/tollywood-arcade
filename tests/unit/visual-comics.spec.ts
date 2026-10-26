import { describe, expect, it } from 'vitest';
import { CUTSCENES, validateCutscene } from '../../src/games/egara/content';
import { messages } from '../../src/core/i18n';

describe('cutscenes', () => {
  it('ships 8 valid openers', () => {
    expect(CUTSCENES.map((c) => c.id)).toEqual(['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8']);
    for (const cut of CUTSCENES) {
      expect(validateCutscene(cut)).toEqual([]);
    }
  });

  it('rejects bad panels', () => {
    expect(validateCutscene(null)).not.toEqual([]);
    expect(validateCutscene({ id: 'x', panels: [{ img: 'nope', mood: 'dawn', caption: 'cut.ch1.p1' }] })).not.toEqual([]);
    expect(validateCutscene({ id: 'x', panels: [{ img: null, mood: 'lava', caption: 'cut.ch1.p1' }] })).not.toEqual([]);
    expect(validateCutscene({ id: 'x', panels: [{ img: null, mood: 'dawn', caption: 'nope' }] })).not.toEqual([]);
    expect(validateCutscene({ id: 'x', panels: [{ img: null, mood: 'dawn', caption: 'cut.ch1.p1' }] })).not.toEqual([]);
  });

  it('has every caption in English and Telugu', () => {
    for (const cut of CUTSCENES) {
      for (const panel of cut.panels) {
        expect(messages.en[panel.caption as keyof typeof messages.en]).toBeTruthy();
        expect(messages.te[panel.caption as keyof typeof messages.te]).toBeTruthy();
      }
    }
  });
});
