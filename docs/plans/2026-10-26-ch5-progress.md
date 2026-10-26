# Progress ledger — ch5 "The Exterminators" enrichment

Plan: docs/plans/2026-10-26-ch5.md
Spec: docs/specs/2026-10-26-ch5-nets.md
Gate: active (blanket authorization 2026-10-26T13:43:33Z by garikipatisai-code)

| Task | Status | Evidence |
|---|---|---|
| 1 Slow sim | done | factor/stacking/outside/determinism green |
| 2 ch5 data | done | coil zones over nests; headless clear green |
| 3 Nets dressing | done | nets/coils/vaporizers/placard + amber decals; screenshot-verified |
| 4 Verify + ship | done | 107/107 stable 3/3, budgets, 5/5 smoke, Pages success, live 200 + live smoke |

## Log

- 2026-10-26T13:43Z — ch5 gate active.
- 2026-10-26T13:52Z — systematic-debugging win: 10 unit failures traced to a one-word regression from the grip refactor (`tuning.width` instead of `tuning.height` on the y-clamp, sim.ts:361). Live impact: players could drift below the visible field. Fixed, 107/107 stable 3/3. Lesson: copy-paste lines need a second read.
- 2026-10-26T13:53Z — ch5 complete. Fresh evidence: 107/107 unit, tsc, build, assets/budget green, smoke 5/5, Pages success, live 200 + live smoke, gate verified. Screenshot: net/coil/vaporizer siege with amber fume decals.
