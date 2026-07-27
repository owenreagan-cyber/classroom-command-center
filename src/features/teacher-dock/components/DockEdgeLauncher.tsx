import { memo, useMemo } from 'react'
import { useDockStore, selectDockCollapsed, selectActiveToolId } from '../dockStore'
import { getToolById } from '../toolRegistry'
import { getPromotedWorkspaceTools, getLessonAwarePromotedTools } from '../../workspace/workspaceResolver'
import { useWorkspaceStore, selectActiveWorkspaceId } from '../../workspace/workspaceStore'
import { useTeacherDockContext } from '../useTeacherDockContext'
import type { ToolId } from '../types'

interface DockEdgeLauncherProps {
  favoriteToolIds: ToolId[]
  onSelectTool: (toolId: ToolId) => void
}

export const DockEdgeLauncher = memo(function DockEdgeLauncher({
  favoriteToolIds,
  onSelectTool,
}: DockEdgeLauncherProps) {
  const collapsed = useDockStore(selectDockCollapsed)
  const activeToolId = useDockStore(selectActiveToolId)
  const toggleCollapsed = useDockStore((s) => s.toggleCollapsed)
  const activeWorkspaceId = useWorkspaceStore(selectActiveWorkspaceId)
  const { activeScreen } = useTeacherDockContext()

  const edgeTools = useMemo(() => {
    const lessonPromoted = getLessonAwarePromotedTools(activeScreen)
    if (lessonPromoted.length > 0) return lessonPromoted.slice(0, 6)
    const promoted = getPromotedWorkspaceTools(activeWorkspaceId)
    if (promoted.length > 0) return promoted.slice(0, 6)
    const favorites = favoriteToolIds
      .map((id) => getToolById(id))
      .filter((tool): tool is NonNullable<ReturnType<typeof getToolById>> => Boolean(tool))
    return favorites.slice(0, 6)
  }, [activeWorkspaceId, activeScreen, favoriteToolIds])

  return (
    <div
      className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-slate-800 bg-slate-950 py-3"
      aria-label="Dock edge launcher"
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand teacher dock' : 'Collapse teacher dock'}
        title={collapsed ? 'Expand dock' : 'Collapse dock'}
      >
        {collapsed ? '»' : '«'}
      </button>
      {edgeTools.map((tool) => {
        const active = tool.id === activeToolId
        return (
          <button
            key={tool.id}
            type="button"
            data-dock-edge-tool={tool.id}
            onClick={() => onSelectTool(tool.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition ${
              active
                ? 'border-cyan-400/70 bg-cyan-950/40'
                : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
            }`}
            aria-label={tool.title}
            aria-current={active ? 'true' : undefined}
            title={tool.title}
          >
            <span aria-hidden="true">{tool.icon}</span>
          </button>
        )
      })}
      {activeToolId && getToolById(activeToolId) && (
        <p className="mt-auto px-1 text-center text-[9px] font-semibold uppercase tracking-wide text-cyan-300/80">
          {getToolById(activeToolId)?.title}
        </p>
      )}
    </div>
  )
})
