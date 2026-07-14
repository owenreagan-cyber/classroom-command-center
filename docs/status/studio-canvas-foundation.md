# Studio Canvas Foundation

Status: implemented and validated (adversarial audit pass completed)
Date: 2026-07-13
Branch: `studio-canvas-foundation`

## Summary

Studio Mode (`AppMode: 'edit'`) now renders a dedicated Studio Canvas — a
bounded, projector-safe 16:9 authoring surface with draggable page
widgets, snap-to-grid, alignment guides, lock/unlock, keyboard movement,
undo/redo, and reset-to-default — in place of the old per-screen dashboard
editors (`HomeroomScreen`, `MathScreen`, `SubjectScreen`, etc.). Classroom
Mode (`AppMode: 'display'`) renders the same persisted widget geometry
read-only, with no editor chrome.

The `PageWidget` data model already existed (`src/data/types.ts`); this
phase gives it real, deterministic, seeded geometry and a full authoring +
presentation pipeline instead of the `x:0,y:0,width:1,height:1` placeholder.

## Logical coordinate system (`src/lib/studioCanvasGeometry.ts`)

- Logical canvas: **1600 × 900** (16:9), independent of rendered pixels.
- Safe margin: **48** logical units (used by seeded/reset layouts).
- Grid size: **16** logical units.
- Minimum widget size: **160 × 90** logical units.
- Pure helpers: `pixelToLogical` / `logicalToPixel` / `rectToPercent`,
  `snapValue`, `clampToCanvas`, `clampToSafeArea`, `enforceMinSize`,
  `normalizeRect`, `keyboardMoveDelta`, `detectAlignmentGuides`,
  `measureOverlapArea`, `isInvalidGeometry`.
- All widget geometry is stored and persisted in **logical units only**.
  Studio Canvas and Classroom Mode both position widgets with CSS
  percentages derived from `rectToPercent` (`left/top/width/height` as %
  of 1600×900), so resizing the browser or rendering at a different
  viewport never mutates stored geometry — it only changes the pixel
  mapping. Verified at 1920×1080, 1440×900, and 1024×768.
- Drag math converts pointer pixel deltas into logical deltas using the
  Studio Canvas box's live `getBoundingClientRect()` — width/height
  divided into `CANVAS_WIDTH`/`CANVAS_HEIGHT` ratios — so it stays correct
  regardless of zoom or window size.

## Seeded layouts (`src/lib/studioLayoutSeeds.ts`)

Every `layoutPreset` has a deterministic region algorithm (1 or 2 widget
regions, since no page currently declares more than two widget types):

| Preset | Regions |
|---|---|
| `centered-message` | one centered region, or a primary block + a secondary block beneath it |
| `message-plus-timer` / `message-plus-materials` | left ~58% / right ~40%, split by a gutter |
| `split-content` | two equal side-by-side halves |
| `full-focus` | one large centered region, or a large primary + a thin secondary strip |
| `cleanup-checklist` | a headline block above a larger checklist block |

Pages that declare no content `widgetTypes` (e.g. `lunch-silent-chew`,
`snack-quiet-snack`, `pack-up-dismissal`, `reading-random-reader`) are
seeded with a single synthetic `message` widget carrying the page's
`primaryMessage` / `subtitle` / `supportingContent`, so every page has
real, non-placeholder geometry. `src/data/pageSequences.ts` calls
`seedWidgetsForPage()` for every page at build time — there is no more
`x:0,y:0,width:1,height:1` anywhere in the seeded data.

## Widget content mapping (`src/features/studio-canvas/`)

`WidgetContentBody.tsx` maps `(screenId, widget.type)` to the existing
content-editing card components — `DoNowCard`, `MaterialsCard`,
`ReminderCard`, `ReadyPositionCard`, `LessonCard`, `VocabularyCard`,
`SmartTextCard`, `TimerWidget` — via `widgetContentAdapter.ts`. These
cards already branch on `mode` internally (inline `EditableText` /
`EditableList` in `'edit'`, clean read-only markup in `'display'`), so the
**same component renders both Studio Canvas and Classroom Mode** — no
duplicate content-rendering logic was written.

Supported types: `focus`, `timer`, `materials`, `ready`, `do-now`,
`reminders`, `lesson`, `lesson-card`, `vocabulary-card`, `compact-cue`,
plus the synthetic `message` type described above.

## Studio Canvas UI

- `StudioCanvas.tsx` — bounded 16:9 canvas (letterboxed via CSS container
  query units so it's correctly capped by *both* available width and
  height inside its flex ancestor — a `max-width: calc(100% * 16/9)`-style
  expression cannot do this, since percentage `max-width` always resolves
  against the container's *width*, not height), pointer drag handling,
  selection, keyboard handling, alignment-guide computation.
- `StudioToolbar.tsx` — Undo, Redo, Snap On/Off, Reset Page Layout,
  Lock/Unlock selected widget, Preview Classroom Mode. All buttons have
  accessible `aria-label`s.
- `StudioWidgetFrame.tsx` — per-widget frame with a drag-handle header
  (shows the widget type + a lock badge), selection outline, and the
  content body.
- `StudioInspector.tsx` — compact read-only panel (x/y/width/height/layer/
  lock state of the selected widget); collapses below `lg` breakpoint.
- `AlignmentGuides.tsx` — renders only while dragging.
- `ClassroomCanvas.tsx` — read-only widget render for `display` mode; no
  grid, drag handles, selection, guides, toolbar, inspector, or page nav
  inside the canvas.

### Dragging

Pointer Events (`onPointerDown`/`onPointerMove`/`onPointerUp` +
`setPointerCapture`), verified with real mouse-drag interaction via
Playwright. A transient `dragState` (component-local `useState`, never
persisted) tracks the live preview; **one store commit happens on pointer
up**, not on every `pointermove`. Locked widgets ignore the drag handle
entirely (`pointerdown` on a locked handle just re-selects, never starts a
drag). `touch-action: none` and `user-select: none` are applied to the
canvas while a drag is active to stop scrolling/text-selection.

### Snap-to-grid

Enabled by default (`studioSnapEnabled`, session-only, not persisted —
"session-local is acceptable for this phase" per spec). Holding **Alt**
while dragging temporarily bypasses snap. Grid overlay renders only in
Studio Canvas, never in Classroom Mode. Snapping uses `Math.round` against
a fixed grid, so there is no cumulative rounding drift.

### Alignment guides

Detected against the canvas center and every other widget's edges/centers
on the same page, within a 6-logical-unit tolerance, purely from
`detectAlignmentGuides()`. Guides are drawn only while `dragState` is
non-null and are never part of persisted state.

### Lock / unlock

`setPageWidgetLocked` store action. Locked widgets stay fully visible in
both modes; they just can't be dragged or keyboard-moved. Creates one
undo-history entry.

### Selection

Session-only `useState` inside `StudioCanvas`. The parent mounts
`<StudioCanvas key={`${screenId}-${page.id}`} .../>`, so switching page or
class remounts the component and resets selection/drag state for free —
no `setState`-in-`useEffect` needed (avoids the
`react-hooks/set-state-in-effect` lint rule entirely).

### Keyboard accessibility

For a selected, unlocked widget: Arrow = 1 logical unit, Shift+Arrow = one
grid step (16), Escape clears selection. Delete/Backspace are
intentionally not wired to anything (no deletion in this phase). Key
handling explicitly ignores `INPUT`/`TEXTAREA`/`contentEditable` targets
so it never interferes with inline text editing.

## Store actions (`src/store/boardStore.ts` + `src/lib/studioCanvasActions.ts`)

All geometry/lock/reset/undo/redo logic lives in **pure functions**
(`src/lib/studioCanvasActions.ts`) operating on plain `ClassWorkspace`
records — no Zustand dependency — so the whole action surface is unit
tested without a DOM or a store. `boardStore.ts` action methods
(`updatePageWidgetGeometry`, `movePageWidget`, `setPageWidgetLocked`,
`resetActivePageLayout`, `undoCanvasLayout`, `redoCanvasLayout`) are thin
wrappers around them. Every action:
- locates the class → page → widget by id and is a safe no-op if any id
  is invalid (verified by tests 24-26),
- returns a **new** workspaces object touching only the target page,
  leaving every other class/page/widget/route/routine/picker state
  untouched (verified by tests 14-17, 35, 37-40).

## Undo / redo

Dedicated, session-only history: `canvasHistoryPast` /
`canvasHistoryFuture` fields on `boardStore` (excluded from `persist`'s
`partialize`, so they never touch `localStorage` and are always empty on
reload). **Not** the same stack as `beautifyUndo` — that stays completely
separate and untouched.

- One committed action (drag release, lock toggle, keyboard move, reset)
  = one history entry.
- Bounded to **50** entries (`MAX_HISTORY_ENTRIES`); oldest entries drop
  off the front.
- A new committed edit clears the redo stack.
- **Chosen behavior for page switching:** history is a single global
  session stack, not per-page. Undo/redo always operate on whichever page
  the recorded entry belongs to (each entry carries its own
  `classId`/`pageId`), so undoing while viewing a different page than the
  one that was edited still correctly reverts that page's widgets — the
  change just won't be visually apparent until you navigate back to it.
  This was the simpler of the two documented-acceptable options; a
  per-page stack is a reasonable follow-up if it proves confusing in
  practice.

## Reset Page Layout

`resetActivePageLayout(classId, pageId)` rebuilds only the target page's
widgets from the canonical seeded definition (`buildClassWorkspaces()` /
`getPageForId()`), preserving every other page/class untouched, and
creates one undo-history entry. The toolbar button shows a
`window.confirm()` prompt naming the page and mentioning that the action
is undoable before applying it.

## Persistence & migration (`src/store/boardStore.ts` version 7 → 8)

- Bumped `zustand/persist` version to **8**.
- New pure normalizer: `src/lib/studioCanvasMigration.ts` →
  `normalizeClassWorkspacesGeometry(persisted)`. Page order/titles/nav
  links always come from a fresh `buildClassWorkspaces()` build (source of
  truth for the current app version); widget geometry/lock/visible is
  preserved from persisted data **only when valid**, otherwise reseeded
  from the fresh build. Invalid means: non-finite, non-positive size,
  entirely off-canvas, or a `width<=1 && height<=1` placeholder.
- Duplicate widget ids on a persisted page are de-duplicated (first
  occurrence wins); widgets missing from a persisted page (present in the
  fresh definition but not the save) are seeded in; a persisted page with
  zero valid widgets falls back to the full fresh widget set.
- Never crashes on partial/malformed `localStorage` — the normalizer only
  reads plain data and always falls back to fresh geometry.
- Text content, active page, mode, backgrounds, teacher notes,
  timers/routines, and picker state are untouched by this migration path
  (unchanged from version 7's behavior for those fields).

## Local Packet behavior

`BackupBoardContent` (`src/features/local-packets/types.ts`) gained
`activePageId` and `classWorkspaces` fields — **this closes a pre-existing
gap**: the Local Packet "board" category previously did not round-trip
`classWorkspaces` or `activePageId` at all (only the flat `contents`
object). `packetStoreAdapter.ts`'s `snapshotCategory('board')`,
`restoreCategory('board', …)`, and `restoreBackupToStores(...)` now
include them, and imported `classWorkspaces` are always run through
`normalizeClassWorkspacesGeometry()` before being applied, so a
hand-edited or corrupted packet can't inject invalid/off-canvas geometry.

Local Packets explicitly do **not** export: selection state, transient
drag state, alignment guides, undo/redo stacks, or pointer coordinates —
none of those ever exist on `BoardState`/`ClassWorkspace` in the first
place (they're component-local `useState` or store fields excluded from
`partialize`), so this is true by construction, not by a separate filter.

## Accessibility

- All toolbar buttons have descriptive `aria-label`s.
- The canvas has `role="application"` with an `aria-label` naming the
  page; each widget frame has `role="group"`, `aria-label`, and
  `aria-selected`, and is keyboard-focusable (`tabIndex={0}`).
- Keyboard movement never fires while focus is inside a text field.

## Privacy boundaries

Unchanged from the nested-vibe-pages phase: no student observations,
fairness history, Mystery identities, group exclusions, or archived
student records ever appear in `VibePage`/`PageWidget` data — verified by
the Studio Canvas test suite (private-key substring checks) in addition to
the existing `test:pages` checks.

## Known limitations

- **Two screens without a dedicated Ready Position field** (`pack-up`'s
  "Ready Position" page) share content with the `ready-position` screen
  rather than duplicating a field that doesn't exist in `PackUpContent`.
  The inline helper text says so explicitly when editing.
- **Timer widgets** are only interactive for `homeroom`, `math`,
  `reading`, and `spelling` (`SimpleTimerScreenId`). A `timer` widget type
  on any other screen (e.g. `writing`, `centers`) renders a clean
  Studio-only placeholder explaining the limitation; Classroom Mode shows
  the same safe placeholder, never a fake control.
- **`SmartTextCard`'s bullet compaction** (`+N more`) applies a fixed
  default limit regardless of the widget box's actual size, so a large
  seeded region can show truncated content with unused whitespace below
  it. This is pre-existing `SmartTextCard` behavior, unchanged by this
  phase; making it size-aware is a good follow-up.
- **The Studio Inspector's x/y/width/height readout lags one frame behind
  an in-progress drag** — it reads the committed store value, not the live
  drag preview, updating only after pointer-up. Minor polish gap.
- **No per-widget visibility toggle UI** in this phase, even though
  `PageWidget.visible` is fully supported end-to-end (seeding, actions,
  migration, Local Packets, and both canvases already respect it).
- **The old per-screen dashboard components** (`HomeroomScreen.tsx`,
  `MathScreen.tsx`, `ReadingScreen.tsx`, `SubjectScreen.tsx`,
  `SnackLunchDisplayView.tsx`, `ReadyPositionScreen.tsx`) are no longer
  referenced by any render path (`VibePageScreen.tsx` now always renders
  `StudioCanvas`/`ClassroomCanvas`) but were left in the repo rather than
  deleted, to keep this diff scoped to addition/wiring rather than
  removal. A follow-up cleanup PR can safely delete them — confirmed via
  repo-wide grep that nothing else imports them.
- **The inline routine-block strip and voice-level noise tracker widget**
  that used to appear inside the old per-screen edit dashboards are not
  yet integrated into Studio Canvas. The underlying routine engine and
  noise-tower logic are completely untouched and still fully reachable —
  noise tracker controls remain in the Teacher Dock's Noise Control panel
  — only their inline overlay on the page editor itself is deferred.
- Per the phase scope: no arbitrary rotation, rich-text editing, freehand
  drawing, image uploads, collaboration, cloud sync, page creation/
  deletion, layer inspector, animation timeline, Tauri, Spotify, or
  backend storage.

## Next recommended Studio phase

1. Make `SmartTextCard` compaction size-aware so seeded regions with lots
   of headroom show more content instead of "+N more".
2. Per-widget visibility toggle in the Studio Inspector.
3. Live-updating inspector readout during an active drag.
4. Per-page undo/redo history (if the shared global stack proves
   confusing in practice).
5. Delete the now-unreferenced legacy per-screen dashboard components.
6. Bring the routine-block strip / voice-level indicator into the Studio
   Canvas toolbar or inspector as compact, non-widget chrome.

## Test coverage

`npm run test:studio-canvas` — **66 tests** across:
pixel/logical conversion, grid snapping, snap-disabled movement, canvas/
safe-area clamping, minimum-size enforcement, alignment-guide detection
(center/edge/out-of-tolerance), lock enforcement (both pointer and
keyboard), keyboard step sizes, widget/page/class isolation, reset
scoping, undo/redo (drag/lock/reset, redo, redo-clearing, bounded
history), new-edit-clears-redo, invalid class/page/widget id safety,
migration (seeding missing widgets, replacing placeholders, preserving
valid geometry, handling non-finite values, zero-size repair, out-of-bounds
repair, idempotency, new widget type seeding, unknown old widget safety),
Local Packet round-trip and transient-state exclusion, Classroom
render-model field/privacy safety, page-switch isolation, resize
stability, non-interference with routine/fairness/Mystery/absence state,
class-specific layout isolation, and restore-round-trip with unrelated
state preservation.

All pre-existing suites continue to pass unmodified: `test:routines` (87),
`test:pages` (148), `test:local-packets` (68 integration + 85 unit),
`test:student-picker` (68), `test:e2e` (7), `lint`, `build`,
`git diff --check`.

## E2E test coverage

`npm run test:e2e` runs Playwright tests against the live dev server:
1. Select, drag, lock, unlock, undo, redo
2. Widget geometry and lock state survive reload
3. Snap toggle affects grid overlay
4. Reset page layout restores seeded geometry (undoable)
5. Page switching preserves layout isolation
6-8. Classroom Mode hides Studio chrome at 1920×1080, 1440×900, 1024×768

All tests use deterministic seeded local state — no real student data,
no external network access.
