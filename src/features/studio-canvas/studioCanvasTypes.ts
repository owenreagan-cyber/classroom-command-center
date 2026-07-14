import type { PageWidget } from '../../data/types'
import type { AlignmentGuides, Rect } from '../../lib/studioCanvasGeometry'

/** Transient (session-only, never persisted) state describing an
 * in-progress pointer drag of a single widget. */
export interface DragState {
  widgetId: string
  startClientX: number
  startClientY: number
  startRect: Rect
  currentRect: Rect
  guides: AlignmentGuides
}

export interface SelectedWidgetInfo {
  widget: PageWidget
}
