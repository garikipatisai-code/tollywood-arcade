---
spec: docs/specs/2026-10-26-screenplay.md
status: approved
approved_by: garikipatisai-code (blanket authorization: proceed without pausing)
approved_at: 2026-10-26T14:38:38Z
files:
  - src/engines/shooter/sim.ts
  - src/engines/shooter/director.ts
  - src/games/egara/content.ts
  - src/games/egara/chapters/*.json
  - src/games/egara/scenes/EgaraScene.ts
  - src/core/hud.ts
  - tests/unit/level-verbs*.spec.ts
  - tests/unit/chapters.spec.ts
  - tests/unit/story-bosses.spec.ts
  - docs/qa/perf.md
allow:
  - docs/plans/2026-10-26-screenplay-progress.md
  - docs/debt-ledger.md
---

# Plan: Screenplay Gameplay

**Goal**: eight distinct chapter verbs on the deterministic sim; completion
predicates unchanged; HUD narrates objectives.

```mermaid
flowchart LR
  A[T1 carry/swift/dummy] --> B[T2 fuse/backfire/escort/martyr/enrage]
  B --> C[T3 chapter rewiring]
  C --> D[T4 HUD + visuals]
  D --> E[T5 bots + suite]
  E --> F[T6 verify + ship]
```

## Tasks

| # | Task | Spec req | Files | Test | Expected | Verify |
|---|------|----------|-------|------|----------|--------|
| 1 | Carry/dropoff, swiftness, harmless | K1–K3 | `sim.ts`, `level-verbs1.spec.ts` | carry/deliver/drop, swift cap, dummy safety | verbs1 spec |
| 2 | Fuse, backfire, escort/exit, martyr, enrage, marked | K3–K7 | `sim.ts`, `director.ts`, `level-verbs2.spec.ts` | countdowns, burns, follows, blast, rage | verbs2 spec |
| 3 | All 8 chapter JSONs rewired + schema | K8 | `content.ts`, `chapters/*.json` | all validate | chapters.spec |
| 4 | Objective line, banners, carried visuals, markers | K9 | `hud.ts`, `scenes` | e2e sees objectives | story smoke |
| 5 | Bots per verb; every chapter clears headless | K8 | `chapters.spec.ts`, `story-bosses.spec.ts` | 8/8 clear | full unit |
| 6 | Full suite, budgets, smoke, deploy, live, close | K10 | `perf.md` | all green, live 200 | ship commands |

## Self-review

Coverage: K1–K10 mapped. No save/audio/asset changes. Biggest risk: bot
complexity — kept dumb (seek-top-priority state machines).
