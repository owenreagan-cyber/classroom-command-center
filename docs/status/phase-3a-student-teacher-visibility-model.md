# Phase 3A — Student/Teacher Visibility Model Status

Status: COMPLETE  
Branch: command-center-visibility-model  
Date: 2026-07-09

## Checklist

- [x] visibility model defined
- [x] student display filtering added
- [x] teacher-only notes/resources protected
- [x] existing screens preserved
- [x] build PASS
- [x] lint PASS
- [x] phase report saved

## Phase Report

### Files changed

| File | Change |
|------|--------|
| `src/lib/visibility.ts` | **New** — `Visibility` helpers: `shouldRenderForMode`, `isVisibleToStudentDisplay`, `filterVisibleItems`, `viewerContextFromMode` |
| `src/components/VisibilityGate.tsx` | **New** — wrapper that hides content in display mode; labels teacher-only content in edit mode |
| `src/data/types.ts` | Added `Visibility`, `WithVisibility`, `TeacherNote`, `TeacherResourceLink`; extended `SmartTextBlock`; added `teacherNotes` to `BoardState` |
| `src/data/defaults.ts` | Added `DEFAULT_TEACHER_NOTES` demo notes scoped per screen |
| `src/store/boardStore.ts` | Persist `teacherNotes`; migrate v3 → v4 |
| `src/board/TeacherNotesPanel.tsx` | **New** — teacher-only notes panel in Teacher Dock (edit mode only) |
| `src/board/TeacherDock.tsx` | Renders `TeacherNotesPanel`; updated dock footer copy |
| `src/app/AppShell.tsx` | Passes `teacherNotes` to Teacher Dock |
| `src/widgets/TeacherHint.tsx` | **New** — inline teacher-only hint component |
| `src/widgets/SmartTextCard.tsx` | Filters blocks by visibility; styles teacher-only note blocks |
| `src/widgets/TimerWidget.tsx` | Optional `teacherHint` prop (teacher-only, edit mode) |
| `src/widgets/PhaseTimerCard.tsx` | Optional `teacherHint` prop (teacher-only, edit mode) |
| `src/screens/MathScreen.tsx` | Passes `timerNote` as teacher hint |
| `src/screens/ReadingScreen.tsx` | Passes `timerNote` as teacher hint |
| `src/screens/SnackLunchScreen.tsx` | Passes `phaseNote` as teacher hint |
| `src/screens/ReadyPositionScreen.tsx` | Compact-cue note block marked `visibility: 'teacherOnly'` |

### Privacy / visibility behavior added

- **`Visibility` type**: `"student" | "teacherOnly" | "hidden"`
  - `student` — visible on projector display and teacher edit view
  - `teacherOnly` — visible only in edit mode (teacher context)
  - `hidden` — not rendered (helpers/types only; no management UI yet)
- **Central helpers** in `src/lib/visibility.ts` keep filtering logic in one place instead of scattered mode checks.
- **Demo teacher notes** in Teacher Dock, scoped per screen (homeroom, math, reading, snack/lunch).
- **Inline teacher hints** on Math, Reading, and Snack/Lunch timer cards using existing `timerNote` / `phaseNote` content.
- **Ready Position compact-cue note** explicitly tagged `teacherOnly` and filtered via `SmartTextCard`.
- **`TeacherResourceLink` type** added for future resource launcher work (not rendered yet).

### How display mode is protected

1. **Teacher Dock** returns `null` when `mode === 'display'` — controls, notes panel, and beautify actions never mount.
2. **`shouldRenderForMode('teacherOnly', 'display')`** returns `false` everywhere it is used.
3. **`SmartTextCard`** filters out blocks with `teacherOnly` or `hidden` visibility before render.
4. **`TeacherHint` / `VisibilityGate`** wrap teacher-only inline hints and return `null` in display mode.
5. **Timer edit controls** (presets, custom minutes, phase editor) were already gated by `mode === 'edit'`; teacher hints follow the same rule.
6. **Persisted `teacherNotes`** live in store state but only render through `TeacherNotesPanel`, which is dock-only.

Students in display mode see: board content, timers (start/pause/resume only), cards, and backgrounds — no teacher notes, hints, or dock controls.

### Future work — `/display` and `/control` split

This phase uses a single app with `edit | display` mode toggling. Documented future direction (from architecture plan):

- **`/display` route** — dedicated student-facing window on projector/Apple TV (no Edit entry unless teacher PIN/gesture)
- **`/control` route** — private teacher workspace on MacBook built-in screen with full dock, prep checklist, resource launcher, hidden-item management
- **Extended display setup** — MacBook teacher screen vs. projector student screen (Presenter View model)
- **Hidden content management UI** — re-enable `hidden` visibility items from control view
- **Teacher Material Launcher** — uses `TeacherResourceLink` with visibility
- **Today Prep** — prep checklist as `teacherOnly` widgets

No routes were added in this phase to avoid overbuilding; the visibility model is ready to plug into route-based contexts via `viewerContextFromMode` or a future `ViewerContext` prop.

### Validation results

```
npm run build  → PASS
npm run lint   → PASS
```

### Risks and limitations

- **Single-window mode toggle** — a teacher can still click "Edit" on the display canvas to re-enter edit mode. True privacy requires separate windows/routes (future).
- **No hidden-item UI** — `hidden` visibility is defined but cannot be toggled yet.
- **Teacher notes are read-only demo content** — no edit UI for notes in this phase.
- **Timer start/pause controls remain on display** — intentional for classroom use; only configuration/prep hints are hidden.
- **Persist migration v4** — existing users get default teacher notes injected on first load after upgrade.

## Notes

This phase formalizes the Presenter View concept:

- students see board
- teacher sees private controls/resources/notes

Existing display layout polish, widgets, timers, and local persistence are preserved.
