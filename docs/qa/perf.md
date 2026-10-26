# Performance protocol

Targets: 60 fps on a mid-tier Android phone and a 4 GB Chromebook, first
gameplay under 20 s on throttled 4G, p95 frame time under 16.7 ms.

## Automated gate (every build)

```sh
npm run build
npm run budget   # hub ≤60 KB gzip, game ≤500 KB gzip, largest file ≤2 MiB
npm run assets   # per-game assets ≤5 MiB, licences present
```

## Manual protocol (each release)

1. Serve the production build: `npm run preview`.
2. Desktop: Chrome DevTools → Performance → Rendering → **Frame Rendering
   Stats** and **FPS meter**. Play a full 90 s run; record min/avg FPS.
3. Throttle CPU 4× and repeat. The sim is fixed-step, so frame rate must drop
   without game speed changing.
4. Phone: open the Pages URL on a mid-tier Android (4 GB RAM), play 10 minutes
   with the screen recording overlay off. Watch for thermal throttle after
   minute 6.
5. Input latency: pause menu → measure key press to on-screen change with a
   high-speed camera or the DevTools input trace. Target ≤100 ms.
6. Lighthouse (mobile, throttled): LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1.
7. Replay check: `npx vitest run tests/unit/shooter-sim.spec.ts` — same seed and
   input log must produce an identical hash.

## Recording

| Build | Device | CPU | Min FPS | Avg FPS | LCP | INP | Notes |
|---|---|---|---|---|---|---|---|
| v1.0 | — | — | — | — | — | — | pending device run |
| v2.0 | — | — | — | — | — | — | hub 1.3 KB gz, egara 356 KB gz, assets 122.5 KiB; device run still pending |
| v3.0 | — | — | — | — | — | — | hub 2.3 KB gz, egara 361 KB gz, assets 2.1 MB; auto-tier verified degrading headless; device run still pending |
| v3.1-ch1 | — | — | — | — | — | — | wind-gust sim green; street screenshot-verified; budgets hold; live 200 |
| v3.2-ch2 | — | — | — | — | — | — | updrafts reuse wind; bedroom screenshot-verified; budgets hold; live 200 |
| v3.3-ch3 | — | — | — | — | — | — | training gates; workbench screenshot-verified; budgets hold; live 200 |
| v3.4-ch4 | — | — | — | — | — | — | traffic hazards; highway screenshot-verified; budgets hold; live 200 |

Automated numbers are not a substitute for the manual row; leave it blank until
the device run happens.
