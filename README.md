# Tollywood Arcade

Six small browser games inspired by Telugu cinema eras, 1957 to 2024. Original
stories, art, music and names — no film assets.

**Play:** https://garikipatisai-code.github.io/tollywood-arcade/

## Stack

Phaser 4.2.1 · TypeScript · Vite · Vitest · Playwright · GitHub Pages.

## Commands

```sh
npm install
npm run dev        # http://localhost:8080/tollywood-arcade/
npm run build      # static build in dist/
npm test           # unit tests (Vitest)
npm run test:e2e   # Playwright smoke tests
npm run assets     # asset licence + budget gate
npm run budget     # bundle budget gate
```

## Layout

```text
src/core/       boot, input, audio, saves, i18n, DOM HUD
src/engines/    deterministic shooter sim + wave director
src/games/      per-game scenes and tuning JSON
public/assets/  original CC0 art and audio + licence manifest
games/          per-game HTML entry points
docs/           spec, plan, progress ledger
```

## Status

v1 ships **Egara**, a 90-second arcade flyer. The other five games are listed on
the hub as locked. Each new game reuses one of three cores (platformer, melee,
shooter) and adds a content pack.

## Licences

Game code and assets are CC0-1.0. Dependencies keep their own licences. See
[CREDITS.md](./CREDITS.md).
