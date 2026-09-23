# E2E Route Migration Audit

This audit classifies every stale E2E assertion against the **current** product
architecture (post the two intentional route/shell migrations) and proposes a
replacement or disposition for each.

Baseline full-suite run (`npx playwright test --project=chromium`): **68 failed /
44 passed / 1 did not run** (113 total, 14 files).

---

## 1. Current route contracts (Phase 3)

### `/control` — default is Teach Mode

`App.tsx` → `AppShell` → `TeacherControlShell`. With `DEFAULT_MODE = 'teach'`
(`src/data/defaults.ts`), `/control` renders **`TeachModeShell`**, which does
**not** render `BoardWorkspace`, `BoardFrame`, `TeacherCommandDock`, or any
edit/studio chrome. Stable contracts (semantic, no utility CSS):

- shell rendered: `<h1>` title `Morning Arrival` (default `homeroom` screen)
- teacher nav: `Dashboard` button (single exit to edit mode), `Previous slide` /
  `Next slide` buttons, `Present` button (`aria-label="Send to student display"`)
- no crash/fallback: none observed

Edit/studio chrome is reached **only** by clicking `Dashboard` (→ `mode='edit'`),
then optionally the Presentation Hub's `Board` tab for the board editor.

### `/display` — Clean Board host

`App.tsx` intercepts `route === 'display'` and renders **`BoardHostDisplay`**
before `AppShell`/`StudentDisplayShell` are ever reached. Stable contracts:

- host rendered: `[data-clean-board-host-display]`
- student canvas: `[data-board-canvas]`
- teacher chrome absent: `[data-teacher-command-dock]` count 0

---

## 2. Stale selector occurrences (Phase 2)

Classification key:

- **A. CONTROL_TEACH_MODE** — test should verify default `/control` Teach Mode
- **B. DISPLAY_CLEAN_BOARD** — test should verify current `/display` Clean Board
- **C. STUDIO_BOARD_FRAME** — test needs the board editor and must enter it first
- **D. OVERLAY_WORKFLOW** — test targets an overlay; only needs a route-host gate
- **E. OBSOLETE_ASSERTION** — assertion proves nothing meaningful anymore

### `.board-screen-title` (14 code occurrences)

| File | Test | Old assertion | Class | Current contract | Proposed replacement |
|------|------|---------------|-------|------------------|----------------------|
| launch-readiness.spec.ts:13 | /control loads without crashing | `.board-screen-title` visible | A | TeachModeShell h1 `Morning Arrival` | `expectTeachModeReady(page)` |
| launch-readiness.spec.ts:19 | /display loads without crashing | `.board-screen-title` visible | B | Clean Board host | `expectDisplayHostReady(page)` |
| control-display-routes.spec.ts:13 | /control shows teacher workspace | `.board-screen-title` visible | A | TeachModeShell | `expectTeachModeReady(page)` then `enterEditMode` |
| control-display-routes.spec.ts:51 | root path redirects to /control | `.board-screen-title` visible | A | TeachModeShell | `expectTeachModeReady(page)` |
| control-display-routes.spec.ts:57 | unknown path redirects to /control | `.board-screen-title` visible | A | TeachModeShell | `expectTeachModeReady(page)` |
| display-polish.spec.ts:12 | /display excludes nav/teacher controls | `.board-screen-title` visible | B | Clean Board host | `expectDisplayHostReady(page)` |
| visual-qa-display.spec.ts:68 | /display at {viewport} | `.board-screen-title` visible | B | Clean Board host | `expectDisplayHostReady(page)` |
| studio-canvas.spec.ts:221 | classroom mode hides studio toolbar | `.board-screen-title` visible | C | BoardFrame (board editor) | `expectStudioCanvasReady(page)` (board view) |
| display-studio.spec.ts:105 | Send to Display … clear | `.board-screen-title` visible | B | Clean Board host | blocked — see §3 (severed pipeline) |
| display-studio.spec.ts:223 | non-student-safe never renders | `.board-screen-title` visible | B | Clean Board host | blocked — see §3 |
| display-studio.spec.ts:312 | Clear Display returns to normal board | `.board-screen-title` visible | B | Clean Board host | blocked — see §3 |
| display-privacy-regression.spec.ts:68 | /display excludes teacher-only content | `.board-screen-title` visible | B | Clean Board host | `expectDisplayHostReady(page)` |
| display-composer.spec.ts:109 | clearing display returns to normal board | `.board-screen-title` visible | B | Clean Board host | blocked — see §3 |
| display-composer.spec.ts:315 | non-student-safe never renders | `.board-screen-title` visible | B | Clean Board host | blocked — see §3 |

### `.board-canvas` (4 code occurrences)

| File | Test | Old assertion | Class | Current contract | Proposed replacement |
|------|------|---------------|-------|------------------|----------------------|
| launch-readiness.spec.ts:14 | /control loads without crashing | `.board-canvas` visible | A | TeachModeShell | removed (Teach Mode has no board canvas) |
| launch-readiness.spec.ts:20 | /display loads without crashing | `.board-canvas` visible | B | `[data-board-canvas]` | `[data-board-canvas]` visible |
| visual-qa-display.spec.ts:69 | /display at {viewport} | `.board-canvas` visible | B | `[data-board-canvas]` | `[data-board-canvas]` visible |
| prize-board-projector.spec.ts:110 | teacher reset spin clears projector | `.board-canvas` visible | B | Clean Board host | blocked — see §3 (projector severed) |

### Additional dead `StudentDisplayShell` markup (beyond the 19)

| File | Test | Old assertion | Class | Disposition |
|------|------|---------------|-------|-------------|
| display-polish.spec.ts:25 | /display shows student-safe fullscreen control | `Enter fullscreen` button | E | removed — Clean Board has no fullscreen button |
| display-polish.spec.ts:60 | ClassroomCanvas frame renders on display | `.classroom-canvas-frame` | E | removed — `.classroom-canvas-frame` only in dead `StudentDisplayShell` |
| visual-qa-display.spec.ts:70 | /display at {viewport} | `.classroom-canvas-frame` | E | removed |
| visual-qa-display.spec.ts:71 | /display at {viewport} | `Enter fullscreen` button | E | removed |

---

## 3. Deeper finding — severed "cast-to-display" pipeline (beyond route drift)

The two route migrations were accompanied by a **larger architectural cut** that
the "19 selector" framing does not capture. `StudentDisplayShell.tsx` was the
sole mount point for every "cast to the student projector" overlay:

- `PrizeBoardProjectorMode` (`[data-projector-mode="prize-board"]`)
- `DisplayComposerOverlay` (`[data-display-screen-id]`)
- `RandomNumberDisplay`
- `NowShowingDisplayLabel` (`data-testid="now-showing-display"`)
- `BoardWorkspace` (student display of the board, incl. `MorningMessageDisplay`)

`App.tsx` now renders `BoardHostDisplay` for `/display` and never reaches
`StudentDisplayShell`, so **none of those overlays render on `/display`**
anymore. `BoardHostDisplay` only renders the Clean Board canvas, the projected
stamp card, and the QR-code widget.

Consequence: the following failing tests are **not** fixable by test edits
alone. They assert real product behavior (teacher casts X → students see X on
`/display`) that is currently not wired to the new display route:

- **Prize Board projector** (`prize-board-projector.spec.ts`,
  `prize-board-projector-snapshots.spec.ts`, the `/display` half of
  `prize-board-ipad-landscape.spec.ts`) — `[data-projector-mode="prize-board"]`
  never appears on `/display`.
- **Display Composer / Display Studio "Send to Display"** (`display-composer.spec.ts`,
  `display-studio.spec.ts`) — `[data-display-screen-id]` never appears on `/display`;
  the `PresentationHub` "Present" preview is teacher-side only.
- **"Now Showing" label** (`visual-qa-display.spec.ts:186`,
  `display-privacy-regression.spec.ts:81`) — `now-showing-display` never renders.
- **Morning Message on `/display`** (`visual-qa-display.spec.ts:81`,
  `morning-message-studio.spec.ts:24`).

These are classified **REAL PRODUCT REGRESSION (or incomplete migration)** and
are out of scope for a test-only repair per Phase 1 (freeze production code).
They must be fixed in `src/` (re-wire the overlays into `BoardHostDisplay`), or
the tests must be deliberately re-scoped with an explicit product decision.

Additionally, the Display Composer **dock tool** was replaced by the **Display
Studio** overlay (`DisplayComposerToolPanel.tsx`), so `display-composer.spec.ts`
tests that drive the old dock panel's saved-screen buttons are stale against the
new Studio thumbnail rail regardless of the display pipeline.

---

## 4. Other independent failure causes (Phase 8 candidates)

- **`display-studio.spec.ts:127`** — `getByText('Time')` strict-mode violation
  (matches category tab + `Countdown Timer` + `Routine Timer`). Test precision
  bug, not route drift. Class: SECONDARY STALE TEST ASSUMPTION.
- **`prize-board-e2e.ts` `enterEditMode`** — clicks `[aria-label="Enter edit mode"]`
  which no longer exists in Teach Mode; must use the `Dashboard` exit (mirror
  `teacher-dock-e2e.ts`). Class: OLD STUDIO ENTRY BEHAVIOR.
- **`studio-canvas.spec.ts`** — after entering edit mode, the default Presentation
  Hub view is "Present", not "Board"; tests must open the `Board` tab before
  asserting `[data-widget-type=...]`. Class: OLD STUDIO ENTRY BEHAVIOR.

---

## 5. Classification summary

| Class | Count (approx) | Action |
|-------|----------------|--------|
| A CONTROL_TEACH_MODE | 5 | migrate to `expectTeachModeReady` |
| B DISPLAY_CLEAN_BOARD (direct) | 6 | migrate to `expectDisplayHostReady` |
| B DISPLAY_CLEAN_BOARD (blocked) | 6 | blocked by severed pipeline |
| C STUDIO_BOARD_FRAME | 8 | enter board view first |
| E OBSOLETE_ASSERTION | 4 | remove dead StudentDisplayShell assertions |
| REAL PRODUCT REGRESSION | ~30 | report; requires `src/` change |
| SECONDARY STALE ASSUMPTION | ~2 | test precision fix |
| OLD STUDIO ENTRY (helper) | ~14 | fix `enterEditMode` helper |

---

## 6. Post-repair result

Full Chromium gate (`npx playwright test --project=chromium --workers=2`,
**111 tests / 14 files**):

| Metric | Baseline | After repair |
|--------|----------|--------------|
| passed | 44 | **68** |
| failed | 68 | **42** |
| did not run | 1 | 1 |

The 42 remaining failures are **all** attributable to the severed
"cast-to-display" pipeline (see §3) plus one secondary product-behavior issue:

- **Display Composer** (`display-composer.spec.ts`) — 23 tests: the dock tool was
  replaced by Display Studio, and `[data-display-screen-id]` never renders on
  `/display`.
- **Prize Board projector** (`prize-board-projector.spec.ts`,
  `prize-board-projector-snapshots.spec.ts`,
  `prize-board-ipad-landscape*.spec.ts`) — 9 tests: `[data-projector-mode="prize-board"]`
  never renders on `/display`.
- **Display Studio send-to-display** (`display-studio.spec.ts`) — 5 tests.
- **Morning Message / Now Showing** (`visual-qa-display.spec.ts`,
  `display-privacy-regression.spec.ts`, `morning-message-studio.spec.ts`) — 4 tests.

One independent secondary finding (not route drift, not the severed pipeline):

- **`display-studio.spec.ts` "placeholder widgets…"** — the widget library
  category tabs call `toggleWidgetLibrary(category)`, which *toggles* the library
  open/closed instead of *switching* category. Clicking a tab while the library
  is open closes it, so no category can be switched. The "Noise Meter" label was
  also renamed to "Noise Level" (now `connected`, not `placeholder`). This is a
  product-level behavior (either a bug or an unreached UX intent), not test
  drift; it is left unfixed pending a product decision, with the stale label
  corrected to a current placeholder ("QR Code").

