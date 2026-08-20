# DB-3 — Clean Board Feature Map and State Model Plan

**Branch:** `db-3-clean-board-feature-map-state-model`
**Base:** `a5d1359 Add display keep-awake mode` (`main`)
**Type:** Documentation-only planning phase — **no runtime code changed**

## Phase purpose

DB-3 is a lightweight planning-only checkpoint for the Clean Board `/board-lab`
lane. It defines, in writing only:

1. The next feature map for the board.
2. The target save-state model.
3. The widget/scene/background roadmap.
4. The recommended DB-4 implementation order.

It intentionally does **not** implement any UI, add widgets, change runtime
board behavior, add external image search, or touch Spotify behavior. The goal
is to land a clear, repo-grounded plan that DB-4 can execute against without
re-deriving decisions.

## Existing foundation summary (DB-0 through DB-2D)

| Phase | Outcome |
| --- | --- |
| **DB-0** | Product spec, data model, Spotify Level 2 architecture, salvage audit, roadmap. |
| **DB-1** | `/board-lab` shell: 16:9 scale-to-fit canvas, `BoardDeck`/`BoardPage`/`BoardObject` typed model, seed board, Present/Edit modes, student-safe projection. |
| **DB-2A** | Spotify Level 2 vertical slice: PKCE auth, Web API wrappers, Web Playback SDK, teacher panel, student-safe now-playing widget. |
| **DB-2B** | Live OAuth + Premium/device validation; auth/op status split; now-playing auto-refresh; duplicate-tile cleanup. |
| **DB-2C** | Classroom playlist builder: search, private playlist create, track review/add, local presets, launch. |
| **DB-2D** | Teacher-only Keep Awake toggle via the Screen Wake Lock API + `caffeinate` docs. |

Current runtime state (as of `main`):

- Board model lives in `src/features/clean-board/types.ts` (`BoardDeck` →
  `BoardPage[]` → `BoardObject[]`), with a discriminated `BoardObjectConfig`
  union and a `BoardBackground` (gradient/solid/image).
- The board itself is **in-memory only** — `BoardLabPage` initializes from
  `createSeedBoard()` and there is **no persistence** of the deck/pages/objects.
- Spotify state is the exception: tokens and playlist presets already persist
  under `clean-board.spotify.*` via `spotifyStorage.ts`.
- Student-safe projection is `toSafeBoardPage()` in `boardSafety.ts`.
- Spotify is teacher-only (`SpotifyTeacherPanel` mounts only in edit mode when
  the now-playing object is selected).

The single most important gap going into DB-4: **the board cannot be saved.**

## Source docs reviewed

- `docs/product/clean-display-board-spec.md`
- `docs/product/clean-display-board-data-model.md`
- `docs/product/clean-display-board-spotify-level-2.md`
- `docs/product/clean-display-board-salvage-audit.md`
- `docs/product/clean-display-board-roadmap.md`
- `docs/architecture/board-scene-widget-target-model.md`
- `docs/architecture/classroom-audio-spotify-plan.md`
- `docs/status/db-0` … `db-2d` status docs
- Current source: `src/features/clean-board/**`

## Product direction (unchanged)

A **big, clean, readable classroom display board** — Google Slides deck/pages
mental model + Canva-style direct editing + a small set of Classroomscreen-style
live widgets + Spotify playback — that scales to any display.

Hard guardrails:

- Clean Board stays focused, readable, and student-safe.
- It does **not** recreate the old overloaded Presentation Hub.
- Teacher-only controls stay hidden from present/student mode.
- Widgets are large, simple, readable, and serializable.
- Save state is local-first.
- Cloud sync waits until the local schema stabilizes.
- Backgrounds preserve text readability.
- Wallpaper/image finding is teacher-reviewed.
- External image search is future-only.
- No student-sensitive data in display scenes; no Spotify tokens/secrets in
  board state.

## Next feature buckets

1. **Persistence & scenes** — save/load board layouts locally; name, duplicate,
   and reuse scenes; templates; daily snapshots.
2. **Backgrounds & theme** — background picker (solid/gradient/image), themed
   presets, readability-safe defaults.
3. **Content widgets** — Directions/Message card, materials/checklist (future).
4. **Time widgets** — classroom timer presets, stopwatch (future).
5. **Media insert** — local image insert + wallpaper upload (teacher-reviewed).
6. **Display modes** — Focus / Calm / Transition present-mode overlays.

## Recommended implementation order (DB-4)

1. **DB-4A — Saved Layouts and Board Scenes** — introduce persistence
   (local-first), the `BoardScene` reusable unit, template library, and daily
   snapshots. *(Foundation; everything else builds on it.)*
2. **DB-4B — Backgrounds and Theme Picker** — background picker + readability
   overlay + themed presets.
3. **DB-4C — Directions / Message Card widget** — a serializable, student-safe
   message card.
4. **DB-4D — Classroom Timer Presets** — saved timer presets wired to the
   existing `timer` object kind.
5. **DB-4E — Image Insert and Wallpaper Upload** — teacher-reviewed local image
   insert + wallpaper upload (no external search).
6. **DB-4F — Focus / Calm / Transition display modes** — present-mode display
   mode overlay presets.

Rationale: persistence first (nothing is durable without it), then visual
surface, then the cheapest high-value widgets, then media, then present-mode
polish. Spotify and Keep Awake are already delivered and only integrate where
needed.

## PASS / WARN / FAIL

**PASS**

- Docs created (this doc + `docs/clean-board/board-state-model.md` +
  `docs/clean-board/widgets-scenes-and-backgrounds-roadmap.md`).
- Feature map, state model, and widget/scene/background roadmap defined.
- Next implementation order is clear and repo-grounded.
- No runtime behavior changed.

**WARN**

- No UI implementation in DB-3 (by design).
- Final state schema still needs source-aligned implementation in DB-4A.
- Google Drive sync deferred.
- Native/Tauri storage deferred.
- External wallpaper finder deferred.

**FAIL**

- None.
