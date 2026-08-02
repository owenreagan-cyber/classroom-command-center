import type { ToolId } from '../teacher-dock/types'
import type { DeviceRole } from '../device-manager/types'
import type { TeachingWorkspaceId } from '../workspace/types'

export type DisplayTarget = 'student-display' | 'optional' | 'none'

export interface ToolCapability {
  requiredDeviceRole: DeviceRole
  displayTarget: DisplayTarget
  permissions: readonly ('teacher-only' | 'control-route-only')[]
  modeSupport: readonly TeachingWorkspaceId[]
}

export type ToolCapabilityMap = Record<ToolId, ToolCapability>

/** Device and workspace requirements for each teacher dock tool. */
export const TOOL_CAPABILITY_REGISTRY: ToolCapabilityMap = {
  dashboard: {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'none',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['morning'],
  },
  timers: {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'optional',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['morning', 'math', 'shurley', 'transition'],
  },
  'classroom-atmosphere': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'optional',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['morning', 'reading', 'reward', 'transition'],
  },
  'morning-message': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'student-display',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['morning'],
  },
  'today-prep': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'none',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['morning'],
  },
  'curriculum-sync': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'none',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['morning'],
  },
  'mystery-star': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'student-display',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['reading'],
  },
  'quick-picker': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'optional',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: [],
  },
  'prize-board': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'student-display',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['reward'],
  },
  'random-number': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'student-display',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: [],
  },
  materials: {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'optional',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['math', 'reading', 'shurley'],
  },
  display: {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'student-display',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['math', 'shurley', 'reward'],
  },
  'display-composer': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'student-display',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['morning', 'math', 'reading', 'shurley', 'transition'],
  },
  omninote: {
    requiredDeviceRole: 'omninote-controller',
    displayTarget: 'student-display',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['math', 'reading', 'shurley'],
  },
  jobs: {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'none',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: [],
  },
  noise: {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'optional',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: ['transition'],
  },
  'board-control': {
    requiredDeviceRole: 'teacher-command-center',
    displayTarget: 'none',
    permissions: ['teacher-only', 'control-route-only'],
    modeSupport: [],
  },
}

export function getToolCapability(toolId: ToolId): ToolCapability {
  return TOOL_CAPABILITY_REGISTRY[toolId]
}

export function toolSupportsWorkspace(toolId: ToolId, workspaceId: TeachingWorkspaceId): boolean {
  const capability = getToolCapability(toolId)
  return capability.modeSupport.includes(workspaceId)
}

export function getToolsForWorkspace(workspaceId: TeachingWorkspaceId): ToolId[] {
  return (Object.keys(TOOL_CAPABILITY_REGISTRY) as ToolId[]).filter((toolId) =>
    toolSupportsWorkspace(toolId, workspaceId),
  )
}
