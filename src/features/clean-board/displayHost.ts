import type { BoardPage, BoardState, DisplayModeId, SavedLayout } from './types'
import { getTemplatePack, templateToBoardPage } from './templatePacks'
import type { ClassroomTemplateId } from './templatePacks'
import { projectPageForDisplayMode } from './displayModes'
import { toSafeBoardPage } from './boardSafety'
import { loadAutosaveLayout, loadPersistedBoardState } from './storage/boardStorage'

/**
 * DB-7A — Clean Board host display state resolver.
 *
 * The M1 `/display` route renders normal Clean Board content, never a parallel
 * display-only model. This module resolves *which* board to project and the
 * display-mode preference to apply, then projects it through the exact same
 * student-safe path (`toSafeBoardPage` → `projectPageForDisplayMode`) used by
 * `/board-lab?mode=present`.
 *
 * Priority:
 *   1. active scene  → its referenced layout + scene display mode
 *   2. active layout → that layout + its display mode
 *   3. autosave      → the last teacher-authored page
 *   4. default       → "Morning Arrival — New Classroom" template
 *
 * Pure resolver (no DOM) is separated from the localStorage-backed loader so
 * the resolution logic is unit-testable without a browser.
 */

export type HostDisplaySource = 'scene' | 'layout' | 'autosave' | 'default'

export interface HostDisplayState {
  page: BoardPage
  displayModeId: DisplayModeId
  source: HostDisplaySource
}

/** The classroom-safe default shown on a fresh M1 with no saved scene. */
const DEFAULT_HOST_TEMPLATE_ID: ClassroomTemplateId = 'morningArrivalNewClassroom'

function pageFromLayout(layout: SavedLayout, title?: string): BoardPage {
  return {
    id: layout.id,
    title: title ?? layout.name,
    background: layout.background,
    theme: layout.theme,
    objects: layout.objects,
  }
}

/** The default board (Morning Arrival — New Classroom) as a normal `BoardPage`. */
export function defaultHostDisplayPage(): BoardPage {
  return templateToBoardPage(getTemplatePack(DEFAULT_HOST_TEMPLATE_ID))
}

/**
 * Resolve the active board + display mode from persisted state. Never throws:
 * missing/corrupt references fall through to the default template.
 */
export function resolveHostDisplayPage(
  state: BoardState | null,
  autosave: SavedLayout | null,
): HostDisplayState {
  if (state) {
    if (state.activeSceneId) {
      const scene = state.scenes.find((s) => s.id === state.activeSceneId)
      const layout = scene ? state.layouts.find((l) => l.id === scene.layoutId) : undefined
      if (scene && layout) {
        return {
          page: pageFromLayout(layout, scene.name),
          displayModeId: scene.displayModeId,
          source: 'scene',
        }
      }
    }
    if (state.activeLayoutId) {
      const layout = state.layouts.find((l) => l.id === state.activeLayoutId)
      if (layout) {
        return {
          page: pageFromLayout(layout),
          displayModeId: layout.displayModeId,
          source: 'layout',
        }
      }
    }
  }
  if (autosave) {
    return {
      page: pageFromLayout(autosave),
      displayModeId: autosave.displayModeId,
      source: 'autosave',
    }
  }
  const pack = getTemplatePack(DEFAULT_HOST_TEMPLATE_ID)
  return {
    page: templateToBoardPage(pack),
    displayModeId: pack.displayModeId,
    source: 'default',
  }
}

/** Student-safe, display-mode-projected page for the host route. */
export function projectHostDisplayPage(state: HostDisplayState): BoardPage {
  return projectPageForDisplayMode(toSafeBoardPage(state.page), state.displayModeId)
}

/** Thin localStorage-backed loader for the browser (guarded for SSR/build). */
export function loadHostDisplayState(): HostDisplayState {
  return resolveHostDisplayPage(loadPersistedBoardState(), loadAutosaveLayout())
}
