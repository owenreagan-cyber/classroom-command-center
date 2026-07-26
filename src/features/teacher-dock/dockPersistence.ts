import {
  DOCK_STORAGE_VERSION,
  type DockPersistedState,
  type ToolId,
} from './types'
import {
  getDefaultDockOrder,
  getDefaultFavoriteToolIds,
  getToolById,
  isToolLaunchable,
} from './toolRegistry'

export function sanitizeToolId(id: unknown): ToolId | null {
  if (typeof id !== 'string') return null
  const tool = getToolById(id as ToolId)
  if (!tool || !isToolLaunchable(tool.status)) return null
  return tool.id
}

export function sanitizeToolIds(ids: unknown, fallback: ToolId[]): ToolId[] {
  if (!Array.isArray(ids)) return fallback
  const seen = new Set<ToolId>()
  const result: ToolId[] = []
  for (const raw of ids) {
    const id = sanitizeToolId(raw)
    if (id && !seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }
  return result.length > 0 ? result : fallback
}

export const DEFAULT_DOCK_STATE: DockPersistedState = {
  version: DOCK_STORAGE_VERSION,
  collapsed: true,
  favoriteToolIds: getDefaultFavoriteToolIds(),
  dockOrder: getDefaultDockOrder(),
  activeToolId: 'dashboard',
}

/** Hydrate persisted JSON into a safe dock state (mirrors zustand migrate). */
export function hydrateDockState(persisted: unknown): DockPersistedState {
  const raw = (persisted ?? {}) as Partial<DockPersistedState>
  return {
    version: DOCK_STORAGE_VERSION,
    collapsed: raw.collapsed ?? DEFAULT_DOCK_STATE.collapsed,
    favoriteToolIds: sanitizeToolIds(
      raw.favoriteToolIds,
      DEFAULT_DOCK_STATE.favoriteToolIds,
    ),
    dockOrder: sanitizeToolIds(raw.dockOrder, DEFAULT_DOCK_STATE.dockOrder),
    activeToolId:
      sanitizeToolId(raw.activeToolId) ?? DEFAULT_DOCK_STATE.activeToolId,
  }
}

/** Serialize dock state for persistence round-trip tests. */
export function serializeDockState(state: DockPersistedState): string {
  return JSON.stringify({
    version: state.version,
    collapsed: state.collapsed,
    favoriteToolIds: state.favoriteToolIds,
    dockOrder: state.dockOrder,
    activeToolId: state.activeToolId,
  })
}

export function parsePersistedDockState(json: string): DockPersistedState {
  return hydrateDockState(JSON.parse(json) as unknown)
}
