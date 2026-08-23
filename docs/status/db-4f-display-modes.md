# DB-4F — Clean Board Display Modes

> Status: **COMPLETE**
> Phase: DB-4F — Focus / Calm / Transition classroom display modes

## Purpose

Let a teacher switch the Clean Board's presentation state with one action so the
same board transforms for different teaching moments (morning arrival, math
focus, independent work, reading calm, transition, cleanup, assessment).

Display modes are a **projection layer**: they apply preferences on top of the
teacher's existing scene/layout. They never own widgets, timers, Spotify state,
images, or messages, and they never duplicate board objects.

## Display mode model

`DisplayModeId` (`src/features/clean-board/types.ts`) is a closed set:

```ts
type DisplayModeId =
  | 'morningArrival'
  | 'focus'
  | 'reading'
  | 'transition'
  | 'cleanup'
  | 'assessment'
  | 'custom'
```

Each id resolves to a `DisplayModeConfig` (`src/features/clean-board/displayModes.ts`):

```ts
interface DisplayModeConfig {
  id: DisplayModeId
  name: string
  description: string
  backgroundPresetId?: BackgroundPresetId   // applied at projection time
  showSpotify: boolean
  showTimer: boolean
  showMessageCards: boolean
  showImages: boolean
  keepAwakeDefault: boolean                 // scene default on save
  recommendedSceneType?: SceneType
}
```

## Presets

| Mode | Background | Spotify | Timer | Msg cards | Images | Keep awake | Scene type |
|------|-----------|---------|-------|-----------|--------|-----------|-----------|
| Morning Arrival | morning-glow | on | on | on | on | on | arrival |
| Focus | slate-focus | off | on | on | off | off | math |
| Reading | reading-cream | off | on | on | on | off | reading |
| Transition | transition-dark | off | on | on | off | off | transition |
| Cleanup | warm-neutral | on | on | on | off | off | packUp |
| Assessment | clean-white | off | on | on | off | off | custom |
| Custom | (authored) | on | on | on | on | off | — |

`custom` is the default: teacher-controlled, shows everything, and preserves the
authored background.

## Projection

`projectObjectsForDisplayMode(objects, modeId)` filters objects by the mode's
visibility flags (text/clock/link/videoEmbed always pass). `projectPageForDisplayMode(page, modeId)`
applies the recommended background preset (when set) and filters objects. Both
are pure — input is never mutated.

The board shell composes safety → mode in present mode only:

```
present = projectPageForDisplayMode(toSafeBoardPage(activePage), displayModeId)
```

Edit mode shows the raw authored page (unfiltered) so nothing is hidden while
authoring.

## Scene integration

- `SavedLayout` and `BoardScene` now carry `displayModeId`.
- Saving a layout/scene captures the current selection.
- Loading a layout restores `layout.displayModeId`; loading a scene restores
  `scene.displayModeId` (scene wins over its referenced layout).
- Saving a scene sets `keepAwake` from the mode's `keepAwakeDefault`.

## Persistence + safety

- `boardSerialization.ts` sanitizes `displayModeId` via `sanitizeDisplayModeId`
  (unknown → `custom`), and migrates the legacy `displayMode` placeholder
  (`default`/`calm`/`focus`/`transition`) to `displayModeId`.
- Whitelist serialization means mode state can never carry Spotify tokens,
  secrets, or private teacher notes (`boardStateHasNoForbiddenKeys` unchanged).

## UI

`DisplayModeSelector.tsx` — a compact teacher-only picker rendered in the board
header, gated behind edit mode. Present mode never shows the selector or any
editing controls (existing `showTeacherControls` gate).

## Files changed

- `src/features/clean-board/types.ts` — `DisplayModeId`, `SavedLayout`/`BoardScene` fields
- `src/features/clean-board/displayModes.ts` — new (catalog + sanitize + projection)
- `src/features/clean-board/DisplayModeSelector.tsx` — new (teacher UI)
- `src/features/clean-board/storage/boardSerialization.ts` — sanitize + legacy migration
- `src/features/clean-board/storage/boardStorage.ts` — `layoutFromPage` accepts mode
- `src/features/clean-board/BoardLabPage.tsx` — state, projection, save/load, selector
- `src/features/clean-board/SavedBoardsPanel.tsx` — mode capture/restore on save/load
- `src/features/clean-board/boardLabTests.ts` — DB-4F tests + fixture updates
- `scripts/test-clean-board.sh` — compile `displayModes.ts`

## Validation

| Check | Result |
|-------|--------|
| `npm run test:clean-board` | PASS (119 tests) |
| `npm run test:clean-board-spotify` | PASS (69 tests) |
| `npm run build` | PASS |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:display-studio` | PASS (124 tests) |
| `npm run test:display-composer` | PASS |
| `npm run lint` | WARN — 3 pre-existing canvas-spike fast-refresh errors |

## Acceptance

- PASS — teacher can switch classroom display modes (selector in edit mode).
- PASS — modes reuse existing scenes/widgets (projection, no duplication).
- PASS — saved layouts/scenes preserve mode (`displayModeId` round-trip).
- PASS — present mode remains clean (selector/controls gated behind edit).
- PASS — Spotify/background/image/message/timer features remain stable.
- PASS — iPad responsive layout remains stable (compact select, no drawer change).
- WARN — AI scene creation deferred; cloud sync deferred; advanced automation deferred.
- FAIL — none.
