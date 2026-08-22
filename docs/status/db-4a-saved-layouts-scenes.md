# DB-4A — Saved Layouts and Board Scenes

> Status: complete. Local-first persistence for Clean Board.

## Goal

Move Clean Board from a temporary in-memory board to a system where a teacher
can **save, load, and reuse** classroom display setups. This is the foundation
for Morning / Math / Reading / Transition / Pack-Up scenes and future
Spotify/background/timer/widget automation.

The teacher should think *"Load my Math board"*, not *"configure a dashboard."*

## Architecture

```
src/features/clean-board/
├── types.ts                       # + DisplayMode, SceneType, SavedLayout, BoardScene, BoardState
├── storage/
│   ├── boardSerialization.ts      # schema version, whitelist sanitize, JSON serialize/parse
│   ├── boardMigrations.ts         # version gate (migrateBoardState)
│   └── boardStorage.ts            # localStorage adapters + pure CRUD
├── SavedBoardsPanel.tsx           # teacher-only edit-mode panel (NEW)
└── BoardLabPage.tsx               # hydrate from autosave, debounced autosave, load handler
```

- **Pure vs DOM split:** all validation, sanitization, migrations, and CRUD
  transforms are side-effect free so they are unit-tested without a browser.
  Only the thin `load/save` adapters touch `localStorage`, each guarded by
  `typeof window` and `try/catch`.

- **Hydration:** on mount `BoardLabPage` restores the last autosaved active
  page (falling back to `createSeedBoard()` when empty/corrupt). A 400 ms
  debounced effect writes the active page back as the autosave on every change,
  so **state survives refresh**.

## Storage design

`localStorage` only, namespaced `clean-board.board.*` (mirrors
`clean-board.spotify.*`):

| Key | Contents |
| --- | --- |
| `clean-board.board.state` | `BoardState` — the named layouts + scenes library |
| `clean-board.board.autosave` | a single `SavedLayout` of the current active page |

Guarantees:

- **Versioned** — `schemaVersion` gates migrations; unknown/higher versions are
  rejected, never guessed at.
- **Graceful recovery** — corrupt JSON or invalid shape returns `null`; the
  caller falls back to seed/empty state and never crashes.
- **Atomic-ish** — `JSON.stringify` writes the whole key in one `setItem`.
- **Student-safe by construction** — every record is whitelist-sanitized on
  load (`sanitizeSavedLayout` / `sanitizeBoardScene`), so tokens, secrets, and
  unknown keys can never enter board state.

## Layout model

A `SavedLayout` is the object-carrying persisted unit (the concrete "board
state" record). It holds the page's `objects`, `background`, `displayMode`, and
metadata:

```ts
interface SavedLayout {
  schemaVersion: number
  id: string
  name: string
  kind: 'layout'
  background: BoardBackground
  objects: BoardObject[]
  displayMode: DisplayMode
  createdAt: number
  updatedAt: number
}
```

## Scene model

A `BoardScene` references a `SavedLayout` plus future automation refs (all
non-secret, teacher-authored placeholders — nothing wired in DB-4A):

```ts
interface BoardScene {
  schemaVersion: number
  id: string
  name: string
  kind: 'scene'
  type: SceneType
  layoutId: string
  displayMode: DisplayMode
  spotifyPresetRef?: string
  timerPresetRef?: string
  backgroundRef?: string
  keepAwake: boolean
  studentSafe: boolean
  createdAt: number
  updatedAt: number
}

type SavedBoardItem = SavedLayout | BoardScene
```

`SceneType = 'arrival' | 'math' | 'reading' | 'transition' | 'packUp' | 'custom'`.

## UI (edit mode only)

A compact left panel (`SavedBoardsPanel`) appears **only in edit mode**. It
offers:

- A name field + **Save Current** (saves the active page as a layout).
- A scene type select + **Scene** (saves the layout *and* a scene referencing it).
- A **Layouts** list with Load / Rename / Delete per row.
- A **Scenes** list with Load / Delete per row.

Present mode renders none of this — no save buttons, scene controls, or edit
controls.

## What is deliberately NOT stored

- Spotify tokens / auth data (separate `clean-board.spotify.*` namespace)
- private account info (email, account/device/user IDs)
- temporary UI state (selection, mode, transport busy, etc.)

## Validation

| Command | Result |
| --- | --- |
| `npm run test:clean-board` | 33 passed, 0 failed |
| `npm run test:clean-board-spotify` | 69 passed, 0 failed |
| `npm run build` | PASS (`tsc -b && vite build`) |
| `npm run test:display-import-guard` | PASS |
| `npm run test:display-bundle-guard` | PASS |
| `npm run test:teacher-dock` | PASS |
| `npm run test:display-studio` | 124 passed |
| `npm run test:display-composer` | PASS |
| `npm run lint` | 3 pre-existing canvas-spike fast-refresh errors only |

## Screenshots

Not captured this pass — DB-4A is a persistence/logic layer; the only visible
surface is the compact edit-mode `Saved Boards` panel (described above) and the
existing board. Live screenshot capture is deferred to a follow-up.

## PASS / WARN / FAIL

**PASS**

- Teacher can save a board (layout).
- Teacher can reload a board.
- Teacher can create scenes.
- Teacher can switch scenes (scene resolves its referenced layout).
- State survives refresh (autosave + hydrate).
- Present mode stays clean (no save/scene controls).
- No secrets stored (whitelist sanitize + forbidden-key tests).
- Existing Spotify functionality still works (69 Spotify tests green).

**WARN**

- Google Drive sync deferred.
- Native (Tauri) storage deferred.
- Backgrounds / wallpaper system deferred.
- AI scene generation deferred.
- Screenshots deferred.

**FAIL**

- None.
