import { useMemo, useCallback, useRef, useState, useEffect } from 'react'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { DisplayScreenRenderer } from '../display-composer/DisplayScreenRenderer'
import { toDisplaySafeScreen } from '../display-composer/displaySafe'
import { useDisplayStudioUI } from './useDisplayStudioUI'
import type { CanvasWidget } from '../display-composer/types'

const WIDGET_ICONS: Record<string, string> = {
  'directions-text': '📝',
  'random-picker': '🎯',
  'mystery-student': '🌟',
  '100-board': '🔢',
  'prize-board': '🎁',
  'press-your-luck': '🎰',
  'work-symbols': '🔤',
}

function CanvasWidgetCard({
  widget,
  isSelected,
  onSelect,
  onDragStart,
}: {
  widget: CanvasWidget
  isSelected: boolean
  onSelect: (id: string) => void
  onDragStart: (e: React.MouseEvent, id: string) => void
}) {
  const icon = WIDGET_ICONS[widget.type] ?? '📦'

  return (
    <div
      data-widget-id={widget.id}
      data-widget-type={widget.type}
      className={`absolute cursor-pointer select-none rounded-lg border-2 transition-colors ${
        isSelected
          ? 'border-cyan-400 bg-slate-800/90 shadow-lg shadow-cyan-400/20 z-[100]'
          : widget.locked
            ? 'border-slate-600 bg-slate-900/80 opacity-70'
            : 'border-slate-700 bg-slate-900/70 hover:border-slate-500'
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
      <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <span className="text-[9px] font-semibold leading-tight text-slate-200 line-clamp-2">
          {widget.label}
        </span>
        {widget.locked && (
          <span className="text-[8px] text-amber-400">🔒 Locked</span>
        )}
        {!widget.visible && (
          <span className="text-[8px] text-slate-500">Hidden</span>
        )}
      </div>
      {isSelected && (
        <div className="absolute -top-1 -right-1 flex gap-0.5">
          {widget.locked && <span className="text-[10px]">🔒</span>}
          {!widget.visible && <span className="text-[10px]">👁‍🗨</span>}
        </div>
      )}
    </div>
  )
}

export function DisplayStudioCanvas() {
  const screens = useDisplayComposerStore((s) => s.screens)
  const order = useDisplayComposerStore((s) => s.order)
  const moveWidget = useDisplayComposerStore((s) => s.moveWidget)
  const { selectedScreenId, selectedWidgetId, selectWidget } = useDisplayStudioUI()

  const activeId = selectedScreenId ?? order[0] ?? null
  const selected = activeId ? screens[activeId] : undefined
  const widgets = useMemo(() => selected?.widgets ?? [], [selected?.widgets])

  const safeScreen = useMemo(() => {
    if (!selected) return null
    return toDisplaySafeScreen(selected)
  }, [selected])

  // Drag state
  const [dragState, setDragState] = useState<{
    widgetId: string
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback(
    (e: React.MouseEvent, widgetId: string) => {
      const widget = widgets.find((w) => w.id === widgetId)
      if (!widget || widget.locked) return
      e.preventDefault()
      setDragState({
        widgetId,
        startX: e.clientX,
        startY: e.clientY,
        origX: widget.x,
        origY: widget.y,
      })
    },
    [widgets],
  )

  // Global mouse move and up listeners for drag
  useEffect(() => {
    if (!dragState) return
    const handleMove = (e: MouseEvent) => {
      if (!dragState || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const dx = ((e.clientX - dragState.startX) / rect.width) * 100
      const dy = ((e.clientY - dragState.startY) / rect.height) * 100
      const newX = Math.max(0, Math.min(100 - 5, dragState.origX + dx))
      const newY = Math.max(0, Math.min(100 - 5, dragState.origY + dy))
      // Transiently update via direct DOM for smooth drag
      const el = document.querySelector(`[data-widget-id="${dragState.widgetId}"]`) as HTMLElement | null
      if (el) {
        el.style.left = `${newX}%`
        el.style.top = `${newY}%`
      }
    }
    const handleUp = () => {
      if (!dragState || !canvasRef.current || !selected) return
      const el = document.querySelector(`[data-widget-id="${dragState.widgetId}"]`) as HTMLElement | null
      if (el) {
        const left = parseFloat(el.style.left || '0')
        const top = parseFloat(el.style.top || '0')
        const finalX = Math.round(Math.max(0, Math.min(100 - 5, left)))
        const finalY = Math.round(Math.max(0, Math.min(100 - 5, top)))
        moveWidget(selected.id, dragState.widgetId, finalX, finalY)
      }
      setDragState(null)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragState, selected, moveWidget])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Only clear selection if clicking the canvas background
      if (e.target === e.currentTarget) {
        selectWidget(null)
      }
    },
    [selectWidget],
  )

  if (!selected) {
    return (
      <div className="flex items-center justify-center text-sm text-slate-400">
        <p>Select a screen from the left panel or create a new one.</p>
      </div>
    )
  }

  return (
    <div
      className="relative flex w-full max-w-5xl flex-col gap-2"
      style={{ aspectRatio: '16 / 9', maxHeight: 'min(100%, calc(100vh - 200px))' }}
      data-display-studio-canvas
    >
      <div className="absolute -top-7 left-0 right-0 flex items-center justify-center">
        <span className="rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-0.5 text-[11px] font-semibold text-slate-400 backdrop-blur">
          {selected.mode} · {selected.studentSafe ? 'Student-safe' : 'Not student-safe'}
        </span>
      </div>

      <div
        className="flex-1 overflow-hidden rounded-xl border border-slate-700 shadow-2xl"
        ref={canvasRef}
      >
        <div
          className="relative h-full w-full"
          onClick={handleCanvasClick}
        >
          {/* Background renderer */}
          <div className="absolute inset-0">
            {safeScreen ? (
              <DisplayScreenRenderer screen={safeScreen} variant="controlPreview" />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-900/60">
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-400">Screen not student-safe</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Enable "Student-safe" in the Screen inspector section to preview.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Widget overlay layer */}
          <div className="absolute inset-0 pointer-events-none">
            {widgets.map((widget) => (
              <div key={widget.id} className="pointer-events-auto">
                <CanvasWidgetCard
                  widget={widget}
                  isSelected={widget.id === selectedWidgetId}
                  onSelect={selectWidget}
                  onDragStart={handleDragStart}
                />
              </div>
            ))}
          </div>

          {/* Drop indicator for empty canvas */}
          {widgets.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="rounded-lg bg-slate-950/50 px-3 py-1.5 text-xs text-slate-500">
                Add widgets from the library to build your screen
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
