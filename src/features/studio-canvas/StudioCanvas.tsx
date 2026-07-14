import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import type { ScreenContents, ScreenId, VibePage } from '../../data/types'
import { useBoardStore } from '../../store/boardStore'
import {
  clampToCanvas,
  detectAlignmentGuides,
  normalizeRect,
  pixelToLogical,
  snapValue,
  type ArrowKey,
} from '../../lib/studioCanvasGeometry'
import type { DragState } from './studioCanvasTypes'
import { StudioWidgetFrame } from './StudioWidgetFrame'
import { AlignmentGuides } from './AlignmentGuides'
import { StudioToolbar } from './StudioToolbar'
import { StudioInspector } from './StudioInspector'
import { CANVAS_HEIGHT, CANVAS_WIDTH, GRID_SIZE } from '../../lib/studioCanvasGeometry'

const GRID_PERCENT_X = (GRID_SIZE / CANVAS_WIDTH) * 100
const GRID_PERCENT_Y = (GRID_SIZE / CANVAS_HEIGHT) * 100

interface StudioCanvasProps {
  screenId: ScreenId
  page: VibePage
  contents: ScreenContents
  onContentsChange: (contents: ScreenContents) => void
  onBeautify?: () => void
  onPreviewClassroom?: () => void
}

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

function isEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

export function StudioCanvas({ screenId, page, contents, onContentsChange, onBeautify, onPreviewClassroom }: StudioCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)

  const canvasHistoryPast = useBoardStore((s) => s.canvasHistoryPast)
  const canvasHistoryFuture = useBoardStore((s) => s.canvasHistoryFuture)
  const snapEnabled = useBoardStore((s) => s.studioSnapEnabled)
  const setStudioSnapEnabled = useBoardStore((s) => s.setStudioSnapEnabled)
  const updatePageWidgetGeometry = useBoardStore((s) => s.updatePageWidgetGeometry)
  const movePageWidget = useBoardStore((s) => s.movePageWidget)
  const setPageWidgetLocked = useBoardStore((s) => s.setPageWidgetLocked)
  const resetActivePageLayout = useBoardStore((s) => s.resetActivePageLayout)
  const undoCanvasLayout = useBoardStore((s) => s.undoCanvasLayout)
  const redoCanvasLayout = useBoardStore((s) => s.redoCanvasLayout)

  // Selection (and any in-flight drag) is session-only chrome that must
  // never survive a page or class switch. Rather than syncing it via an
  // effect, the parent mounts this component with `key={screenId-pageId}`
  // so React resets all local state for free on switch.
  const selectedWidget = page.widgets.find((w) => w.id === selectedWidgetId) ?? null
  const visibleWidgets = page.widgets.filter((w) => w.visible !== false)

  function handleDragHandlePointerDown(widgetId: string, e: ReactPointerEvent<HTMLDivElement>) {
    const widget = page.widgets.find((w) => w.id === widgetId)
    if (!widget || widget.locked) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    setSelectedWidgetId(widgetId)
    const startRect = { x: widget.x, y: widget.y, width: widget.width, height: widget.height }
    setDragState({
      widgetId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startRect,
      currentRect: startRect,
      guides: { vertical: [], horizontal: [] },
    })
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragState) return
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const box = canvasEl.getBoundingClientRect()
    const deltaLogical = pixelToLogical(
      { x: e.clientX - dragState.startClientX, y: e.clientY - dragState.startClientY },
      box.width,
      box.height,
    )
    const bypassSnap = e.altKey
    let x = dragState.startRect.x + deltaLogical.x
    let y = dragState.startRect.y + deltaLogical.y
    if (snapEnabled && !bypassSnap) {
      x = snapValue(x)
      y = snapValue(y)
    }
    const nextRect = normalizeRect(
      clampToCanvas({ x, y, width: dragState.startRect.width, height: dragState.startRect.height }),
    )
    const others = page.widgets
      .filter((w) => w.id !== dragState.widgetId)
      .map((w) => ({ x: w.x, y: w.y, width: w.width, height: w.height }))
    const guides = detectAlignmentGuides(nextRect, others)
    setDragState({ ...dragState, currentRect: nextRect, guides })
  }

  function handlePointerUp() {
    if (!dragState) return
    updatePageWidgetGeometry(screenId, page.id, dragState.widgetId, {
      x: dragState.currentRect.x,
      y: dragState.currentRect.y,
    })
    setDragState(null)
  }

  function handleCanvasPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      setSelectedWidgetId(null)
    }
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (isEditingTarget(e.target)) return
    if (e.key === 'Escape') {
      if (dragState) {
        setDragState(null)
      }
      setSelectedWidgetId(null)
      return
    }
    if (!selectedWidgetId || !ARROW_KEYS.has(e.key)) return
    if (dragState) return // don't keyboard-move while dragging
    e.preventDefault()
    movePageWidget(screenId, page.id, selectedWidgetId, e.key as ArrowKey, e.shiftKey)
  }

  function handleResetLayout() {
    const confirmed = window.confirm(
      `Reset "${page.title}" to its default layout? Widget positions, sizes, and lock state on this page will be restored. You can undo this from the toolbar.`,
    )
    if (!confirmed) return
    resetActivePageLayout(screenId, page.id)
  }

  function handleToggleLock() {
    if (!selectedWidget) return
    setPageWidgetLocked(screenId, page.id, selectedWidget.id, !selectedWidget.locked)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <StudioToolbar
        canUndo={canvasHistoryPast.length > 0}
        canRedo={canvasHistoryFuture.length > 0}
        onUndo={undoCanvasLayout}
        onRedo={redoCanvasLayout}
        snapEnabled={snapEnabled}
        onToggleSnap={() => setStudioSnapEnabled(!snapEnabled)}
        onResetLayout={handleResetLayout}
        selectedLocked={selectedWidget ? selectedWidget.locked : null}
        onToggleLock={handleToggleLock}
        onPreviewClassroom={onPreviewClassroom}
        pageLabel={page.title}
      />
      <div className="flex min-h-0 flex-1 items-center justify-center gap-3">
        <div className="flex h-full min-h-0 w-full items-center justify-center [container-type:size]">
          <div
            ref={canvasRef}
            className="studio-canvas-surface relative w-full max-w-[min(100%,calc(100cqh*16/9))] max-h-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60 shadow-inner"
            style={{ aspectRatio: '16 / 9', touchAction: dragState ? 'none' : undefined, userSelect: dragState ? 'none' : undefined }}
            data-snap-enabled={snapEnabled}
            role="application"
            aria-label={`Studio Canvas for ${page.title}`}
            tabIndex={-1}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
          >
            {snapEnabled && (
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.4) 1px, transparent 1px)',
                  backgroundSize: `${GRID_PERCENT_X}% ${GRID_PERCENT_Y}%`,
                }}
              />
            )}
            {visibleWidgets.map((widget) => {
              const rect =
                dragState && dragState.widgetId === widget.id
                  ? dragState.currentRect
                  : { x: widget.x, y: widget.y, width: widget.width, height: widget.height }
              return (
                <StudioWidgetFrame
                  key={widget.id}
                  screenId={screenId}
                  page={page}
                  widget={widget}
                  rect={rect}
                  mode="edit"
                  contents={contents}
                  onContentsChange={onContentsChange}
                  onBeautify={onBeautify}
                  selected={selectedWidgetId === widget.id}
                  onSelect={setSelectedWidgetId}
                  onDragHandlePointerDown={handleDragHandlePointerDown}
                />
              )
            })}
            {dragState && <AlignmentGuides guides={dragState.guides} />}
          </div>
        </div>
        <StudioInspector widget={selectedWidget} />
      </div>
    </div>
  )
}
