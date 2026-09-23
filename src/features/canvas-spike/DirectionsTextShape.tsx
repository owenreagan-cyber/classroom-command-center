/**
 * Phase 15M — Directions-text shape for tldraw spike.
 * Displays a multi-line text block, editable on double-click.
 */

import { createShapeId, ShapeUtil, type TLBaseShape } from 'tldraw'
import { DirectionsComponent } from './DirectionsComponent'

export type DirectionsTextShape = TLBaseShape<'spike-directions', { text: string; label: string; w: number; h: number }>

// @ts-expect-error Custom shape type extends TLShape union — ShapeUtil supports this but TS constrains to the known union.
export class DirectionsTextShapeUtil extends ShapeUtil<DirectionsTextShape> {
  static override type = 'spike-directions' as const

  getDefaultProps(): DirectionsTextShape['props'] {
    return { text: 'Directions...', label: 'Directions', w: 400, h: 200 }
  }

  override canBind() { return false }
  override canEdit() { return true }
  override canResize() { return true }
  override hideRotateHandle() { return true }

  getGeometry() {
    return undefined as never
  }

  component(shape: DirectionsTextShape) {
    return <DirectionsComponent shape={shape} />
  }

  getIndicatorPath(shape: DirectionsTextShape) {
    const path = new Path2D()
    path.rect(0, 0, shape.props.w, shape.props.h)
    return path
  }
}

export function createDirectionsTextShapeId() {
  return createShapeId('spike-directions')
}
