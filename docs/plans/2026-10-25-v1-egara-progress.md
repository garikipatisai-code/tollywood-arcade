# Progress ledger — Tollywood Arcade v1

Plan: docs/plans/2026-10-25-v1-egara.md
Spec: docs/specs/2026-10-25-tollywood-arcade.md
Gate: active (approved 2026-10-26T04:10:14Z by garikipatisai-code)

| Task | Status | Evidence |
|---|---|---|
| 1 Scaffold | done | `npm run build` → dist/index.html, dist/404.html, dist/games/egara/index.html; phaser chunk 356 KB gz |
| 2 Boot + hub | done | `npx playwright test tests/smoke/hub.spec.ts` → 1 passed (canvas mounted, 0 console errors) |
| 3 i18n + saves | done | `npx vitest run tests/unit` → 11 tests (migration, corrupt data, round-trip) |
| 4 Input | done | 8 tests (remap, deadzone, merge, pointer) |
| 5 Audio | done | 5 unit tests; gesture-unlock e2e deferred to T8 with real sounds |
| 6 Shooter sim | done | 8 tests incl. same seed + input log → identical hash; pools fixed |
| 7 Egara content | done | 38 unit tests; `npx playwright test tests/smoke/` → 2 passed (boot, pause/resume, 0 errors) |
| 8 Art + credits | done | `npm run assets` → 6 files, 79.4 KiB, all CC0; original 16×16 sheet + 5 WAVs |
| 9 A11y + perf | done | `npx playwright test tests/smoke/` → 5 passed (TE toggle, mute, remap, pause); `node scripts/check-budget.mjs` → hub 1.3 KB, egara 353 KB gz |
| 10 Deploy | done | https://garikipatisai-code.github.io/tollywood-arcade/ (Pages workflow run 40269463533, live Playwright passed) |

## Log

- 2026-10-26T04:10Z — spec gate approved and activated.
- 2026-10-26T04:31Z — public repo created, Pages enabled, live URL verified.
- Deviations (in-scope, recorded): tuning JSON lives in `src/games/egara/` (Vite cannot import `public/`); art/audio generated as original CC0 instead of Kenney downloads; audio smoke moved from T5 to T9.
- 2026-10-26T04:37Z — final verification (fresh): unit 38/38, tsc clean, build OK, assets 79.4 KiB licensed, budget hub 1.3 KB / egara 353 KB gz, smoke 5/5, live hub+game HTTP 200, gate OK, worktree clean, no secrets.
- Review: `code-reviewer` subagent unavailable (free usage limit). Orchestrator self-review instead: no innerHTML/eval (textContent only); HUD handlers overwrite-safe (`onclick`); all window listeners removed on SHUTDOWN; HUD appended once (no duplication on restart); no debug leftovers.
