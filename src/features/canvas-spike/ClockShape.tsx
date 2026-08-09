/**
 * Phase 15M — Clock shape for tldraw spike.
 * A read-only current-time display widget with w/h in props.
 */

import { useState, useEffect } from 'react'
import { createShapeId, ShapeUtil, HTMLContainer, type TLBaseShape } from 'tldraw'

type ClockShape = TLBaseShape<'spike-clock', { label: string; w: number; h: number }>

// @ts-expect-error Custom shape type extends TLShape union — ShapeUtil supports this but TS constrains to the known union.
export class ClockShapeUtil extends ShapeUtil<ClockShape> {
  static override type = 'spike-clock' as const

  getDefaultProps(): ClockShape['props'] {
    return { label: 'Current Time', w: 200, h: 100 }
  }

  override canBind() { return false }
  override canEdit() { return false }
  override canResize() { return true }
  override hideRotateHandle() { return true }

  getGeometry() {
    return undefined as never
  }

  component(shape: ClockShape) {
    return <ClockComponent label={shape.props.label} w={shape.props.w} h={shape.props.h} />
  }

  getIndicatorPath(shape: ClockShape) {
    const path = new Path2D()
    path.rect(0, 0, shape.props.w, shape.props.h)
    return path
  }
}

function ClockComponent({ label }: { label: string; w: number; h: number }) {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <HTMLContainer>
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-slate-950/80 px-4 py-2 text-white shadow-xl backdrop-blur-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-3xl font-black tabular-nums text-cyan-200">{time}</span>
      </div>
    </HTMLContainer>
  )
}

export function createClockShapeId() {
  return createShapeId('spike-clock')
}
