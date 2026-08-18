# Clean Display Board — Roadmap

> Phase: **DB-0** (current) — spec + salvage audit. Build phases below.
> Goal: ship a clean, scalable classroom display board without rebuilding clutter.

## Guardrails for every phase

- `/control` and `/display` stay functional and untouched.
- `/board-lab` is never the default app until a later migration phase.
- No secrets, no tokens, no school URLs, no real student data committed.
- Display safety guards (`test:display-import-guard`, `test:display-bundle-guard`) stay green.
- Every phase ends with `npm run build` green and the display test suite green.

---

## DB-0 — Product spec & salvage audit (this phase)

**Deliverables (done):** product spec, data model, Spotify Level 2 architecture, salvage audit, roadmap,
status doc.

**Explicitly not done:** no app implementation, no OAuth, no widgets, no tldraw/Konva.

**Exit:** docs reviewed; build + display tests green.

---

## DB-1 — Board lab skeleton + data model + student-safe projection

- Add `src/features/board-lab/` directory with the data model types (from the data model doc).
- Add a tiny, **clearly-labeled experimental** `/board-lab` route stub (optional, low-risk). It must
  render a "board lab — experimental" placeholder, not wire into the default app.
- Add a route entry to `appRoute.ts` (salvaged directly) with `boardLab` as a non-default route.
- Implement `toBoardSafePage` (student-safe projection) mirroring `toDisplaySafeScreen`.
- Add board-lab executable regression tests (mirroring `src/lib/display-studio-tests.ts`).
- Add board-lab to the display import guard's protected list.

**Exit:** `/board-lab` renders a stub; `/control` and `/display` unaffected; build + tests green.

---

## DB-2 — 16:9 canvas + scale-to-fit + background

- Implement the 1920×1080 logical canvas renderer with uniform scale-to-fit.
- Implement page background rendering (gradient/solid/image/wallpaper) with safe fallback.
- Implement board-deck/page navigation (next/prev) and the page rail (minimal).
- Port the wallpaper model from `src/lib/wallpaperRegistry.ts` into the expanded
  `WallpaperSource`/`WallpaperQuery`/`WallpaperResult` model (concept salvage).
- Wallpaper category expansion: school, subject, seasonal, holiday, weather, mood.

**Exit:** a board with multiple pages and backgrounds scales cleanly across display sizes.

---

## DB-3 — Object editing (Canva-style)

- Implement `BoardObject` placement: drag to move, handles to resize, rotation.
- Implement text editing (double-click in place, shrink-to-fit).
- Implement the floating toolbar (lock / duplicate / delete / layer up / layer down).
- Implement right inspector only when an object is selected.
- Implement smart editing rules: snap to safe margins, snap to center/objects, low-contrast warning,
  too-small-text warning.

**Exit:** teacher can build a page with text/images/links/videos/GIFs using simple direct manipulation.

---

## DB-4 — Widgets (clock + timers)

- Implement `BoardWidget` renderer + the minimal widget registry (clock, timer, routine timer).
- Reuse `timerTypes.ts` / `timerDefaults.ts` / `timerFormat.ts` (salvage directly).
- Extract the simple + routine timer logic from `timerStore.ts` into board-lab timer stores
  (concept salvage).
- Auto-avoid clock/timer zones where practical.
- Implement student-safe widget projection.

**Exit:** clock, countdown, and routine/scheduled timers render and run on the board.

---

## DB-5 — Spotify Level 2

- Implement the Spotify architecture from the Spotify doc (PKCE, token store, SDK, Connect, playback).
- Teacher-only controls + optional student-safe now-playing widget.
- Playlist presets (reuse `MusicMode` taxonomy + curated playlist URIs).
- Graceful Premium handling + iPad volume caveat.

**Exit:** teacher connects Spotify, selects a device, and plays/pauses/skips from the board; students see
only a safe now-playing widget.

---

## DB-6 — Wallpaper/media library + fetcher interface

- Build the media library UI (browse/filter by category).
- Define the `WallpaperSource` provider interface; connect a wallpaper fetcher **behind** that interface.
- Wire the expanded wallpaper logic (school/subject/seasonal/holiday/weather/mood) to search/suggest.

**Exit:** teacher picks wallpapers from a categorized library; a fetcher source plugs in without touching
the board core.

---

## DB-7 — Present mode + safety hardening

- Implement `/board-lab/present` (board only, no chrome) and `/board-lab/edit` (teacher editor).
- Enforce presentation rules: no auth details, no tokens, no teacher notes, no debug text.
- Harden student-safe projection and add present-mode safety regression tests.

**Exit:** present mode is clean and student-safe; edit mode is teacher-only.

---

## DB-8 — App-loader + migration (later)

- Build the separate app-loader app that launches the board (and future apps).
- Define the migration path off `/control` and `/display` once the board proves out in the classroom.
- Freeze and eventually retire the old Command Center hub.

**Exit:** board lab is the primary display experience; old hub retired deliberately, not abruptly.

---

## Explicit deferrals (do not start early)

- tldraw/Konva migration.
- AI lesson-message generation.
- Noise meter, prize board, random picker, and the full engagement widget sprawl.
- Server-side Spotify token proxy (post-MVP hardening).
