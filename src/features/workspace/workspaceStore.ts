import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_STORAGE_VERSION,
  type TeachingWorkspaceId,
  type WorkspacePersistedState,
} from './types'
import {
  DEFAULT_WORKSPACE_STATE,
  hydrateWorkspaceState,
} from './workspacePersistence'
import { getWorkspaceById } from './workspaceRegistry'

interface WorkspaceStore extends WorkspacePersistedState {
  setActiveWorkspace: (workspaceId: TeachingWorkspaceId) => void
  setFavoriteWorkspace: (workspaceId: TeachingWorkspaceId | null) => void
  getActiveWorkspace: () => ReturnType<typeof getWorkspaceById>
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_WORKSPACE_STATE,

      setActiveWorkspace: (workspaceId) => {
        if (!getWorkspaceById(workspaceId)) return
        set({
          activeWorkspaceId: workspaceId,
          lastActiveWorkspaceId: workspaceId,
        })
      },

      setFavoriteWorkspace: (workspaceId) => {
        if (workspaceId !== null && !getWorkspaceById(workspaceId)) return
        set({ favoriteWorkspaceId: workspaceId })
      },

      getActiveWorkspace: () => getWorkspaceById(get().activeWorkspaceId),
    }),
    {
      name: WORKSPACE_STORAGE_KEY,
      version: WORKSPACE_STORAGE_VERSION,
      partialize: (state) => ({
        version: state.version,
        activeWorkspaceId: state.activeWorkspaceId,
        favoriteWorkspaceId: state.favoriteWorkspaceId,
        lastActiveWorkspaceId: state.lastActiveWorkspaceId,
      }),
      migrate: (persisted) => hydrateWorkspaceState(persisted),
    },
  ),
)

export const selectActiveWorkspaceId = (state: WorkspaceStore) => state.activeWorkspaceId
export const selectFavoriteWorkspaceId = (state: WorkspaceStore) => state.favoriteWorkspaceId
