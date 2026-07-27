import { memo } from 'react'
import type { ToolDefinition } from '../types'

interface DockToolCardProps {
  tool: ToolDefinition
  active: boolean
  favorite: boolean
  deprioritized?: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}

export const DockToolCard = memo(function DockToolCard({
  tool,
  active,
  favorite,
  deprioritized = false,
  onSelect,
  onToggleFavorite,
}: DockToolCardProps) {
  return (
    <div
      className={`group flex items-start gap-2 rounded-xl border p-2.5 transition ${
        active
          ? 'border-cyan-400/60 bg-cyan-950/30'
          : deprioritized
            ? 'border-slate-800 bg-slate-950/40 opacity-70 hover:border-slate-600 hover:opacity-100'
            : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
      }`}
    >
      <button
        type="button"
        data-dock-tool-card={tool.id}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-start gap-2 text-left"
        aria-current={active ? 'true' : undefined}
        aria-label={`Open ${tool.title}`}
      >
        <span className="text-lg leading-none" aria-hidden="true">
          {tool.icon}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-100">{tool.title}</span>
          <span className="mt-0.5 block text-[11px] leading-snug text-slate-400">
            {tool.description}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleFavorite}
        className={`shrink-0 rounded-lg px-2 py-1 text-xs transition ${
          favorite
            ? 'text-amber-300 hover:text-amber-200'
            : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-300'
        }`}
        aria-label={favorite ? `Remove ${tool.title} from favorites` : `Favorite ${tool.title}`}
        aria-pressed={favorite}
      >
        {favorite ? '★' : '☆'}
      </button>
    </div>
  )
})
