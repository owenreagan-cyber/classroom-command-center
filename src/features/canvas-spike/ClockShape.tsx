/**
 * Phase 15M — Clock shape for tldraw spike.
 * A read-only current-time display widget with w/h in props.
 */

import { createShapeId, ShapeUtil, type TLBaseShape } from 'tldraw'
import { ClockComponent } from './ClockComponent'

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

export function createClockShapeId() {
  return createShapeId('spike-clock')
}
