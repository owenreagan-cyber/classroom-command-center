# Current State Review

**Generated:** 2026-08-08
**Branch:** `current-state-design-review-package`
**Base commit:** `3514700` — "Add local-first Jobs Manager core"
**Review scope:** Full application architecture, routing, widget inventory, chrome/UI, gaps, and test status
**Application code changes:** None (documentation/screenshots only)

---

## 1. ARCHITECTURE SNAPSHOT

### Repo structure

Key folders and files:

- `src/App.tsx` — Top-level route dispatch
- `src/app/AppShell.tsx` — Maps route to TeacherControlShell or StudentDisplayShell
- `src/app/appRoute.ts` — Route type, path constants, `getAppRoute()`
- `src/app/useAppRoute.ts` — `useSyncExternalStore` hook with popstate events
- `src/app/RootRedirect.tsx` — Redirects `/` → `/control`
- `src/app/TeacherControlShell.tsx` — Full control route shell (dock + board + studio)
- `src/app/StudentDisplayShell.tsx` — Student/projector view with overlay precedence
- `src/app/BoardWorkspace.tsx` — Shared board rendering on both routes
- `src/data/types.ts` — `ScreenId` (16 screens), `BoardState`, `BoardPreset`
- `src/data/defaults.ts` — `SCREEN_META`, `DEFAULT_CONTENTS`, visibility configs
- `src/data/pageSequences.ts` — Vibe page sequences per screen
- `src/data/boardPresets.ts` — 8 board presets
- `src/data/routineSchedule.ts` — Daily block schedule, routine schedules
- `src/store/boardStore.ts` — Core board state (Zustand, key: `classroom-command-center-lite`)
- `src/store/timerStore.ts` — Timer engine (Zustand, key: `classroom-command-center-timers`)
- `src/features/display-composer/` — Display screen builder (types, store, renderers)
- `src/features/display-studio/` — Display Studio editor overlay (widgets, registry, renderers, themes)
- `src/features/teacher-dock/` — Teacher Command Dock (tools, registry, store)
- `src/features/hundred-board/` — Standalone 100 Board game
- `src/features/lotto-board/` — Bingo-style 1-100 draw
- `src/features/jobs-manager/` — Classroom jobs & cycles
- `src/features/prize-board/` — Prize Board & Press Your Luck
- `src/features/student-picker/` — Mystery Star, random picker
- `src/features/classroom-atmosphere/` — Music/soundscape
- `src/features/random-number/` — Random number generator
- `src/features/noise-control/` — Voice level management
- `src/features/workspace/` — Teaching workspace configurations
- `src/features/curriculum/` — Curriculum pacing
- `src/features/curriculum-library/` — Content library (imported)
- `src/features/curriculum-library-fetcher/` — Library index/scanner
- `src/features/curriculum-readiness/` — Lesson readiness checks
- `src/features/device-manager/` — Device role management
- `src/features/omninote-bridge/` — OmniNote integration bridge
- `src/features/studio-canvas/` — Canvas foundation (Board > Workspace > Page model)
- `src/lib/display-studio-tests.ts` — Studio tests (63 assertions)
- `src/lib/display-polish-tests.ts` — Polish tests (15 assertions)
- `src/lib/studio-canvas-tests.ts` — Canvas tests (93 assertions)
- `src/lib/boardStorageHealth.ts` — Storage diagnostics
- `src/board/DailyBriefPanel.tsx` — Daily brief editor (used by old Jobs proxy)
- `docs/status/` — Phase reports (15C-K)
- `docs/review/` — This review package
- `docs/future-modules/` — Parking lot docs

### Scene and widget instance types

#### CanvasWidget — the core widget instance type

```68:114:/Users/owen/Projects/classroom-command-center/src/features/display-composer/types.ts
export type CanvasWidgetType =
  | 'clock'
  | 'countdown-timer'
  | 'routine-timer'
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

// ... (WidgetSizePreset)

export interface CanvasWidget {
  id: string
  type: CanvasWidgetType
  label: string
  x: number        // percentage-based (0-100)
  y: number
  w: number
  h: number
  visible: boolean
  locked: boolean
  settings: Record<string, unknown>
  zIndex: number
}
```

**Observations:** The `CanvasWidget` interface has `visible` and `locked` booleans plus `zIndex` — these map to basic show/hide, lock/unlock, and layer semantics. There is **no** `pin`, `spotlight`, or `focus` property.

#### DisplayScreen — a scene containing widgets

```116:146:/Users/owen/Projects/classroom-command-center/src/features/display-composer/types.ts
export interface DisplayScreen {
  id: string
  title: string
  mode: DisplayScreenMode
  background: DisplayScreenBackground
  showClock: boolean
  timerWidget: DisplayTimerWidgetConfig
  materialsCard?: MaterialsCard
  checklistCard?: ChecklistCard
  studentMessage?: string
  widgets?: CanvasWidget[]
  teacherNotes?: string       // Teacher-only, never on /display
  studentSafe: boolean        // Kill-switch
  updatedAt: number
  version: number
}
```

**Observations:** `DisplayScreen` is the closest thing to a "Scene" in the Display Composer. It contains an array of `CanvasWidget`. Classroom screens (homeroom, math) are a **separate** model — they are `ScreenId` entries in `BoardState`, not `DisplayScreen` objects.

#### BoardState — the legacy classroom screen model

```454:467:/Users/owen/Projects/classroom-command-center/src/data/types.ts
export interface BoardState {
  mode: AppMode
  activeScreen: ScreenId
  activePageId: VibePageId | null
  classWorkspaces: Record<ScreenId, ClassWorkspace | undefined>
  backgroundId: BackgroundAssetId
  contents: ScreenContents
  teacherNotes: TeacherNote[]
  todayPrep: TodayPrepState
  morningMessage: MorningMessageState
  cardVisibility: ScreenCardVisibility
  customPresets: CustomBoardPreset[]
  noiseTrackers: Record<NoiseTrackerId, NoiseTrackerState>
}
```

**Three parallel board/scene systems coexist** with no shared abstraction:

| System | Type | Container | Widgets |
|--------|------|-----------|---------|
| Display Composer | `DisplayScreen` | `Record<string, DisplayScreen>` in `displayComposerStore` | `CanvasWidget[]` |
| Classroom Screens | `ScreenId` (16 literals) | `BoardState` in `boardStore` | `PageWidget[]` |
| Studio Canvas | `VibePage` / `ClassWorkspace` | `classWorkspaces` on `BoardState` | `PageWidget[]` per page |

### Routing table

The app has **2 real URL routes + a root catch-all**. All 16 classroom screens are **state selections**, not routes.

| route | renders/component | mode | notes |
|-------|-------------------|------|-------|
| `/` | `RootRedirect` | redirect | Immediately `history.replaceState` to `/control` |
| `/control` | `TeacherControlShell` | teacher/control | Full teacher workspace: dock + board + Display Studio |
| `/display` | `StudentDisplayShell` | student/projector | Student-safe view with overlay precedence (blank > prize board > random number > display composer > normal board) |

**Routing mechanism:** Custom pathname-based routing via `useSyncExternalStore` listening to `popstate` events. No React Router dependency.

**Classroom screens** (state-selected within `/control` and `/display`, NOT URL routes):

| screen ID | content type | page count |
|-----------|-------------|------------|
| `homeroom` | HomeroomContent | 5 vibe pages |
| `math` | MathContent | 6 vibe pages |
| `reading` | ReadingContent | 6 vibe pages |
| `writing` | SubjectContent (Shurley) | 4 pages |
| `science` | SubjectContent | 4 pages |
| `social-studies` | SubjectContent | 1 page |
| `assessment` | SubjectContent | 1 page |
| `centers` (Group Work) | SubjectContent | 1 page |
| `snack` | SnackContent | 2 pages |
| `lunch` | LunchContent | 4 pages |
| `recess` | ReadyPositionContent | 1 page |
| `movement` | ReadyPositionContent | 1 page |
| `ready-position` | ReadyPositionContent | 1 page |
| `homework` | HomeworkContent | 3 pages |
| `pack-up` | PackUpContent | 3 pages |
| `spelling` | SubjectContent | 3 pages |

Selected via `useBoardStore.setActiveScreen(screenId)`. Persisted to localStorage. Both `/control` and `/display` share the same `activeScreen` but render with different chrome.

### State management

**Total Zustand stores found: 19.** All use `persist` middleware with localStorage.

| state/store | file path | runtime state | persistence | reload behavior | notes |
|------------|-----------|--------------|-------------|-----------------|-------|
| Board State | `src/store/boardStore.ts` | activeScreen, activePageId, classWorkspaces, contents, teacherNotes, noiseTrackers, cardVisibility | `classroom-command-center-lite` v11 | All major state persisted; undo/history session-only | Legacy board. Has own PageWidget system |
| Timer Store | `src/store/timerStore.ts` | 5 timer types | `classroom-command-center-timers` v2 | Custom merge: recovers wall-clock states | Separate from display composer timer configs |
| Display Composer | `src/features/display-composer/displayComposerStore.ts` | screens, order, activeScreenId, displayBlanked | `classroom-command-center-display-composer` v1 | Cross-tab sync via `window storage` | Primary Display Studio data source |
| AI Provider Settings | `src/features/display-composer/aiProviderSettingsStore.ts` | settings, draftCounter | `classroom-command-center-ai-provider-settings` v1 | Full persist | No secrets |
| Device Manager | `src/features/device-manager/deviceStore.ts` | preferredDeviceRoles, deviceOverrides | `classroom-device-manager-v1` | Full persist | |
| Curriculum Pacing | `src/features/curriculum/pacingStore.ts` | lessonOverrides | `classroom-curriculum-pacing-v1` | Full persist | |
| Library Store | `src/features/curriculum-library/libraryStore.ts` | packages, lastImportedAt | `classroom-curriculum-library-v1` | Full persist | **COLLISION** with LibraryIndexStore |
| Library Index | `src/features/curriculum-library-fetcher/libraryIndexStore.ts` | packages, lastScannedAt, syncStatus | `classroom-curriculum-library-v1` | Full persist | **COLLISION** with LibraryStore |
| Readiness | `src/features/curriculum-readiness/readinessStore.ts` | teacherOverrides | `classroom-curriculum-readiness-v1` | Full persist | |
| Lotto Board | `src/features/lotto-board/lottoBoardStore.ts` | availableNumbers, pendingNumbers, drawHistory | `classroom-lotto-board-v1` | Full persist | |
| Hundred Board | `src/features/hundred-board/hundredBoardStore.ts` | 100 tiles, outcomes, revealState | `classroom-hundred-board-v1` | Full persist | |
| Workspace | `src/features/workspace/workspaceStore.ts` | activeWorkspaceId, favoriteWorkspaceId | `classroom-workspace-v1` | Full persist | |
| Dock | `src/features/teacher-dock/dockStore.ts` | collapsed, favoriteToolIds, dockOrder, activeToolId | `teacher-command-dock-v1` | Full persist | |
| Random Number | `src/features/random-number/randomNumberStore.ts` | min, max, preventRepeat, history, lastResult | `classroom-random-number-v1` | Full persist | Has own display-to-student toggle |
| Atmosphere | `src/features/classroom-atmosphere/atmosphereStore.ts` | activeMode, playlistId, volume, showOnDisplay | `classroom-atmosphere-v1` | `isPlaying` resets to false on reload | Music stops on reload |
| Student Picker | `src/features/student-picker/pickerStore.ts` | students, fairnessHistory, activeMysterySessions, coachingConfig | `classroom-picker-storage-v3` | Custom migrate for legacy formats | Mystery sessions, fairness, 36 tests |
| Press Your Luck | `src/features/prize-board/pressYourLuck/pressYourLuckStore.ts` | phase, remainingSpins, outcome, revealExperience | `classroom-press-your-luck-v1` | Cross-tab sync; spin recovery | Complex state machine |
| Prize Board | `src/features/prize-board/prizeBoardStore.ts` | prizeBank, prizeOverrides, boards | `classroom-prize-board-storage-v1` | Full persist | |
| Jobs Manager | `src/features/jobs-manager/jobsManagerStore.ts` | jobs, activeCycle, archivedCycles, studentHistory | `classroom-jobs-manager-v1` | Full persist | Phase 15K |

**React Contexts (ephemeral, not persisted):**

| Context | File | Provides |
|---------|------|----------|
| `TeacherDockContext` | `src/features/teacher-dock/TeacherDockContext.tsx` | Bridges board state to dock tool panels |
| `DisplayStudioUIContext` | `src/features/display-studio/displayStudioUIContext.ts` | UI state: isOpen, selectedScreenId, selectedWidgetId, library/picker/quick-start/presenter visibility |

**Architectural note:** 19 independent stores with no shared board/scene abstraction. Display Composer screens (DisplayScreen + CanvasWidget) and classroom screens (ScreenId + BoardState + PageWidget) are completely separate data models.

**Known localStorage key collision:** `useLibraryStore` and `useLibraryIndexStore` both use `classroom-curriculum-library-v1`.

---

## 2. WIDGET INVENTORY

| widget name | file path(s) | shared contract? | status | notes |
|------------|-------------|-----------------|--------|-------|
| Clock | studioWidgets, widgetLibrary | no (`canvasType: null`) | shipped | Screen toggle, not canvas widget |
| Countdown Timer | widgetRegistry, CanvasCard, DisplayOverlay | partial | shipped | Canvas card shows timerKind; display shows static "⏱ Timer" |
| Routine Timer | same | partial | shipped | Static display renderer |
| Stopwatch | studioWidgets | no | planned | Placeholder |
| Directions / Text | widgetRegistry, CanvasCard, DisplayOverlay | yes | shipped | Full CanvasWidget contract + settings.text |
| Materials | same | partial | stubbed | Static "📋 Materials" |
| Checklist | same | partial | stubbed | Static "✅ Checklist" |
| Work Symbols | same | partial | shipped | Has settings.symbol → renders corresponding label |
| Noise Level | same | partial | shipped | Settings.level + color dot on /display |
| Atmosphere / Music | same | partial | stubbed | Static label |
| QR Code | studioWidgets | no | planned | Placeholder |
| Random Picker | CanvasCard, DisplayOverlay | partial | stubbed | Static label |
| Mystery Student | same + EngagementRenderers | partial | shipped | Session status on teacher; "Mystery Star is watching" on display |
| 100 Board | same + HundredBoardDisplayWidget | partial | shipped | Interactive select/reveal; 10x10 grid on display |
| Dice / Spinner | studioWidgets | no | planned | Placeholder |
| Poll | studioWidgets | no | planned | Placeholder |
| Prize Board | CanvasCard, DisplayOverlay | partial | shipped | Static "🎁 Prize Board" on display |
| Press Your Luck | same | partial | shipped | Static "🎰 Press Your Luck" on display |
| Scoreboard | studioWidgets | no | planned | Placeholder |
| Lotto Board | CanvasCard, DisplayOverlay + LottoBoardStudentDisplay | partial | shipped | Interactive draw/confirm; lotto balls on display |
| Jobs Manager | same + JobsManagerStudentDisplay | partial | shipped | Cycles, smart assign; job cards on display |
| Image | widgetRegistry | no | planned | Placeholder |
| PDF / Embed | widgetRegistry | no | planned | Placeholder |

**Shared contract assessment:**

- **position/size/z-index:** ✅ All CanvasWidget types
- **pin:** ❌ No pinned field
- **lock:** ✅ locked boolean
- **visibility:** ✅ visible boolean
- **spotlight:** ❌ No focus/solo mode
- **settings:** ⚠️ `Record<string, unknown>` — untyped, ad-hoc casts
- **display-safe:** ⚠️ Each widget type has manual case in WidgetDisplayOverlay, no shared protocol
- **teacher/student renderers:** ⚠️ Separate switch statements in two files

**Gap summary:** CanvasWidget provides consistent visual properties (position, size, z-index, visible, locked). But the widget content contract is fragmented — each type has hardcoded renderers in separate switch statements with no shared protocol, no typed settings, and no shared display-safe projection interface.

---

## 3. TOOLBAR / MENU / CHROME

### Control Dock / Teacher Dashboard

**Dock Edge Launcher (leftmost icon rail):**
- Expand/Collapse button (`»`/`«`) — 22rem / 42rem toggle
- Up to 6 edge tool icons (lesson-aware promoted or favorites, icon-only)
- Active tool label below icon row

**Dock Launcher Panel (middle, hidden when collapsed):**
- Workspace selector dropdown (Morning/Math/Reading/Shurley/Reward/Transition)
- 18 tool cards across 4 categories:
  - Daily: Dashboard, Timers, Classroom Atmosphere, Morning Message, Today Prep, Curriculum Sync, Display Screens
  - Students: Mystery Star, Quick Picker, Prize Board, Random Number, Lotto Board
  - Instruction: Materials, Display, OmniNote
  - Management: Jobs, Noise Control, Board Control

**Board Sidebar Panels (teacher-only):**
- TeacherDashboardPanel — schedule snapshot, quick actions (Start Timer, OmniNote, Mystery Star, Prize Board, Materials, Morning Message)
- BoardPresetPanel — 8 presets + custom preset save/apply/delete
- BoardBackupPanel — export/import JSON
- DisplayLaunchPanel — "Open Student Display", "Open Display for Fullscreen", "Copy Display Link"
- NoiseControlPanel — per-tracker voice level buttons
- CardVisibilityPanel — show/hide optional toggles
- DailyBriefPanel — template, title, voice expectations, instruction textarea
- TeacherNotesPanel — read-only per-screen notes
- TodayPrepPanel — readiness checklist, material launcher

### Display Studio / Editor

**Shell:** Fixed full-screen overlay (z-50), three-column, closeable via Escape.

**Thumbnail Rail (left, 208px):**
- Screens heading + close button
- Pack filter dropdown
- Screen thumbnails with Live badge
- "+ New Screen" and "📁 Browse Templates" buttons

**Command Bar (top):**
- "Display Studio" title + status pill
- 📁 Templates, ⚡ Quick Start, Send to Display, Clear, Blank/Restore, Presenter, Close

**Duplicate controls identified:**
- Send to Display: Command Bar + Inspector + Presenter View (3 places)
- Blank/Restore: Command Bar + Quick Start (2 places)
- Presenter: Command Bar + Inspector (2 places)
- Clear Display: Command Bar + Inspector (2 places)
- Browse Templates: Thumbnail Rail + Command Bar (2 places)

**Canvas Area (center):**
- 16:9 background renderer with draggable/resizable widgets
- "Add widgets from the library" placeholder when empty

**Quick Start Panel:** 14 flow buttons (Start the Day through Restore Display)

**Inspector Panel (right):** 6 collapsible sections — Screen, Content, Widgets, Style (with theme picker for 10 themes), Teacher Notes, Display

**Widget Library:** 5 category tabs, 22 widget buttons, quick templates

**Template Picker:** 4 category tabs, 28 template cards with preview + "Use Template"

**Presenter View (z-60):**
- Prev/Next navigation, large 16:9 preview
- Send to Display, "Next to Display →"
- Blank Screen / Restore Display toggle
- Active Tools status row (music, timer, PYL, Mystery Star)
- Next Screen mini-preview, Student Message, Teacher Notes
- Quick Jump thumbnail chips

### /display

**Overlay precedence chain:** Blank > Prize Board > Random Number > Display Composer > Normal Board

- Blank overlay: full-screen black with "Screen Paused"
- Normal board: background + title + content cards
- Display Composer overlay: teacher-composed screen with background + message + widgets
- Prize Board projector mode: full-screen game
- Random Number display: full-screen result
- Fullscreen button (bottom-right, hidden during Prize Board)
- MusicDisplayIndicator + NowShowingDisplayLabel
- MysteryStudentActiveBadge
- Teacher-only elements (Edit, CoachingCard, MysteryRevealStage) hidden via `studentDisplay` prop

---

## 4. GAP REPORT

### Board model gaps

**Is there a true Board abstraction?** No. The closest is `BoardState` — a monolithic bag with 16 screen IDs, vibes, contents, teacher notes, noise trackers, and legacy card visibility.

**Are scenes grouped into boards?** No. Display Composer screens are a flat `Record<string, DisplayScreen>`. Classroom screens are 16 literal strings. Studio Canvas pages exist under `ClassWorkspace` per `ScreenId`.

**Are classroom screens boards/scenes/routes/state?** State selections, not objects. They are `ScreenId` values indexing `BoardState`.

**Are display screens isolated from teacher control state?** Partially. `displayComposerStore` has separate `activeScreenId` + `displayBlanked`. But classroom screens share `activeScreen` between /control and /display.

### Scene model gaps

**Are scenes first-class objects?** Display Composer: yes (DisplayScreen). Classroom: no (string literal). Studio Canvas: yes but different type (VibePage).

**Are they persisted?** Yes, but to different storage keys with different structures.

**Are templates scenes or hardcoded?** Both. 28 hardcoded Display Composer templates copied to state. Classroom screens have hardcoded content defaults per ScreenId.

**Can scenes be duplicated/ordered/recovered?** Display Composer: yes. Classroom: no (fixed set). Studio Canvas: no (no user-visible reorder).

**Are routes and scenes conflated?** Classroom screens use state selection, not routing. Appropriate but not obvious from a Board > Scene > Widget perspective.

### Widget contract gaps

| Property | Status |
|----------|--------|
| position/size/z-index | ✅ |
| visible/locked | ✅ |
| pin | ❌ Not supported |
| spotlight/focus | ❌ Not supported |
| settings/config | ⚠️ `Record<string, unknown>` — untyped |
| display-safe projection | ⚠️ Ad-hoc per widget, no shared protocol |
| teacher/student renderer | ⚠️ Separate switch statements |
| resize/drag | ✅ |
| selection/layering | ✅ |

### Shortcuts and hardcoded values

- 16-literal `ScreenId` union — adding a classroom screen changes type, defaults, metadata, page sequences, background library, board presets
- 16-literal `CanvasWidgetType` union + 22-entry `STUDIO_WIDGETS` array (6 placeholders)
- 18-tool `TEACHER_TOOL_REGISTRY` const array
- 28 hardcoded template cards in 4 categories
- 14 hardcoded Quick Start flow buttons
- Hardcoded daily schedule blocks in `routineSchedule.ts`
- Hardcoded `/control` and `/display` path strings in `appRoute.ts`
- WidgetCanvasCard.tsx and WidgetDisplayOverlay.tsx each have ~15-case manual switch statements
- Each tool (100 Board, Lotto Board, Jobs Manager) has its own Zustand store — widget renderers bridge across stores manually
- No shared `toDisplaySafe()` protocol — each feature exports its own function
- DailyBriefPanel uses raw `localStorage.setItem/getItem` outside Zustand
- Two completely separate widget models: CanvasWidget vs PageWidget

### Rework needed: Board > Scene > Widget

1. **Unify widget model** — One shared Widget interface for Display Composer and Studio Canvas
2. **Create Board abstraction** — Board groups Scene objects; classroom screens become scenes
3. **Add pin** — pinned boolean for cross-scene persistence
4. **Add spotlight** — solo full-canvas render for a single widget
5. **Type widget settings** — Replace `Record<string, unknown>` with discriminated per-type settings
6. **Shared display-safe protocol** — Single `toDisplaySafeWidget()` instead of 15 manual cases
7. **Unify renderers** — One dispatch component, not two separate switch statements
8. **Unify persistence** — Single board/scene state root, not 19 stores
9. **Remove duplicate controls** — Collapse 3× Send to Display, 2× Blank/Restore, 2× Presenter
10. **Discriminate content types** — Classroom screens and display screens should be the same Scene type

---

## 5. TEST/CI STATUS

### Results (run 2026-08-08)

| check/script | command | result | notes |
|-------------|---------|--------|-------|
| Jobs Manager | `npm run test:jobs-manager` | **PASS** | 82 assertions, 0 failures |
| Hundred Board | `npm run test:hundred-board` | **PASS** | 387 assertions, 0 failures |
| Lotto Board | `npm run test:lotto-board` | **PASS** | 166 assertions, 0 failures |
| Prize Board | `npm run test:prize-board` | **PASS** | 238 assertions, 0 failures |
| Display Studio | `npm run test:display-studio` | **PASS** | 63 assertions, 0 failures |
| Display Composer | `npm run test:display-composer` | **PASS** | All composer/pack/template/readability + AI safety tests pass |
| Display Launch | `npm run test:display-launch` | **PASS** | 12 assertions, 0 failures |
| Display Polish | `npm run test:display-polish` | **PASS** | 15 assertions, 0 failures |
| Student Picker | `npm run test:student-picker` | **PASS** | 36 assertions, 0 failures |
| Teacher Dock | `npm run test:teacher-dock` | **PASS** | All dock tests pass |
| Random Number | `npm run test:random-number` | **PASS** | 29 assertions, 0 failures |
| Build | `npm run build` | **PASS** | tsc + vite build clean |
| Lint | `npm run lint` | **PASS** | 0 errors, 0 warnings |
| Smoke:classroom | Not in package.json | **N/A** | No smoke script |
| Playwright/E2E | Teacher Workstation E2E | **WARN** | Playwright SEGV_MAPERR (pre-existing, Phase 15H–K) |

**Total unit test coverage:** ~1,028 assertions across 11 test suites, all passing.

**Known issues:**
- Playwright chromium SEGV_MAPERR — sandboxed macOS environment limitation
- localStorage key collision: `classroom-curriculum-library-v1` used by two stores
- No integration/end-to-end tests pass in sandbox

---

## 6. SCREENSHOT STATUS

**Attempted:** Playwright chromium launch (SEGV_MAPERR), with --no-sandbox (same), macOS screencapture (sandbox blocked).

**Routes confirmed reachable:** /control (200), /display (200), / (200 → redirect to /control). All classroom screens are state-selected (not URL routes).

**Coverage: 0/38** — 2 viewports × 19 screens planned, 0 captured.

**Status:** WARN — Playwright chromium headless shell SEGV_MAPERR is a known pre-existing environment limitation (documented across Phase 15H–K). The dev server serves all routes correctly (curl-confirmed).

---

## 7. SUMMARY

**What works:**
- 2 real routes with teacher/student gating
- 16 classroom screens (state-selected) with content cards
- Display Studio with canvas editor, widget library, template picker, quick start, presenter view
- 17 connected widgets (6 are stubs/placeholders)
- Teacher Dock with 18 tool panels
- 9 board sidebar panels
- 19 Zustand stores with localStorage persist
- ~200+ interactive controls
- 1,028 passing unit test assertions

**What needs work:**
- No Board abstraction — 3 parallel systems with no shared interface
- No Scene abstraction — classroom screens and display screens are different types
- No pin/spotlight on widgets
- Untyped widget settings (`Record<string, unknown>`)
- No shared display-safe projection protocol
- 3× Send to Display, 2× Blank/Restore, 2× Presenter (duplicate controls)
- Widget renderers are manual switch statements
- Display Composer and Studio Canvas use completely different widget models
- localStorage key collision between library stores
- No E2E/integration tests pass in sandbox
- 6 stubbed widgets show static placeholder content
