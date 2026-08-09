# Phase 15L.2 — Widget Overlap/Collision Safety + Duplicate Chrome Collapse

**Status**: Implementation complete. Not committed.

**Branch**: `phase-15l-2-overlap-chrome-safety`

**Parent**: 2840c06 (Phase 15L.1A — Amend canvas engine display boundary decision)

---

## Summary

Phase 15L.2 delivers two independent safety improvements to the Display Studio teacher authoring surface (`/control` only):

1. **Duplicate chrome collapse** — Each high-level action (Send to Display, Blank/Restore, Presenter, Clear Display, Browse Templates) exists in exactly one primary location, with static source guards that fail if duplicates return.

2. **CanvasWidget overlap/collision safety** — A widget-vs-widget overlap detector plus a reserved-zone detector for title bar and top-right status chrome, teacher-only, scoped to `/control`.

`/display` is **unchanged**. The protected projection boundary established in Phase 15L.1A is preserved.

---

## A. Duplicate Chrome Collapse

### Primary Locations

| Action | Primary Location | Guards |
|--------|-----------------|--------|
| Send to Display | `DisplayStudioCommandBar.tsx` (line 85 `data-studio-action="send-to-display"`) | `scripts/test-display-studio.sh` |
| Clear Display | `DisplayStudioCommandBar.tsx` (line 95 `data-studio-action="clear-display"`) | `scripts/test-display-studio.sh` |
| Blank / Restore | `DisplayStudioCommandBar.tsx` (lines 106, 116 `data-studio-action="blank-display"/"unblank-display"`) | `scripts/test-display-studio.sh` |
| Presenter toggle | `DisplayStudioCommandBar.tsx` (line 124 `onClick={togglePresenterMode}`) | `scripts/test-display-studio.sh` |
| Browse Templates | `DisplayStudioThumbnailRail.tsx` (`toggleTemplatePicker`) | `scripts/test-display-studio.sh` |

### What Was Removed From Secondary Locations

- **`DisplayStudioInspector.tsx`**: `Send to Display`, `Clear Display`, and `togglePresenterMode` buttons removed. The `DisplaySection` now shows a passive live-status indicator and readability warnings only.
- **`DisplayStudioPresenter.tsx`**: All `Send to Display`, `Blank`, `Restore`, and `Clear Display` buttons removed. Replaced with passive guidance text ("Use the command bar to send…"). No imports of `clearDisplay`, `blankDisplay`, or `unblankDisplay`.
- **`DisplayStudioCommandBar.tsx`**: The `📁 Templates` button (previously toggling `templatePickerOpen`) removed. Template browsing is only in `DisplayStudioThumbnailRail.tsx`.

### Allowed Exceptions (Not Duplicates)

- **Presenter "Exit Presenter"** in `DisplayStudioPresenter.tsx`: This exits the presenter modal/mode. It is not the same as the Presenter toggle launcher in the CommandBar.
- **QuickStart blank/restore** in `DisplayStudioQuickStart.tsx`: These are Quick Start flows (`BLANK` / `RESTORE` action entries), not duplicate high-level chrome. They are a convenience panel that does not persist in the main toolbar.

### Guard Implementation

Static source guards live in `scripts/test-display-studio.sh`. They use `grep` to verify:

| Guard | Checks |
|-------|--------|
| Send to Display NOT in Presenter | No `onClick={sendCurrentToDisplay}` or `>Send to Display<` in `DisplayStudioPresenter.tsx` |
| Send to Display NOT in Inspector | No `sendToDisplay(screen.id)` or `data-studio-action="send-to-display"` in `DisplayStudioInspector.tsx` |
| Clear Display NOT in Presenter | No `onClick={clearDisplay}` or `>Clear Display<` in `DisplayStudioPresenter.tsx` |
| Clear Display NOT in Inspector | No `onClick={clearDisplay}` or `data-studio-action="clear-display"` in `DisplayStudioInspector.tsx` |
| Blank/Restore NOT in Presenter | No `onClick={blankDisplay}`, `onClick={unblankDisplay}`, `>Blank Screen<`, or `>Restore Display<` in `DisplayStudioPresenter.tsx` |
| Templates NOT in CommandBar | No `toggleTemplatePicker` or `templatePickerOpen` in `DisplayStudioCommandBar.tsx` |
| togglePresenterMode NOT in Inspector | No `togglePresenterMode` in `DisplayStudioInspector.tsx` |
| clearDisplay/blankDisplay/unblankDisplay NOT imported in Presenter | No `clearDisplay`, `blankDisplay`, or `unblankDisplay` in `DisplayStudioPresenter.tsx` |
| Browse Templates IS in ThumbnailRail | `Browse Templates` present in `DisplayStudioThumbnailRail.tsx` |

---

## B. CanvasWidget Overlap/Collision Safety

### Implemented and Tested

**Widget-vs-widget overlap detection** (`src/lib/canvasWidgetOverlapDetector.ts`):
- `detectCanvasWidgetOverlaps(widgets)`: Detects overlapping (intersection > 0) and near-collision (gap ≤ 3%) pairs of visible `CanvasWidget`s using percentage-based `x/y/w/h` coordinates.
- `detectScreenOverlaps(widgets)`: Convenience wrapper returning `OverlapReport` (empty if < 2 widgets).

**Reserved-zone detection** (same file):
- `DISPLAY_STUDIO_RESERVED_ZONES`: Two predefined zones:
  - Title Bar: (0, 0, 100, 10) — covers the screen title and mode badge
  - Top-Right Status: (70, 0, 30, 12) — covers the clock, voice-level badge, and status indicators
- `detectReservedZoneOverlaps(widgets, zones)`: Flags any visible widget that intersects a reserved zone.
- `detectScreenOverlapsWithZones(widgets, zones)`: Combines widget-vs-widget + reserved-zone warnings into a single `OverlapReport`.

**Integration** (`src/features/display-studio/DisplayStudioCanvas.tsx`):
- Calls `detectScreenOverlapsWithZones` in a `useMemo`.
- Renders a teacher-only warning panel with `data-overlap-warnings` attribute when `overlapReport.hasWarnings` is true.
- Warning panel shows the severity icon and message for each warning.

**Tests** (`src/lib/display-studio-tests.ts`):
- Overlap detection: 8 tests (overlap, touch, near-collision, hidden widgets, empty/single, structured output, default templates, display isolation)
- Reserved zones: 6 tests (title bar collision, top-right collision, well-placed clean, hidden widgets, combined reporting, zone definitions)

**Scope**: CanvasWidget in Display Composer / Display Studio only. `/control` only — never exposed on `/display`.

### Deferred / Open (Screenshot-Review Bugs)

The widget-vs-widget detector and reserved-zone detector catch **intersecting percentage rectangles**. They do **not** catch the following known visual risks:

| Bug | Status | Rationale |
|-----|--------|-----------|
| Math Launch title vs timer | **Deferred to 15L.3** | Screen title is authoring-time text, not a CanvasWidget. Timers are `timerWidget` model fields, not widgets. The reserved-zone Title Bar detection partially covers this, but actual visual clash depends on rendered font sizes. |
| Mystery Student title/status vs widget | **Deferred to 15L.3** | The mystery-student status badge is rendered by the live widget component, not positioned in the CanvasWidget model. |
| Current Time/top-right badges vs status widgets | **Partially covered** | The Top-Right Status reserved zone (70,0,30,12) will warn if widgets overlap that region. However, the exact rendered size of the clock/badge depends on font metrics. |
| Lunch title/background/timer crowding | **Deferred to 15L.3/15L.4** | Multi-element layout issue (background + title + timer + widgets). Reserved-zone detects widget-vs-zone overlap but not overall density or baked-in text. |
| Baked-in background text collisions | **Deferred to 15L.4** | Explicitly a Phase 15L.4 template completeness audit item. Cannot be detected by any runtime analysis. |

### PageWidget Overlap Risk

PageWidget-based classroom screens (pixel `x/y/width/height` on 1600×900 logical canvas) carry the same structural overlap risk as CanvasWidget. However:

- PageWidget uses a different coordinate system and field names
- PageWidget overlaps have not been reported as live bugs
- Unifying overlap detection is planned for Phase 15N (model unification)
- Fixing PageWidget overlap now would duplicate Phase 15N work

**Decision**: Deferred to Phase 15N.

---

## C. Files Changed

| File | Change |
|------|--------|
| `src/lib/canvasWidgetOverlapDetector.ts` | Added `ReservedZone` interface, `DISPLAY_STUDIO_RESERVED_ZONES`, `widgetIntersectsZone`, `detectReservedZoneOverlaps`, `detectScreenOverlapsWithZones` |
| `src/features/display-studio/DisplayStudioCanvas.tsx` | Import `detectScreenOverlapsWithZones` + `DISPLAY_STUDIO_RESERVED_ZONES`, use combined detector for overlap report |
| `src/lib/display-studio-tests.ts` | Removed 2 decorative chrome tests, added 6 reserved-zone tests, updated imports |
| `scripts/test-display-studio.sh` | Added 2 static source guards (togglePresenterMode in Inspector, clearDisplay/blankDisplay/unblankDisplay in Presenter) |
| `docs/status/phase-15l-2-overlap-chrome-safety.md` | This document |

**No changes to**: `/display`, Board/Scene/Widget model, state migration, routes, dependencies.

---

## D. Confirmation

- No tldraw installed or imported
- No Konva installed or imported
- No new dependencies
- No `/display` behavior change
- No Board/Scene/Widget target-model change
- No state migration
- No commit made
