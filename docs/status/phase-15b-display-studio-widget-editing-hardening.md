# Phase 15B — Display Studio Widget Editing, Canvas Interaction, and Presenter Hardening

**Branch**: (uncommitted changes on current branch)
**Starting commit**: `f1b0d74 Add Display Studio redesign`
**Date**: August 4, 2026

## Goals

Make Display Studio usable as the primary classroom display authoring and presenting tool by adding canvas widget selection, drag, actions, hardened inspector, text input fix, presenter improvements, and more templates.

## Files Changed

### New files
- `src/lib/inputSafety.ts` — `isTypingTarget()` helper for keyboard-safe text editing

### Modified files
| File | Changes |
|------|---------|
| `src/features/display-composer/types.ts` | Added `CanvasWidget`, `CanvasWidgetType`, `WidgetSizePreset`, `WIDGET_SIZE_PRESETS`; extended `DisplayScreen` with `widgets?: CanvasWidget[]` and `teacherNotes?: string` |
| `src/features/display-composer/displaySafe.ts` | Added `widgets` to `DisplaySafeScreen`; filters hidden widgets and non-safe settings; added `teacherNotes` to forbidden keys |
| `src/features/display-composer/displayComposerStore.ts` | 10 new widget actions: addWidget, removeWidget, updateWidget, duplicateWidget, toggleWidgetVisibility, toggleWidgetLock, moveWidget, resizeWidget, bringWidgetForward, sendWidgetBackward |
| `src/features/display-composer/defaultScreens.ts` | 8 new classroom templates (15 total, up from 7) |
| `src/features/display-studio/displayStudioUIContext.ts` | Added `selectedWidgetId` and `selectWidget` to context |
| `src/features/display-studio/displayStudioContext.tsx` | Added `selectedWidgetId` state and `selectWidget` callback |
| `src/features/display-studio/DisplayStudioShell.tsx` | Uses `isTypingTarget` for Escape key handler |
| `src/features/display-studio/DisplayStudioCanvas.tsx` | Complete rewrite: widget rendering, click-to-select, drag-to-move with transient state, selection outline, empty state |
| `src/features/display-studio/DisplayStudioInspector.tsx` | Widget-specific detail section; teacher notes persisted to store; screen-level sections when no widget selected |
| `src/features/display-studio/DisplayStudioWidgetLibrary.tsx` | Canvas widget creation integrated; `WIDGET_TYPE_MAP` for type/size mapping |
| `src/features/display-studio/DisplayStudioPresenter.tsx` | Prev/next navigation, "Send Next" button, teacher notes display, fixed hook ordering |
| `src/lib/display-studio-tests.ts` | 27 tests: widget presets, teacher notes safety, hidden widgets filtering, typing targets |
| `src/lib/display-composer-tests.ts` | Updated for 15 screens |
| `src/lib/display-composer-packs-tests.ts` | Updated pack counts |
| `tests/e2e/display-studio.spec.ts` | Updated for 15 thumbnails |

## Data Model

### CanvasWidget
- `id`, `type` (canvas widget type), `label`, `x/y` (0-100%), `w/h` (%), `visible`, `locked`, `settings`, `zIndex`

### Size Presets: small (20x20), medium (30x30), large (45x45), wide (60x30), full-width (90x20)

## Widget Actions Implemented

Show/Hide, Lock/Unlock, Duplicate, Delete, Bring Forward, Send Backward, Resize (presets), Drag-to-move (transient DOM + commit on dragEnd)

## Text Input Fix

`isTypingTarget()` in `src/lib/inputSafety.ts` — recognizes INPUT, TEXTAREA, SELECT, contentEditable, role=textbox. Works in browser and Node.js test environments.

## Presenter Mode

Prev/Next navigation, Send Next button, teacher notes from persisted data, Blank Screen → clearDisplay(), fixed hook ordering

## Templates: 15 screens (was 7)

New: Lesson Launch, Work Time, Partner Talk, Cleanup, Pack Up, End of Day, Game/Review, Prize Board

## Validation Table

| Test | Result |
|------|--------|
| tsc --noEmit | PASS |
| npm run lint | PASS (0 errors, 0 warnings) |
| npm run build | PASS |
| test:display-studio (27 tests) | PASS |
| test:display-composer | PASS |
| test:timers | PASS |
| test:morning-message | PASS |
| test:teacher-dock | PASS |
| test:display-launch | PASS |
| test:display-polish | PASS |
| test:studio-canvas (93 tests) | PASS |
| test:teacher-workstation | PASS |
| test:e2e (Playwright) | WARN (browser binary missing) |

## Student-Safety

- `toDisplaySafeScreen()` returns null for `studentSafe: false`
- `teacherNotes` excluded from DisplaySafeScreen + added to forbidden keys
- Hidden widgets filtered; widget settings restricted to safe keys
- All safety tests pass

## Known Limitations

- Engagement/reward widgets show placeholder cards on canvas (not live content)
- No resize handles (size presets only)
- Thumbnail rail no drag reorder
- Morning Message not integrated into Display Studio screens

## Safe to Commit: Yes

**No commit has been made.** Awaiting approval.
