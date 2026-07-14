import type { PointerEvent as ReactPointerEvent } from 'react'
import type { AppMode, PageWidget, ScreenContents, ScreenId, VibePage } from '../../data/types'
import { rectToPercent, type Rect } from '../../lib/studioCanvasGeometry'
import { WidgetContentBody } from './WidgetContentBody'

interface StudioWidgetFrameProps {
  screenId: ScreenId
  page: VibePage
  widget: PageWidget
  rect: Rect
  mode: AppMode
  contents: ScreenContents
  onContentsChange: (contents: ScreenContents) => void
  onBeautify?: () => void
  selected: boolean
  onSelect: (widgetId: string) => void
  onDragHandlePointerDown: (widgetId: string, event: ReactPointerEvent<HTMLDivElement>) => void
}

export function StudioWidgetFrame({
  screenId,
  page,
  widget,
  rect,
  mode,
  contents,
  onContentsChange,
  onBeautify,
  selected,
  onSelect,
  onDragHandlePointerDown,
}: StudioWidgetFrameProps) {
  const percent = rectToPercent(rect)

  return (
    <div
      className={`absolute flex flex-col overflow-hidden rounded-2xl transition-shadow ${
        selected ? 'ring-2 ring-cyan-400 shadow-[0_0_0_4px_rgba(34,211,238,0.15)]' : 'ring-1 ring-white/10'
      }`}
      style={{
        left: `${percent.left}%`,
        top: `${percent.top}%`,
        width: `${percent.width}%`,
        height: `${percent.height}%`,
      }}
      data-widget-id={widget.id}
      data-widget-type={widget.type}
      data-locked={widget.locked ? 'true' : 'false'}
      tabIndex={0}
      role="group"
      aria-label={`${widget.type} widget`}
      aria-selected={selected}
      onFocus={() => onSelect(widget.id)}
      onClick={() => {
        // Clicking anywhere in the frame selects it; only the drag handle
        // starts a drag — clicks inside editable text fields must keep
        // working normally.
        onSelect(widget.id)
      }}
      onPointerDown={() => {
        onSelect(widget.id)
      }}
    >
      <div
        className={`flex shrink-0 items-center justify-between gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70 ${
          widget.locked ? 'cursor-not-allowed bg-slate-800/70' : 'cursor-grab active:cursor-grabbing bg-slate-900/70'
        }`}
        onPointerDown={(e) => {
          if (widget.locked) {
            onSelect(widget.id)
            return
          }
          onDragHandlePointerDown(widget.id, e)
        }}
        aria-label={`Drag handle for ${widget.type} widget`}
      >
        <span className="truncate">{widget.type}</span>
        {widget.locked && (
          <span aria-label="Locked" title="Locked — cannot be dragged or moved">
            🔒
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 p-1">
        <WidgetContentBody
          screenId={screenId}
          type={widget.type}
          mode={mode}
          contents={contents}
          page={page}
          onContentsChange={onContentsChange}
          onBeautify={onBeautify}
          className="h-full"
        />
      </div>
    </div>
  )
}
