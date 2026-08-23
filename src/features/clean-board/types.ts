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
  'messageCard',
] as const

export type BoardObjectKind = (typeof BOARD_OBJECT_KINDS)[number]

export type BoardMode = 'present' | 'edit'

export type BackgroundCategory =
  | 'calm'
  | 'focus'
  | 'morning'
  | 'reading'
  | 'math'
  | 'transition'
  | 'neutral'

export type BackgroundPresetId =
  | 'calm-blue'
  | 'soft-green'
  | 'warm-neutral'
  | 'clean-white'
  | 'slate-focus'
  | 'morning-glow'
  | 'reading-cream'
  | 'math-grid-subtle'
  | 'quiet-purple'
  | 'transition-dark'

export type ReadabilityOverlay = 'none' | 'soft' | 'strong'

// ── DB-4E — safe local images / wallpaper ──

/** Browser-safe raster MIME types accepted for teacher image uploads. */
export type ImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp'

/** Object-fit mode for image board objects. */
export type ImageFit = 'contain' | 'cover' | 'fill'

/**
 * A sanitized, local-only raster image. `dataUrl` is a self-contained
 * `data:image/(png|jpeg|webp);base64,...` payload (never a remote URL, file
 * path, blob, or SVG). No EXIF/private metadata is stored; the original file
 * name is intentionally dropped.
 */
export type SafeLocalImage = {
  kind: 'localData'
  mimeType: ImageMimeType
  dataUrl: string
  altText: string
  byteSize: number
  width?: number
  height?: number
}

/** Config for a board image object (replaces the old free-form `src` shape). */
export type ImageObjectConfig = {
  kind: 'image'
  image: SafeLocalImage
  fit: ImageFit
  opacity: number
}

export type BoardThemeId = 'minimal-light' | 'minimal-dark' | 'glass-dark' | 'solid-focus'

export type BoardTheme = {
  id: BoardThemeId
  name: string
  textTone: 'dark' | 'light'
  accent: string
  surface: 'glass' | 'solid' | 'minimal'
}

export type BoardBackground =
  | {
      type: 'gradient'
      from: string
      to: string
      angleDeg?: number
      readabilityOverlay?: ReadabilityOverlay
    }
  | { type: 'solid'; color: string; readabilityOverlay?: ReadabilityOverlay }
  | { type: 'preset'; presetId: BackgroundPresetId; readabilityOverlay?: ReadabilityOverlay }
  | {
      type: 'localImage'
      image: SafeLocalImage
      readabilityOverlay?: ReadabilityOverlay
    }

// ── DB-4C — Directions / Message Card widget ──

/** Semantic label a teacher picks for a message card. */
export type MessageCardKind =
  | 'doNow'
  | 'objective'
  | 'directions'
  | 'reminder'
  | 'transition'
  | 'exitTicket'
  | 'announcement'

/** Visual tone for the card's accent. */
export type MessageCardTone = 'neutral' | 'calm' | 'focus' | 'warning' | 'success'

/** Text scale for title + body. */
export type MessageCardTextSize = 'small' | 'medium' | 'large'

/**
 * Student-facing message card content. Plain text only — no HTML, markdown,
 * links, images, or remote content. `title` and `message` are rendered as text
 * (React escapes by construction), so nothing here can execute.
 */
export type MessageCardConfig = {
  kind: 'messageCard'
  title: string
  message: string
  cardKind: MessageCardKind
  tone: MessageCardTone
  textSize: MessageCardTextSize
  checklistStyle: boolean
}

// ── DB-4D — Classroom timer presets ──

/** Semantic classroom routine a teacher picks for a timer. */
export type TimerPresetId =
  | 'morningWork'
  | 'mathSprint'
  | 'independentWork'
  | 'readingStamina'
  | 'cleanup'
  | 'transition'
  | 'exitTicket'
  | 'brainBreak'
  | 'partnerTalk'
  | 'quietWriting'
  | 'custom'

/** Visual tone for the timer's accent. */
export type TimerTone = 'neutral' | 'calm' | 'focus' | 'urgent' | 'success'

/**
 * Timer widget config. Static (no live countdown) — `label` is the formatted
 * duration shown to students, `title` is the routine name, and `presetId`/`tone`
 * carry the last-applied preset for persistence/reuse.
 */
export type TimerConfig = {
  kind: 'timer'
  presetId: TimerPresetId
  title: string
  durationMinutes: number
  tone: TimerTone
  label: string
}

export type BoardObjectConfig =
  | {
      kind: 'text'
      text: string
      fontSize: number
      color: string
      align: 'left' | 'center' | 'right'
    }
  | ImageObjectConfig
  | { kind: 'link'; url: string; label: string }
  | { kind: 'videoEmbed'; src: string; label: string }
  | { kind: 'clock'; format: '12h' | '24h'; label: string }
  | TimerConfig
  | { kind: 'spotifyNowPlayingPlaceholder'; label: string }
  | MessageCardConfig

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
  theme: BoardTheme
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

/**
 * DB-4F — a teacher-selectable classroom display mode. A projection-layer
 * preference applied on top of existing scene/layout content; it never owns
 * widgets, timers, Spotify, images, or messages.
 */
export type DisplayModeId =
  | 'morningArrival'
  | 'focus'
  | 'reading'
  | 'transition'
  | 'cleanup'
  | 'assessment'
  | 'custom'

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
 * `background` are the display content; `displayModeId` is a projection-layer
 * preference restored when the layout is loaded.
 */
export interface SavedLayout {
  schemaVersion: number
  id: string
  name: string
  kind: 'layout'
  background: BoardBackground
  theme: BoardTheme
  objects: BoardObject[]
  displayModeId: DisplayModeId
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
  displayModeId: DisplayModeId
  spotifyPresetRef?: string
  timerPresetRef?: string
  backgroundRef?: string
  backgroundPresetId?: BackgroundPresetId
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
