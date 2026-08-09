# Board, Scene, and Widget Target Model

**Phase:** 15L.1 — Canvas Engine Decision + Board/Scene/Widget Target Model
**Date:** 2026-08-08
**Status:** Documentation-only architecture target model
**No application code changed.** No dependencies installed.

---

## Overview

This document defines the target product model for a unified Board > Scene > Widget hierarchy. It replaces the three parallel systems found in the current-state review:

| Current System | Target Mapping |
|---------------|----------------|
| `DisplayComposerPersistedState` (flat `Record<string, DisplayScreen>`) | `Board` with `Scene[]` |
| `BoardState` (monolithic bag with `ScreenId`, `ScreenContents`, `ClassWorkspace`, etc.) | `Board` with `Scene[]` per classroom screen |
| `ClassWorkspace` → `VibePage` (Studio Canvas pages) | `Scene` within a `Board` |

The target model is engine-agnostic — it can be implemented on tldraw shapes, Konva layers, or a hand-rolled DOM canvas. The specific engine affects how shapes, frames, and camera states are realized, but the abstract model is the same.

---

## Board

A Board is a named collection of Scenes with an active scene (teacher editing) and a display scene (student projection).

```typescript
interface Board {
  /** Stable unique identifier. */
  id: string

  /** Human-readable board name (e.g. "Morning Routine", "Math Block"). */
  title: string

  /** Ordered list of scenes on this board. */
  scenes: Scene[]

  /** The scene the teacher is currently editing. */
  activeSceneId: string

  /** The scene currently projected to /display. May differ from activeSceneId
   *  (teacher edits one scene while students see another). */
  displaySceneId: string | null

  /** Timestamps for audit and conflict resolution. */
  createdAt: number
  updatedAt: number

  /** Monotonic version for migration and conflict detection. */
  version: number

  /** Board-level metadata. */
  metadata: BoardMetadata
}

interface BoardMetadata {
  /** Category or subject grouping. */
  category?: 'daily' | 'subject' | 'transition' | 'special' | 'custom'

  /** Tags for filtering and search. */
  tags?: string[]

  /** Optional icon for dock/thumbnail display. */
  icon?: string
}
```

### Local-first persistence notes

- Boards are persisted to localStorage via Zustand `persist` middleware, same as all existing stores
- Each Board is a single JSON blob under a storage key like `classroom-command-center-board-v1`
- The `version` field enables migration between model versions
- Export/import uses the existing `BoardExportPayload` format, extended for the new model
- No cloud sync, no network dependency, no tldraw sync
- iPad handoff remains local — teacher moves the iPad to the projector or uses the existing display launch tool

### How Boards relate to the current model

- **Current Display Composer screens** (`Record<string, DisplayScreen>` in `displayComposerStore`): Each display screen becomes a `Scene` on a "Display Screens" Board. The flat `order` array becomes the `Board.scenes` array.
- **Current classroom screens** (`ScreenId` indexing `BoardState`): Each of the 16 classroom screens becomes a `Board`. For example, "Homeroom" is a Board containing 5 Scenes (morning-arrival, silent-work, clean-up-math, morning-message, announcements). "Math" is a Board containing 6 Scenes.
- **Current Studio Canvas** (`ClassWorkspace` → `VibePage`): Each `ClassWorkspace` becomes a Board. Each `VibePage` becomes a Scene on that Board.

---

## Scene

A Scene is a single visible workspace with a background, a set of widgets, camera settings, and display safety controls.

```typescript
interface Scene {
  /** Stable unique identifier. */
  id: string

  /** Human-readable scene name (e.g. "Morning Arrival", "Silent Work"). */
  title: string

  /** Semantic category for filtering and layout presets. */
  type: SceneType

  /** Background configuration. */
  background: SceneBackground

  /** Widgets placed on this scene, ordered by layer. */
  widgets: Widget[]

  /** Camera/viewport state. Engine-specific, but conceptually:
   *  - tldraw: frame bounds + camera zoom/pan
   *  - Konva: stage scale + position
   *  - DOM: CSS transform on container */
  camera: SceneCamera

  /** Whether this scene is safe for student projection.
   *  When false, the scene cannot be pushed to /display. */
  studentSafe: boolean

  /** Teacher-only notes. Never included in display-safe projection. */
  teacherNotes?: string

  /** Display configuration for student projection. */
  displaySettings: SceneDisplaySettings

  /** Timestamps. */
  createdAt: number
  updatedAt: number

  /** Monotonic version. */
  version: number
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

interface SceneBackground {
  type: 'gradient' | 'image' | 'solid' | 'wallpaper'
  /** Token id referencing the asset library. */
  token: string
  /** Optional overlay for readability (e.g. darken, blur). */
  overlay?: 'none' | 'darken' | 'lighten' | 'blur'
}

interface SceneCamera {
  /** Camera position and zoom for the teacher editor view. */
  x: number
  y: number
  zoom: number

  /** If using tldraw frames: the frame ID this scene is anchored to.
   *  If using Konva/DOM: the target viewport for camera snap. */
  frameId?: string
}

interface SceneDisplaySettings {
  /** Override the teacher camera for student projection.
   *  When set, /display uses this camera instead of the teacher's view. */
  displayCamera?: SceneCamera

  /** Whether the clock overlay is visible on /display. */
  showClock: boolean

  /** Student-facing message shown at the bottom of /display. */
  studentMessage?: string

  /** Theme applied to the display render of this scene. */
  themeId?: string
}
```

### Scene ordering and navigation

Scenes within a Board are ordered by their position in the `Board.scenes` array. Navigation controls (prev/next) in the Presenter View traverse this order. The active scene is the one the teacher is editing. The display scene is the one projected to students.

### How current models map to Scene

| Current Model | Maps to Scene field |
|--------------|-------------------|
| `DisplayScreen.id` | `Scene.id` |
| `DisplayScreen.title` | `Scene.title` |
| `DisplayScreen.mode` | `Scene.type` |
| `DisplayScreen.background` | `Scene.background` |
| `DisplayScreen.widgets` (CanvasWidget[]) | `Scene.widgets` (Widget[]) |
| `DisplayScreen.teacherNotes` | `Scene.teacherNotes` |
| `DisplayScreen.studentSafe` | `Scene.studentSafe` |
| `DisplayScreen.showClock` | `Scene.displaySettings.showClock` |
| `DisplayScreen.studentMessage` | `Scene.displaySettings.studentMessage` |
| `DisplayScreen.updatedAt` / `DisplayScreen.version` | `Scene.updatedAt` / `Scene.version` |
| `VibePage.id` | `Scene.id` (string version of VibePageId) |
| `VibePage.title` | `Scene.title` |
| `VibePage.backgroundId` | `Scene.background.token` |
| `VibePage.primaryMessage` / `supportingContent` | Mapped to a "directions-text" widget on the Scene |
| `VibePage.widgets` (PageWidget[]) | `Scene.widgets` (Widget[]) |
| `VibePage.visibleInClassroom` | `Scene.studentSafe` |

### What maps to Board rather than Scene

`ClassWorkspace` maps to `Board`:
- `ClassWorkspace.classId` → `Board.id` + metadata
- `ClassWorkspace.title` → `Board.title`
- `ClassWorkspace.pages` (VibePage[]) → `Board.scenes` (Scene[])
- `ClassWorkspace.activePageId` → `Board.activeSceneId`
- `ClassWorkspace.routinePhaseAssociations` → `Board.metadata` (or a separate routine phase mapping)

`BoardState.activeScreen` (ScreenId) → `Board.id` (current active board)

---

## Widget

A Widget is a draggable, resizable, layerable element placed on a Scene. It has typed settings (not `Record<string, unknown>`) and a shared display-safe projection protocol.

```typescript
interface Widget {
  /** Stable unique identifier. */
  id: string

  /** Discriminated widget type. */
  type: WidgetType

  /** Position and size.
   *  Engine-specific representation:
   *  - tldraw: shape geometry (bounds, rotation)
   *  - Konva: x, y, width, height, rotation, scaleX, scaleY
   *  - DOM: percentage-based x, y, w, h */
  position: WidgetPosition
  size: WidgetSize

  /** Layer ordering within the scene. Higher = on top. */
  order: number

  /** Whether the widget is rendered. Hidden widgets are in the model but not visible. */
  visible: boolean

  /** When locked, the widget cannot be moved, resized, or deleted via canvas interaction.
   *  Teacher can still modify settings through the inspector panel. */
  locked: boolean

  /** When pinned, the widget appears on every scene in the board.
   *  Position and size are per-scene but the widget instance is shared.
   *  If a scene has a pinned widget at a different position, the scene's position overrides. */
  pinned: boolean

  /** When spotlighted, this widget renders full-canvas (solo mode).
   *  All other widgets on the scene are hidden.
   *  Only one widget can be in spotlight at a time per scene. */
  spotlight: boolean

  /** Focus mode: widget is rendered at enlarged scale, centered.
   *  Other widgets may be dimmed or hidden depending on engine rendering.
   *  Less aggressive than spotlight — the scene remains visible. */
  focus: boolean

  /** Typed widget-specific settings. Discriminated by WidgetType.
   *  Replaces the current `Record<string, unknown>`. */
  settings: WidgetSettings

  /** Fields that must never be sent to /display.
   *  Engine-agnostic: these fields are stripped by the shared display-safe protocol
   *  before the widget is rendered on the student projection. */
  teacherOnly: WidgetTeacherOnly

  /** Display-safe projection fields.
   *  These are the fields that survive the display-safe filter.
   *  Derived from settings + teacherOnly: displaySafe = settings - teacherOnly + displayOverrides */
  displaySafe?: DisplaySafeWidgetProps

  /** Timestamps. */
  createdAt: number
  updatedAt: number

  /** Monotonic version. */
  version: number
}

type WidgetType =
  | 'clock'
  | 'countdown-timer'
  | 'routine-timer'
  | 'stopwatch'
  | 'directions-text'
  | 'materials'
  | 'checklist'
  | 'work-symbols'
  | 'noise-meter'
  | 'atmosphere'
  | 'random-picker'
  | 'mystery-student'
  | '100-board'
  | 'prize-board'
  | 'press-your-luck'
  | 'lotto-board'
  | 'jobs-manager'
  | 'image'
  | 'pdf-embed'
  // Future: 'poll', 'scoreboard', 'dice-spinner', 'qr-code'

/** Engine-agnostic position. Specific representation depends on engine. */
interface WidgetPosition {
  /** X position. tldraw/Konva: pixels from origin. DOM: percentage 0-100. */
  x: number
  /** Y position. */
  y: number
  /** Rotation in degrees. */
  rotation?: number
}

/** Engine-agnostic size. */
interface WidgetSize {
  /** Width. tldraw/Konva: pixels. DOM: percentage 0-100. */
  w: number
  /** Height. */
  h: number
  /** Scale multipliers (1 = 100%). */
  scaleX?: number
  scaleY?: number
}

/** Discriminated union of widget-specific settings.
 *  Replace `Record<string, unknown>` with this. */
type WidgetSettings =
  | { type: 'clock'; format?: '12h' | '24h'; showSeconds?: boolean; showDate?: boolean }
  | { type: 'countdown-timer'; timerKind?: string; timerId?: string; label?: string }
  | { type: 'routine-timer'; timerId?: string; showSteps?: boolean }
  | { type: 'stopwatch'; running?: boolean; elapsedMs?: number }
  | { type: 'directions-text'; text: string; fontSize?: 'sm' | 'md' | 'lg'; align?: 'left' | 'center' }
  | { type: 'materials'; heading: string; sections?: { id: string; label?: string; items: string[] }[] }
  | { type: 'checklist'; heading: string; items?: { id: string; text: string; checked: boolean }[] }
  | { type: 'work-symbols'; symbol: string }
  | { type: 'noise-meter'; level?: number; showLabel?: boolean }
  | { type: 'atmosphere'; mode?: string; showNowPlaying?: boolean }
  | { type: 'random-picker'; label?: string; result?: string }
  | { type: 'mystery-student'; activeSession?: boolean; showStatus?: boolean }
  | { type: '100-board'; gameId?: string; revealMode?: 'select' | 'reveal' }
  | { type: 'prize-board'; boardId?: string; showPrizeName?: boolean }
  | { type: 'press-your-luck'; spins?: number; showOutcome?: boolean }
  | { type: 'lotto-board'; drawCount?: number; showHistory?: boolean }
  | { type: 'jobs-manager'; cycleLabel?: string; showAssignments?: boolean }
  | { type: 'image'; src: string; alt?: string; fit?: 'contain' | 'cover' | 'fill' }
  | { type: 'pdf-embed'; src: string; page?: number }

interface WidgetTeacherOnly {
  /** Internal game state IDs (never shown on display). */
  gameIds?: string[]
  /** Student PII (names, scores, history). */
  studentData?: never
  /** Coaching hints for teacher view. */
  coachingHints?: string[]
  /** Raw settings before display-safe filtering. */
  rawSettings?: Record<string, unknown>
}

/** Display-safe widget projection. Sent to /display after filtering. */
interface DisplaySafeWidgetProps {
  /** Visible fields on /display. Type varies by widget. */
  props: Record<string, unknown>
  /** Whether the widget shows interactive game state (e.g., lotto balls, job cards). */
  isInteractive: boolean
  /** Widget-level visibility override for /display. */
  visibleOnDisplay: boolean
}
```

### Pin semantics

A pinned widget (`pinned: true`) appears on every Scene in its Board:
- The widget instance is shared — same `id`, same `settings`, same `teacherOnly`
- Position and size can be overridden per Scene (stored in a `sceneOverrides` map)
- If a Scene sets a different position for a pinned widget, the scene position wins
- Pinned widgets appear at the top of the layer stack (above all scene-local widgets)
- Pinned widgets are useful for: clock, noise meter, atmosphere/music indicator, mystery star status — elements that should persist across classroom transitions

### Spotlight semantics

A spotlighted widget (`spotlight: true`) renders full-canvas in solo mode on /display:
- All other widgets on the Scene are hidden
- The widget expands to fill the canvas (centered, scaled to fit)
- Only one widget can be spotlighted at a time per Scene
- Spotlight is per-display-scene — the teacher's editing view is unaffected
- Useful for: 100 Board game, Prize Board reveal, Mystery Star selection, Lotto Board draw — moments when one widget should command full student attention

### Focus semantics

A focused widget (`focus: true`) is rendered at enlarged scale centered on the Scene:
- Other widgets are dimmed (opacity ~20%) but not hidden
- Less aggressive than spotlight — the scene context remains visible
- Focus can coexist with pin and lock
- Useful for: highlighting active timer during work time, emphasizing directions text, showing the current picker result while keeping the timer visible

### Lock semantics

A locked widget (`locked: true`) cannot be moved, resized, or deleted through canvas interaction:
- Drag handles are hidden
- The widget cannot be selected via click or marquee
- Settings can still be modified through the Inspector panel
- Lock is per-widget, per-scene — a pinned widget can be locked in one scene and unlocked in another
- Useful for: fixed layout elements (clock in corner, title bar), preventing accidental disruption during live teaching

### Layer/order semantics

Widgets within a Scene are ordered by `Widget.order`:
- Higher `order` value = rendered on top
- Pinned widgets render above all scene-local widgets regardless of order
- When a widget is spotlighted, it renders above everything
- The canvas engine's native layer system (tldraw z-index, Konva layer ordering, DOM z-index) maps to `order`
- Drag-to-reorder in the widget list and right-click "Bring to Front"/"Send to Back" manipulate `order`

---

## Typed Widget Settings

The current `settings: Record<string, unknown>` is replaced by a discriminated union:

```typescript
type WidgetSettings =
  | { type: 'clock'; format?: '12h' | '24h'; /* ... */ }
  | { type: 'countdown-timer'; timerKind?: string; /* ... */ }
  // ... one entry per WidgetType

type Widget = {
  // ...
  settings: WidgetSettings  // not Record<string, unknown>
}
```

**Benefits:**
- TypeScript catches missing required fields at compile time
- Inspector panel can render type-safe settings forms per widget type
- Display-safe projection knows exactly which fields to include/strip
- Migration scripts can validate settings against the type schema
- No more ad-hoc `as` casts in widget renderers

**Migration approach:**
1. Define `WidgetSettings` discriminated union in `types.ts`
2. Add per-type type guards (`isClockSettings`, `isTimerSettings`, etc.)
3. Migrate existing settings: read `Record<string, unknown>`, validate against type, coerce defaults for missing fields
4. Remove `Record<string, unknown>` from `CanvasWidget` and `PageWidget`

---

## Student-Safe Projection Protocol

Replace the current ad-hoc per-widget projection in `WidgetDisplayOverlay.tsx` with a single shared protocol:

```typescript
/**
 * Given a Widget, produce its display-safe projection.
 * All teacher-only fields are stripped, student PII is redacted,
 * and interactive game state is projected through a student-safe lens.
 */
function toDisplaySafeWidget(widget: Widget, engineState: EngineState): DisplaySafeWidget {
  const displaySafe: DisplaySafeWidget = {
    id: widget.id,
    type: widget.type,
    visible: widget.visible,
    // Position/size unchanged — same layout on /display and /control
    position: widget.position,
    size: widget.size,
    order: widget.order,
    props: {},
    isInteractive: false,
    visibleOnDisplay: true,
  }

  // Per-type projection rules
  switch (widget.settings.type) {
    case 'clock':
      displaySafe.props = { format: widget.settings.format, showSeconds: widget.settings.showSeconds, showDate: widget.settings.showDate }
      break
    case 'countdown-timer':
      displaySafe.props = { label: widget.settings.label, remainingMs: engineState.timer?.remainingMs }
      displaySafe.isInteractive = true
      break
    case '100-board':
      // Only send tile reveal state, not game configuration
      displaySafe.props = { tiles: engineState.hundredBoard?.tiles?.map(t => ({ id: t.id, value: t.value, revealed: t.revealed })) }
      displaySafe.isInteractive = true
      break
    // ... one case per WidgetType
  }

  return displaySafe
}

/** Wraps the per-widget filter for an entire scene. */
function toDisplaySafeScene(scene: Scene, engineState: EngineState): DisplaySafeScene {
  return {
    id: scene.id,
    title: scene.title,
    background: scene.background,
    // teacherNotes is stripped — never included
    // displaySettings may include studentMessage and showClock
    studentMessage: scene.displaySettings.studentMessage,
    showClock: scene.displaySettings.showClock,
    widgets: scene.widgets
      .filter(w => w.visible && (!w.teacherOnly || scene.studentSafe))
      .map(w => toDisplaySafeWidget(w, engineState)),
    // spotlight mode: if any widget is spotlighted, only render that one
    spotlitWidgetId: scene.widgets.find(w => w.spotlight)?.id ?? null,
  }
}
```

**Key invariant:** No teacher-only data ever crosses to /display. The `toDisplaySafeWidget` function is the single source of truth for projection. Every widget type's display-safe projection is defined in one place. No separate switch statements in `WidgetDisplayOverlay.tsx` (current) or parallel renderers.

**How this replaces the current approach:**
- `WidgetDisplayOverlay.tsx` switch statement → single `toDisplaySafeWidget()` call per widget
- `WidgetCanvasCard.tsx` switch statement → engine-native shape rendering (ShapeUtil or Konva component)
- `toDisplaySafeScreen()` in `displaySafe.ts` → extended with per-widget projection via the same protocol
- Each feature's ad-hoc "student display" component (e.g., `JobsManagerStudentDisplay`, `LottoBoardStudentDisplay`) → replaced by the widget's display-safe rendering within the canvas engine

---

## Student Display Projection Boundary

The Board > Scene > Widget model defines an explicit boundary between the authoring model and the student projection model. This boundary is engine-independent and is the mechanism that keeps /display safe, clean, and watermark-free.

### Authoring model (on /control)

- Board, Scene, Widget are the authoring model
- /control can render authoring widgets using the chosen engine (tldraw, React-Konva, or hand-rolled DOM)
- Teacher sees full widget state: settings, teacherOnly fields, inspector panels, selection handles, cameras, private notes

### Projection model (on /display)

- DisplaySafeScene / DisplaySafeWidget is the projection model
- /display renders only the student-safe projection through a lightweight renderer
- /display should not load the editor engine (tldraw Editor, Konva Stage, etc.)

### What never crosses the boundary

Teacher-only fields, editor-only state, selection handles, cameras, inspector state, private notes, and implementation artifacts never cross the projection boundary. The `toDisplaySafeScene()` and `toDisplaySafeWidget()` functions are the single source of truth for projection. Every widget type's display-safe rendering is defined in one place, not scattered across parallel switch statements.

### Engine independence

This boundary applies regardless of which engine powers /control. If tldraw is chosen, the projection boundary is also how we keep /display watermark-free — /display renders DisplaySafeWidget through a lightweight React/DOM renderer that never loads the tldraw Editor.

If a future decision explicitly chooses to power /display with the same engine (for example, to share a canvas renderer), that would be a new decision crossing this boundary. As of this amendment, the boundary stands.

---

## What Remains Outside the Canvas

These components stay in React/DOM and are never rendered on the canvas:

| Component | Location | Reason |
|-----------|----------|--------|
| Teacher Command Dock | Sidebar panels, tool launchers | UI chrome, not canvas content |
| App shell/routing | `TeacherControlShell`, `StudentDisplayShell` | Page-level layout, not canvas |
| Settings/preferences | AI provider, device roles, pacing | Configuration UI, not projected |
| Local storage scripts | `boardStorageHealth.ts`, backup export/import | Utility, not visual |
| Background game stores | `hundredBoardStore`, `lottoBoardStore`, `prizeBoardStore`, `pressYourLuckStore`, `jobsManagerStore`, `pickerStore`, `timerStore`, `atmosphereStore`, `randomNumberStore` | State management — widgets on the canvas read from these stores |
| Blank screen overlay | Full-screen overlay on /display | Overlay, not a canvas widget |
| Prize Board projector | Full-screen game mode on /display | Overrides canvas entirely |
| Random Number display | Full-screen result on /display | Overrides canvas entirely |
| Display launch controls | Presenter View, Send to Display, Blank/Restore | Toolbar, not canvas |

### How /control renders the teacher/editor view

```
/control
├── AppShell
│   ├── TeacherControlShell
│   │   ├── TeacherCommandDock (DOM sidebar)
│   │   │   ├── DockEdgeLauncher
│   │   │   ├── DockLauncherPanel
│   │   │   └── ToolPanels (not on canvas)
│   │   ├── BoardWorkspace
│   │   │   └── EngineProvider (tldraw Editor / Konva Stage / DOM canvas)
│   │   │       ├── SceneRenderer (activeSceneId)
│   │   │       │   ├── SceneBackground
│   │   │       │   └── Widget[] (editable, with selection/resize/drag)
│   │   │       └── DisplayStudioUIContext (overlay, not on canvas)
│   │   └── DisplayStudioOverlay (Inspector, Library, Templates — DOM)
│   └── (no display overlays on /control)
```

### How /display renders the student-safe projection

```
/display
├── AppShell
│   ├── StudentDisplayShell
│   │   ├── OverlayPrecedence (DOM overlays, evaluated in order)
│   │   │   ├── BlankOverlay (when displayBlanked)
│   │   │   ├── PrizeBoardProjector (when prize board is active)
│   │   │   ├── RandomNumberDisplay (when showing random result)
│   │   │   └── EngineProvider (read-only canvas projection)
│   │   │       └── SceneRenderer (displaySceneId)
│   │   │           ├── SceneBackground (student-safe)
│   │   │           ├── studentMessage (bottom)
│   │   │           ├── showClock (overlay)
│   │   │           └── Widget[] (read-only, display-safe projections only)
│   │   │               └── spotlitWidget (if spotlight active, only this)
│   │   ├── FullscreenButton (bottom-right, DOM)
│   │   └── DisplayIndicators (MusicDisplayIndicator, NowShowingLabel — DOM)
```

---

## How Current Widget Models Map to the Target Widget

### CanvasWidget → Widget

```typescript
// Current
interface CanvasWidget {
  id: string;          // → Widget.id
  type: CanvasWidgetType; // → Widget.type
  label: string;       // → Widget.settings (per-type label field)
  x: number;           // → Widget.position.x
  y: number;           // → Widget.position.y
  w: number;           // → Widget.size.w
  h: number;           // → Widget.size.h
  visible: boolean;    // → Widget.visible
  locked: boolean;     // → Widget.locked
  settings: Record<string, unknown>; // → Widget.settings (typed)
  zIndex: number;      // → Widget.order
  // Missing, added in target:
  // pinned, spotlight, focus, teacherOnly, displaySafe, createdAt, updatedAt, version
}
```

### PageWidget → Widget

```typescript
// Current
interface PageWidget {
  id: string;          // → Widget.id
  type: string;        // → Widget.type (narrowed to WidgetType)
  x: number;           // → Widget.position.x
  y: number;           // → Widget.position.y
  width: number;       // → Widget.size.w
  height: number;      // → Widget.size.h
  zIndex: number;      // → Widget.order
  locked: boolean;     // → Widget.locked
  visible: boolean;    // → Widget.visible
  snapRegion?: string; // → Widget metadata (layout hint)
  contentRef?: string; // → Widget settings (content reference)
  // Missing, added in target:
  // settings (typed), pinned, spotlight, focus, teacherOnly, displaySafe
}
```

---

## Migration Plan

The migration is staged across six phases (plus this amendment). Each phase is small, merges independently, and does not break existing functionality.

### Phase 15L.1A — Canvas Engine Display Boundary Amendment (this phase)

**Goal:** Documentation-only amendment clarifying that /display must remain engine-agnostic, correcting ratings, and reconciling the phase sequence.

**Deliverables:**
- Updated `canvas-engine-decision.md` with Display Boundary Decision section
- Updated `board-scene-widget-target-model.md` with Student Display Projection Boundary section and reconciled Migration Plan
- New `phase-15l-1a-display-boundary-amendment.md` status document

**No code changes.** Documentation only.

### Phase 15L.2 — Widget Overlap/Collision Safety + Duplicate Chrome Collapse

**Goal:** Fix widget overlap and collision issues found in the current-state review, and collapse duplicate chrome controls.

**Deliverables:**
- Widget overlap/collision safety audit and warnings on existing canvas
- Collapse duplicate chrome:
  - Send to Display: 3 instances → 1
  - Blank/Restore: 2 instances → 1
  - Presenter: 2 instances → 1
  - Clear Display: 2 instances → 1
  - Browse Templates: 2 instances → 1
- No model changes, no engine changes, no new dependencies

**Validation:** All existing tests pass. Visual QA on /control and /display.

### Phase 15L.3 — Status Widget Slot System

**Goal:** Shared docked-corner placement for always-on status widgets (clock, voice-level, mode badge, materials icon), replacing free positioning.

**Deliverables:**
- Define slot positions (corners, edges) for status widgets
- Migrate clock, voice-level, mode badge, materials icon to slot-based positioning
- Status widgets share consistent, predictable placement across all scenes
- No model changes beyond slot positioning

**Validation:** All existing tests pass. Visual QA on /control and /display.

### Phase 15L.4 — Template Completeness Audit

**Goal:** Audit and fix hollow templates and background images with text baked into the asset.

**Deliverables:**
- Identify and fill hollow templates (e.g., the empty "Review Game" entry)
- Replace background images with baked-in text with text-free backgrounds — text should be rendered as a directions-text widget, not embedded in the image asset
- Ensure every template has a complete, usable widget layout
- No engine changes, no new dependencies

**Validation:** All existing tests pass. Visual QA on all templates.

### Phase 15M — Canvas Engine Prototype/Spike

**Goal:** Build a small, isolated prototype of tldraw on /control only (dev-only route).

**Deliverables:**
- A separate dev-only route (`/canvas-spike`) with tldraw
- One Board with 2 Scenes ("Morning Arrival", "Silent Work")
- 3 widgets: clock, directions-text, countdown-timer
- Working: selection, drag, resize, pan, zoom, camera navigation between scenes
- Working: display-safe projection to /display (engine-agnostic, per Display Boundary Decision)
- Working: pin a widget to both scenes

**Constraints:**
- /control only — /display remains the engine-agnostic lightweight renderer
- Runs on sample data — no production state migration
- Does not modify existing routes, stores, or widget renderers
- Does not add tldraw to the main dependency tree (dev-only import or separate workspace)
- iPad and Mac Safari testing must pass

**Validation:** Manual testing on iPad + Mac. The spike does not add to the production test suite.

### Phase 15N — Production Migration

**Goal:** Migrate production state and renderers to the chosen engine. This phase is only executed after:
1. Canvas engine decision is finalized (Phase 15L.1)
2. Display boundary amendment applied (Phase 15L.1A)
3. Overlap/collision fixes and duplicate chrome collapse (Phase 15L.2)
4. Status widget slot system (Phase 15L.3)
5. Template completeness audit (Phase 15L.4)
6. Spike validates the engine on iPad/Mac (Phase 15M)

**Deliverables (in order):**
1. Add the engine dependency (tldraw or react-konva)
2. Define `Board`, `Scene`, `Widget` types in `src/data/types.ts`
3. Create `toDisplaySafeWidget()` protocol
4. Add data migration: `CanvasWidget` → `Widget`, `DisplayScreen` → `Scene`, `DisplayComposerPersistedState` → `Board`
5. Add data migration: `PageWidget` → `Widget`, `VibePage` → `Scene`, `ClassWorkspace` → `Board`, `ScreenId` → `Board.id`
6. Create engine-specific shape renderers (ShapeUtil for tldraw, Konva components for Konva)
7. Replace `WidgetCanvasCard.tsx` and `WidgetDisplayOverlay.tsx` switch statements with engine rendering
8. Remove duplicate `CanvasWidget` and `PageWidget` types
9. Update tests to cover new model and migration
10. Remove `displayComposerStore` and `boardStore` legacy fields (in favor of new `boardStoreV2`)

**Validation:** All existing 1,028+ assertions must either pass (unchanged suites) or be replaced with equivalent tests for the new model. New migration tests must cover round-trip: old state → new model → display-safe projection.

---

## Test Preservation

**During all phases 15L.1 through 15L.4:** No test is modified. All 11 test suites continue to pass. These are documentation-only and safety-fix phases.

**During Phase 15M:** The spike has its own tests. Existing tests are unaffected.

**During Phase 15N:**
- Tests for `WidgetCanvasCard.tsx` and `WidgetDisplayOverlay.tsx` are replaced by equivalent tests for engine-specific shape renderers
- Existing game feature tests (hundred-board: 387, lotto-board: 166, prize-board: 238, jobs-manager: 82, student-picker: 36, etc.) continue to pass — their stores are unchanged, only the display rendering changes
- Migration tests: old `CanvasWidget`/`PageWidget` → new `Widget` round-trip validation
- Display-safe protocol tests: verify `toDisplaySafeWidget()` strips all teacher-only fields for every widget type
- Test coverage minimum: maintain ~1,000+ assertions
