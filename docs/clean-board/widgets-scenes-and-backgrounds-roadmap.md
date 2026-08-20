# Clean Board — Widgets, Scenes, and Backgrounds Roadmap

> Planning target for DB-4B through DB-4F. Documentation only — no runtime
> behavior changed in DB-3.

## 1. Widget roadmap

Widgets are large, simple, readable, and **serializable**. Every widget is a
`BoardObject` with a discriminated `config` union — never a free-form settings
bag. Live widgets keep their runtime state **outside** board content so it is
not serialized into scenes.

Priority order (only DB-4C and DB-4D are in the near-term plan):

| Priority | Widget | Phase | Notes |
| --- | --- | --- | --- |
| Now | Clock | DB-1 (placeholder) | Live tick is future polish; already typed. |
| Now | Spotify now-playing | DB-2A–2C | Teacher-only controls; student-safe widget only. |
| 1 | **Directions / Message card** | DB-4C | Teacher message, big readable text, serializable, student-safe. |
| 2 | **Classroom Timer presets** | DB-4D | Saved timer presets on the existing `timer` kind. |
| 3 | Stopwatch | future | Not in near-term plan. |
| 3 | Routine/scheduled timer | future | Reuse old routine-timer concepts only if needed. |
| 4 | Materials / checklist | future | Not in near-term plan; avoids widget sprawl. |

Deliberately excluded (avoid recreating the old Presentation Hub sprawl):
noise meter, prize board, random picker, mystery student, games, jobs manager.

Widget rules:

- Large and readable at 1920×1080 scale.
- Teacher-only controls never render in present mode.
- `config` is typed and JSON-safe.
- Hidden widgets (`visible: false`) are dropped from the projection.

## 2. Scene roadmap

Scenes are the reusable unit introduced in DB-4A (see `board-state-model.md`).
A scene is a page + `type` + `studentSafe` + timestamps.

| Step | Phase | Notes |
| --- | --- | --- |
| Introduce `BoardScene` + persistence | DB-4A | Migrate `BoardPage` onto the scene shape; local-first storage. |
| Scene library (name/duplicate/reorder/delete) | DB-4A | Edit-only panel. |
| Template library | DB-4A | Built-in templates from seed; `kind: 'scene' \| 'template'`. |
| Daily snapshots | DB-4A | Append-only, timestamped recall. |
| Scene type presets (arrival/workTime/etc.) | DB-4B/4F | Drives display-mode defaults. |

Scene rules:

- `studentSafe: false` blocks projection.
- `teacherNotes` is stripped before present mode (existing `toSafeBoardPage`).
- A scene never stores Spotify tokens, secrets, or student-sensitive data.

## 3. Display modes

Present-mode-only projection presets (DB-4F), separate from authored content.

| Mode | Phase | Purpose |
| --- | --- | --- |
| `default` | existing | Normal board projection. |
| `focus` | DB-4F | Dim non-essential content; emphasize the primary message/timer. |
| `calm` | DB-4F | Soft overlay, reduced motion, minimal chrome. |
| `transition` | DB-4F | Brief full-board transition state (e.g., "Clean up"). |

Display modes carry only `studentMessage` + an optional overlay. No teacher
notes, tokens, or student data.

## 4. Background roadmap

Backgrounds must preserve text readability.

| Step | Phase | Notes |
| --- | --- | --- |
| Solid / gradient picker | DB-4B | Already typed; add a picker in edit mode. |
| Theme presets | DB-4B | A few built-in themed backgrounds (calm/focus/etc.). |
| Readability overlay | DB-4B | `overlay: none \| darken \| lighten \| blur` on the scene/background. |
| Image background | DB-4B/4E | Local image reference only (no external search). |
| Wallpaper (media-library ref) | DB-4E | `{ type: 'wallpaper', wallpaperId }` ref into a local library. |

## 5. Wallpaper finder strategy

- **Teacher-reviewed, local-first.** A wallpaper is either a built-in themed
  background or a teacher-uploaded local image.
- External wallpaper/image search is **future-only** and must sit behind a
  `WallpaperSource` provider interface so the board core never depends on the
  network.
- Any future fetcher result must carry `studentSafe` + `overlayStrength`
  metadata so text readability is checked before use.

## 6. Image insert strategy

- **DB-4E scope:** teacher inserts a **local image** (upload) or a pasted URL;
  the image becomes an `image` object with a local asset reference.
- Smart-fit (`cover`/`contain`/`fill`), safe-margin snapping, and a low-contrast
  warning are the "smart editing" rails already specified in the product spec.
- No external image search in DB-4E.

## 7. Recommended build order

1. **DB-4A — Saved Layouts and Board Scenes** (foundation: persistence + scenes).
2. **DB-4B — Backgrounds and Theme Picker** (visual surface + readability).
3. **DB-4C — Directions / Message Card widget** (cheap, high-value content).
4. **DB-4D — Classroom Timer Presets** (saved timers on the existing `timer` kind).
5. **DB-4E — Image Insert and Wallpaper Upload** (teacher-reviewed local media).
6. **DB-4F — Focus / Calm / Transition display modes** (present-mode polish).

## 8. Safety and quality gates (every DB-4 sub-phase)

- Present/student mode never exposes teacher controls.
- `toSafeBoardPage` (and any future scene projection) is the single projection
  path; no parallel renderer adds fields.
- No Spotify token/secret is ever serialized into board state.
- No student-sensitive data is stored in scenes.
- `npm run build`, `test:clean-board`, `test:clean-board-spotify`, and the
  display import/bundle guards + `teacher-dock` stay green.
- Only focused files are committed; no `.env`, tokens, screenshots, or unrelated
  files.
