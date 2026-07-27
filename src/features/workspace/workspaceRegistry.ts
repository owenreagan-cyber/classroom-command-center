import type { TeachingWorkspace, TeachingWorkspaceId } from './types'

/** Canonical teaching workspaces that combine dock tools for classroom modes. */
export const TEACHING_WORKSPACE_REGISTRY: readonly TeachingWorkspace[] = [
  {
    id: 'morning',
    name: 'Morning Mode',
    description: 'Start the day with schedule, message, atmosphere, and timers.',
    activeToolIds: ['dashboard', 'morning-message', 'classroom-atmosphere', 'timers'],
    promotedToolIds: ['dashboard', 'morning-message', 'classroom-atmosphere', 'timers'],
    icon: '☀️',
  },
  {
    id: 'math',
    name: 'Math Mode',
    description: 'Instruction block with timers, materials, OmniNote, and display.',
    activeToolIds: ['timers', 'materials', 'omninote', 'display'],
    promotedToolIds: ['omninote', 'materials', 'timers', 'display'],
    icon: '🔢',
  },
  {
    id: 'reading',
    name: 'Reading Mode',
    description: 'Literacy block with materials, atmosphere, OmniNote, and mystery star.',
    activeToolIds: ['materials', 'classroom-atmosphere', 'omninote', 'mystery-star'],
    promotedToolIds: ['materials', 'omninote', 'classroom-atmosphere', 'mystery-star'],
    icon: '📖',
  },
  {
    id: 'shurley',
    name: 'Shurley Workspace',
    description: 'Grammar and writing block with OmniNote, materials, display, and timers.',
    activeToolIds: ['omninote', 'materials', 'display', 'timers'],
    promotedToolIds: ['omninote', 'materials', 'display', 'timers'],
    icon: '✏️',
  },
  {
    id: 'reward',
    name: 'Reward Mode',
    description: 'Celebration block with prize board, atmosphere, and display.',
    activeToolIds: ['prize-board', 'classroom-atmosphere', 'display'],
    promotedToolIds: ['prize-board', 'classroom-atmosphere', 'display'],
    icon: '🎁',
  },
  {
    id: 'transition',
    name: 'Transition Mode',
    description: 'Between blocks with timers, music, and noise tools.',
    activeToolIds: ['timers', 'classroom-atmosphere', 'noise'],
    promotedToolIds: ['timers', 'classroom-atmosphere', 'noise'],
    icon: '🔄',
  },
] as const

const REGISTRY_BY_ID = new Map<TeachingWorkspaceId, TeachingWorkspace>(
  TEACHING_WORKSPACE_REGISTRY.map((workspace) => [workspace.id, workspace]),
)

export function getWorkspaceById(id: TeachingWorkspaceId): TeachingWorkspace | undefined {
  return REGISTRY_BY_ID.get(id)
}

export function getDefaultWorkspace(): TeachingWorkspace {
  return TEACHING_WORKSPACE_REGISTRY[0]
}

export function isValidWorkspaceId(id: unknown): id is TeachingWorkspaceId {
  return typeof id === 'string' && REGISTRY_BY_ID.has(id as TeachingWorkspaceId)
}

export function getAllWorkspaceIds(): TeachingWorkspaceId[] {
  return TEACHING_WORKSPACE_REGISTRY.map((workspace) => workspace.id)
}
