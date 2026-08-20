# Clean Board — State Model

> Planning target for DB-4A. This is the **target** schema, not current source.
> Current source (`src/features/clean-board/types.ts`) already has `BoardDeck`,
> `BoardPage`, `BoardObject`, and `BoardBackground`; the board itself is
> in-memory only. This doc defines what persistence and scenes will look like.

## 1. Current board state (as of `main`)

- `BoardLabPage` initializes the deck from `createSeedBoard()` and holds it in
  React `useState`. There is **no save/load** of the deck.
- The types are already discriminated and layer-aware:

```ts
interface BoardDeck {
  id: string
  title: string
  pages: BoardPage[]
  activePageId: string
  createdAt?: number
  updatedAt?: number
}

interface BoardPage {
  id: string
  title: string
  background: BoardBackground
  objects: BoardObject[]
  teacherNotes?: string   // never projected to present mode
}

interface BoardObject {
  id: string
  kind: BoardObjectKind   // text | image | link | videoEmbed | clock | timer | spotifyNowPlayingPlaceholder
  x: number; y: number; w: number; h: number
  rotation: number
  locked: boolean
  visible: boolean
  layer: number
  config: BoardObjectConfig // discriminated by `kind`
}

type BoardBackground =
  | { type: 'gradient'; from: string; to: string; angleDeg?: number }
  | { type: 'solid'; color: string }
  | { type: 'image'; assetPath: string }
```

- Spotify tokens/presets are the only already-persisted slice, under the
  `clean-board.spotify.*` namespace (`spotifyStorage.ts`). Tokens are **never**
  part of board state and must never be serialized into a scene.

## 2. Target entities

### BoardState

The top-level persisted unit. Wraps the deck plus scene metadata and a monotonic
schema version.

```ts
interface BoardState {
  schemaVersion: number
  deckId: string
  title: string
  /** Ordered, reusable scenes. */
  scenes: BoardScene[]
  activeSceneId: string
  /** Currently projected scene (may differ from the scene being edited). */
  displaySceneId: string | null
  createdAt: number
  updatedAt: number
}
```

`BoardState` replaces the bare `BoardDeck` as the persisted shape. `BoardDeck`
remains the in-memory authoring unit; persistence maps `BoardDeck` → `BoardState`
(and back) in DB-4A.

### BoardObject

Unchanged from the current `BoardObject` (see above). Two additions for
serialization:

- Keep `config` as a **discriminated union** — never a `Record<string, unknown>`.
- Every `config` variant must be serializable to plain JSON (no functions, no
  class instances, no `undefined`).

### BoardScene

The reusable, portable unit of a board. A scene is a **page + type + safety
flag + version bookkeeping**. This is the entity DB-4A introduces for templates
and daily snapshots.

```ts
interface BoardScene {
  id: string
  title: string
  /** Semantic category for filtering and layout presets. */
  type: SceneType
  background: BoardBackground
  objects: BoardObject[]
  teacherNotes?: string
  /** Kill-switch: false means never project to present mode. */
  studentSafe: boolean
  createdAt: number
  updatedAt: number
}

type SceneType =
  | 'arrival'
  | 'lessonLaunch'
  | 'workTime'
  | 'transition'
  | 'break'
  | 'assessment'
  | 'packUp'
  | 'custom'
```

Reconciliation note for DB-4A: `BoardPage` already plays the scene role in
source. DB-4A should either rename `BoardPage` → `BoardScene`, or keep
`BoardPage` as the in-memory unit and introduce `BoardScene` as its persisted,
tagged form. Recommendation: **introduce `BoardScene` and migrate `BoardPage`
onto it**, so `type`, `studentSafe`, and timestamps exist uniformly for
templates and snapshots.

### BoardBackground

Already present. Two DB-4B additions:

```ts
type BoardBackground =
  | { type: 'gradient'; from: string; to: string; angleDeg?: number }
  | { type: 'solid'; color: string }
  | { type: 'image'; assetPath: string }
  | { type: 'wallpaper'; wallpaperId: string }          // DB-4E: media library ref
  // Readability overlay, applied in present mode only.
```

Add a page-level `overlay?: 'none' | 'darken' | 'lighten' | 'blur'` field (on
the scene or background) so text stays readable over any background. The overlay
is a render concern, not student data.

### DisplayMode

A present-mode-only presentation preset (DB-4F). It is **not** authored board
content; it is a projection overlay.

```ts
type DisplayMode = 'default' | 'focus' | 'calm' | 'transition'

interface DisplayModeConfig {
  mode: DisplayMode
  /** Optional student-safe message shown at the bottom of present mode. */
  studentMessage?: string
  /** Optional overlay to apply while the mode is active. */
  overlay?: 'none' | 'darken' | 'blur'
}
```

Display modes carry **no** teacher notes, tokens, or student data.

## 3. Saved layouts

A saved layout is a **full `BoardState` snapshot** persisted locally. Rules:

- One active board at a time, but multiple named boards may be stored locally.
- A save writes `{ schemaVersion, scenes, activeSceneId, ... }` atomically.
- A load validates against `schemaVersion` and falls back to the seed on
  corruption (never crash).
- The seed board stays as the first-run default and the migration fallback.

## 4. Scenes

- A scene is a reusable page. The scene library lets a teacher name, duplicate,
  reorder, and reuse scenes across boards.
- `studentSafe: false` is a hard block on projection — the scene cannot reach
  present mode.
- `teacherNotes` is stripped by `toSafeBoardPage` (already implemented) and must
  remain stripped in the persisted projection path.

## 5. Templates

- A template is a `BoardScene` marked as reusable, stored separately from the
  active board so it is not overwritten by daily edits.
- DB-4A ships a small built-in template set derived from `createSeedBoard()`.
- Templates are a subset of scenes; no separate entity is required — a
  `kind: 'scene' | 'template'` tag on the scene record suffices.

## 6. Daily snapshots

- A daily snapshot is an immutable, timestamped copy of a scene (or full board)
  taken when the teacher "starts the day" or explicitly saves a snapshot.
- Storage: `clean-board.snapshots.<date>` or a small snapshot index. Snapshots
  are **append-only** and not overwritten by normal saves.
- Purpose: undo/recall a previous day's layout without a cloud backend.
- Snapshots are subject to the same student-safety projection if ever surfaced
  in present mode.

## 7. Storage levels (in order of adoption)

1. **Local browser storage (first)** — `localStorage` under a versioned
   `clean-board.board.*` namespace. Mirrors the existing `clean-board.spotify.*`
   convention. This is the only level built in DB-4A.
2. **Export/import JSON (second)** — a `download`/`upload` path for `.json`
   portability (move a board between MacBook and iPad). Built on top of the same
   serialized schema.
3. **Google Drive sync (later)** — deferred until the local schema stabilizes.
   Requires an explicit auth + sync surface; must never pull student data.
4. **Native/Tauri storage (later)** — deferred to the future Tauri/native shell;
   the serialized schema stays engine-agnostic so it can be reused.

## 8. Save-state principles

- **Local-first.** No network dependency to save or load a board.
- **Versioned.** `schemaVersion` gates migrations; unknown versions fall back,
  never crash.
- **Atomic.** Writes replace the whole key or are staged; no half-written state.
- **Student-safe by construction.** Persisted scenes carry `teacherNotes` and
  `studentSafe`; present mode only ever reads the sanitized projection. Tokens
  and secrets are never written into board state.
- **Separate concerns.** Board content (scenes/objects) and live runtime state
  (Spotify, timer tick, wake lock) are stored separately. Only board content is
  serialized into scenes.
- **Serializable widgets.** Every object `config` is JSON-safe and typed.

## 9. DB-4A recommended scope

1. Add `BoardState`, `BoardScene`, `SceneType`, and `BoardBackground.overlay`
   to the clean-board types (migrate `BoardPage` → `BoardScene`).
2. Add a `boardStorage.ts` with `saveBoard`, `loadBoard`, `clearBoard`,
   `exportBoard`, `importBoard`, and a version check — namespaced
   `clean-board.board.*`.
3. Wire `BoardLabPage` to hydrate from storage (fall back to seed) and save on
   change (debounced).
4. Add a minimal scene library (name/duplicate/reorder/delete) in the edit-only
   panel.
5. Add a small built-in template set and a daily snapshot capture.
6. Keep `toSafeBoardPage` as the single projection path; add tests that
   persistence never writes `teacherNotes`/tokens into present output.
7. Add pure-logic tests for save/load round-trip, version fallback, and
   student-safe persistence. Run the full clean-board/display/teacher validation
   suite.

Deferred past DB-4A: Google Drive sync, Tauri storage, wallpaper fetcher,
external image search.
