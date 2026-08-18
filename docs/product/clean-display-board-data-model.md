# Clean Display Board — Data Model

> Phase: **DB-0** — spec only. No implementation yet.
> The shapes below are the target model. Type names are proposals; final module path is
> `src/features/board-lab/` (or similar) and will be finalized in DB-1.

## 1. Core entities

| Entity | Purpose |
| --- | --- |
| `BoardDeck` | A named collection of pages. Top-level persisted unit. |
| `BoardPage` | One slide/board. Has a background, an ordered set of objects, and page-level widget slots. |
| `BoardObject` | A positioned, layered content object (text, image, gif, link, videoEmbed). |
| `BoardBackground` | The page's wallpaper/background (image, gradient, solid, or media-library ref). |
| `BoardWidget` | A live widget (clock, timer, routine timer, spotify) — a special object type with runtime state. |
| `RoutineTimer` | A scheduled/auto-advancing timer definition (steps + schedule). |
| `SpotifyState` | Spotify connection, device, playback, and now-playing state (teacher + student-safe views). |
| `WallpaperSource` | A provider of wallpaper/media (built-in, local, fetcher). |
| `WallpaperQuery` | A structured query for the wallpaper fetcher (school, subject, seasonal, holiday, weather, mood). |
| `WallpaperResult` | A wallpaper result returned by a source (metadata + asset reference). |

## 2. BoardDeck

```ts
interface BoardDeck {
  id: string
  title: string
  /** Ordered page ids. */
  pageOrder: string[]
  /** Deck-level settings (theme accent, default font, autoplay, etc.). */
  settings: BoardDeckSettings
  /** Revision bookkeeping — never serialized to /present. */
  updatedAt: number
  version: number
}

interface BoardDeckSettings {
  /** Default canvas is 1920x1080 (16:9). Kept configurable for future ratios. */
  canvasWidth: number
  canvasHeight: number
  /** Scale-to-fit behavior on the target display. */
  fitMode: 'contain' | 'cover'
  /** Pause animated content in present mode (GIFs). */
  pauseAnimations: boolean
  accentColor?: string
}
```

## 3. BoardPage

```ts
interface BoardPage {
  id: string
  deckId: string
  title: string
  /** Page background (see BoardBackground). */
  background: BoardBackground
  /** Ordered, layered objects (z-order implied by array order or explicit zIndex). */
  objects: BoardObject[]
  /** Live widgets attached to the page. */
  widgets: BoardWidget[]
  /** Teacher-only notes — must never reach /board-lab/present. */
  teacherNotes?: string
  /** Kill-switch: false means this page must never render in present mode. */
  studentSafe: boolean
  updatedAt: number
}
```

## 4. BoardBackground

A page-level background (not a draggable object). Distinguishes a wallpaper reference (media library)
from a plain style token.

```ts
type BoardBackground =
  | { type: 'gradient'; token: string }         // maps to a built-in gradient token
  | { type: 'solid'; color: string }
  | { type: 'image'; assetPath: string }        // local or remote asset
  | { type: 'wallpaper'; wallpaperId: string }  // reference into the media library
```

## 5. BoardObject

```ts
type BoardObjectType = 'text' | 'image' | 'gif' | 'link' | 'videoEmbed'

interface BoardObject {
  id: string
  type: BoardObjectType
  /** Normalized position/size (0..1) relative to the canvas, top-left origin. */
  x: number
  y: number
  w: number
  h: number
  /** Rotation in degrees, clockwise. */
  rotation: number
  /** Layering — higher renders on top. */
  zIndex: number
  visible: boolean
  locked: boolean
  /** Type-specific payload. */
  data: TextObjectData | ImageObjectData | GifObjectData | LinkObjectData | VideoEmbedObjectData
}
```

### 5.1 Object payloads

```ts
interface TextObjectData {
  text: string
  fontSize: number          // logical px on the 1920x1080 canvas
  color: string
  align: 'left' | 'center' | 'right'
  shrinkToFit: boolean      // default true
}

interface ImageObjectData {
  src: string               // local or remote URL
  alt?: string
  fit: 'cover' | 'contain' | 'fill'
  /** Optional overlay to guarantee contrast with overlaid text. */
  overlayStrength: 'light' | 'medium' | 'strong' | 'none'
}

interface GifObjectData {
  src: string
  alt?: string
  fit: 'cover' | 'contain' | 'fill'
  /** Respects BoardDeckSettings.pauseAnimations in present mode. */
  autoplay: boolean
}

interface LinkObjectData {
  url: string
  label?: string
  /** Optional short-code/QR rendering for classroom scanning. */
  showQr: boolean
}

interface VideoEmbedObjectData {
  /** YouTube/Vimeo/iframe embed URL. */
  src: string
  provider: 'youtube' | 'vimeo' | 'iframe' | 'unknown'
  autoplay: boolean
  muted: boolean
  controls: boolean
}
```

## 6. BoardWidget

A live widget is a special object type that carries runtime state. It reuses the object position/size
shape but adds a `kind` and `config`/`state`.

```ts
type BoardWidgetKind =
  | 'clockWidget'
  | 'timerWidget'
  | 'routineTimerWidget'
  | 'spotifyWidget'

interface BoardWidget {
  id: string
  kind: BoardWidgetKind
  x: number
  y: number
  w: number
  h: number
  zIndex: number
  visible: boolean
  locked: boolean
  config: WidgetConfig
}

type WidgetConfig =
  | { kind: 'clockWidget'; format: '12h' | '24h'; showSeconds: boolean }
  | { kind: 'timerWidget'; durationMs: number; label?: string; chimeEnabled: boolean }
  | { kind: 'routineTimerWidget'; routineTimerId: string }
  | { kind: 'spotifyWidget'; showTrack: boolean; showControls: boolean }
```

> **Rationale vs. old model:** the old `CanvasWidget` (`src/features/display-composer/types.ts`) used a
> single bag with a `type: CanvasWidgetType` union and a generic `settings: Record<string, unknown>`.
> The new model uses a discriminated `kind` + typed `config` so a widget's config is statically checked
> instead of keyed-by-string. This is the main data-model improvement over the old build.

## 7. RoutineTimer

Scheduled / auto-advancing timers. Conceptually reuses the old `RoutineTimerState` +
`RoutineSchedule`/`RoutinePhaseDefinition` (`src/data/timerTypes.ts`, `src/data/routineTypes.ts`), but
decoupled from the old screen model.

```ts
interface RoutineTimer {
  id: string
  title: string
  steps: RoutineTimerStep[]
  /** Auto-advance between steps. */
  autoAdvance: boolean
  /** Chime between steps. */
  chimeBetweenSteps: boolean
  /** Optional weekly schedule; empty means "manual only". */
  schedule?: RoutineTimerSchedule
}

interface RoutineTimerStep {
  id: string
  label: string
  durationMs: number
  instructions?: string
}

interface RoutineTimerSchedule {
  weekdays: ('mon' | 'tue' | 'wed' | 'thu' | 'fri')[]
  /** HH:MM local times. */
  startTime: string
  endTime: string
  enabled: boolean
}
```

## 8. SpotifyState

Full detail in the Spotify Level 2 doc. Data model summary:

```ts
type SpotifyConnectionStatus =
  | 'disconnected'
  | 'authenticating'
  | 'authenticated'
  | 'premiumRequired'
  | 'error'

interface SpotifyState {
  status: SpotifyConnectionStatus
  /** Present only in the teacher view; never serialized to present mode. */
  accessToken?: string
  /** Active Spotify Connect device id, if any. */
  activeDeviceId: string | null
  deviceName: string | null
  isPlaying: boolean
  /** Present-only metadata — safe to show students. */
  nowPlaying: NowPlaying | null
  /** Playlist preset id, if a preset is active. */
  activePresetId: string | null
  volume: number
}

interface NowPlaying {
  trackName: string
  artistName: string
  albumName?: string
  /** Optional album art URL (allowed in student view). */
  artworkUrl?: string
}
```

**Invariant:** `accessToken` (and refresh token, if any) live in a separate, teacher-only store slice and
are **never** part of the student-safe projection, never logged, and never committed.

## 9. Wallpaper / media library

```ts
type WallpaperSourceKind = 'builtIn' | 'localImport' | 'fetcher'

interface WallpaperSource {
  id: string
  kind: WallpaperSourceKind
  label: string
  /** Whether this source requires network (fetcher). */
  requiresNetwork: boolean
}

interface WallpaperQuery {
  school?: string
  subject?: string
  seasonal?: string   // 'fall' | 'winter' | 'spring' | 'summer'
  holiday?: string
  weather?: string
  mood?: string
  /** Free-text tag search. */
  tags?: string[]
}

interface WallpaperResult {
  id: string
  sourceId: string
  title: string
  /** Local or remote asset reference. */
  assetPath: string
  /** Dominant color for preview thumbnails / contrast checks. */
  dominantColor: string
  categories: WallpaperCategory[]
  /** Recommended overlay strength for text readability. */
  overlayStrength: 'light' | 'medium' | 'strong'
  studentSafe: boolean
}

type WallpaperCategory =
  | 'school'
  | 'subject'
  | 'seasonal'
  | 'holiday'
  | 'weather'
  | 'mood'
  | 'classroom'
  | 'calm'
  | 'nature'
```

> The existing `WallpaperMetadata`/`WallpaperCategory` in `src/lib/wallpaperRegistry.ts` is a strong
> starting point but is built-in only and missing the expanded school/subject/weather/mood categories.
> We **salvage the concept**, then extend it with the fuller category set and a `source`/`query`/`result`
> split (see salvage audit).

## 10. Persistence and safety

- Deck/pages/objects/widgets persist to local storage under a versioned key (mirroring the existing
  `DISPLAY_COMPOSER_STORAGE_KEY` convention), plus a JSON export/import path for portability.
- A **student-safe projection** function (analogous to `toDisplaySafeScreen` in
  `src/features/display-composer/displaySafe.ts`) strips `teacherNotes`, `updatedAt`, `version`, and any
  teacher-only widget state before present mode.
- The projection must also drop `accessToken`, refresh tokens, device ids, and any auth detail.

## 11. Normalization (scale-to-fit)

- All object geometry is stored **normalized to the logical canvas** (0..1 for x/y/w/h, or logical px
  against a fixed 1920×1080 canvas). The renderer computes a single uniform scale factor so the board
  fits the target display without reflow.
- Font sizes, corner radii, and spacing are defined in logical canvas units so they scale with the board.
