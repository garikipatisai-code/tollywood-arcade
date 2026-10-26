# Progress ledger — Egara v2 Story Mode

Plan: docs/plans/2026-10-26-story-mode.md
Spec: docs/specs/2026-10-26-egara-story-mode.md
Gate: active (approved 2026-10-26T04:47:01Z by garikipatisai-code)

| Task | Status | Evidence |
|---|---|---|
| 1 Sim inputs | done | `npx vitest run tests/unit` → 46 passed (8 new: determinism w/ paranoia+loadout, 2× spawns at 100, clamp, needle gate, armor absorb, cannon pierce, shard + objective events); tsc clean |
| 2 Feel kit | done | `npx vitest run tests/unit` → 54 passed (8 new feel tests); tsc clean; build OK; scene wired (shake/hit-stop/slow-mo); egara smoke 4/5 — 1 flake (see log) |
| 3 Saves v2 + i18n | done | 61/61 unit (v1/v0 migration, corrupt reset, story state, TE parity); tsc clean; scope amended (save.spec.ts) via close + re-approval |
| 4 Chapters 1-3 | done | 67/67 unit (schema, rejection cases, headless full clears of ch1-ch3); tsc + build clean |
| 5 Chapters 4-5 | done | 69/69 unit (ch4 meter debut + sabotage, ch5 armor vs exterminators, both clear headless) |
| 6 Exorcist boss | done | hazards + hurtPlayer refactor; ch6 escape clears headless 3/3; 73/73 unit stable 4/4 full runs |
| 7 Mansion + finale | done | 76/76 unit (ch7 rescue + ch8 cannon run clear headless; wave hp override; hazard render hook); build clean |
| 8 Select + NG+ | done | chapter/select/NG+ runtime in scene; shard-slot scoring; hub Story link; 2 story + 2 hub + 3 egara smoke green; 77/77 unit |
| 9 Art/audio/cards | done | buzz loop + adaptive gain, shard render, chapter tints, manifest/CREDITS; `npm run assets` → 7 files 122.5 KiB licensed; 6/7 smoke (1 known pre-existing remap flake, out of scope) |
| 10 Ship gate | done | budgets OK (hub 1.3 KB, egara 356 KB gz); Pages deploy success (40272472981); live hub+game 200, live smoke passed; 77/77 unit, tsc, gates green |

## Log

- 2026-10-26T04:47Z — v2 spec gate approved and activated; research, spec, plan pushed (49c93f2).
- 2026-10-26T04:55Z — hosting decision (garikipatisai-code): full 1 GB Pages budget may be used; if exceeded, split each game into its own repo with `tollywood-arcade` as hub-only repo. No action now (usage ~1 MB); a split requires `spec-check close` + re-approval as it changes repo layout and the plan's file scope.
- 2026-10-26T04:53Z — T2 smoke flake: `egara.spec.ts` remap test fails intermittently at line 73 (dialog rows missing after reload). Proven pre-existing via `git stash`: fails on clean v1 tree too. Suspected race (Escape lands before pause-key listener attaches). Fix = harden test with scene-ready wait, but `tests/smoke/egara.spec.ts` is OUTSIDE the v2 plan file scope → no edit made (gate). Logged as deviation; T2's own verify (unit) is green.
- 2026-10-26T04:56Z — DEVIATION (blocked edit): `tests/unit/save.spec.ts:35` asserts `save.v === 1`, contradicting approved spec S9 (v1→v2 migration). Exactly 1 test fails; the file is outside the plan scope. Requesting `spec-check close` + re-approval to amend scope with that file (one-line update: expect v2 + new defaults). No edit made until approved.
- 2026-10-26T04:56Z — scope amended: gate closed, `tests/unit/save.spec.ts` added (22 files), re-approved and re-activated. One-line fix applied; full unit 61/61 green.
- 2026-10-26T05:08Z — v2 complete. Fresh evidence: 77/77 unit, tsc clean, build OK, assets 122.5 KiB licensed, budget hub 1.3 KB/egara 356 KB gz, smoke 4/4 (story+hub) + 3/3 egara file-run, live 200s + live smoke passed, gate verify OK, no secrets/strays/unsafe DOM.
- Review: `code-reviewer` unavailable (free limit); orchestrator self-review — committed files all in gate scope (`spec-check check` clean); no console/debug in game code; no innerHTML/eval.
- Known minors: (1) remap smoke flake pre-existing, out of scope, untouched; (2) pause-menu Story link falls back to English 'Story' for TE (avoids out-of-scope main.ts edit); (3) pictogram objectives cut — text goals + shard visuals instead; (4) device perf row still pending per protocol — needs a mid-tier Android run.
