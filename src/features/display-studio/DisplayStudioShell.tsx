import { type ReactNode } from 'react'
import { useDisplayStudioUI } from './useDisplayStudioUI'
import { isTypingTarget } from '../../lib/inputSafety'

interface DisplayStudioShellProps {
  leftRail: ReactNode
  canvas: ReactNode
  inspector: ReactNode
  commandBar: ReactNode
  widgetLibrary?: ReactNode
}

/**
 * Main Display Studio overlay — PowerPoint/Classroomscreen-style slide editor.
 * Takes over the /control viewport when open, leaving the Teacher Dock visible
 * on the left edge for navigation between tools.
 */
export function DisplayStudioShell({
  leftRail,
  canvas,
  inspector,
  commandBar,
  widgetLibrary,
}: DisplayStudioShellProps) {
  const { isOpen, close } = useDisplayStudioUI()

  if (!isOpen) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isTypingTarget(e.target)) return
      close()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex bg-slate-950"
      data-display-studio
      onKeyDown={handleKeyDown}
    >
      {/* Left: Thumbnail Rail */}
      <aside
        className="flex w-52 shrink-0 flex-col border-r border-slate-800 bg-slate-950"
        data-display-studio-thumbnail-rail
      >
        {leftRail}
      </aside>

      {/* Center: Canvas + Command Bar */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Command Bar */}
        <div className="shrink-0 border-b border-slate-800 bg-slate-950" data-display-studio-command-bar>
          {commandBar}
        </div>

        {/* Canvas Area */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6" data-display-studio-canvas-area>
          {canvas}
        </div>
      </div>

      {/* Right: Inspector + optional Widget Library */}
      <aside
        className="flex w-72 shrink-0 flex-col border-l border-slate-800 bg-slate-950"
        data-display-studio-inspector
      >
        {widgetLibrary}
        {inspector}
      </aside>
    </div>
  )
}
