// Pure normalization for persisted / imported classWorkspaces. Used by the
// board store migration (version bump) and by Local Packet import, so both
// paths share one safety net against missing, invalid, or placeholder
// widget geometry.

import type { ClassWorkspace, PageWidget, ScreenId, VibePage } from '../data/types'
import { buildClassWorkspaces } from '../data/pageSequences'
import { isInvalidGeometry, normalizeRect } from './studioCanvasGeometry'

export type Workspaces = Record<ScreenId, ClassWorkspace | undefined>

function normalizeWidget(widget: PageWidget, fallback: PageWidget | undefined, index: number): PageWidget {
  const rect = { x: widget.x, y: widget.y, width: widget.width, height: widget.height }
  const needsSeed = isInvalidGeometry(rect)
  if (!needsSeed) {
    return { ...widget, ...normalizeRect(rect) }
  }
  if (fallback) {
    return { ...fallback, id: widget.id, type: widget.type, locked: widget.locked, visible: widget.visible }
  }
  // No matching seeded widget (e.g. a stray/unknown widget id) — fall back
  // to a safe on-canvas box rather than dropping it.
  return { ...widget, ...normalizeRect({ x: 64 + index * 24, y: 64 + index * 24, width: 400, height: 240 }) }
}

function normalizePage(persistedPage: VibePage, freshPage: VibePage): VibePage {
  const freshById = new Map(freshPage.widgets.map((w) => [w.id, w]))
  const seenIds = new Set<string>()

  const persistedWidgets = Array.isArray(persistedPage.widgets) ? persistedPage.widgets : []

  const normalizedWidgets: PageWidget[] = persistedWidgets
    .filter((w) => w && typeof w.id === 'string')
    .filter((w) => {
      // Guard against duplicate widget IDs making layout ambiguous — keep
      // only the first occurrence of each id.
      if (seenIds.has(w.id)) return false
      seenIds.add(w.id)
      return true
    })
    .map((w, index) => {
      const normalized = normalizeWidget(w, freshById.get(w.id), index)
      // Phase 9B: homeroom Morning Message page uses dedicated widget type.
      if (
        persistedPage.id === 'homeroom-morning-message' &&
        normalized.type === 'reminders' &&
        freshPage.widgets.some((fw) => fw.type === 'morning-message')
      ) {
        return { ...normalized, type: 'morning-message' }
      }
      return normalized
    })

  // Seed any widget present in the fresh definition but missing entirely
  // from the persisted page (e.g. an older save from before this widget
  // type existed on the page).
  const normalizedIds = new Set(normalizedWidgets.map((w) => w.id))
  for (const freshWidget of freshPage.widgets) {
    if (!normalizedIds.has(freshWidget.id)) {
      normalizedWidgets.push({ ...freshWidget })
    }
  }

  if (normalizedWidgets.length === 0 && freshPage.widgets.length > 0) {
    return {
      ...persistedPage,
      widgets: freshPage.widgets.map((w) => ({ ...w })),
      widgetIds: freshPage.widgets.map((w) => w.id),
    }
  }

  return {
    ...persistedPage,
    widgets: normalizedWidgets,
    widgetIds: normalizedWidgets.map((w) => w.id),
  }
}

/**
 * Merge persisted classWorkspaces with freshly-built ones: page order,
 * titles, and navigation links always come from the fresh build (the
 * source of truth for the current app version); widget geometry/lock/
 * visible state is preserved from the persisted data when valid, and
 * seeded from the fresh build when missing, invalid, or placeholder-like.
 */
export function normalizeClassWorkspacesGeometry(
  persisted: Workspaces | undefined | null,
): Workspaces {
  const fresh = buildClassWorkspaces()
  if (!persisted) return fresh

  const result: Workspaces = { ...fresh }

  for (const classId of Object.keys(fresh) as ScreenId[]) {
    const freshWs = fresh[classId]
    const persistedWs = persisted[classId]
    if (!freshWs) continue
    if (!persistedWs || !Array.isArray(persistedWs.pages)) {
      result[classId] = freshWs
      continue
    }

    const persistedPagesById = new Map(persistedWs.pages.filter((p) => p && p.id).map((p) => [p.id, p]))

    const mergedPages = freshWs.pages.map((freshPage) => {
      const persistedPage = persistedPagesById.get(freshPage.id)
      if (!persistedPage) return freshPage
      return normalizePage(persistedPage, freshPage)
    })

    const activePageId =
      persistedWs.activePageId && mergedPages.some((p) => p.id === persistedWs.activePageId)
        ? persistedWs.activePageId
        : freshWs.activePageId

    const activeIndex = mergedPages.findIndex((p) => p.id === activePageId)

    result[classId] = {
      ...freshWs,
      pages: mergedPages,
      activePageId,
      previousPageId: activeIndex > 0 ? mergedPages[activeIndex - 1].id : null,
      nextPageId: activeIndex >= 0 && activeIndex < mergedPages.length - 1 ? mergedPages[activeIndex + 1].id : null,
    }
  }

  return result
}
