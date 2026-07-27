import {
  WORKSPACE_STORAGE_VERSION,
  type TeachingWorkspaceId,
  type WorkspacePersistedState,
} from './types'
import { getDefaultWorkspace, isValidWorkspaceId } from './workspaceRegistry'

export const DEFAULT_WORKSPACE_STATE: WorkspacePersistedState = {
  version: WORKSPACE_STORAGE_VERSION,
  activeWorkspaceId: getDefaultWorkspace().id,
  favoriteWorkspaceId: null,
  lastActiveWorkspaceId: getDefaultWorkspace().id,
}

function sanitizeWorkspaceId(
  raw: unknown,
  fallback: TeachingWorkspaceId,
): TeachingWorkspaceId {
  return isValidWorkspaceId(raw) ? raw : fallback
}

export function hydrateWorkspaceState(persisted: unknown): WorkspacePersistedState {
  const raw = (persisted ?? {}) as Partial<WorkspacePersistedState>
  const activeWorkspaceId = sanitizeWorkspaceId(
    raw.activeWorkspaceId,
    DEFAULT_WORKSPACE_STATE.activeWorkspaceId,
  )
  const favoriteWorkspaceId = isValidWorkspaceId(raw.favoriteWorkspaceId)
    ? raw.favoriteWorkspaceId
    : null
  const lastActiveWorkspaceId = sanitizeWorkspaceId(
    raw.lastActiveWorkspaceId ?? activeWorkspaceId,
    activeWorkspaceId,
  )

  return {
    version: WORKSPACE_STORAGE_VERSION,
    activeWorkspaceId,
    favoriteWorkspaceId,
    lastActiveWorkspaceId,
  }
}

export function serializeWorkspaceState(state: WorkspacePersistedState): string {
  return JSON.stringify({
    version: state.version,
    activeWorkspaceId: state.activeWorkspaceId,
    favoriteWorkspaceId: state.favoriteWorkspaceId,
    lastActiveWorkspaceId: state.lastActiveWorkspaceId,
  })
}

export function parsePersistedWorkspaceState(json: string): WorkspacePersistedState {
  return hydrateWorkspaceState(JSON.parse(json) as unknown)
}
