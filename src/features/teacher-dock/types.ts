import type { ComponentType } from 'react'

/** Tool categories in the teacher command dock launcher. */
export type ToolCategory = 'daily' | 'students' | 'instruction' | 'management'

/**
 * Tool lifecycle in the registry:
 * - active: featured in launcher and eligible as default
 * - docked: available in launcher
 * - inactive: registered but hidden from launcher (e.g. optional modules)
 */
export type ToolStatus = 'active' | 'docked' | 'inactive'

/** Route and surface permissions for a tool. */
export type ToolPermission = 'teacher-only' | 'control-route-only'

export type ToolId =
  | 'dashboard'
  | 'timers'
  | 'classroom-atmosphere'
  | 'morning-message'
  | 'today-prep'
  | 'curriculum-sync'
  | 'mystery-star'
  | 'quick-picker'
  | 'prize-board'
  | 'random-number'
  | 'materials'
  | 'display'
  | 'omninote'
  | 'jobs'
  | 'noise'
  | 'board-control'

export interface ToolDefinition {
  id: ToolId
  title: string
  category: ToolCategory
  icon: string
  status: ToolStatus
  permissions: ToolPermission[]
  componentId: ToolId
  description: string
}

export type ToolPanelProps = Record<string, never>

export type ToolPanelComponent = ComponentType

export interface DockPersistedState {
  version: 1
  collapsed: boolean
  favoriteToolIds: ToolId[]
  dockOrder: ToolId[]
  activeToolId: ToolId | null
}

export const DOCK_STORAGE_KEY = 'teacher-command-dock-v1'
export const DOCK_STORAGE_VERSION = 1 as const
