/**
 * Phase 15M — Countdown-timer shape for tldraw spike.
 * A start/stop/reset timer widget.
 */

import { createShapeId, ShapeUtil, type TLBaseShape } from 'tldraw'
import { TimerComponent } from './TimerComponent'

type CountdownTimerShape = TLBaseShape<'spike-timer', { label: string; timerKind: string; w: number; h: number }>

// @ts-expect-error Custom shape type extends TLShape union — ShapeUtil supports this but TS constrains to the known union.
export class CountdownTimerShapeUtil extends ShapeUtil<CountdownTimerShape> {
  static override type = 'spike-timer' as const

  getDefaultProps(): CountdownTimerShape['props'] {
    return { label: 'Timer', timerKind: 'general', w: 240, h: 180 }
  }

  override canBind() { return false }
  override canEdit() { return false }
  override canResize() { return true }
  override hideRotateHandle() { return true }

  getGeometry() {
    return undefined as never
  }

  component(shape: CountdownTimerShape) {
    return <TimerComponent label={shape.props.label} />
  }

  getIndicatorPath(shape: CountdownTimerShape) {
    const path = new Path2D()
    path.rect(0, 0, shape.props.w, shape.props.h)
    return path
  }
}

export function createCountdownTimerShapeId() {
  return createShapeId('spike-timer')
}
