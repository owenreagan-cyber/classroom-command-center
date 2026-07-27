import { memo, useMemo } from 'react'
import type { ToolCategory, ToolId } from '../types'
import type { ToolDefinition } from '../types'
import { getWorkspaceById, getAllWorkspaceIds } from '../../workspace/workspaceRegistry'
import {
  getLessonAwareLauncherTools,
  getToolPriorityInWorkspace,
} from '../../workspace/workspaceResolver'
import { useWorkspaceStore, selectActiveWorkspaceId } from '../../workspace/workspaceStore'
import { useTeacherDockContext } from '../useTeacherDockContext'
import { DockToolCard } from './DockToolCard'
import { resolveFetchedLessonForScreen, getLessonReadinessStatusLabel } from '../../curriculum-library-fetcher/libraryIndexStore'
import { useLibraryIndexStore } from '../../curriculum-library-fetcher/libraryIndexStore'
import { useReadinessStore } from '../../curriculum-readiness/readinessStore'

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  daily: 'Daily',
  students: 'Students',
  instruction: 'Instruction',
  management: 'Management',
}

interface DockLauncherPanelProps {
  favoriteToolIds: ToolId[]
  dockOrder: ToolId[]
  activeToolId: ToolId | null
  onSelectTool: (toolId: ToolId) => void
  onToggleFavorite: (toolId: ToolId) => void
}

export const DockLauncherPanel = memo(function DockLauncherPanel({
  favoriteToolIds,
  dockOrder,
  activeToolId,
  onSelectTool,
  onToggleFavorite,
}: DockLauncherPanelProps) {
  const { activeScreen } = useTeacherDockContext()
  const activeWorkspaceId = useWorkspaceStore(selectActiveWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)
  const fetcherPackages = useLibraryIndexStore((state) => state.packages)
  const teacherOverrides = useReadinessStore((state) => state.teacherOverrides)
  const scorePackage = useReadinessStore((state) => state.scorePackage)
  const activeWorkspace = useMemo(
    () => getWorkspaceById(activeWorkspaceId),
    [activeWorkspaceId],
  )

  const currentLesson = useMemo(
    () => resolveFetchedLessonForScreen(activeScreen, fetcherPackages),
    [activeScreen, fetcherPackages],
  )

  const lessonOverrideActive =
    currentLesson != null && teacherOverrides[currentLesson.id] === true

  const lessonReadiness = useMemo(() => {
    if (!currentLesson) return null
    return scorePackage(currentLesson)
  }, [currentLesson, scorePackage, lessonOverrideActive])

  const launcherTools = useMemo(
    () =>
      getLessonAwareLauncherTools(
        dockOrder,
        favoriteToolIds,
        activeWorkspaceId,
        activeScreen,
      ),
    [dockOrder, favoriteToolIds, activeWorkspaceId, activeScreen],
  )

  const grouped = useMemo(() => {
    const groups = new Map<ToolCategory, ToolDefinition[]>()
    for (const tool of launcherTools) {
      const list = groups.get(tool.category) ?? []
      list.push(tool)
      groups.set(tool.category, list)
    }
    return groups
  }, [launcherTools])

  return (
    <div
      className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-800 bg-slate-950 p-4"
      aria-label="Teacher tool launcher"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          Command Dock
        </p>
        <h2 className="mt-1 text-xl font-bold text-white">Tools</h2>
        {activeWorkspace && (
          <div className="mt-3 space-y-2" data-workspace-selector>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Workspace
            </p>
            <p className="text-sm font-semibold text-cyan-200">
              {activeWorkspace.icon} {activeWorkspace.name}
            </p>
            {currentLesson && lessonReadiness && (
              <div
                className="rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1.5"
                data-lesson-readiness
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Lesson context
                </p>
                <p className="text-xs font-semibold text-slate-100">{currentLesson.title}</p>
                <p
                  className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    lessonReadiness.status === 'ready'
                      ? 'text-emerald-300/90'
                      : lessonReadiness.status === 'warning'
                        ? 'text-amber-200/90'
                        : 'text-rose-300/90'
                  }`}
                >
                  {lessonReadiness.status === 'ready'
                    ? getLessonReadinessStatusLabel(currentLesson, teacherOverrides)
                    : '⚠ Resources Missing'}
                </p>
              </div>
            )}
            <select
              value={activeWorkspaceId}
              onChange={(event) =>
                setActiveWorkspace(event.target.value as typeof activeWorkspaceId)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-200"
              aria-label="Teaching workspace"
              data-workspace-select
            >
              {getAllWorkspaceIds().map((id) => {
                  const workspace = getWorkspaceById(id)
                  if (!workspace) return null
                  return (
                    <option key={id} value={id}>
                      {workspace.icon} {workspace.name}
                    </option>
                  )
                })}
            </select>
          </div>
        )}
      </div>

      {(['daily', 'students', 'instruction', 'management'] as const).map((category) => {
        const tools = grouped.get(category)
        if (!tools?.length) return null
        return (
          <section key={category} className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="space-y-2">
              {tools.map((tool) => {
                const priority = getToolPriorityInWorkspace(tool.id, activeWorkspace)
                return (
                  <DockToolCard
                    key={tool.id}
                    tool={tool}
                    active={tool.id === activeToolId}
                    favorite={favoriteToolIds.includes(tool.id)}
                    deprioritized={priority === 'deprioritized'}
                    onSelect={() => onSelectTool(tool.id)}
                    onToggleFavorite={() => onToggleFavorite(tool.id)}
                  />
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
})
