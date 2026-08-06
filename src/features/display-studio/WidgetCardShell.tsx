import type { ReactNode } from 'react'
import type { CanvasWidget } from '../display-composer/types'

export function WidgetCardShell({
  widget,
  isSelected,
  onSelect,
  onDragStart,
  children,
}: {
  widget: CanvasWidget
  isSelected: boolean
  onSelect: (id: string) => void
  onDragStart: (e: React.MouseEvent, id: string) => void
  children: ReactNode
}) {
  return (
    <div
      data-widget-id={widget.id}
      data-widget-type={widget.type}
      className={`absolute cursor-pointer select-none overflow-hidden rounded-xl border-2 transition-all duration-150 ${
        isSelected
          ? 'border-cyan-400 bg-slate-800/95 shadow-lg shadow-cyan-400/30 ring-1 ring-cyan-400/50 z-[100] scale-[1.02]'
          : widget.locked
            ? 'border-slate-600 bg-slate-900/85 opacity-70'
            : 'border-slate-700/50 bg-slate-900/75 hover:border-slate-500 hover:bg-slate-900/85'
      } ${widget.visible ? '' : 'opacity-20'}`}
      style={{
        left: `${widget.x}%`,
        top: `${widget.y}%`,
        width: `${widget.w}%`,
        height: `${widget.h}%`,
        zIndex: isSelected ? 100 : widget.zIndex,
        userSelect: 'none',
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(widget.id)
      }}
      onMouseDown={(e) => {
        if (widget.locked) return
        onDragStart(e, widget.id)
      }}
    >
      {children}
      {isSelected && (
        <div className="absolute top-1 right-1.5 flex gap-1">
          {widget.locked && <span className="text-[10px]">🔒</span>}
          {!widget.visible && <span className="text-[10px]">👁‍🗨</span>}
        </div>
      )}
    </div>
  )
}
