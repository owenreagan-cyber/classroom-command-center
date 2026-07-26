# Phase 13.1 — Track-Aware Schedule Correction

**Branch:** `phase-13-teacher-workstation-consolidation`  
**Date:** 2026-07-26  
**Status:** Ready for review (NOT committed)

---

## Summary

Corrected the canonical daily bell schedule order and added a typed, track-aware schedule model for History/Science rotation. No schedule editor was added; blocks remain data-driven in `routineSchedule.ts`.

---

## Corrected instructional order

After Carpool/Homeroom:

1. Math  
2. Snack  
3. Shurley/Writing/Handwriting  
4. Movement  
5. Spelling  
6. Reading  
7. Lunch  
8. Recess  
9. History/Science (track-aware label)  
10. Specials  
11. Pack Up  
12. Carpool  

---

## Track-aware History/Science mapping

| Track | Subject |
| --- | --- |
| 1 | History |
| 2 | Science |
| 3 | History |
| 4 | Science |

Track resolves weekly from `TRACK_ROTATION_EPOCH` (2026-08-17, Q1W1 Monday). Override labels and screen routing live on the `history-science` block via `trackOverrides`.

### TRACK_ROTATION_EPOCH (temporary helper)

`TRACK_ROTATION_EPOCH` is a **temporary deterministic schedule helper**. It enables current/next subject resolution and track-aware recess suggestions before a teacher-editable track calendar exists. A future schedule editor should allow manual teacher override of the active track — that editor is **not** built in Phase 13.1.

---

## Typed schedule model

`ScheduleBlockModel` (`src/data/scheduleModel.ts`):

- `blockId`
- `title`
- `startTime` / `endTime`
- `durationMinutes`
- `trackOverrides`

Helpers: `toScheduleBlockModel`, `resolveCurriculumTrack`, `resolveBlockDisplayLabel`, `resolveBlockPageSuggestion`, `assertInstructionalBlockOrder`.

---

## UI updates

- **Teacher Dashboard** — track-aware Now/Next labels; schedule preview shows History or Science by track.
- **Today Prep** — active context banner shows curriculum track, today's History/Science subject, and current block.
- **Snack display fallback** — after snack, suggests Shurley/Writing instead of History/Science.
- **Recess suggestion** — track-aware `Open History` / `Open Science` via `resolveBlockPageSuggestion`.
- **Movement routing** — movement block uses `movement` screen id (minimal vibe page; dedicated display polish deferred).

---

## Files changed

| File | Change |
| --- | --- |
| `src/data/routineTypes.ts` | Curriculum track types, `ScheduleBlockModel`, block `trackOverrides` |
| `src/data/scheduleModel.ts` | Track resolution, `resolveBlockPageSuggestion`, epoch docs |
| `src/data/routineSchedule.ts` | Movement screen routing; recess suggestion resolved at runtime |
| `src/data/types.ts` | `movement` screen id + `movement-default` vibe page |
| `src/data/defaults.ts` | Movement default content |
| `src/data/pageSequences.ts` | Movement workspace stub |
| `src/lib/routine-tests.ts` | Movement routing + recess track suggestion tests |
| `src/screens/HomeroomScreen.tsx` | Track-aware block suggestions on display |
| `src/screens/SnackLunchDisplayView.tsx` | Track-aware block suggestions on display |
| `src/board/TeacherDashboardPanel.tsx` | Track-aware schedule labels |
| `src/board/TodayPrepPanel.tsx` | Track + current block in active context banner |
| `src/screens/SnackLunchDisplayView.tsx` | Snack → Shurley suggestion |
| `scripts/test-routines.sh` | Compiles `scheduleModel.ts` |

---

## Remaining schedule improvements

- Teacher-configurable track calendar (replace `TRACK_ROTATION_EPOCH` weekly rotation)
- Teacher-editable bell schedule UI (Phase 14)
- Exact block times still hardcoded pending teacher confirmation
- Movement vibe page is a minimal stub — dedicated movement display/widgets deferred
- Late-start / assembly / early-dismissal day variants not modeled

---

## Validation

Run from repo root:

```bash
npm run build
npm run lint
npm run test:routines
npm run test:teacher-workstation
```
