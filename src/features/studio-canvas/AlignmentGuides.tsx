import type { AlignmentGuides as AlignmentGuidesData } from '../../lib/studioCanvasGeometry'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../../lib/studioCanvasGeometry'

interface AlignmentGuidesProps {
  guides: AlignmentGuidesData
}

/** Renders temporary center/edge alignment guides during an active drag.
 * Studio Canvas only — never mounted in Classroom Mode. */
export function AlignmentGuides({ guides }: AlignmentGuidesProps) {
  if (guides.vertical.length === 0 && guides.horizontal.length === 0) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
      {guides.vertical.map((x) => (
        <div
          key={`v-${x}`}
          className="absolute top-0 bottom-0 w-px bg-fuchsia-400/80 shadow-[0_0_6px_rgba(232,121,249,0.8)]"
          style={{ left: `${(x / CANVAS_WIDTH) * 100}%` }}
        />
      ))}
      {guides.horizontal.map((y) => (
        <div
          key={`h-${y}`}
          className="absolute left-0 right-0 h-px bg-fuchsia-400/80 shadow-[0_0_6px_rgba(232,121,249,0.8)]"
          style={{ top: `${(y / CANVAS_HEIGHT) * 100}%` }}
        />
      ))}
    </div>
  )
}
