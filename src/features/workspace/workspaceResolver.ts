import type { ToolDefinition, ToolId } from '../teacher-dock/types'
import { getLauncherTools, isToolLaunchable } from '../teacher-dock/toolRegistry'
import { getToolById } from '../teacher-dock/toolRegistry'
import type { ScreenId } from '../../data/types'
import type { TeachingWorkspace, TeachingWorkspaceId } from './types'
import { getWorkspaceById } from './workspaceRegistry'
import {
  getPromotedToolIdsForSubject,
  resolveSubjectFromScreen,
} from '../curriculum/pacingResolver'
import { resolveFetchedLessonForScreen } from '../curriculum-library-fetcher/libraryIndexStore'
import type { LibraryLessonPackage as FetcherLessonPackage } from '../curriculum-library-fetcher/types'

export interface WorkspaceToolPriority {
  toolId: ToolId
  priority: 'promoted' | 'active' | 'available' | 'deprioritized'
}

/** Resolve priority tier for a tool within the active workspace. */
export function getToolPriorityInWorkspace(
  toolId: ToolId,
  workspace: TeachingWorkspace | undefined,
): WorkspaceToolPriority['priority'] {
  if (!workspace) return 'available'
  if (workspace.promotedToolIds.includes(toolId)) return 'promoted'
  if (workspace.activeToolIds.includes(toolId)) return 'active'
  return 'deprioritized'
}

/** Workspace-aware launcher ordering — promotes workspace tools, never hides any. */
export function getWorkspaceAwareLauncherTools(
  order: ToolId[],
  favorites: ToolId[],
  workspaceId: TeachingWorkspaceId | null,
): ToolDefinition[] {
  const base = getLauncherTools(order, favorites)
  const workspace = workspaceId ? getWorkspaceById(workspaceId) : undefined
  if (!workspace) return base

  const priorityRank: Record<WorkspaceToolPriority['priority'], number> = {
    promoted: 0,
    active: 1,
    available: 2,
    deprioritized: 3,
  }

  return [...base].sort((a, b) => {
    const aPriority = priorityRank[getToolPriorityInWorkspace(a.id, workspace)]
    const bPriority = priorityRank[getToolPriorityInWorkspace(b.id, workspace)]
    if (aPriority !== bPriority) return aPriority - bPriority

    const aFav = favorites.includes(a.id)
    const bFav = favorites.includes(b.id)
    if (aFav !== bFav) return aFav ? -1 : 1

    const orderIndex = new Map(order.map((id, index) => [id, index]))
    const aOrder = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER
    const bOrder = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.title.localeCompare(b.title)
  })
}

/** Tools active in a workspace that are launchable. */
export function getActiveWorkspaceTools(workspaceId: TeachingWorkspaceId): ToolDefinition[] {
  const workspace = getWorkspaceById(workspaceId)
  if (!workspace) return []
  return workspace.activeToolIds
    .map((id) => getToolById(id))
    .filter((tool): tool is ToolDefinition => Boolean(tool && isToolLaunchable(tool.status)))
}

/** Promoted tools for edge launcher quick access. */
export function getPromotedWorkspaceTools(workspaceId: TeachingWorkspaceId): ToolDefinition[] {
  const workspace = getWorkspaceById(workspaceId)
  if (!workspace) return []
  return workspace.promotedToolIds
    .map((id) => getToolById(id))
    .filter((tool): tool is ToolDefinition => Boolean(tool && isToolLaunchable(tool.status)))
}

/** Current lesson package for workspace context (fetcher index + pacing). */
export function getCurrentLessonContext(
  activeScreen: ScreenId | null,
  packages: Record<string, FetcherLessonPackage> = {},
  date = new Date(),
): FetcherLessonPackage | null {
  if (!activeScreen) return null
  return resolveFetchedLessonForScreen(activeScreen, packages, date)
}

/** Workspace id for the active lesson context. */
export function resolveWorkspaceForLessonContext(
  lesson: FetcherLessonPackage | null,
  fallbackWorkspaceId: TeachingWorkspaceId | null,
): TeachingWorkspaceId | null {
  if (lesson?.workspace) return lesson.workspace
  return fallbackWorkspaceId
}

/** Lesson-context promoted tools — uses subject pacing when screen maps to a lesson. */
export function getLessonAwarePromotedTools(
  activeScreen: ScreenId | null,
  date = new Date(),
): ToolDefinition[] {
  if (!activeScreen) return []
  const subjectId = resolveSubjectFromScreen(activeScreen, date)
  if (!subjectId) return []
  return getPromotedToolIdsForSubject(subjectId)
    .map((id) => getToolById(id))
    .filter((tool): tool is ToolDefinition => Boolean(tool && isToolLaunchable(tool.status)))
}

/** Workspace launcher with optional lesson-context promotion ordering. */
export function getLessonAwareLauncherTools(
  order: ToolId[],
  favorites: ToolId[],
  workspaceId: TeachingWorkspaceId | null,
  activeScreen: ScreenId | null = null,
  date = new Date(),
): ToolDefinition[] {
  const lessonTools = getLessonAwarePromotedTools(activeScreen, date)
  if (lessonTools.length === 0) {
    return getWorkspaceAwareLauncherTools(order, favorites, workspaceId)
  }

  const lessonToolIds = new Set(lessonTools.map((tool) => tool.id))
  const base = getLauncherTools(order, favorites)
  const workspace = workspaceId ? getWorkspaceById(workspaceId) : undefined

  return [...base].sort((a, b) => {
    const aLesson = lessonToolIds.has(a.id)
    const bLesson = lessonToolIds.has(b.id)
    if (aLesson !== bLesson) return aLesson ? -1 : 1

    const aPriority = getToolPriorityInWorkspace(a.id, workspace)
    const bPriority = getToolPriorityInWorkspace(b.id, workspace)
    const priorityRank = { promoted: 0, active: 1, available: 2, deprioritized: 3 }
    if (priorityRank[aPriority] !== priorityRank[bPriority]) {
      return priorityRank[aPriority] - priorityRank[bPriority]
    }

    const aFav = favorites.includes(a.id)
    const bFav = favorites.includes(b.id)
    if (aFav !== bFav) return aFav ? -1 : 1

    const orderIndex = new Map(order.map((id, index) => [id, index]))
    return (orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  })
}

export function resolveWorkspaceForToolLaunch(
  workspaceId: TeachingWorkspaceId,
  toolId: ToolId,
): { allowed: boolean; reason: string | null } {
  const workspace = getWorkspaceById(workspaceId)
  if (!workspace) {
    return { allowed: true, reason: null }
  }
  const tool = getToolById(toolId)
  if (!tool || !isToolLaunchable(tool.status)) {
    return { allowed: false, reason: 'Tool is not launchable.' }
  }
  return { allowed: true, reason: null }
}
