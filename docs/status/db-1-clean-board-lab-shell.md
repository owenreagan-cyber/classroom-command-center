# DB-1 — Clean Board Lab Shell (Status)

> Phase: **DB-1**
> Branch: `db-1-clean-board-lab-shell`
> Date: 2026-08-18

## Summary

Created the first isolated implementation shell for the Clean Classroom Display Board product lane:
a new `/board-lab` route with a dominant 16:9 board canvas, scale-to-fit display behavior, a
Present/Edit mode shell, a typed `BoardDeck`/`BoardPage`/`BoardObject` model, simple seed data, and a
student-safe board-only presentation surface. No old Command Center clutter, no app dock, no old
display-studio/presentation-hub UI imports.

## Route created

- `/board-lab` — default mode is `present`.
- `/board-lab?mode=present` and `/board-lab?mode=edit` select the mode via query param.
- Registered in `src/app/appRoute.ts` (`boardLab` route) and lazy-loaded in `src/App.tsx` (isolated
  `BoardLabPage-*.js` chunk, ~11.9 kB). **Not** the default app; `/control` and `/display` unchanged.

## Files added

- `src/features/clean-board/types.ts` — typed data model.
- `src/features/clean-board/boardGeometry.ts` — 16:9 geometry + scale-to-fit.
- `src/features/clean-board/boardSafety.ts` — student-safe projection + forbidden-key guard.
- `src/features/clean-board/seedBoard.ts` — two-page seed board.
- `src/features/clean-board/BoardObjectRenderer.tsx` — object rendering (text/image/link/video/widgets).
- `src/features/clean-board/BoardCanvas.tsx` — scaled 16:9 canvas with selection + minimal drag.
- `src/features/clean-board/BoardToolbar.tsx` — edit-only add toolbar.
- `src/features/clean-board/BoardLabPage.tsx` — page shell (top bar, toggle, dots, toolbar).
- `src/features/clean-board/boardLabTests.ts` — pure-logic tests.
- `scripts/test-clean-board.sh` — import guard + test runner.
- `scripts/capture-db1-board-lab-screenshots.mjs` — screenshot capture.
- `docs/status/db-1-screenshots/*.png` — screenshots.

## Data model implemented

- `BoardDeck { id, title, pages, activePageId, createdAt?, updatedAt? }`
- `BoardPage { id, title, background, objects, teacherNotes? }`
- `BoardObject { id, kind, x, y, w, h, rotation, locked, visible, layer, config }`
- `BoardBackground` = gradient | solid | image
- `BoardObjectKind` = text | image | link | videoEmbed | clock | timer | spotifyNowPlayingPlaceholder
- `config` is a discriminated union typed by `kind` (an improvement over the old stringly-typed
  `CanvasWidget.settings`).

## Geometry choice

**Fixed 1920×1080 logical canvas.** Object geometry is stored in logical pixels. The renderer applies a
single uniform `scale-to-fit` ("contain") transform, centering the board with letterbox offsets. This
keeps the board internally 16:9 and prevents object reflow at any display size. Edit chrome (top bar,
toolbar, page dots) lives outside the scaled canvas, so it does not scale with board content.

## Intentionally static placeholders

- `clock`, `timer`, and `spotifyNowPlayingPlaceholder` objects render static placeholder content only.
  No live clock tick, no timer countdown, no Spotify OAuth/API. This is per the DB-1 constraint.

## What was NOT imported from the old build

- No `presentation-hub`, `display-studio`, or `display-composer` imports (enforced by the clean-board
  import guard in `scripts/test-clean-board.sh`).
- No app dock, no tool grid, no status wall, no dashboard cards, no multiple side panels.
- `/control` and `/display` are untouched.

## Safety

- `toSafeBoardPage` strips `teacherNotes` and other forbidden keys (`updatedAt`, `version`,
  `accessToken`, `refreshToken`, `deviceId`, `accountId`, `clientSecret`), filters hidden objects,
  sorts by layer, and reduces the Spotify placeholder config to label-only.
- Present mode renders through the safe projection; edit mode renders raw objects for editing.

## Screenshots

- `docs/status/db-1-screenshots/board-lab-present-1440x900.png`
- `docs/status/db-1-screenshots/board-lab-edit-1440x900.png`
- `docs/status/db-1-screenshots/board-lab-present-1024x768.png`
- `docs/status/db-1-screenshots/board-lab-edit-1024x768.png`

## Validation results

- `npm run build` — **PASS** (BoardLabPage isolated to its own 11.9 kB lazy chunk).
- `npm run test:clean-board` — **PASS** (14 passed, 0 failed; import guard PASS).
- `npm run test:display-studio` — **PASS** (124 passed).
- `npm run test:display-composer` — **PASS**.
- `npm run test:display-import-guard` — **PASS**.
- `npm run test:display-bundle-guard` — **PASS** (tldraw isolated to spike chunk).
- `npm run test:teacher-dock` — **PASS**.
- `npm run lint` — **3 pre-existing errors** only (canvas-spike fast-refresh), no new errors/warnings.

## PASS / WARN / FAIL

- **PASS:** `/board-lab` route exists, visually clean, board dominant and 16:9, scales to fit at
  1440x900 and 1024x768, Present/Edit shell works, typed model + seed render, present surface is
  student-safe, no old shell imports, no Spotify OAuth/API, build + guards pass, docs + screenshots done.
- **WARN:** Drag/resize is minimal (simple pointer drag for selected objects; no resize handles, no
  rotation UI). Full editing polish is deferred to DB-1.1/DB-2.
- **WARN:** Placeholder objects (clock/timer/spotify) are static.
- **WARN:** `npm run lint` retains 3 pre-existing canvas-spike fast-refresh errors (not fixed here).
- **FAIL:** none.

## Next recommended phase

**DB-1.1 / DB-2 — object editing polish + background library.** Add resize handles, rotation, the
floating toolbar (lock/duplicate/delete/layer), snap-to-safe-margins/center, low-contrast and
too-small-text warnings, and port the wallpaper model into the expanded `WallpaperSource`/`Query`/`Result`
shape with the school/subject/seasonal/holiday/weather/mood categories.
