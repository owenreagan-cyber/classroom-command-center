# Status — Command Center Phase 7C/7D Noise Tower Defense

## Checklist

- [x] noise tower letters added
- [x] 2 HP tower state added
- [x] tower state persisted locally
- [x] old saved boards migrate safely
- [x] noisy point tower damage rule added
- [x] lap minute bonus on tower destruction added
- [x] repair tick rule added
- [x] lap minute reduction on full rebuild added
- [x] lap minutes never drop below zero
- [x] manual lap +/- controls preserved
- [x] Served reset preserved
- [x] manual tracker reset control added
- [x] teacher tower health summary added
- [x] student-facing tower HUD upgraded
- [x] Homeroom card wiring preserved
- [x] Math card wiring preserved
- [x] Reading card wiring preserved
- [x] display placement adjusted for readability
- [x] local-only boundary preserved
- [x] no microphone/WebRTC/cloud/API work added
- [x] no new dependencies added
- [x] build PASS
- [x] lint PASS
- [x] phase docs saved
- [x] QA checklist saved

## Validation proof

```text
npm run build  -> PASS
npm run lint   -> PASS
```

## Files changed

Expected implementation files:

- `src/data/types.ts`
- `src/data/defaults.ts`
- `src/lib/noiseTowers.ts`
- `src/store/boardStore.ts`
- `src/app/AppShell.tsx`
- `src/board/TeacherDock.tsx`
- `src/board/NoiseControlPanel.tsx`
- `src/screens/ActiveScreen.tsx`
- `src/screens/HomeroomScreen.tsx`
- `src/screens/MathScreen.tsx`
- `src/screens/ReadingScreen.tsx`
- `src/widgets/NoiseStatusCard.tsx`
- `src/lib/displayLayout.ts`

Docs:

- `docs/phases/phase-7c-7d-noise-tower-defense.md`
- `docs/status/phase-7c-7d-noise-tower-defense.md`
- `docs/qa/phase-7c-7d-noise-tower-defense-qa.md`
