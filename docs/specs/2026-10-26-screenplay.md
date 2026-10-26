# Screenplay Gameplay (APPROVED — blanket authorization)

Date: 2026-10-26 · Status: approved by owner (standing order: critique-driven
redesign; proceed without pausing).
Critique accepted: all chapters share one verb (sting/collect) under different
backdrops. This phase gives each chapter its own screenplay verb, reusing the
deterministic sim. Completion still flows through existing predicates
(clear/collect/survive/escape) so saves and chapter data stay compatible.

## The eight verbs

| Ch | Screenplay beat | Verb | Sim mechanism (new) |
|---|---|---|---|
| 1 | Petal courier run | CARRY petals to Bindu's window | carry (1 max) + dropoff zones; hit drops |
| 2 | Memory returns as wings learn | OUTRUN to remember | swiftness: each shard +12% speed (cap +60%) |
| 3 | Scrap-gym montage | TRAIN on dummies | harmless targets (no contact damage) |
| 4 | Airport crash + threat | ASSASSINATE the windshield | marked boss + kill banner event |
| 5 | Cash-fire sabotage | IGNITE the hoard | fuse shards (armed → 3 s → detonation + score) |
| 6 | Trap backfires | TURN the ritual | active hazards wound enemies (burn ticks) |
| 7 | Bait → rescue | ESCORT Shilpi to the window | follower shard + exit zones; hit drops |
| 8 | Powder → flame → dive | SACRIFICE into the cannon | martyr shard: blast kills all, player dies, WON |

Boss texture: enraged flag (speed scales as hp falls) for Garva + Exorcist.

## Rules

- Every mechanism deterministic, hashed, blink-safe; no RNG in sim.
- Completion predicates UNCHANGED (taken/clear/survive/escape absorb the rest).
- HUD: live objective line (delivered/escort/fuse state) + kill banners.
- Headless bots extended per verb; every chapter still clears in tests.

## Requirements

| ID | Requirement |
|----|---|
| K1 | Carry/dropoff + drop-on-hit; tests. |
| K2 | Swiftness stacks with cap; tests. |
| K3 | Harmless dummies; marked kills with banner events; tests. |
| K4 | Fuse shards with countdown + detonation score; tests. |
| K5 | Hazard-vs-enemy burn ticks; tests. |
| K6 | Escort followers + exit zones + drop-on-hit; tests. |
| K7 | Martyr blast (kills all, WON) + enraged bosses; tests. |
| K8 | All 8 chapters rewired (JSON), bots clear every chapter headless. |
| K9 | HUD objective line + banners; carried/escort visuals; dropoff/exit markers. |
| K10 | Full suite + smoke + budgets + deploy + live; determinism green throughout. |
