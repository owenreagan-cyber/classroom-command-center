import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { getBackgroundPreset, overlayScrimCss } from './backgrounds'
import { BoardObjectRenderer } from './BoardObjectRenderer'
import {
  BOARD_LOGICAL_HEIGHT,
  BOARD_LOGICAL_WIDTH,
  fitBoardToContainer,
} from './boardGeometry'
import type { SafeNowPlaying } from './spotify/spotifySafety'
import type { BoardBackground, BoardMode, BoardObject, BoardTheme } from './types'

interface BoardCanvasProps {
  background: BoardBackground
  objects: BoardObject[]
  mode: BoardMode
  selectedObjectId: string | null
  onSelect: (id: string | null) => void
  onMoveObject: (id: string, x: number, y: number) => void
  spotifyNowPlaying?: SafeNowPlaying | null
  /** Theme accent used for edit-mode selection chrome only. */
  accent?: string
  /** Board theme; forwarded to widget renderers (e.g. message card surface). */
  theme?: BoardTheme
}

interface DragState {
  id: string
  startX: number
  startY: number
  origX: number
  origY: number
}

function backgroundStyle(bg: BoardBackground): CSSProperties {
  if (bg.type === 'preset') {
    return { background: getBackgroundPreset(bg.presetId).css }
  }
  if (bg.type === 'localImage') {
    return {
      backgroundColor: '#0f172a',
      backgroundImage: `url(${bg.image.dataUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  if (bg.type === 'gradient') {
    return {
      background: `linear-gradient(${bg.angleDeg ?? 135}deg, ${bg.from}, ${bg.to})`,
    }
  }
  return { backgroundColor: bg.color }
}

/**
 * DB-1 — the 16:9 board canvas.
 *
 * Measures its container and applies a uniform scale-to-fit so the board
 * never reflows. Edit chrome (top bar, toolbar, dots) lives outside this
 * component and therefore does not scale with board content.
 */
export function BoardCanvas({
  background,
  objects,
  mode,
  selectedObjectId,
  onSelect,
  onMoveObject,
  spotifyNowPlaying,
  accent = '#22d3ee',
  theme,
}: BoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fit = useMemo(() => fitBoardToContainer(size.w, size.h), [size.w, size.h])

  const ordered = useMemo(
    () => [...objects].sort((a, b) => a.layer - b.layer),
    [objects],
  )

  const scrim = overlayScrimCss(background)

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>, o: BoardObject) => {
    if (mode !== 'edit') return
    onSelect(o.id)
    if (o.locked) return
    dragRef.current = {
      id: o.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: o.x,
      origY: o.y,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>, o: BoardObject) => {
    const drag = dragRef.current
    if (!drag || drag.id !== o.id || fit.scale <= 0) return
    const dx = (e.clientX - drag.startX) / fit.scale
    const dy = (e.clientY - drag.startY) / fit.scale
    onMoveObject(o.id, drag.origX + dx, drag.origY + dy)
  }

  const endDrag = () => {
    dragRef.current = null
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-950">
      {size.w > 0 && size.h > 0 && (
        <div
          className="absolute"
          style={{
            left: fit.offsetX,
            top: fit.offsetY,
            width: fit.width,
            height: fit.height,
          }}
        >
          <div
            className="relative origin-top-left overflow-hidden"
            style={{
              width: BOARD_LOGICAL_WIDTH,
              height: BOARD_LOGICAL_HEIGHT,
              transform: `scale(${fit.scale})`,
              ...backgroundStyle(background),
            }}
            data-board-canvas
            onPointerDown={(e) => {
              if (mode === 'edit' && e.target === e.currentTarget) onSelect(null)
            }}
          >
            {scrim && (
              <div
                className="pointer-events-none absolute inset-0"
                style={scrim}
                aria-hidden
                data-board-readability-scrim
              />
            )}
            {ordered.map((o) => {
              const selected = mode === 'edit' && selectedObjectId === o.id
              return (
                <div
                  key={o.id}
                  data-board-object-kind={o.kind}
                  className={`absolute ${mode === 'edit' ? 'cursor-move' : ''}`}
                  style={{
                    left: o.x,
                    top: o.y,
                    width: o.w,
                    height: o.h,
                    transform: `rotate(${o.rotation}deg)`,
                    opacity: mode === 'edit' && !o.visible ? 0.35 : 1,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, o)}
                  onPointerMove={(e) => handlePointerMove(e, o)}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <BoardObjectRenderer
                    object={o}
                    spotifyNowPlaying={spotifyNowPlaying}
                    mode={mode}
                    theme={theme}
                  />
                  {selected && (
                    <div
                      className="pointer-events-none absolute inset-0 rounded-xl"
                      style={{ outline: `2px solid ${accent}`, outlineOffset: '2px' }}
                      data-board-selection
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
