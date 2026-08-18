# DB-0 — Clean Display Board Product Spec (Status)

> Phase: **DB-0**
> Branch: `db-0-clean-display-board`
> Date: 2026-08-18

## Summary

Defined a clean-from-scratch **Classroom Display Board** product lane as a reset from the cluttered
Command Center presentation hub. Documented the product direction, data model, Spotify Level 2
architecture, a repo-grounded salvage audit, and a phased roadmap. No app implementation was performed.

## What was delivered

| Doc | Path |
| --- | --- |
| Product spec | `docs/product/clean-display-board-spec.md` |
| Data model | `docs/product/clean-display-board-data-model.md` |
| Spotify Level 2 | `docs/product/clean-display-board-spotify-level-2.md` |
| Salvage audit | `docs/product/clean-display-board-salvage-audit.md` |
| Roadmap | `docs/product/clean-display-board-roadmap.md` |
| Status (this file) | `docs/status/db-0-clean-display-board-product-spec.md` |

## Key decisions

1. **New isolated route `/board-lab`**, with future `/present`, `/edit`, `/library`, `/settings`
   sub-routes. Not the default app.
2. **Mental model** = Google Slides (deck/pages/objects) + Canva (simple direct editing) + selected
   Classroomscreen widgets (clock, timers, routine timers).
3. **Data model** centered on `BoardDeck → BoardPage → BoardObject/BoardWidget`, with a discriminated
   `kind` + typed `config` (an improvement over the old stringly-typed `CanvasWidget`).
4. **Salvage directly** only the proven, decoupled parts: display safety projection/forbidden-key scan,
   timer types/defaults/format, and the routing path→route pattern.
5. **Salvage concept only** most of the editor/widget/wallpaper/music code — rebuild clean rather than
   import the old module graph.
6. **Do not reuse** the `PresentationHub`, old composer/studio shells, the embed-based Spotify provider,
   and the legacy screen-model background assets.
7. **Spotify Level 2** via Authorization Code + PKCE, Web Playback SDK + Connect, teacher-only controls,
   student-safe now-playing, graceful Premium handling, and documented iPad volume caveat.
8. **Deferred:** tldraw/Konva migration, AI lesson-message generation, full engagement widget sprawl,
   and a server-side token proxy (post-MVP hardening).

## Acceptance check

- [x] Clean board product direction documented.
- [x] Data model documented.
- [x] Spotify Level 2 architecture documented.
- [x] Salvage audit concrete and repo-grounded.
- [x] Roadmap phased and avoids rebuilding clutter.
- [ ] Build passes (pending validation run).
- [ ] Display safety guards pass (pending validation run).
- [x] No secrets or unrelated WIP committed.

## Out of scope (intentionally not done)

- No app implementation, no Spotify OAuth, no widgets, no tldraw/Konva.
- No changes to `/control` or `/display`.

## Next phase

DB-1 — board lab skeleton + data model + student-safe projection.
