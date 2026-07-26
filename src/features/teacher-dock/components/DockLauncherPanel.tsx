import { memo, useMemo } from 'react'
import type { ToolCategory, ToolId } from '../types'
import type { ToolDefinition } from '../types'
import { getLauncherTools } from '../toolRegistry'
import { DockToolCard } from './DockToolCard'

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
  const launcherTools = useMemo(
    () => getLauncherTools(dockOrder, favoriteToolIds),
    [dockOrder, favoriteToolIds],
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
              {tools.map((tool) => (
                <DockToolCard
                  key={tool.id}
                  tool={tool}
                  active={tool.id === activeToolId}
                  favorite={favoriteToolIds.includes(tool.id)}
                  onSelect={() => onSelectTool(tool.id)}
                  onToggleFavorite={() => onToggleFavorite(tool.id)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
})
