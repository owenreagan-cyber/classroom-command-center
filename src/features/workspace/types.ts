import type { ToolId } from '../teacher-dock/types'

export type TeachingWorkspaceId =
  | 'morning'
  | 'math'
  | 'reading'
  | 'shurley'
  | 'reward'
  | 'transition'

export interface TeachingWorkspace {
  id: TeachingWorkspaceId
  name: string
  description: string
  activeToolIds: readonly ToolId[]
  promotedToolIds: readonly ToolId[]
  icon: string
}

export interface WorkspacePersistedState {
  version: 1
  activeWorkspaceId: TeachingWorkspaceId
  favoriteWorkspaceId: TeachingWorkspaceId | null
  lastActiveWorkspaceId: TeachingWorkspaceId
}

export const WORKSPACE_STORAGE_KEY = 'classroom-workspace-v1'
export const WORKSPACE_STORAGE_VERSION = 1 as const
