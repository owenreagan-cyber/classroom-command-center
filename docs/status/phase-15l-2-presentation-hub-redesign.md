# Phase 15L.2 — Presentation Hub Redesign

## Summary

Redesigned the teacher-facing presentation surface of Command Center from a
cluttered "cockpit" into a premium, presentation-first workstation. The new
**Presentation Hub** is now the primary surface on `/control` (edit mode): a
dominant live 16:9 preview of the student display, a compact status strip, a
compact scene rail, a single set of primary Send / Blank / Restore actions, and
clear entry points into Display Studio, Teach Mode, and the board editor.

`/display` behavior is unchanged except where it already shares composer state,
and all Phase 15L.1 student-display safety guarantees still pass.

## Before / After Problem Statement

**Before:** `/control` edit mode opened directly onto the board editor flanked
by the Teacher Dock. The live display state lived in a small "Live" chip inside
Display Studio's command bar, and the presentation workflow (what's live, what's
next, send/blank/restore) had no dedicated home. The result felt like a dense
dashboard/cockpit with no single "what are students seeing right now" surface.

**After:** `/control` edit mode opens onto the Presentation Hub. The live
display preview is the dominant object, presentation controls are primary and
not duplicated, and the dock is a secondary, collapsed-by-default rail. The
board editor remains available via the "Board" segment.

## Files Changed

New:

- `src/features/presentation-hub/presentationHubLogic.ts` — pure, deterministic
  helpers for display status resolution and Current/Next navigation.
- `src/features/presentation-hub/PresentationHub.tsx` — the hub UI (preview,
  status strip, scene rail, primary actions, entry points).
- `scripts/capture-phase15l2-screenshots.mjs` — Playwright screenshot capture.
- `docs/status/phase-15l-2-screenshots/` — 8 review screenshots.

Modified:

- `src/app/TeacherControlShell.tsx` — center of edit mode now renders
  `PresentationHub` wrapping the existing `BoardWorkspace` (board editor).
- `src/lib/display-studio-tests.ts` — added 5 executable Presentation Hub logic
  tests (124 total, up from 119).
- `scripts/test-display-studio.sh` — added `presentationHubLogic.ts` to the
  compiled test surface.

## Presentation Hub Behavior

- **Large live preview (dominant):** renders the live Display Composer screen
  faithfully via the student-safe `DisplayScreenRenderer` (`variant="display"`).
  Shows a distinct "Screen Paused" state when blanked, and a calm "No screen is
  live" state when idle. A "Preview" badge marks a non-live selection.
- **Current / Next flow:** status strip shows the live screen title and a
  "Next: …" hint. Primary `Send to Display`, `Blank Screen` / `Restore Display`,
  and `Clear` actions are centered and single-instance in the hub. Previous/Next
  cycle the scene rail (clamped, no wrap).
- **Scene rail:** a compact horizontal rail of existing Display Composer screens
  (reused from `displayComposerStore.order`), with the live screen highlighted.
- **Status strip:** compact single row with display status (Live / Blanked /
  Ready), live screen title, running timer chip, active music label, and clock.
  No teacher-private data.
- **Entry points:** `Display Studio` (opens the existing overlay on the selected
  screen), `Teach Mode` (switches to the clean classroom preview), and a
  `Present | Board` segment to reach the existing board editor.

## Intentionally Not Redesigned

- **Display Studio** itself is unchanged (entry only, no editor rebuild).
- **Teacher Dock** remains; it stays collapsed by default and is now secondary
  to the hub. Its internal tool panels and any deeper Send/Blank/Clear controls
  inside Display Studio (Command Bar) remain as pre-existing duplicates —
  deferred, since removing them risks regressing the editor.
- **Board > Scene > Widget model** unchanged; the board editor is preserved
  behind the "Board" segment.
- No new widgets, templates, or feature families. No tldraw/Konva migration.
- OmniNote, Canvas, AI, Spotify OAuth, Behavior untouched.

## Student Display Safety

- `/display` path unchanged; no hub chrome mounts on `/display`.
- Hub preview renders through `toDisplaySafeScreen` (strips `teacherNotes`,
  `updatedAt`, `version`) and the same student-safe renderer used on `/display`.
- `test-display-studio.sh` student-facing renderer scan still passes.
- Template audit unchanged and still valid (34 entries, 0 unsafe, 0 overlap).
- `test:display-import-guard` and `test:display-bundle-guard` pass.

## Validation

```
npm run build                       PASS (tsc -b && vite build)
npm run lint                        WARN (3 pre-existing canvas-spike fast-refresh errors; changed files clean)
npm run test:display-studio         PASS (124 passed, 0 failed)
npm run test:display-composer       PASS
npm run test:display-launch         PASS (12 passed)
npm run test:display-polish         PASS (15 passed)
npm run test:teacher-dock           PASS
npm run test:student-picker         PASS (36 passed)
npm run test:hundred-board          PASS (387 passed)
npm run test:lotto-board            PASS (166 passed)
npm run test:prize-board            PASS (238 passed)
npm run test:jobs-manager           WARN (pre-existing JM-14 deterministic failure, unrelated)
npm run test:display-import-guard   PASS
npm run test:display-bundle-guard   PASS
```

## Screenshot List

Saved under `docs/status/phase-15l-2-screenshots/`:

- `hub-1440x900.png`
- `hub-blanked-1440x900.png`
- `hub-studio-1440x900.png`
- `hub-1024x768.png`
- `hub-blanked-1024x768.png`
- `hub-studio-1024x768.png`
- `display-active-1440x900.png`
- `display-active-1024x768.png`

## PASS / WARN / FAIL

- **PASS:** hub is preview-first and less cluttered; Send/Blank/Restore obvious;
  `/display` student-safe; no new widgets/features; Display Studio opens; safety
  tests pass; build passes; screenshots captured; report written.
- **WARN:** deeper Display Studio Command Bar duplicates remain (documented,
  deferred); pre-existing jobs-manager JM-14 and canvas-spike lint failures
  remain (proven unrelated); Board > Scene > Widget unification and
  tldraw/Konva decisions deferred.
- **FAIL:** none.

## Deferred Items

- Remove/collapse duplicate Send/Blank/Clear controls inside Display Studio
  (Command Bar) once a safe editor path is confirmed.
- Fully hide the dock tool workspace when the hub is the active primary view
  (kept intact to preserve dock functionality).
- Board > Scene > Widget model unification; tldraw/Konva decision.
