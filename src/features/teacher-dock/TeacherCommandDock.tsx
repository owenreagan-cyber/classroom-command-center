import { memo, useCallback, useMemo } from 'react'
import type { AppMode } from '../../data/types'
import {
  useDockStore,
  selectDockCollapsed,
  selectActiveToolId,
  selectFavoriteToolIds,
  selectDockOrder,
} from './dockStore'
import { DockEdgeLauncher } from './components/DockEdgeLauncher'
import { DockLauncherPanel } from './components/DockLauncherPanel'
import { DockToolWorkspace } from './components/DockToolWorkspace'
import { TeacherDockProvider, type TeacherDockContextValue } from './TeacherDockContext'
import type { ToolId } from './types'

interface TeacherCommandDockProps {
  mode: AppMode
  dockContext: Omit<TeacherDockContextValue, 'onActivateTool'>
}

export const TeacherCommandDock = memo(function TeacherCommandDock({
  mode,
  dockContext,
}: TeacherCommandDockProps) {
  const collapsed = useDockStore(selectDockCollapsed)
  const activeToolId = useDockStore(selectActiveToolId)
  const favoriteToolIds = useDockStore(selectFavoriteToolIds)
  const dockOrder = useDockStore(selectDockOrder)
  const setActiveTool = useDockStore((s) => s.setActiveTool)
  const toggleFavorite = useDockStore((s) => s.toggleFavorite)

  const onActivateTool = useCallback(
    (toolId: ToolId) => {
      setActiveTool(toolId)
    },
    [setActiveTool],
  )

  const contextValue = useMemo<TeacherDockContextValue>(
    () => ({
      ...dockContext,
      onActivateTool,
    }),
    [dockContext, onActivateTool],
  )

  if (mode !== 'edit') {
    return null
  }

  return (
    <TeacherDockProvider value={contextValue}>
      <aside
        className={`flex h-full shrink-0 overflow-hidden border-r border-slate-700 bg-slate-950 text-slate-100 ${
          collapsed ? 'w-[22rem]' : 'w-[42rem]'
        }`}
        aria-label="Teacher controls"
        data-teacher-command-dock
      >
        <DockEdgeLauncher
          favoriteToolIds={favoriteToolIds}
          onSelectTool={onActivateTool}
        />
        {!collapsed && (
          <DockLauncherPanel
            favoriteToolIds={favoriteToolIds}
            dockOrder={dockOrder}
            activeToolId={activeToolId}
            onSelectTool={onActivateTool}
            onToggleFavorite={toggleFavorite}
          />
        )}
        <DockToolWorkspace activeToolId={activeToolId} />
      </aside>
    </TeacherDockProvider>
  )
})
