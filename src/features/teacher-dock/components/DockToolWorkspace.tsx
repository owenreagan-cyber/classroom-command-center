import { memo } from 'react'
import { getToolById } from '../toolRegistry'
import { getToolPanelComponent } from '../toolPanels'
import type { ToolId } from '../types'

interface DockToolWorkspaceProps {
  activeToolId: ToolId | null
}

export const DockToolWorkspace = memo(function DockToolWorkspace({
  activeToolId,
}: DockToolWorkspaceProps) {
  if (!activeToolId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-400">
        Select a tool from the launcher.
      </div>
    )
  }

  const tool = getToolById(activeToolId)
  if (!tool || tool.status === 'inactive') {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-400">
        This tool is not available.
      </div>
    )
  }

  const Panel = getToolPanelComponent(activeToolId)
  if (!Panel) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-rose-300">
        Tool panel not registered.
      </div>
    )
  }

  return (
    <div
      className="flex w-80 min-w-80 flex-col overflow-hidden"
      aria-label={`${tool.title} workspace`}
      data-teacher-tool={activeToolId}
    >
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {tool.icon}
          </span>
          <div>
            <h2 className="text-base font-bold text-white">{tool.title}</h2>
            <p className="text-xs text-slate-400">{tool.description}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <Panel />
      </div>
    </div>
  )
})
