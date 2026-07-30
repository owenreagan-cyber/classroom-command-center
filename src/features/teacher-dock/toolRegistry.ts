import type { ToolDefinition, ToolId, ToolStatus } from './types'

/** Canonical registry of deployable teacher tools. */
export const TEACHER_TOOL_REGISTRY: readonly ToolDefinition[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    category: 'daily',
    icon: '📊',
    status: 'active',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'dashboard',
    description: 'Today overview, schedule, and quick actions.',
  },
  {
    id: 'timers',
    title: 'Timers',
    category: 'daily',
    icon: '⏱',
    status: 'active',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'timers',
    description: 'Start, pause, and configure classroom timers.',
  },
  {
    id: 'classroom-atmosphere',
    title: 'Classroom Atmosphere',
    category: 'daily',
    icon: '🎵',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'classroom-atmosphere',
    description: 'Background music and display indicator.',
  },
  {
    id: 'morning-message',
    title: 'Morning Message',
    category: 'daily',
    icon: '☀️',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'morning-message',
    description: 'Edit the morning message studio content.',
  },
  {
    id: 'today-prep',
    title: 'Today Prep',
    category: 'daily',
    icon: '📋',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'today-prep',
    description: 'Daily prep checklist and block timeline.',
  },
  {
    id: 'curriculum-sync',
    title: 'Curriculum Sync',
    category: 'daily',
    icon: '📚',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'curriculum-sync',
    description: 'Sync curriculum library from Google Drive.',
  },
  {
    id: 'mystery-star',
    title: 'Mystery Star',
    category: 'students',
    icon: '⭐',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'mystery-star',
    description: 'Run mystery student sessions and observations.',
  },
  {
    id: 'quick-picker',
    title: 'Quick Picker',
    category: 'students',
    icon: '🎯',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'quick-picker',
    description: 'Fair random student selection.',
  },
  {
    id: 'prize-board',
    title: 'Prize Board',
    category: 'students',
    icon: '🎁',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'prize-board',
    description: 'Configure and run the prize board game.',
  },
  {
    id: 'random-number',
    title: 'Random Number',
    category: 'students',
    icon: '🔢',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'random-number',
    description: 'Draw random numbers with optional no-repeat mode.',
  },
  {
    id: 'materials',
    title: 'Materials',
    category: 'instruction',
    icon: '📚',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'materials',
    description: 'Launch lesson materials with Open With presets.',
  },
  {
    id: 'display',
    title: 'Display',
    category: 'instruction',
    icon: '🖥',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'display',
    description: 'Open projector display and launch controls.',
  },
  {
    id: 'omninote',
    title: 'OmniNote',
    category: 'instruction',
    icon: '📝',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'omninote',
    description: 'Hand off lesson resources to OmniNote on iPad.',
  },
  {
    id: 'jobs',
    title: 'Jobs',
    category: 'management',
    icon: '🧰',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'jobs',
    description: 'Daily brief templates and classroom job prompts.',
  },
  {
    id: 'noise',
    title: 'Noise Control',
    category: 'management',
    icon: '🔊',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'noise',
    description: 'Voice level towers and noise tracker reset.',
  },
  {
    id: 'board-control',
    title: 'Board Control',
    category: 'management',
    icon: '🎛',
    status: 'docked',
    permissions: ['teacher-only', 'control-route-only'],
    componentId: 'board-control',
    description: 'Screens, background, presets, backup, and board actions.',
  },
] as const

const REGISTRY_BY_ID = new Map<ToolId, ToolDefinition>(
  TEACHER_TOOL_REGISTRY.map((tool) => [tool.id, tool]),
)

export function getToolById(id: ToolId): ToolDefinition | undefined {
  return REGISTRY_BY_ID.get(id)
}

/** Tools visible in the dock launcher (excludes inactive). */
export function getLauncherTools(
  order: ToolId[],
  favorites: ToolId[],
): ToolDefinition[] {
  const visible = TEACHER_TOOL_REGISTRY.filter((tool) => tool.status !== 'inactive')
  const orderIndex = new Map(order.map((id, index) => [id, index]))

  return [...visible].sort((a, b) => {
    const aFav = favorites.includes(a.id)
    const bFav = favorites.includes(b.id)
    if (aFav !== bFav) return aFav ? -1 : 1
    const aOrder = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER
    const bOrder = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.title.localeCompare(b.title)
  })
}

export function isToolLaunchable(status: ToolStatus): boolean {
  return status === 'active' || status === 'docked'
}

export function getDefaultDockOrder(): ToolId[] {
  return TEACHER_TOOL_REGISTRY.filter((tool) => isToolLaunchable(tool.status)).map(
    (tool) => tool.id,
  )
}

export function getDefaultFavoriteToolIds(): ToolId[] {
  return TEACHER_TOOL_REGISTRY.filter((tool) => tool.status === 'active').map(
    (tool) => tool.id,
  )
}

/** Teacher dock registry must never mount on the display route. */
export function shouldExposeToolRegistryOnRoute(route: 'control' | 'display'): boolean {
  return route === 'control'
}
