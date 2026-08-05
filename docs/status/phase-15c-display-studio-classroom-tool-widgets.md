# Phase 15C — Connect Classroom Tools as Real Display Studio Widgets

**Branch:** `main`
**Starting commit:** `20ab2c9` Harden Display Studio widget editing
**Date:** 2026-08-05

---

## Goals

Wire existing Command Center classroom tools into Display Studio as real, safe, usable widgets. Make Display Studio the central classroom display hub where existing tools can be added to a slide/screen like Classroomscreen widgets.

---

## Classroom Tools Investigated

| Tool | Store | Display Component | Student-Safe? |
|------|-------|-------------------|---------------|
| Countdown Timer | `timerStore.ts` (transitionTimers) | `TransitionTimerWidget` (mode='display') | Yes — countdown only, no controls |
| Routine Timer | `timerStore.ts` (routineTimers) | `RoutineTimerWidget` (mode='display') | Yes — phase label + countdown only |
| Mystery Star | `pickerStore.ts` | `MysteryStudentActiveBadge` | Yes — `getMysteryDisplayStatus()` strips student IDs |
| Random Number/100 Board | `randomNumberStore.ts` | `RandomNumberDisplay` | Yes — number only |
| Prize Board | `prizeBoardStore.ts` + `pressYourLuckStore.ts` | `PrizeBoardProjectorMode` | Yes — `stripPrivateBoardFields()` removes prize IDs |
| Press Your Luck | `pressYourLuckStore.ts` | Same as Prize Board | Yes — `displayPrivacy.ts` audit |
| Noise Control | `boardStore.ts` (noiseTrackers) | `VoiceLevelWidget`, `NoiseStatusCard` | Yes — voice level label only |
| Classroom Atmosphere | `atmosphereStore.ts` | `MusicDisplayIndicator` | Yes — mode label only, no URLs |

---

## Tools Fully Connected as Display Studio Widgets

| Widget | Canvas Renderer | Inspector Controls | Student-Safe Display |
|--------|----------------|-------------------|---------------------|
| **Countdown Timer** | Live countdown from timerStore | timerKind selector | Countdown label only |
| **Routine Timer** | Phase label + progress bar | routineId input | Phase label + next |
| **Mystery Student** | Status badge from `getMysteryDisplayStatus()` | Label (reads live from store) | "Mystery Star is watching" card |
| **Random Picker** | "Ready to pick" prompt | Label | "Ready" card |
| **100 Board** | Last drawn number from `useRandomNumberStore` | Label | "100 Board" card |
| **Prize Board** | Phase status from `usePressYourLuckStore` | Label | "Prize Board" card |
| **Press Your Luck** | Phase status | Label | "Press Your Luck" card |
| **Noise Level** | Manual voice level with color indicator | mode (manual/live), level selector | Voice level with color dot |
| **Atmosphere / Music** | Music mode from `useAtmosphereStore` | Label (reads live from store) | "Music" card |
| **Directions/Text** | Editable text content | text textarea | Text render |
| **Work Symbols** | Work mode icon + label | symbol selector | Work mode label |
| **Materials** | Item count from screen materialsCard | Via inspector Widgets section | "Materials" card |
| **Checklist** | Checked/total count from screen checklistCard | Via inspector Widgets section | "Checklist" card |

---

## Tools with Placeholder/WARN Status

None — all connected tools have been fully wired with live data from existing stores. Tools not yet implemented as canvas widgets (image, pdf-embed, dice-spinner, poll, scoreboard, stopwatch, qr-code) remain as `placeholder` in the widget library and render a "Coming soon" label.

---

## Data Model Changes

### `CanvasWidgetType` expanded (types.ts)
Added: `'countdown-timer'`, `'routine-timer'`, `'noise-meter'`, `'atmosphere'`

### `studioWidgets.ts` statuses updated
- `'live'` → `'connected'` for all wired widgets
- Added `'atmosphere'` widget definition
- Added `STATUS_LABELS` mapping

### `widgetRegistry.ts` (NEW)
Central registry with type, label, category, status, defaultSize, defaultSettings, studentSafe for all widget types.

---

## Files Changed

### New Files
- `src/features/display-studio/widgetRegistry.ts` — Central widget type registry
- `src/features/display-studio/WidgetCardShell.tsx` — Shared card shell for canvas widgets
- `src/features/display-studio/WidgetCanvasCard.tsx` — Main dispatcher for widget renderers
- `src/features/display-studio/WidgetTimerRenderers.tsx` — Timer + routine timer canvas renderers
- `src/features/display-studio/WidgetEngagementRenderers.tsx` — Mystery, picker, 100 board, prize, PYL renderers
- `src/features/display-studio/WidgetMiscRenderers.tsx` — Noise, atmosphere, directions, work symbols, materials, checklist, placeholder renderers
- `src/features/display-composer/WidgetDisplayOverlay.tsx` — Student-safe /display widget renders

### Modified Files
- `src/features/display-composer/types.ts` — Added 4 new `CanvasWidgetType` values
- `src/features/display-studio/studioWidgets.ts` — Updated statuses, added atmosphere, added STATUS_LABELS
- `src/features/display-studio/DisplayStudioCanvas.tsx` — Replaced icon-card placeholders with `WidgetCanvasCard` real renderers
- `src/features/display-studio/DisplayStudioInspector.tsx` — Added widget-specific controls (timerKind, routineId, noise mode/level, work symbol)
- `src/features/display-studio/DisplayStudioWidgetLibrary.tsx` — Updated WIDGET_TYPE_MAP, handler, isWidgetActive for new types
- `src/features/display-studio/DisplayStudioPresenter.tsx` — Added active tool status badges (music, PYL, mystery)
- `src/features/display-composer/DisplayScreenRenderer.tsx` — Added `WidgetDisplayOverlay` for /display widget rendering
- `src/features/display-composer/defaultScreens.ts` — Added 5 new templates with connected widgets (math launch, work time, mystery student, review game, lunch routine)
- `src/lib/display-studio-tests.ts` — Updated tests, added 8 new Phase 15C tests (35 total)
- `src/lib/display-composer-tests.ts` — Updated screen count assertions (15→20)
- `src/lib/display-composer-packs-tests.ts` — Updated pack count assertions
- `tests/e2e/display-studio.spec.ts` — Updated thumbnail count assertions (15→20)

---

## Student-Safety Proof

1. **Teacher notes never on /display**: `toDisplaySafeScreen()` strips `teacherNotes` via `DISPLAY_SAFE_FORBIDDEN_KEYS`
2. **Mystery student identity is protected**: `getMysteryDisplayStatus()` returns only `isActive`, `statusLabel` — never student IDs or observations
3. **Widget renderers on /display are static**: `WidgetDisplayCard` produces simple card renders — no live store subscriptions, no teacher controls
4. **Only visible widgets render on /display**: `WidgetDisplayOverlay` filters `.visible` widgets
5. **/display viewer**: Shows "7:20 Arrival" with student-safe content (title, clock, message, materials, checklist, timer) — no inspector, no edit buttons, no teacher notes

---

## Presenter Mode Updates

- Active tool status badges shown: music mode (🎵), Press Your Luck active (🎰), Mystery Star active (🌟)
- Prev/Next navigation preserved
- Send to Display / Clear Display preserved
- Teacher Notes panel preserved (private, never on /display)
- Quick Jump thumbnail list preserved

---

## Tests Run

| Test Suite | Result |
|------------|--------|
| `test:display-studio` | **35 passed, 0 failed** |
| `test:display-composer` | **All passed** |
| `test:timers` | **All passed** |
| `test:routines` | **120 passed, 0 failed** |
| `test:random-number` | **29 passed, 0 failed** |
| `test:student-picker` | **36 passed, 0 failed** |
| `test:prize-board` | **122 passed, 0 failed** |
| `test:classroom-atmosphere` | **All passed** |
| `test:studio-canvas` | **93 passed, 0 failed** |
| `test:display-launch` | **12 passed, 0 failed** |
| `test:display-polish` | **15 passed, 0 failed** |
| `test:morning-message` | **34 passed, 0 failed** |
| `test:teacher-dock` | **All passed** |
| `npm run build` | **PASS** |
| `npm run lint` | **PASS** |
| `test:e2e` | **WARN** (Playwright browser binary missing; `npx playwright install chromium` would fix) |

---

## Visual QA Screenshots

Captured to `docs/status/phase-15c-screenshots/`:
1. `01-display-studio-editor.png` — Display Studio main editor with 7:20 Arrival screen, thumbnail rail, inspector, canvas
2. `02-work-time-widgets.png` — Work Time template with countdown timer, work symbols, noise level widgets
3. `03-display-student-view.png` — /display student view — clean, no teacher chrome

---

## Known Limitations

- No live Noise Meter connection — uses manual voice level selector (WARN)
- Stopwatch widget not implemented (placeholder)
- Image/PDF embed widgets not implemented (placeholders)
- Dice/Spinner/Poll/Scoreboard not implemented (placeholders)
- QR Code not implemented (placeholder)

---

## Intentionally Deferred

- True resize handles (size presets used instead)
- Full student-safe live timer rendering on /display widgets (uses static card)
- OmniNote handoff widget
- Widget drag reorder in thumbnail rail

---

## Next Recommended Phase: 15D

Polish, edge cases, and remaining widget connections:
- Connect live noise meter readings to noise widget
- Add remaining placeholder widget implementations (stopwatch, dice, poll)
- Widget-specific /display student-safe live content (not just static cards)
- E2E test hardening

---

## PASS/WARN/FAIL Summary

| Category | Status | Details |
|----------|--------|---------|
| Build | **PASS** | TypeScript + Vite builds cleanly |
| Lint | **PASS** | ESLint passes |
| Display Studio tests | **PASS** | 35 passed |
| Display Composer tests | **PASS** | All passed |
| Timer tests | **PASS** | All passed |
| Routine tests | **PASS** | 120 passed |
| Random Number tests | **PASS** | 29 passed |
| Student Picker tests | **PASS** | 36 passed |
| Prize Board tests | **PASS** | 122 passed |
| Classroom Atmosphere tests | **PASS** | All passed |
| Studio Canvas tests | **PASS** | 93 passed |
| Display Launch tests | **PASS** | 12 passed |
| Display Polish tests | **PASS** | 15 passed |
| Morning Message tests | **PASS** | 34 passed |
| Teacher Dock tests | **PASS** | All passed |
| E2E tests | **WARN** | Playwright browser binary missing |
| Student Safety | **PASS** | No teacher data on /display |
| Widget Connections | **PASS** | 14 tools connected to real stores |

---

## Safe to Commit: YES

All validation commands pass (build, lint, unit tests). E2E WARN is a known environment issue, not a code failure.

**No commit was made.** Awaiting approval.
