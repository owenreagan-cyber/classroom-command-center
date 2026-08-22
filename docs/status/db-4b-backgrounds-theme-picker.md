# DB-4B — Backgrounds and Theme Picker

> Status: complete. A simple, classroom-safe background and theme picker for
> Clean Board, built on DB-4A saved layouts/scenes.

## Purpose

Let a teacher choose a calm, projection-safe background and a lightweight theme
for the board, persist both in saved layouts and autosave, and keep present mode
clean and uncluttered.

This is a "calm teaching canvas", not a wallpaper marketplace. There is no
wallpaper search, no AI image generation, no uploaded images, no Google Drive
sync, and no new widgets.

## Background model

`BoardBackground` is a discriminated union (existing `gradient`/`solid` variants
plus a new `preset` variant). The removed `image`/`assetPath` background shape is
no longer accepted — it recovers to the default preset so a single stale record
can never carry a local file path or remote URL into board state.

```ts
type BoardBackground =
  | { type: 'gradient'; from: string; to: string; angleDeg?: number; readabilityOverlay?: ReadabilityOverlay }
  | { type: 'solid'; color: string; readabilityOverlay?: ReadabilityOverlay }
  | { type: 'preset'; presetId: BackgroundPresetId; readabilityOverlay?: ReadabilityOverlay }

type ReadabilityOverlay = 'none' | 'soft' | 'strong'
```

- `readabilityOverlay` is an optional per-background scrim. It is a **contrast
  scrim**: light text gets a dark scrim, dark text a light one, so it always
  increases readability rather than reducing it.
- Presets define a recommended `textTone` and a default `overlay`; the teacher
  can override the overlay from the picker.

## Theme model

A lightweight, non-secret rendering hint (not a full design system):

```ts
type BoardTheme = {
  id: BoardThemeId            // 'minimal-light' | 'minimal-dark' | 'glass-dark' | 'solid-focus'
  name: string
  textTone: 'dark' | 'light'
  accent: string
  surface: 'glass' | 'solid' | 'minimal'
}
```

The theme's `accent` currently surfaces as the edit-mode selection outline color;
`textTone`/`surface` are stored and validated for future readability/polish work.
Themes are always round-tripped through a fixed catalog so unknown ids and
private keys cannot enter board state.

## Preset list

| id | name | category | text tone | overlay |
| --- | --- | --- | --- | --- |
| `calm-blue` | Calm Blue | calm | light | soft |
| `soft-green` | Soft Green | calm | light | soft |
| `warm-neutral` | Warm Neutral | neutral | dark | none |
| `clean-white` | Clean White | neutral | dark | none |
| `slate-focus` | Slate Focus | focus | light | soft |
| `morning-glow` | Morning Glow | morning | dark | none |
| `reading-cream` | Reading Cream | reading | dark | none |
| `math-grid-subtle` | Math Grid Subtle | math | dark | none |
| `quiet-purple` | Quiet Purple | calm | light | soft |
| `transition-dark` | Transition Dark | transition | light | strong |

Categories: `calm`, `focus`, `morning`, `reading`, `math`, `transition`,
`neutral`. Every preset is a self-contained CSS `background` value — no external
assets, remote URLs, animation, or heavy textures.

## Persistence behavior

- `SavedLayout` now stores `background` and `theme` (alongside existing
  `objects` and `displayMode`). `layoutFromPage` snapshots both.
- Autosave (`clean-board.board.autosave`) stores the same `SavedLayout` shape, so
  background/theme survive refresh via the existing debounced autosave path.
- Loading a layout restores `background` + `theme` (the shell re-applies both).
- `schemaVersion` remains `1` and migration-ready; `sanitizeBackground` /
  `sanitizeTheme` whitelist-validate every record, recovering corrupt or unknown
  values to defaults.

Deliberately NOT stored: image blobs, file paths, remote URLs, secrets, tokens,
or private account data.

## Scene integration

The simple version only:

- `BoardScene` gains an optional `backgroundPresetId?: BackgroundPresetId`,
  populated when a scene is saved from a preset background and whitelist-validated
  on load.
- Loading a scene still resolves its referenced layout, which applies the
  layout's `background` and `theme`. No per-scene automation is built yet.

## UI

A compact teacher-only "Board Look" panel (`BoardLookPanel`) renders in **edit
mode only**, alongside the Saved Boards panel:

- Background preset swatch grid
- Readability overlay selector (`none` / `soft` / `strong`)
- Theme selector
- Reset to default

Present mode renders none of this.

## Safety rules

- Present mode never mounts the picker; `showTeacherControls` gates teacher UI.
- Backgrounds/themes are whitelist-sanitized; unknown/private keys are stripped.
- The `image`/`assetPath` background shape is rejected and recovers to default.
- The scrim direction follows text tone, so defaults never reduce readability.

## Validation

| Command | Result |
| --- | --- |
| `npm run test:clean-board` | 51 passed, 0 failed |
| `npm run test:clean-board-spotify` | 69 passed, 0 failed |
| `npm run build` | PASS (`tsc -b && vite build`) |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:display-studio` | 124 passed |
| `npm run test:display-composer` | PASS |
| `npm run lint` | 3 pre-existing canvas-spike fast-refresh errors only |

## PASS / WARN / FAIL

**PASS**

- Teacher can choose a background preset.
- Teacher can choose a theme.
- Board visually updates (preset + scrim in present mode; accent in edit mode).
- Saved layouts persist background/theme.
- Autosave persists background/theme.
- Loading a layout restores background/theme.
- Present mode remains clean.
- No external assets, remote URLs, tokens, or secrets are stored.

**WARN**

- Uploaded images deferred.
- Wallpaper library deferred.
- AI background generation deferred.
- Google Drive sync deferred.
- Advanced per-scene automation deferred.

**FAIL**

- None.
