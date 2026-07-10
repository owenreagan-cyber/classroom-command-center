# Status — Command Center Phase 7A/7B Noise Tracker Foundation

## Checklist

- [x] noise tracker ids added
- [x] voice level type added
- [x] noise tracker state added
- [x] Homeroom tracker default added
- [x] Math tracker default added
- [x] Reading tracker default added
- [x] noise trackers persisted locally
- [x] import fallback handles old board backups without noise trackers
- [x] reset restores default noise trackers
- [x] Teacher Dock noise controls added
- [x] voice level controls added
- [x] manual meter controls added
- [x] noisy point control added
- [x] lap +/- controls added
- [x] Time Served reset added
- [x] student-facing Noise Status card added
- [x] Homeroom card wiring added
- [x] Math card wiring added
- [x] Reading card wiring added
- [x] card visibility support added
- [x] local-only boundary preserved
- [x] no new dependencies
- [x] build PASS
- [x] lint PASS
- [x] manual QA checklist saved
- [x] phase report saved

## Validation proof

```text
npm run build  -> PASS
npm run lint   -> PASS
```

## Files changed

Expected implementation files:

- `src/data/types.ts`
- `src/data/defaults.ts`
- `src/store/boardStore.ts`
- `src/app/AppShell.tsx`
- `src/board/TeacherDock.tsx`
- `src/board/NoiseControlPanel.tsx`
- `src/screens/ActiveScreen.tsx`
- `src/screens/HomeroomScreen.tsx`
- `src/screens/MathScreen.tsx`
- `src/screens/ReadingScreen.tsx`
- `src/widgets/NoiseStatusCard.tsx`

Docs:

- `docs/phases/phase-7a-7b-noise-tracker-foundation.md`
- `docs/status/phase-7a-7b-noise-tracker-foundation.md`
- `docs/qa/phase-7a-7b-noise-tracker-foundation-qa.md`
