# Clean Display Board — Product Spec

> Phase: **DB-0** — Product spec + salvage audit (no implementation yet)
> Branch: `db-0-clean-display-board`
> Status: Draft for review

## 1. Why this exists

The current Command Center `/control` hub (see `src/features/presentation-hub/PresentationHub.tsx`) grew
into a presentation-first home with a status strip, scene rail, Teach Mode entry, board editor entry, and
a "Display Studio" entry point. In field testing, the user found it **still too cluttered and confusing**.

This lane is a **reset**, not a refactor. It defines a **clean, isolated Display Board** product that the
user can actually read from across a classroom, with a separate app-loader app launching it later.

The old Command Center hub and dashboard are **frozen** — we stop refining them. They stay functional
until the new board is ready to replace them.

## 2. Product one-liner

A **big, clean, readable classroom display board** you build like a Google Slides deck and polish like
Canva, with a handful of live Classroomscreen-style widgets and Spotify playback on top — that scales to
whatever display it lands on.

## 3. Mental models

Three mental models compose into one product:

| Source | What we take |
| --- | --- |
| **Google Slides** | Deck → pages → objects. A board is a deck of pages; each page holds positioned, layered objects. Next/prev navigation. |
| **Canva** | Simple direct object editing: drag to move, handles to resize, double-click to edit text, a floating toolbar, an inspector only when you need it. |
| **Classroomscreen.com** | A small, curated set of *live* classroom widgets (clock, timers, routine/scheduled timers) that are "always on" rather than authored content. |

Explicitly **not** taking: the full Classroomscreen widget sprawl, the old Command Center's multi-tab
teacher dashboard, or a heavyweight canvas engine (no tldraw/Konva migration now).

## 4. Goals

1. A display board that is **big, calm, and unambiguous** — the opposite of the current hub.
2. **Scale-to-fit**: a fixed 16:9 logical canvas (1920×1080) that shrinks/grows to fill any display,
   letterboxing or cropping as needed, never reflowing content mid-lesson.
3. **Smart, easy editing**: low-friction object editing with sensible defaults and live safety warnings.
4. **Minimal content surface** first — links, images, GIFs, video embeds, wallpaper/backgrounds — with
   widgets layered on top.
5. **Spotify Level 2** (Authorization Code + PKCE) wired in from the start, teacher-only controls,
   optional student-safe now-playing widget.
6. A **wallpaper/media library** with an expanded category model (school, subject, seasonal, holiday,
   weather, mood) that later connects to a wallpaper fetcher.

## 5. Non-goals (DB-0 and beyond, for now)

- No full app implementation in DB-0.
- No Spotify OAuth implementation yet (architecture only).
- No new widgets implemented yet.
- No tldraw/Konva migration yet.
- No re-building the old dashboard/hub.
- No app-loader app yet (it comes later and will *launch* this board).

## 6. Route and app boundaries

New isolated route:

- `/board-lab` — the experimental board lab entry (only a tiny, clearly-labeled stub if we add one now).

Planned sub-routes (future phases, not yet implemented):

- `/board-lab/present` — student-safe presentation (board only, no chrome).
- `/board-lab/edit` — teacher editor.
- `/board-lab/library` — wallpaper/media library.
- `/board-lab/settings` — board/deck settings.

**Boundary rules**

1. The board lab lives in its own feature directory (e.g. `src/features/board-lab/`), isolated from the
   old composer/studio/hub.
2. It must **not** import from `display-composer`, `display-studio`, or `presentation-hub` (see salvage
   audit — we copy proven concepts, we don't wire the old module graph).
3. `/board-lab` is **not** the default app. `/control` and `/display` remain untouched and functional.
4. A future **app-loader** app owns the top-level route that launches the board; the board itself stays
   a self-contained, embeddable experience.

## 7. The board experience

### 7.1 Present mode (what students see)

- Board only. No teacher chrome, no auth details, no tokens, no private teacher notes, no debug text.
- Full-bleed background, objects and widgets layered on top.
- Scale-to-fit so the board looks identical on projector, iPad, and laptop.
- A present mode must pass the existing display safety guards (see salvage audit §7).

### 7.2 Edit mode (what the teacher sees)

- The same 16:9 canvas, but with selection handles, a floating toolbar, and a right inspector that
  appears only when an object is selected or a property needs detail.
- Empty canvas starts with a **single obvious affordance** ("Add" / "Insert") instead of a wall of
  tabs.
- Every object type is one click away; every widget is one click away; nothing else.

## 8. Minimum content features

| Feature | Notes |
| --- | --- |
| Insert link | Editable URL + optional label; renders as a clickable/QR-able affordance on the board. |
| Insert image | Local upload or URL; smart-fit and safe-margin snapping. |
| Insert GIF | Same as image but animated; respects "pause animations" present-mode switch later. |
| Embed video | YouTube/Vimeo/iframe embed; scaled to object bounds. |
| Wallpaper / background | Per-page background from the media library; gradient/solid fallback always available. |
| Wallpaper fetcher | **Later** — connect to an external wallpaper fetcher (interface defined now, integration deferred). |
| Expanded wallpaper logic | Categories: school, subject, seasonal, holiday, weather, mood (and more), used for search/filter/auto-suggest. |
| Widgets | clock, countdown timer, routine/scheduled timer, and other simple useful widgets. |
| Spotify | Level 2 integration (see Spotify doc). |

## 9. Object types (v1)

- `text`
- `image`
- `gif`
- `link`
- `videoEmbed`
- `wallpaper/background` (page-level, not a page object)
- `clockWidget`
- `timerWidget`
- `routineTimerWidget`
- `spotifyWidget`

Full field-level detail lives in the data model doc. Object types map 1:1 onto the `BoardObject` /
`BoardWidget` models.

## 10. Editing rules

- **16:9 logical canvas**, 1920×1080 default; coordinates stored in normalized units so any display
  scales cleanly.
- **Drag** to move; **resize handles** to size; **double-click/tap** text to edit in place.
- **Floating toolbar** for the selected object (lock / duplicate / delete / layer up / layer down).
- **Right inspector only when needed** — it is not always visible.
- **Snap to safe margins** and **snap to center/other objects**.
- **Warn on low contrast** (object vs. background).
- **Warn on too-small text**.
- **Shrink-to-fit text** within its box by default.
- **Auto-avoid clock/timer zones** where practical (don't let objects overlap reserved widget zones).
- Layer controls: bring forward / send back / lock / duplicate / delete.

These are the "smart and easy" rails; they must be low-friction defaults, not a settings panel.

## 11. Presentation rules

- Present mode shows **board only**.
- No teacher chrome on the student display.
- No auth details, no tokens, no private teacher notes, no debug/internal text.
- Student-safe projection is mandatory (mirror the existing `displaySafe` convention).

## 12. Out of scope for DB-0

- Implementation of the board, widgets, Spotify OAuth, wallpaper fetcher, or app-loader.
- Any changes to `/control` or `/display`.
- Any new dependencies.

## 13. Definitions of success (acceptance)

- Product direction, data model, Spotify Level 2, salvage audit, and roadmap are all documented and
  repo-grounded.
- Build and display safety guards still pass.
- No secrets, tokens, school URLs, real student data, or unrelated WIP are committed.
- The old Command Center stays functional.
