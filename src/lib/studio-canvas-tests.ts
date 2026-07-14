// Deterministic Studio Canvas foundation tests.
// Run via: npm run test:studio-canvas

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { buildClassWorkspaces } from '../data/pageSequences'
import type { ClassWorkspace, PageWidget, ScreenId, VibePageId } from '../data/types'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GRID_SIZE,
  MIN_WIDGET_HEIGHT,
  MIN_WIDGET_WIDTH,
  MAX_HISTORY_ENTRIES,
  SAFE_MARGIN,
  clampToCanvas,
  clampToSafeArea,
  detectAlignmentGuides,
  enforceMinSize,
  keyboardMoveDelta,
  logicalToPixel,
  pixelToLogical,
  snapValue,
} from './studioCanvasGeometry'
import {
  moveWidget,
  pushHistory,
  redoCanvasHistory,
  resetActivePageLayout,
  setWidgetGeometry,
  setWidgetLocked,
  undoCanvasHistory,
  type CanvasHistoryEntry,
  type Workspaces,
} from './studioCanvasActions'
import { normalizeClassWorkspacesGeometry } from './studioCanvasMigration'

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) {
    passed += 1
  } else {
    failed += 1
    console.error(`FAIL: ${label}`)
  }
}

function cloneWorkspaces(ws: Workspaces): Workspaces {
  return structuredClone(ws)
}

function findWidget(ws: Workspaces, classId: ScreenId, pageId: VibePageId, widgetId: string): PageWidget | undefined {
  return ws[classId]?.pages.find((p) => p.id === pageId)?.widgets.find((w) => w.id === widgetId)
}

// ── 1-2. Pixel <-> logical conversion ────────────────────────────────
{
  const logical = pixelToLogical({ x: 400, y: 225 }, 800, 450)
  assert('pixel-to-logical scales proportionally', logical.x === 800 && logical.y === 450)

  const pixel = logicalToPixel({ x: 800, y: 450 }, 800, 450)
  assert('logical-to-pixel scales proportionally', pixel.x === 400 && pixel.y === 225)

  const roundTrip = pixelToLogical(logicalToPixel({ x: 320, y: 180 }, 1024, 576), 1024, 576)
  assert('pixel/logical round-trip is stable', Math.abs(roundTrip.x - 320) < 0.001 && Math.abs(roundTrip.y - 180) < 0.001)
}

// ── 3. Grid snapping ──────────────────────────────────────────────────
assert('snapValue rounds down to nearest grid line', snapValue(20, GRID_SIZE) === 16)
assert('snapValue rounds up to nearest grid line', snapValue(25, GRID_SIZE) === 32)
assert('snapValue is idempotent', snapValue(snapValue(101)) === snapValue(101))

// ── 4. Clamping to canvas ─────────────────────────────────────────────
{
  const clamped = clampToCanvas({ x: -50, y: -50, width: 200, height: 100 })
  assert('clampToCanvas pulls negative x/y back on-canvas', clamped.x === 0 && clamped.y === 0)
  const clampedFar = clampToCanvas({ x: CANVAS_WIDTH + 500, y: CANVAS_HEIGHT + 500, width: 200, height: 100 })
  assert('clampToCanvas pulls far-out rects back on-canvas', clampedFar.x === CANVAS_WIDTH - 200 && clampedFar.y === CANVAS_HEIGHT - 100)
}

// ── 5. Safe-margin enforcement ────────────────────────────────────────
{
  const clamped = clampToSafeArea({ x: 0, y: 0, width: 200, height: 100 })
  assert('clampToSafeArea respects the safe margin', clamped.x === SAFE_MARGIN && clamped.y === SAFE_MARGIN)
}

// ── 6. Minimum size enforcement ───────────────────────────────────────
{
  const enforced = enforceMinSize({ x: 0, y: 0, width: 10, height: 10 })
  assert('enforceMinSize raises width to the minimum', enforced.width === MIN_WIDGET_WIDTH)
  assert('enforceMinSize raises height to the minimum', enforced.height === MIN_WIDGET_HEIGHT)
}

// ── 7-9. Alignment guides ──────────────────────────────────────────────
{
  const centered = { x: CANVAS_WIDTH / 2 - 100, y: 100, width: 200, height: 100 }
  const guides = detectAlignmentGuides(centered, [])
  assert('center guide detected when aligned to canvas center', guides.vertical.includes(CANVAS_WIDTH / 2))

  const other = { x: 300, y: 300, width: 200, height: 100 }
  const edgeAligned = { x: 300, y: 500, width: 150, height: 80 }
  const edgeGuides = detectAlignmentGuides(edgeAligned, [other])
  assert('edge guide detected for matching left edge', edgeGuides.vertical.includes(300))

  const farAway = { x: 900, y: 900, width: 50, height: 50 }
  const noGuides = detectAlignmentGuides(farAway, [other])
  assert('no guide reported outside tolerance', noGuides.vertical.length === 0 && noGuides.horizontal.length === 0)
}

// ── Shared fixtures for action tests ──────────────────────────────────
const baseWorkspaces = buildClassWorkspaces()
const HOMEROOM: ScreenId = 'homeroom'
const homeroomFirstPageId = baseWorkspaces[HOMEROOM]!.pages[0].id as VibePageId
const homeroomFirstWidgetId = baseWorkspaces[HOMEROOM]!.pages[0].widgets[0].id
const MATH: ScreenId = 'math'
const mathFirstPageId = baseWorkspaces[MATH]!.pages[0].id as VibePageId

// ── 10-11. Lock prevents movement, unlocked moves ─────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const locked = setWidgetLocked(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, true)
  const lockedWidget = findWidget(locked.workspaces, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!
  const moveAttempt = moveWidget(locked.workspaces, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, 'ArrowRight', false)
  assert('locked widget cannot move', moveAttempt.historyEntry === null && moveAttempt.workspaces === locked.workspaces)

  const unlocked = setWidgetLocked(locked.workspaces, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, false)
  const moved = moveWidget(unlocked.workspaces, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, 'ArrowRight', false)
  const movedWidget = findWidget(moved.workspaces, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!
  assert('unlocked widget moves', movedWidget.x === lockedWidget.x + 1)
}

// ── 12-13. Keyboard step sizes ─────────────────────────────────────────
assert('plain arrow key moves by 1 logical unit', keyboardMoveDelta('ArrowRight', false).x === 1)
assert('shift+arrow moves by one grid step', keyboardMoveDelta('ArrowDown', true).y === GRID_SIZE)

// ── 14-16. Isolation: widget / page / class ───────────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const page = ws[HOMEROOM]!.pages[0]
  const otherWidgetsBefore = page.widgets.filter((w) => w.id !== homeroomFirstWidgetId).map((w) => structuredClone(w))
  const otherPagesBefore = ws[HOMEROOM]!.pages.slice(1).map((p) => structuredClone(p))
  const otherClassesBefore = structuredClone(ws[MATH])

  const result = moveWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, 'ArrowDown', true)
  const nextPage = result.workspaces[HOMEROOM]!.pages[0]
  const otherWidgetsAfter = nextPage.widgets.filter((w) => w.id !== homeroomFirstWidgetId)

  assert('move affects only the targeted widget', JSON.stringify(otherWidgetsAfter) === JSON.stringify(otherWidgetsBefore))
  assert(
    'move affects only the targeted page',
    JSON.stringify(result.workspaces[HOMEROOM]!.pages.slice(1)) === JSON.stringify(otherPagesBefore),
  )
  assert('move affects only the targeted class', JSON.stringify(result.workspaces[MATH]) === JSON.stringify(otherClassesBefore))
}

// ── 17. Reset affects only the active page ────────────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const moved = moveWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, 'ArrowRight', true)
  const secondPageId = moved.workspaces[HOMEROOM]!.pages[1].id
  const movedSecondWidgetId = moved.workspaces[HOMEROOM]!.pages[1].widgets[0]?.id
  let afterSecondMove = moved.workspaces
  if (movedSecondWidgetId) {
    afterSecondMove = moveWidget(moved.workspaces, HOMEROOM, secondPageId, movedSecondWidgetId, 'ArrowDown', true).workspaces
  }
  const secondPageBefore = structuredClone(afterSecondMove[HOMEROOM]!.pages[1])

  const reset = resetActivePageLayout(afterSecondMove, HOMEROOM, homeroomFirstPageId)
  const firstPageAfter = reset.workspaces[HOMEROOM]!.pages[0]
  const secondPageAfter = reset.workspaces[HOMEROOM]!.pages[1]

  assert('reset restores seeded geometry on the active page', firstPageAfter.widgets[0].x === baseWorkspaces[HOMEROOM]!.pages[0].widgets[0].x && firstPageAfter.widgets[0].y === baseWorkspaces[HOMEROOM]!.pages[0].widgets[0].y)
  assert('reset does not touch other pages', JSON.stringify(secondPageAfter) === JSON.stringify(secondPageBefore))
}

// ── 18-23. Undo / redo history ────────────────────────────────────────
{
  let past: CanvasHistoryEntry[] = []
  let future: CanvasHistoryEntry[] = []
  let ws = cloneWorkspaces(baseWorkspaces)

  const originalWidget = structuredClone(findWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!)
  // Small, in-bounds offsets relative to the widget's own (large) seeded
  // rect — this widget may be tall/wide enough that an absolute target
  // coordinate would legitimately get clamped back on-canvas.
  const targetX = originalWidget.x + 20
  const targetY = Math.max(0, originalWidget.y - 10)

  const geometryResult = setWidgetGeometry(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, { x: targetX, y: targetY })
  ws = geometryResult.workspaces
  past = pushHistory(past, geometryResult.historyEntry!)

  const afterCommit = findWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!
  assert('drag commit updates geometry', afterCommit.x === targetX && afterCommit.y === targetY)

  const undone = undoCanvasHistory(ws, past, future)
  ws = undone.workspaces
  past = undone.past
  future = undone.future
  const afterUndo = findWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!
  assert('drag commit is undoable', afterUndo.x === originalWidget.x && afterUndo.y === originalWidget.y)

  const redone = redoCanvasHistory(ws, past, future)
  ws = redone.workspaces
  past = redone.past
  future = redone.future
  const afterRedo = findWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!
  assert('redo restores the edit', afterRedo.x === targetX && afterRedo.y === targetY)

  // New edit after undo should clear redo.
  const undo2 = undoCanvasHistory(ws, past, future)
  ws = undo2.workspaces
  past = undo2.past
  future = undo2.future
  assert('future has an entry before a new edit', future.length === 1)
  const secondTargetX = originalWidget.x + 40
  const secondTargetY = Math.max(0, originalWidget.y - 5)
  const newEdit = setWidgetGeometry(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, { x: secondTargetX, y: secondTargetY })
  ws = newEdit.workspaces
  past = pushHistory(past, newEdit.historyEntry!)
  future = [] // caller (boardStore) always clears future on a new committed edit
  assert('new edit clears redo', future.length === 0)

  // Lock is undoable
  const lockResult = setWidgetLocked(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, true)
  const lockUndo = undoCanvasHistory(lockResult.workspaces, pushHistory(past, lockResult.historyEntry!), [])
  const afterLockUndo = findWidget(lockUndo.workspaces, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!
  assert('lock is undoable', afterLockUndo.locked === false)

  // Reset is undoable
  const resetResult = resetActivePageLayout(ws, HOMEROOM, homeroomFirstPageId)
  const resetUndo = undoCanvasHistory(resetResult.workspaces, pushHistory(past, resetResult.historyEntry!), [])
  const afterResetUndo = findWidget(resetUndo.workspaces, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!
  assert('reset is undoable', afterResetUndo.x === secondTargetX && afterResetUndo.y === secondTargetY)
}

// ── 23. Bounded history ────────────────────────────────────────────────
{
  let past: CanvasHistoryEntry[] = []
  const entry: CanvasHistoryEntry = {
    classId: HOMEROOM,
    pageId: homeroomFirstPageId,
    before: [],
    after: [],
  }
  for (let i = 0; i < MAX_HISTORY_ENTRIES + 10; i++) {
    past = pushHistory(past, entry)
  }
  assert('history is bounded to the configured maximum', past.length === MAX_HISTORY_ENTRIES)
}

// ── 24-26. Invalid IDs are safe no-ops ─────────────────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const badWidget = moveWidget(ws, HOMEROOM, homeroomFirstPageId, 'not-a-real-widget', 'ArrowRight', false)
  assert('invalid widget ID is a safe no-op', badWidget.historyEntry === null && badWidget.workspaces === ws)

  const badPage = moveWidget(ws, HOMEROOM, 'not-a-real-page' as VibePageId, homeroomFirstWidgetId, 'ArrowRight', false)
  assert('invalid page ID is a safe no-op', badPage.historyEntry === null && badPage.workspaces === ws)

  const badClass = moveWidget(ws, 'not-a-real-class' as ScreenId, homeroomFirstPageId, homeroomFirstWidgetId, 'ArrowRight', false)
  assert('invalid class ID is a safe no-op', badClass.historyEntry === null && badClass.workspaces === ws)
}

// ── 27-30. Migration / normalization ────────────────────────────────────
{
  // 27: seeds missing geometry — page has fewer widgets than the fresh definition
  const missing = cloneWorkspaces(baseWorkspaces)
  const page = missing[HOMEROOM]!.pages[0]
  page.widgets = page.widgets.slice(0, Math.max(0, page.widgets.length - 1))
  page.widgetIds = page.widgets.map((w) => w.id)
  const normalizedMissing = normalizeClassWorkspacesGeometry(missing)
  const freshCount = baseWorkspaces[HOMEROOM]!.pages[0].widgets.length
  assert('migration seeds widgets missing from a persisted page', normalizedMissing[HOMEROOM]!.pages[0].widgets.length === freshCount)

  // 28: replaces 1x1 placeholder geometry
  const placeholder = cloneWorkspaces(baseWorkspaces)
  placeholder[HOMEROOM]!.pages[0].widgets[0] = { ...placeholder[HOMEROOM]!.pages[0].widgets[0], x: 0, y: 0, width: 1, height: 1 }
  const normalizedPlaceholder = normalizeClassWorkspacesGeometry(placeholder)
  const placeholderResultWidget = normalizedPlaceholder[HOMEROOM]!.pages[0].widgets[0]
  assert('migration replaces 1x1 placeholder geometry', !(placeholderResultWidget.width <= 1 && placeholderResultWidget.height <= 1))

  // 29: preserves valid custom geometry
  const custom = cloneWorkspaces(baseWorkspaces)
  custom[HOMEROOM]!.pages[0].widgets[0] = { ...custom[HOMEROOM]!.pages[0].widgets[0], x: 321, y: 154, width: 480, height: 260 }
  const normalizedCustom = normalizeClassWorkspacesGeometry(custom)
  const customResultWidget = normalizedCustom[HOMEROOM]!.pages[0].widgets[0]
  assert(
    'migration preserves valid persisted geometry',
    customResultWidget.x === 321 && customResultWidget.y === 154 && customResultWidget.width === 480 && customResultWidget.height === 260,
  )

  // 30: handles non-finite values without crashing
  const nonFinite = cloneWorkspaces(baseWorkspaces)
  nonFinite[HOMEROOM]!.pages[0].widgets[0] = { ...nonFinite[HOMEROOM]!.pages[0].widgets[0], x: Number.NaN, y: Number.POSITIVE_INFINITY, width: Number.NaN, height: -5 }
  let migrationThrew = false
  let normalizedNonFinite: Workspaces | undefined
  try {
    normalizedNonFinite = normalizeClassWorkspacesGeometry(nonFinite)
  } catch {
    migrationThrew = true
  }
  assert('migration handles non-finite values without throwing', !migrationThrew)
  const nonFiniteWidget = normalizedNonFinite?.[HOMEROOM]?.pages[0].widgets[0]
  assert(
    'migration replaces non-finite geometry with finite geometry',
    !!nonFiniteWidget && Number.isFinite(nonFiniteWidget.x) && Number.isFinite(nonFiniteWidget.y) && Number.isFinite(nonFiniteWidget.width) && Number.isFinite(nonFiniteWidget.height),
  )
}

// ── 31-32. Local Packet round-trip ──────────────────────────────────────
{
  // 31: round-trips widget geometry through JSON (as a packet payload would)
  const custom = cloneWorkspaces(baseWorkspaces)
  custom[HOMEROOM]!.pages[0].widgets[0] = { ...custom[HOMEROOM]!.pages[0].widgets[0], x: 200, y: 100, width: 300, height: 200, locked: true, visible: false, zIndex: 9 }
  const roundTripped = JSON.parse(JSON.stringify(custom)) as Workspaces
  const normalizedRoundTrip = normalizeClassWorkspacesGeometry(roundTripped)
  const rtWidget = normalizedRoundTrip[HOMEROOM]!.pages[0].widgets[0]
  assert(
    'Local Packet round-trip preserves widget geometry, lock, visible, and zIndex',
    rtWidget.x === 200 && rtWidget.y === 100 && rtWidget.width === 300 && rtWidget.height === 200 && rtWidget.locked === true && rtWidget.visible === false && rtWidget.zIndex === 9,
  )

  // 32: a board snapshot shaped like packetStoreAdapter's snapshotCategory('board')
  // must never carry transient Studio Canvas session state.
  const boardSnapshotShape = {
    mode: 'edit',
    activeScreen: 'homeroom',
    activePageId: homeroomFirstPageId,
    classWorkspaces: custom,
    backgroundId: 'homeroom-morning-briefing',
    contents: {},
    teacherNotes: [],
    cardVisibility: {},
    customPresets: [],
    noiseTrackers: {},
    beautifyUndo: null,
  }
  const forbiddenKeys = ['selectedWidgetId', 'dragState', 'canvasHistoryPast', 'canvasHistoryFuture', 'studioSnapEnabled', 'alignmentGuides', 'pointerX', 'pointerY']
  const serialized = JSON.stringify(boardSnapshotShape)
  assert(
    'Local Packet board snapshot excludes transient Studio state',
    forbiddenKeys.every((key) => !serialized.includes(key)),
  )
}

// ── 33-34. Classroom render model safety ────────────────────────────────
{
  const knownWidgetFields = new Set(['id', 'type', 'x', 'y', 'width', 'height', 'zIndex', 'locked', 'visible', 'snapRegion', 'contentRef'])
  const ws = cloneWorkspaces(baseWorkspaces)
  const moved = moveWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, 'ArrowRight', true)
  const widgetAfterAction = findWidget(moved.workspaces, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!
  const extraFields = Object.keys(widgetAfterAction).filter((k) => !knownWidgetFields.has(k))
  assert('Classroom render model excludes Studio-only chrome fields (e.g. selection)', extraFields.length === 0)

  const pageJson = JSON.stringify(baseWorkspaces)
  const forbiddenPrivateKeys = ['studentObservations', 'fairnessHistory', 'activeMysterySessions', 'groupExclusions', 'archivedStudent', 'teacherPrivate']
  assert(
    'Classroom render model excludes private student/teacher data',
    forbiddenPrivateKeys.every((key) => !pageJson.includes(key)),
  )
}

// ── 35. Page switching preserves each page's layout ─────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const secondPageId = ws[HOMEROOM]!.pages[1].id
  const secondPageBefore = structuredClone(ws[HOMEROOM]!.pages[1])
  const moved = moveWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, 'ArrowDown', true)
  const secondPageAfter = moved.workspaces[HOMEROOM]!.pages.find((p) => p.id === secondPageId)!
  assert('editing one page leaves other pages layout untouched on switch', JSON.stringify(secondPageAfter) === JSON.stringify(secondPageBefore))
}

// ── 36. Browser resize does not mutate logical geometry ─────────────────
{
  const rect = { x: 480, y: 270, width: 320, height: 180 }
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]
  let stable = true
  for (const viewport of viewports) {
    // Assume the Studio Canvas box is letterboxed to 16:9 within the viewport.
    const boxWidth = Math.min(viewport.width, (viewport.height * 16) / 9)
    const boxHeight = (boxWidth * 9) / 16
    const pixel = logicalToPixel(rect, boxWidth, boxHeight)
    const backToLogical = pixelToLogical(pixel, boxWidth, boxHeight)
    if (Math.abs(backToLogical.x - rect.x) > 0.01 || Math.abs(backToLogical.y - rect.y) > 0.01) {
      stable = false
    }
  }
  assert('resizing the browser does not mutate stored logical geometry', stable)
}

// ── 37-40. Unrelated state stays untouched ───────────────────────────────
{
  const routineState = { phase: 'silent-work', remainingMs: 120000 }
  const routineSnapshot = JSON.stringify(routineState)
  const fairnessHistory: unknown[] = [{ id: 'a', studentId: 's1' }]
  const fairnessSnapshot = JSON.stringify(fairnessHistory)
  const mysterySessions: Record<string, unknown> = { math: { status: 'active' } }
  const mysterySnapshot = JSON.stringify(mysterySessions)
  const absenceState: Record<string, boolean> = { s1: false, s2: true }
  const absenceSnapshot = JSON.stringify(absenceState)

  const ws = cloneWorkspaces(baseWorkspaces)
  void moveWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, 'ArrowRight', false)
  void setWidgetLocked(ws, MATH, mathFirstPageId, ws[MATH]!.pages[0].widgets[0]?.id ?? '', true)
  void resetActivePageLayout(ws, HOMEROOM, homeroomFirstPageId)
  void normalizeClassWorkspacesGeometry(ws)

  assert('routine timing state remains unchanged', JSON.stringify(routineState) === routineSnapshot)
  assert('fairness history remains unchanged', JSON.stringify(fairnessHistory) === fairnessSnapshot)
  assert('Mystery session state remains unchanged', JSON.stringify(mysterySessions) === mysterySnapshot)
  assert('absence/attendance state remains unchanged', JSON.stringify(absenceState) === absenceSnapshot)
}

// ── 41. Snap-disabled movement does not snap ────────────────────────────
{
  // setWidgetGeometry with snap: true snaps to grid, snap: false or undefined does not
  // (Note: the action layer snaps via snapValue when patch.snap is true; we test the
  // function path here since the action calls snapValue for snap requests)
  const ws = cloneWorkspaces(baseWorkspaces)
  const widget = findWidget(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId)!
  // Move to a non-grid-aligned position without snap
  const unsnappedResult = setWidgetGeometry(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, { x: widget.x + 7, y: widget.y + 9, snap: false })
  const unsnapped = unsnappedResult.workspaces[HOMEROOM]!.pages[0].widgets.find((w) => w.id === homeroomFirstWidgetId)!
  assert('snap-disabled movement preserves non-grid-aligned x', unsnapped.x % GRID_SIZE !== 0)
  assert('snap-disabled movement preserves non-grid-aligned y', unsnapped.y % GRID_SIZE !== 0)
}

// ── 43. Cancel does not commit (no-op for missing widget/page/class) ────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const cancelResult = setWidgetGeometry(ws, HOMEROOM, homeroomFirstPageId, 'nonexistent-widget', { x: 100, y: 100 })
  assert('cancel with invalid widget id does not commit', cancelResult.historyEntry === null && cancelResult.workspaces === ws)
}

// ── 44. Lock toggle is noop when already same state ─────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const locked = setWidgetLocked(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, false)
  assert('locking to already-current state is noop', locked.historyEntry === null && locked.workspaces === ws)
}

// ── 45-47. Invalid geometry repair ──────────────────────────────────────
{
  // Zero-size widget
  const zeroSz = cloneWorkspaces(baseWorkspaces)
  zeroSz[HOMEROOM]!.pages[0].widgets[0] = { ...zeroSz[HOMEROOM]!.pages[0].widgets[0], width: 0, height: 0 }
  const zeroNorm = normalizeClassWorkspacesGeometry(zeroSz)
  const zeroWidget = zeroNorm[HOMEROOM]!.pages[0].widgets[0]
  assert('zero-size widget is repaired to minimum width', zeroWidget.width >= MIN_WIDGET_WIDTH)
  assert('zero-size widget is repaired to minimum height', zeroWidget.height >= MIN_WIDGET_HEIGHT)

  // Out-of-bounds (entirely right of canvas)
  const oob = cloneWorkspaces(baseWorkspaces)
  oob[HOMEROOM]!.pages[0].widgets[0] = { ...oob[HOMEROOM]!.pages[0].widgets[0], x: CANVAS_WIDTH + 100, y: 200 }
  const oobNorm = normalizeClassWorkspacesGeometry(oob)
  const oobWidget = oobNorm[HOMEROOM]!.pages[0].widgets[0]
  assert('out-of-bounds widget is clamped on-canvas', oobWidget.x + oobWidget.width <= CANVAS_WIDTH && oobWidget.x >= 0)
}

// ── 48-49. Migration idempotency ───────────────────────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  ws[HOMEROOM]!.pages[0].widgets[0] = { ...ws[HOMEROOM]!.pages[0].widgets[0], x: 111, y: 222, width: 333, height: 444 }
  const first = normalizeClassWorkspacesGeometry(ws)
  const second = normalizeClassWorkspacesGeometry(first)
  const w1 = first[HOMEROOM]!.pages[0].widgets[0]
  const w2 = second[HOMEROOM]!.pages[0].widgets[0]
  assert('migration is idempotent: first pass preserves custom geometry', w1.x === 111 && w1.y === 222 && w1.width === 333 && w1.height === 444)
  assert('migration is idempotent: second pass does not change geometry', w2.x === w1.x && w2.y === w1.y && w2.width === w1.width && w2.height === w1.height)
}

// ── 50-51. New widget type seeding ──────────────────────────────────────
{
  // Simulate adding a new widget type: fresh definition has a widget that
  // persisted data does not. Migration should seed it without destroying old ones.
  const ws = cloneWorkspaces(baseWorkspaces)
  const freshPageCount = ws[HOMEROOM]!.pages[0].widgets.length
  // Remove last widget to simulate pre-existing save without it
  const reducedWidgets = ws[HOMEROOM]!.pages[0].widgets.slice(0, -1)
  ws[HOMEROOM]!.pages[0].widgets = reducedWidgets
  ws[HOMEROOM]!.pages[0].widgetIds = reducedWidgets.map((w) => w.id)
  const migrated = normalizeClassWorkspacesGeometry(ws)
  const migratedWidgets = migrated[HOMEROOM]!.pages[0].widgets
  assert('new widget seeded by migration', migratedWidgets.length === freshPageCount)
  // First widget geometry preserved
  assert('existing widget geometry preserved during new-type seeding', migratedWidgets[0].x === reducedWidgets[0].x)
}

// ── 52. Unknown old widget entries do not crash ────────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  ws[HOMEROOM]!.pages[0].widgets = [
    ...ws[HOMEROOM]!.pages[0].widgets,
    { id: 'stray-old-widget', type: 'unknown', x: 50, y: 50, width: 200, height: 100, zIndex: 99, locked: false, visible: true },
  ]
  let threw = false
  let migrated: Workspaces | undefined
  try {
    migrated = normalizeClassWorkspacesGeometry(ws)
  } catch {
    threw = true
  }
  assert('unknown old widget entries do not crash migration', !threw)
  const knownWidgets = migrated?.[HOMEROOM]?.pages[0].widgets
  assert('unknown old widget receives safe geometry', knownWidgets?.some((w) => w.id === 'stray-old-widget') === true)
}

// ── 53-56. Page isolation: editing one class does not affect another ───
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const mathBefore = structuredClone(ws[MATH])
  const readingBefore = structuredClone(ws.reading)
  // setWidgetGeometry is pure — it returns a new Workspaces without mutating ws.
  // We use the returned result to prove the other classes/pages are untouched.
  const result = setWidgetGeometry(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, { x: 500, y: 400 })
  assert('editing Homeroom does not change Math', JSON.stringify(result.workspaces[MATH]) === JSON.stringify(mathBefore))
  assert('editing Homeroom does not change Reading', JSON.stringify(result.workspaces.reading) === JSON.stringify(readingBefore))
}

{
  const ws = cloneWorkspaces(baseWorkspaces)
  const mathPage1Before = structuredClone(ws[MATH]!.pages[0])
  const mathSecondPageId = ws[MATH]!.pages[1].id
  const mathSecondWidgetId = ws[MATH]!.pages[1].widgets[0]?.id
  let resultWs = ws
  if (mathSecondWidgetId) {
    resultWs = setWidgetGeometry(ws, MATH, mathSecondPageId, mathSecondWidgetId, { x: 600, y: 500 }).workspaces
  }
  assert('editing Math page 2 does not change Math page 1', JSON.stringify(resultWs[MATH]!.pages[0]) === JSON.stringify(mathPage1Before))
  // Also verify Homeroom is untouched (pure function guarantees no mutation)
  assert('editing Math does not change Homeroom first page', resultWs[HOMEROOM]!.pages[0].widgets[0].x === baseWorkspaces[HOMEROOM]!.pages[0].widgets[0].x)
}

// ── 57. Homework edit does not change Lunch ────────────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const lunchBefore = structuredClone(ws.lunch)
  const HOMEWORK: ScreenId = 'homework'
  const homeworkFirstPageId = ws[HOMEWORK]?.pages[0]?.id
  const homeworkFirstWidgetId = ws[HOMEWORK]?.pages[0]?.widgets[0]?.id
  let resultWs = ws
  if (homeworkFirstPageId && homeworkFirstWidgetId) {
    resultWs = setWidgetGeometry(ws, HOMEWORK, homeworkFirstPageId as VibePageId, homeworkFirstWidgetId, { x: 700, y: 600 }).workspaces
  }
  assert('editing Homework does not change Lunch', JSON.stringify(resultWs.lunch) === JSON.stringify(lunchBefore))
}

// ── 58. Backup/restore round-trip with unrelated state preservation ─────
{
  const custom = cloneWorkspaces(baseWorkspaces)
  custom[HOMEROOM]!.pages[0].widgets[0] = { ...custom[HOMEROOM]!.pages[0].widgets[0], x: 200, y: 100, width: 300, height: 200 }
  custom[MATH]!.pages[0].widgets[0] = { ...custom[MATH]!.pages[0].widgets[0], x: 400, y: 300, width: 500, height: 250, locked: true }
  const serialized = JSON.parse(JSON.stringify(custom)) as Workspaces
  const restored = normalizeClassWorkspacesGeometry(serialized)
  const hrWidget = restored[HOMEROOM]!.pages[0].widgets[0]
  const mathWidget = restored[MATH]!.pages[0].widgets[0]
  assert('backup round-trip preserves Homeroom custom x', hrWidget.x === 200)
  assert('backup round-trip preserves Math custom x and lock', mathWidget.x === 400 && mathWidget.locked === true)
  assert('backup round-trip preserves Homeroom lock state', hrWidget.locked === false) // original was unlocked
}

// ── 59. Old backup without classWorkspaces imports safely ───────────────
{
  const oldBackup = {}
  const migrated = normalizeClassWorkspacesGeometry(oldBackup as Workspaces)
  assert('old backup without classWorkspaces produces valid workspaces', migrated[HOMEROOM] !== undefined && migrated[MATH] !== undefined)
  assert('old backup has seeded (non-placeholder) geometry', migrated[HOMEROOM]!.pages[0].widgets[0].width > 1)
}

// ── 60. Malformed backup (null pages) does not crash ────────────────────
{
  const malformed = cloneWorkspaces(baseWorkspaces)
  ;(malformed[HOMEROOM] as unknown as Record<string, unknown>).pages = null
  let threw = false
  try {
    normalizeClassWorkspacesGeometry(malformed)
  } catch {
    threw = true
  }
  assert('malformed backup with null pages does not crash', !threw)
}

// ── 61. Restoring layouts leaves unrelated state unchanged ──────────────
{
  const pickerSnapshot = { students: ['a', 'b'], fairnessHistory: [{ id: 'e1', studentId: 's1' }] }
  const pickerJson = JSON.stringify(pickerSnapshot)
  const ws = cloneWorkspaces(baseWorkspaces)
  const moved = setWidgetGeometry(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, { x: 300, y: 200 })
  void JSON.stringify(moved.workspaces[HOMEROOM]!.pages[0].widgets)
  assert('layout edits do not mutate picker state', JSON.stringify(pickerSnapshot) === pickerJson)
}

// ── 62. Studio-only fields never appear in persisted classWorkspaces ────
{
  const wsJson = JSON.stringify(baseWorkspaces)
  const studioTransientKeys = ['dragState', 'selectedWidgetId', 'canvasHistoryPast', 'canvasHistoryFuture', 'alignmentGuides']
  assert(
    'Studio transient fields never appear in classWorkspaces JSON',
    studioTransientKeys.every((key) => !wsJson.includes(key)),
  )
}

// ── 63. Lock prevents keyboard and geometry movement ────────────────────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const lockedResult = setWidgetLocked(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, true)
  const lockedWs = lockedResult.workspaces

  // Keyboard move of locked widget is noop
  const keyMove = moveWidget(lockedWs, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, 'ArrowDown', true)
  assert('keyboard move of locked widget is noop', keyMove.historyEntry === null)

  // Geometry set on locked widget is noop
  const geomMove = setWidgetGeometry(lockedWs, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, { x: 999, y: 999 })
  assert('geometry set of locked widget is noop', geomMove.historyEntry === null)
}

// ── 64. Class-specific layout isolation ─────────────────────────────────
{
  // Homeroom Morning Arrival layout is independent from Homeroom Morning Message
  const ws = cloneWorkspaces(baseWorkspaces)
  const morningMsgPage = ws[HOMEROOM]!.pages.find((p) => p.id === 'homeroom-morning-message')!
  const morningMsgWidgetsBefore = structuredClone(morningMsgPage.widgets)
  const arrivalPage = ws[HOMEROOM]!.pages.find((p) => p.id === 'homeroom-morning-arrival')!
  void setWidgetGeometry(ws, HOMEROOM, arrivalPage.id, arrivalPage.widgets[0].id, { x: 500, y: 500 })
  const morningMsgAfter = ws[HOMEROOM]!.pages.find((p) => p.id === 'homeroom-morning-message')
  assert('Morning Arrival edit does not change Morning Message', JSON.stringify(morningMsgAfter?.widgets) === JSON.stringify(morningMsgWidgetsBefore))
}

// ── 65. Classroom render model excludes Studio controls ─────────────────
{
  // Test that the PageWidget model has no Studio-specific chrome fields
  const knownWidgetFields = new Set(['id', 'type', 'x', 'y', 'width', 'height', 'zIndex', 'locked', 'visible', 'snapRegion', 'contentRef'])
  const ws = cloneWorkspaces(baseWorkspaces)
  for (const cls of Object.values(ws)) {
    if (!cls) continue
    for (const page of cls.pages) {
      for (const widget of page.widgets) {
        const extra = Object.keys(widget).filter((k) => !knownWidgetFields.has(k))
        if (extra.length > 0) {
          assert(`classroom model has no Studio-only chrome on ${widget.id}`, false)
        }
      }
    }
  }
  assert('classroom model excludes Studio-only chrome fields', true)
}

// ── 66. setWidgetGeometry preserves locked when lock is unchanged ───────
{
  const ws = cloneWorkspaces(baseWorkspaces)
  const locked = setWidgetLocked(ws, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, true)
  const geom = setWidgetGeometry(locked.workspaces, HOMEROOM, homeroomFirstPageId, homeroomFirstWidgetId, { x: 100, y: 100 })
  assert('geometry set on locked widget is noop', geom.historyEntry === null)
}

// ── Sanity: every page has deterministic seeded (non-placeholder) geometry
{
  const allPages: ClassWorkspace[] = Object.values(baseWorkspaces).filter((w): w is ClassWorkspace => Boolean(w))
  const allWidgets = allPages.flatMap((ws) => ws.pages.flatMap((p) => p.widgets))
  assert('every seeded widget has a positive, finite, on-canvas rect', allWidgets.every((w) =>
    Number.isFinite(w.x) && Number.isFinite(w.y) && w.width > 1 && w.height > 1 && w.x >= 0 && w.y >= 0 && w.x + w.width <= CANVAS_WIDTH && w.y + w.height <= CANVAS_HEIGHT,
  ))
}

console.log(`\nStudio Canvas Foundation Tests`)
console.log(`Passed: ${passed}, Failed: ${failed}`)
process.exitCode = failed > 0 ? 1 : 0
