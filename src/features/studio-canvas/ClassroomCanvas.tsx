import type { ScreenContents, ScreenId, VibePage } from '../../data/types'
import { rectToPercent } from '../../lib/studioCanvasGeometry'
import { WidgetContentBody } from './WidgetContentBody'

interface ClassroomCanvasProps {
  screenId: ScreenId
  page: VibePage
  contents: ScreenContents
}

/**
 * Student-facing, read-only render of a page's persisted widget geometry.
 * No grid, drag handles, selection outlines, inspector, alignment guides,
 * toolbar, or page navigation — those are Studio Canvas-only chrome.
 */
export function ClassroomCanvas({ screenId, page, contents }: ClassroomCanvasProps) {
  const visibleWidgets = page.widgets.filter((w) => w.visible !== false)

  if (visibleWidgets.length === 0) {
    return null
  }

  return (
    <div className="classroom-canvas-frame relative h-full w-full">
      {visibleWidgets.map((widget) => {
        const percent = rectToPercent(widget)
        return (
          <div
            key={widget.id}
            className="absolute overflow-hidden"
            style={{
              left: `${percent.left}%`,
              top: `${percent.top}%`,
              width: `${percent.width}%`,
              height: `${percent.height}%`,
              zIndex: widget.zIndex,
            }}
          >
            <WidgetContentBody
              screenId={screenId}
              type={widget.type}
              mode="display"
              contents={contents}
              page={page}
              onContentsChange={() => {}}
              className="h-full"
            />
          </div>
        )
      })}
    </div>
  )
}