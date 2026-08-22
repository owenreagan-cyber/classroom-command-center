/**
 * DB-1 — Clean Board data model.
 *
 * A board is a deck of 16:9 pages. Each page has a background and a set of
 * positioned, layered objects. Object kinds are discriminated so each object's
 * config is statically checked.
 *
 * Live widget logic (clock tick, timer countdown, Spotify playback) is
 * intentionally NOT implemented in DB-1 — those kinds render as static
 * placeholders only.
 */

export const BOARD_OBJECT_KINDS = [
  'text',
  'image',
  'link',
  'videoEmbed',
  'clock',
  'timer',
  'spotifyNowPlayingPlaceholder',
] as const

export type BoardObjectKind = (typeof BOARD_OBJECT_KINDS)[number]

export type BoardMode = 'present' | 'edit'

export type BoardBackground =
  | { type: 'gradient'; from: string; to: string; angleDeg?: number }
  | { type: 'solid'; color: string }
  | { type: 'image'; assetPath: string }

export type BoardObjectConfig =
  | {
      kind: 'text'
      text: string
      fontSize: number
      color: string
      align: 'left' | 'center' | 'right'
    }
  | { kind: 'image'; src: string; alt: string; fit: 'cover' | 'contain' | 'fill' }
  | { kind: 'link'; url: string; label: string }
  | { kind: 'videoEmbed'; src: string; label: string }
  | { kind: 'clock'; format: '12h' | '24h'; label: string }
  | { kind: 'timer'; durationMinutes: number; label: string }
  | { kind: 'spotifyNowPlayingPlaceholder'; label: string }

export interface BoardObject {
  id: string
  kind: BoardObjectKind
  /** Logical pixels on the fixed 1920x1080 canvas, top-left origin. */
  x: number
  y: number
  w: number
  h: number
  /** Clockwise rotation in degrees. */
  rotation: number
  locked: boolean
  visible: boolean
  /** Render order — higher renders on top. */
  layer: number
  config: BoardObjectConfig
}

export interface BoardPage {
  id: string
  title: string
  background: BoardBackground
  objects: BoardObject[]
  /** Teacher-only. Never projected into present mode. */
  teacherNotes?: string
}

export interface BoardDeck {
  id: string
  title: string
  pages: BoardPage[]
  activePageId: string
  createdAt?: number
  updatedAt?: number
}

// ── DB-4A — persistence / scenes ──

/** Present-mode projection preset (placeholder in DB-4A; wired in DB-4F). */
export type DisplayMode = 'default' | 'focus' | 'calm' | 'transition'

/** Semantic classroom category for a scene. */
export type SceneType =
  | 'arrival'
  | 'math'
  | 'reading'
  | 'transition'
  | 'packUp'
  | 'custom'

/**
 * A named saved board ("saved layout"). The object-carrying persisted unit:
 * holds the page's objects, background, and metadata. `objects` and
 * `background` are the display content; `displayMode` is a placeholder.
 */
export interface SavedLayout {
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

/**
 * A classroom scene referencing a saved layout plus future automation refs.
 * The refs are non-secret, teacher-authored placeholders — nothing is wired
 * to them in DB-4A.
 */
export interface BoardScene {
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

/** Discriminated union of the two persisted item kinds. */
export type SavedBoardItem = SavedLayout | BoardScene

/**
 * Top-level persisted collection under `clean-board.board.state`. Wraps the
 * named layouts and scenes plus the currently-active references and a
 * monotonic schema version for migrations.
 */
export interface BoardState {
  schemaVersion: number
  id: string
  name: string
  activeLayoutId: string | null
  activeSceneId: string | null
  layouts: SavedLayout[]
  scenes: BoardScene[]
  createdAt: number
  updatedAt: number
}
