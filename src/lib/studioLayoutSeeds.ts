// Deterministic seeded widget geometry for vibe pages, keyed by layout
// preset. Pure — no React/store dependency — used both when building the
// default page sequences and when resetting/migrating a page's layout.

import type { PageLayoutPreset, PageWidget } from '../data/types'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  SAFE_MARGIN,
  normalizeRect,
  type Rect,
} from './studioCanvasGeometry'

const CONTENT_TOP = SAFE_MARGIN + 48 // leave room for the page title caption
const CONTENT_BOTTOM = CANVAS_HEIGHT - SAFE_MARGIN
const CONTENT_HEIGHT = CONTENT_BOTTOM - CONTENT_TOP
const CONTENT_LEFT = SAFE_MARGIN
const CONTENT_RIGHT = CANVAS_WIDTH - SAFE_MARGIN
const CONTENT_WIDTH = CONTENT_RIGHT - CONTENT_LEFT

const GUTTER = 32

/** Region layouts per preset, keyed by how many widgets need to be placed
 * (1 or 2 — no seeded page currently declares more than two widget types).
 * A 0-widget page renders no boxes at all. */
function regionsForPreset(preset: PageLayoutPreset, count: number): Rect[] {
  if (count <= 0) return []

  switch (preset) {
    case 'centered-message': {
      if (count === 1) {
        const width = Math.round(CONTENT_WIDTH * 0.72)
        return [
          {
            x: CONTENT_LEFT + (CONTENT_WIDTH - width) / 2,
            y: CONTENT_TOP,
            width,
            height: CONTENT_HEIGHT,
          },
        ]
      }
      const primaryHeight = Math.round(CONTENT_HEIGHT * 0.56)
      const secondaryHeight = CONTENT_HEIGHT - primaryHeight - GUTTER
      const width = Math.round(CONTENT_WIDTH * 0.72)
      const left = CONTENT_LEFT + (CONTENT_WIDTH - width) / 2
      return [
        { x: left, y: CONTENT_TOP, width, height: primaryHeight },
        { x: left, y: CONTENT_TOP + primaryHeight + GUTTER, width, height: secondaryHeight },
      ]
    }

    case 'message-plus-timer':
    case 'message-plus-materials': {
      if (count === 1) {
        return [{ x: CONTENT_LEFT, y: CONTENT_TOP, width: CONTENT_WIDTH, height: CONTENT_HEIGHT }]
      }
      const leftWidth = Math.round(CONTENT_WIDTH * 0.58)
      const rightWidth = CONTENT_WIDTH - leftWidth - GUTTER
      return [
        { x: CONTENT_LEFT, y: CONTENT_TOP, width: leftWidth, height: CONTENT_HEIGHT },
        { x: CONTENT_LEFT + leftWidth + GUTTER, y: CONTENT_TOP, width: rightWidth, height: CONTENT_HEIGHT },
      ]
    }

    case 'split-content': {
      if (count === 1) {
        return [{ x: CONTENT_LEFT, y: CONTENT_TOP, width: CONTENT_WIDTH, height: CONTENT_HEIGHT }]
      }
      const halfWidth = Math.round((CONTENT_WIDTH - GUTTER) / 2)
      return [
        { x: CONTENT_LEFT, y: CONTENT_TOP, width: halfWidth, height: CONTENT_HEIGHT },
        { x: CONTENT_LEFT + halfWidth + GUTTER, y: CONTENT_TOP, width: halfWidth, height: CONTENT_HEIGHT },
      ]
    }

    case 'full-focus': {
      if (count === 1) {
        const width = Math.round(CONTENT_WIDTH * 0.82)
        return [
          {
            x: CONTENT_LEFT + (CONTENT_WIDTH - width) / 2,
            y: CONTENT_TOP,
            width,
            height: CONTENT_HEIGHT,
          },
        ]
      }
      const width = Math.round(CONTENT_WIDTH * 0.82)
      const left = CONTENT_LEFT + (CONTENT_WIDTH - width) / 2
      const primaryHeight = Math.round(CONTENT_HEIGHT * 0.78)
      const secondaryHeight = CONTENT_HEIGHT - primaryHeight - GUTTER
      return [
        { x: left, y: CONTENT_TOP, width, height: primaryHeight },
        { x: left, y: CONTENT_TOP + primaryHeight + GUTTER, width, height: secondaryHeight },
      ]
    }

    case 'cleanup-checklist': {
      const width = Math.round(CONTENT_WIDTH * 0.62)
      const left = CONTENT_LEFT + (CONTENT_WIDTH - width) / 2
      if (count === 1) {
        return [{ x: left, y: CONTENT_TOP, width, height: CONTENT_HEIGHT }]
      }
      const headlineHeight = Math.round(CONTENT_HEIGHT * 0.32)
      const checklistHeight = CONTENT_HEIGHT - headlineHeight - GUTTER
      return [
        { x: left, y: CONTENT_TOP, width, height: headlineHeight },
        { x: left, y: CONTENT_TOP + headlineHeight + GUTTER, width, height: checklistHeight },
      ]
    }

    default: {
      const width = Math.round(CONTENT_WIDTH * 0.72)
      return [
        {
          x: CONTENT_LEFT + (CONTENT_WIDTH - width) / 2,
          y: CONTENT_TOP,
          width,
          height: CONTENT_HEIGHT,
        },
      ]
    }
  }
}

/**
 * Build deterministic, projector-safe seeded widgets for a page. When the
 * page declares no content widget types (widgetTypes is empty), a single
 * synthetic `message` widget is seeded so the page still has real geometry
 * to work with in Studio Canvas — it carries the page's primaryMessage /
 * supportingContent.
 */
export function seedWidgetsForPage(
  pageId: string,
  layoutPreset: PageLayoutPreset,
  widgetTypes: string[],
): PageWidget[] {
  const types = widgetTypes.length > 0 ? widgetTypes : ['message']
  const regions = regionsForPreset(layoutPreset, types.length)

  return types.map((type, index) => {
    const region = regions[index] ?? regions[regions.length - 1] ?? {
      x: CONTENT_LEFT,
      y: CONTENT_TOP,
      width: CONTENT_WIDTH,
      height: CONTENT_HEIGHT,
    }
    const rect = normalizeRect(region)
    return {
      id: `${pageId}-widget-${index}`,
      type,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      zIndex: index + 1,
      locked: false,
      visible: true,
      snapRegion: undefined,
      contentRef: undefined,
    }
  })
}
