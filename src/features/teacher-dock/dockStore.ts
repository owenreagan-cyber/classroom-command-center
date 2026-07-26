import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DOCK_STORAGE_KEY,
  DOCK_STORAGE_VERSION,
  type DockPersistedState,
  type ToolId,
} from './types'
import {
  getToolById,
  isToolLaunchable,
} from './toolRegistry'
import {
  DEFAULT_DOCK_STATE,
  hydrateDockState,
  sanitizeToolIds,
} from './dockPersistence'

interface DockStore extends DockPersistedState {
  toggleCollapsed: () => void
  setCollapsed: (collapsed: boolean) => void
  setActiveTool: (toolId: ToolId | null) => void
  toggleFavorite: (toolId: ToolId) => void
  reorderDock: (toolIds: ToolId[]) => void
}

export const useDockStore = create<DockStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_DOCK_STATE,

      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),

      setCollapsed: (collapsed) => set({ collapsed }),

      setActiveTool: (toolId) => {
        if (toolId === null) {
          set({ activeToolId: null })
          return
        }
        const tool = getToolById(toolId)
        if (!tool || !isToolLaunchable(tool.status)) return
        set({ activeToolId: toolId })
      },

      toggleFavorite: (toolId) => {
        const tool = getToolById(toolId)
        if (!tool || !isToolLaunchable(tool.status)) return
        set((state) => {
          const favorites = state.favoriteToolIds.includes(toolId)
            ? state.favoriteToolIds.filter((id) => id !== toolId)
            : [...state.favoriteToolIds, toolId]
          return { favoriteToolIds: favorites }
        })
      },

      reorderDock: (toolIds) => {
        set({ dockOrder: sanitizeToolIds(toolIds, get().dockOrder) })
      },
    }),
    {
      name: DOCK_STORAGE_KEY,
      version: DOCK_STORAGE_VERSION,
      partialize: (state) => ({
        version: state.version,
        collapsed: state.collapsed,
        favoriteToolIds: state.favoriteToolIds,
        dockOrder: state.dockOrder,
        activeToolId: state.activeToolId,
      }),
      migrate: (persisted) => hydrateDockState(persisted),
    },
  ),
)

/** Selector helpers — use in components to avoid broad subscriptions. */
export const selectDockCollapsed = (state: DockStore) => state.collapsed
export const selectActiveToolId = (state: DockStore) => state.activeToolId
export const selectFavoriteToolIds = (state: DockStore) => state.favoriteToolIds
export const selectDockOrder = (state: DockStore) => state.dockOrder
