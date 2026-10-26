export type Lang = 'en' | 'te';

const en = {
  'hub.title': 'Tollywood Arcade',
  'hub.subtitle': 'Six small games inspired by Telugu cinema eras. Original stories, art and music.',
  'hub.play': 'Play',
  'hub.locked': 'locked',
  'hub.language': 'Language',
  'hub.credits': 'Credits',
  'game.score': 'Score',
  'game.best': 'Best: {score}',
  'game.lives': 'Lives',
  'game.start': 'Start',
  'game.pause': 'Pause',
  'game.resume': 'Resume',
  'game.retry': 'Play again',
  'game.win': 'You made it out!',
  'game.lose': 'Swatted.',
  'game.mute': 'Mute',
  'game.unmute': 'Unmute',
  'game.back': 'Back to arcade',
  'game.time': 'Time',
  'game.controls': 'Controls',
  'controls.left': 'Move left',
  'controls.right': 'Move right',
  'controls.up': 'Move up',
  'controls.down': 'Move down',
  'controls.sting': 'Sting',
  'controls.pause': 'Pause',
  'controls.change': 'Change',
  'controls.capturing': 'Press a key…',
  'genre.flyer': 'arcade flyer',
  'genre.beat': "beat-'em-up",
  'genre.puzzle': 'puzzle-platformer',
  'genre.slash': 'hack-and-slash',
  'genre.brawler': 'brawler',
  'genre.shooter': 'top-down shooter',
  'egara.name': 'Egara',
  'egara.tagline': 'A fly with a grudge',
  'credits.title': 'Credits and licences',
  'credits.assets': 'Assets',
  'credits.code': 'Code'
} as const;

const te: Record<keyof typeof en, string> = {
  'hub.title': 'టాలీవుడ్ ఆర్కేడ్',
  'hub.subtitle': 'తెలుగు సినిమా యుగాల నుండి స్ఫూర్తి పొందిన ఆరు చిన్న ఆటలు. అసలైన కథలు, కళ, సంగీతం.',
  'hub.play': 'ఆడండి',
  'hub.locked': 'లాక్ చేయబడింది',
  'hub.language': 'భాష',
  'hub.credits': 'క్రెడిట్స్',
  'game.score': 'స్కోరు',
  'game.best': 'అత్యుత్తమ: {score}',
  'game.lives': 'ప్రాణాలు',
  'game.start': 'ప్రారంభించు',
  'game.pause': 'విరామం',
  'game.resume': 'కొనసాగించు',
  'game.retry': 'మళ్లీ ఆడండి',
  'game.win': 'బయటపడ్డారు!',
  'game.lose': 'అంతమైంది.',
  'game.mute': 'నిశ్శబ్దం',
  'game.unmute': 'శబ్దం',
  'game.back': 'ఆర్కేడ్‌కు తిరిగి',
  'game.time': 'సమయం',
  'game.controls': 'నియంత్రణలు',
  'controls.left': 'ఎడమకు',
  'controls.right': 'కుడికి',
  'controls.up': 'పైకి',
  'controls.down': 'కిందకి',
  'controls.sting': 'కుట్టు',
  'controls.pause': 'విరామం',
  'controls.change': 'మార్చు',
  'controls.capturing': 'కీ నొక్కండి…',
  'genre.flyer': 'ఆర్కేడ్ ఫ్లయర్',
  'genre.beat': 'బీట్-ఎమ్-అప్',
  'genre.puzzle': 'పజిల్-ప్లాట్‌ఫారమర్',
  'genre.slash': 'హ్యాక్ అండ్ స్లాష్',
  'genre.brawler': 'బ్రాలర్',
  'genre.shooter': 'టాప్-డౌన్ షూటర్',
  'egara.name': 'ఎగర',
  'egara.tagline': 'పగబట్టిన ఈగ',
  'credits.title': 'క్రెడిట్స్ మరియు లైసెన్సులు',
  'credits.assets': 'ఆస్తులు',
  'credits.code': 'కోడ్'
};

export const messages = { en, te };
export type MessageKey = keyof typeof en;

export function translate(
  lang: Lang,
  key: MessageKey,
  vars?: Record<string, string | number>
): string {
  const dictionary = messages[lang] ?? messages.en;
  const template = dictionary[key] ?? messages.en[key];

  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
}
