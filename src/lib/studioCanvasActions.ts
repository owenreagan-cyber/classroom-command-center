// Pure, testable Studio Canvas mutation + history logic. Operates only on
// plain ClassWorkspace records — no Zustand, no React, no DOM. boardStore.ts
// wires these into `set()`/`get()`; the test suite calls them directly.

import type { ClassWorkspace, PageWidget, ScreenId, VibePageId } from '../data/types'
import { buildClassWorkspaces, getPageForId } from '../data/pageSequences'
import {
  clampToCanvas,
  enforceMinSize,
  keyboardMoveDelta,
  normalizeRect,
  snapValue,
  MAX_HISTORY_ENTRIES,
  type ArrowKey,
} from './studioCanvasGeometry'

export type Workspaces = Record<ScreenId, ClassWorkspace | undefined>

export interface CanvasHistoryEntry {
  classId: ScreenId
  pageId: VibePageId
  before: PageWidget[]
  after: PageWidget[]
}

export interface CanvasActionResult {
  workspaces: Workspaces
  /** null when the requested class/page/widget could not be located — the
   * caller should treat this as a safe no-op and not touch history. */
  historyEntry: CanvasHistoryEntry | null
}

function noop(workspaces: Workspaces): CanvasActionResult {
  return { workspaces, historyEntry: null }
}

interface Located {
  ws: ClassWorkspace
  pageIndex: number
  widgets: PageWidget[]
}

function locatePage(workspaces: Workspaces, classId: ScreenId, pageId: VibePageId): Located | null {
  const ws = workspaces[classId]
  if (!ws) return null
  const pageIndex = ws.pages.findIndex((p) => p.id === pageId)
  if (pageIndex < 0) return null
  return { ws, pageIndex, widgets: ws.pages[pageIndex].widgets }
}

/** Replace only the target page's widgets, leaving every other class,
 * page, and field of BoardState untouched. */
function replacePageWidgets(
  workspaces: Workspaces,
  classId: ScreenId,
  pageId: VibePageId,
  nextWidgets: PageWidget[],
): Workspaces {
  const located = locatePage(workspaces, classId, pageId)
  if (!located) return workspaces
  const { ws, pageIndex } = located
  const nextPages = ws.pages.slice()
  nextPages[pageIndex] = { ...nextPages[pageIndex], widgets: nextWidgets, widgetIds: nextWidgets.map((w) => w.id) }
  return {
    ...workspaces,
    [classId]: { ...ws, pages: nextPages },
  }
}

// ── Move by delta (keyboard) ─────────────────────────────────────────────

export function moveWidget(
  workspaces: Workspaces,
  classId: ScreenId,
  pageId: VibePageId,
  widgetId: string,
  key: ArrowKey,
  shiftKey: boolean,
): CanvasActionResult {
  const located = locatePage(workspaces, classId, pageId)
  if (!located) return noop(workspaces)
  const widget = located.widgets.find((w) => w.id === widgetId)
  if (!widget) return noop(workspaces)
  if (widget.locked) return noop(workspaces)

  const delta = keyboardMoveDelta(key, shiftKey)
  const moved = normalizeRect(
    clampToCanvas({ x: widget.x + delta.x, y: widget.y + delta.y, width: widget.width, height: widget.height }),
  )

  const before = located.widgets
  const after = before.map((w) => (w.id === widgetId ? { ...w, x: moved.x, y: moved.y } : w))

  return {
    workspaces: replacePageWidgets(workspaces, classId, pageId, after),
    historyEntry: { classId, pageId, before, after },
  }
}

// ── Commit geometry (drag completion) ────────────────────────────────────

export interface GeometryPatch {
  x: number
  y: number
  width?: number
  height?: number
  snap?: boolean
}

export function setWidgetGeometry(
  workspaces: Workspaces,
  classId: ScreenId,
  pageId: VibePageId,
  widgetId: string,
  patch: GeometryPatch,
): CanvasActionResult {
  const located = locatePage(workspaces, classId, pageId)
  if (!located) return noop(workspaces)
  const widget = located.widgets.find((w) => w.id === widgetId)
  if (!widget) return noop(workspaces)
  if (widget.locked) return noop(workspaces)

  let x = patch.x
  let y = patch.y
  const width = patch.width ?? widget.width
  const height = patch.height ?? widget.height

  if (patch.snap) {
    x = snapValue(x)
    y = snapValue(y)
  }

  const rect = normalizeRect(enforceMinSize(clampToCanvas({ x, y, width, height })))

  const before = located.widgets
  const after = before.map((w) =>
    w.id === widgetId ? { ...w, x: rect.x, y: rect.y, width: rect.width, height: rect.height } : w,
  )

  return {
    workspaces: replacePageWidgets(workspaces, classId, pageId, after),
    historyEntry: { classId, pageId, before, after },
  }
}

// ── Lock / unlock ─────────────────────────────────────────────────────

export function setWidgetLocked(
  workspaces: Workspaces,
  classId: ScreenId,
  pageId: VibePageId,
  widgetId: string,
  locked: boolean,
): CanvasActionResult {
  const located = locatePage(workspaces, classId, pageId)
  if (!located) return noop(workspaces)
  const widget = located.widgets.find((w) => w.id === widgetId)
  if (!widget) return noop(workspaces)
  if (widget.locked === locked) return noop(workspaces)

  const before = located.widgets
  const after = before.map((w) => (w.id === widgetId ? { ...w, locked } : w))

  return {
    workspaces: replacePageWidgets(workspaces, classId, pageId, after),
    historyEntry: { classId, pageId, before, after },
  }
}

// ── Reset page layout ─────────────────────────────────────────────────

let freshWorkspacesCache: Workspaces | null = null
function getFreshWorkspaces(): Workspaces {
  // buildClassWorkspaces() is a pure function of static page-sequence data,
  // so it is safe (and much cheaper) to memoize for the life of the module.
  if (!freshWorkspacesCache) freshWorkspacesCache = buildClassWorkspaces()
  return freshWorkspacesCache
}

export function resetActivePageLayout(
  workspaces: Workspaces,
  classId: ScreenId,
  pageId: VibePageId,
): CanvasActionResult {
  const located = locatePage(workspaces, classId, pageId)
  if (!located) return noop(workspaces)

  const freshPage = getPageForId(pageId, getFreshWorkspaces())
  if (!freshPage) return noop(workspaces)

  const before = located.widgets
  const after = freshPage.widgets.map((w) => ({ ...w }))

  return {
    workspaces: replacePageWidgets(workspaces, classId, pageId, after),
    historyEntry: { classId, pageId, before, after },
  }
}

// ── History (undo/redo) ───────────────────────────────────────────────

export function pushHistory(
  past: CanvasHistoryEntry[],
  entry: CanvasHistoryEntry,
  max = MAX_HISTORY_ENTRIES,
): CanvasHistoryEntry[] {
  const next = [...past, entry]
  if (next.length > max) return next.slice(next.length - max)
  return next
}

/** Entries for every other page/class are left in place and in their
 * original relative order — only the current page's redo stack should be
 * invalidated by a fresh edit (see `clearFutureForPage`). */
export function clearFutureForPage(
  future: CanvasHistoryEntry[],
  classId: ScreenId,
  pageId: VibePageId,
): CanvasHistoryEntry[] {
  return future.filter((entry) => !(entry.classId === classId && entry.pageId === pageId))
}

/** Index of the most recent entry in `entries` belonging to the given
 * class/page, or -1. History entries for other pages/classes may be
 * interleaved in the same array, so this is not simply `entries.length - 1`. */
function findLastEntryIndexForPage(
  entries: CanvasHistoryEntry[],
  classId: ScreenId,
  pageId: VibePageId,
): number {
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].classId === classId && entries[i].pageId === pageId) return i
  }
  return -1
}

export interface HistoryStepResult {
  workspaces: Workspaces
  past: CanvasHistoryEntry[]
  future: CanvasHistoryEntry[]
}

/** Undo the most recent committed action for the given class/page. Entries
 * belonging to other pages/classes in `past`/`future` are left untouched,
 * so undo history from one page never intermixes with another's. */
export function undoCanvasHistory(
  workspaces: Workspaces,
  past: CanvasHistoryEntry[],
  future: CanvasHistoryEntry[],
  classId: ScreenId,
  pageId: VibePageId,
): HistoryStepResult {
  const index = findLastEntryIndexForPage(past, classId, pageId)
  if (index < 0) return { workspaces, past, future }
  const entry = past[index]
  const nextWorkspaces = replacePageWidgets(workspaces, entry.classId, entry.pageId, entry.before)
  return {
    workspaces: nextWorkspaces,
    past: [...past.slice(0, index), ...past.slice(index + 1)],
    future: pushHistory(future, entry),
  }
}

/** Redo the most recently undone action for the given class/page. Entries
 * belonging to other pages/classes in `past`/`future` are left untouched. */
export function redoCanvasHistory(
  workspaces: Workspaces,
  past: CanvasHistoryEntry[],
  future: CanvasHistoryEntry[],
  classId: ScreenId,
  pageId: VibePageId,
): HistoryStepResult {
  const index = findLastEntryIndexForPage(future, classId, pageId)
  if (index < 0) return { workspaces, past, future }
  const entry = future[index]
  const nextWorkspaces = replacePageWidgets(workspaces, entry.classId, entry.pageId, entry.after)
  return {
    workspaces: nextWorkspaces,
    past: pushHistory(past, entry),
    future: [...future.slice(0, index), ...future.slice(index + 1)],
  }
}
