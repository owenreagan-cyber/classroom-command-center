// Pure geometry helpers for the Studio Canvas. No React, no store, no DOM
// dependency — safe to unit test directly under Node.

export const CANVAS_WIDTH = 1600
export const CANVAS_HEIGHT = 900
export const SAFE_MARGIN = 48
export const GRID_SIZE = 16
export const MIN_WIDGET_WIDTH = 160
export const MIN_WIDGET_HEIGHT = 90
export const GUIDE_TOLERANCE = 6
export const MAX_HISTORY_ENTRIES = 50

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Point {
  x: number
  y: number
}

// ── Pixel <-> logical coordinate conversion ─────────────────────────────

/** Convert a point measured in rendered pixels (relative to the canvas's
 * top-left corner) into logical canvas units. */
export function pixelToLogical(
  pixelPoint: Point,
  renderedWidth: number,
  renderedHeight: number,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): Point {
  if (!Number.isFinite(renderedWidth) || renderedWidth <= 0) return { x: 0, y: 0 }
  if (!Number.isFinite(renderedHeight) || renderedHeight <= 0) return { x: 0, y: 0 }
  return {
    x: (pixelPoint.x / renderedWidth) * canvasWidth,
    y: (pixelPoint.y / renderedHeight) * canvasHeight,
  }
}

/** Convert a logical-unit point into rendered pixels for a canvas box of
 * the given rendered size. */
export function logicalToPixel(
  logicalPoint: Point,
  renderedWidth: number,
  renderedHeight: number,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): Point {
  if (!Number.isFinite(canvasWidth) || canvasWidth <= 0) return { x: 0, y: 0 }
  if (!Number.isFinite(canvasHeight) || canvasHeight <= 0) return { x: 0, y: 0 }
  return {
    x: (logicalPoint.x / canvasWidth) * renderedWidth,
    y: (logicalPoint.y / canvasHeight) * renderedHeight,
  }
}

/** Express a logical rect as percentages of the logical canvas — the
 * primitive that drives responsive (resize-safe) CSS positioning. */
export function rectToPercent(rect: Rect, canvasWidth = CANVAS_WIDTH, canvasHeight = CANVAS_HEIGHT) {
  return {
    left: (rect.x / canvasWidth) * 100,
    top: (rect.y / canvasHeight) * 100,
    width: (rect.width / canvasWidth) * 100,
    height: (rect.height / canvasHeight) * 100,
  }
}

// ── Snapping ──────────────────────────────────────────────────────────

/** Snap a single logical value to the nearest multiple of gridSize. */
export function snapValue(value: number, gridSize = GRID_SIZE): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value / gridSize) * gridSize
}

export function snapRectToGrid(rect: Rect, gridSize = GRID_SIZE): Rect {
  return {
    x: snapValue(rect.x, gridSize),
    y: snapValue(rect.y, gridSize),
    width: rect.width,
    height: rect.height,
  }
}

// ── Minimum size enforcement ─────────────────────────────────────────────

export function enforceMinSize(
  rect: Rect,
  minWidth = MIN_WIDGET_WIDTH,
  minHeight = MIN_WIDGET_HEIGHT,
): Rect {
  return {
    ...rect,
    width: Math.max(minWidth, Number.isFinite(rect.width) ? rect.width : minWidth),
    height: Math.max(minHeight, Number.isFinite(rect.height) ? rect.height : minHeight),
  }
}

// ── Clamping ──────────────────────────────────────────────────────────

/** Clamp a rect so it stays fully within the bounded canvas (0,0)-(W,H).
 * If the rect is larger than the canvas on an axis, it is shrunk to fit. */
export function clampToCanvas(
  rect: Rect,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): Rect {
  const width = Math.min(Math.max(0, rect.width), canvasWidth)
  const height = Math.min(Math.max(0, rect.height), canvasHeight)
  const x = Math.min(Math.max(0, rect.x), canvasWidth - width)
  const y = Math.min(Math.max(0, rect.y), canvasHeight - height)
  return { x, y, width, height }
}

/** Clamp a rect so it stays within the safe-margin inset of the canvas,
 * used for seeded/reset layouts (not for free dragging). */
export function clampToSafeArea(
  rect: Rect,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
  margin = SAFE_MARGIN,
): Rect {
  const usableWidth = canvasWidth - margin * 2
  const usableHeight = canvasHeight - margin * 2
  const width = Math.min(Math.max(0, rect.width), usableWidth)
  const height = Math.min(Math.max(0, rect.height), usableHeight)
  const x = Math.min(Math.max(margin, rect.x), margin + usableWidth - width)
  const y = Math.min(Math.max(margin, rect.y), margin + usableHeight - height)
  return { x, y, width, height }
}

/** Full normalization pipeline applied to any rect that will be persisted:
 * enforce minimum size, then clamp to canvas bounds. */
export function normalizeRect(rect: Rect): Rect {
  return clampToCanvas(enforceMinSize(rect))
}

// ── Keyboard movement ─────────────────────────────────────────────────

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

/** Step size for a single keyboard nudge. Plain arrow = 1 logical unit,
 * Shift+Arrow = one full grid step. */
export function keyboardStepSize(shiftKey: boolean, gridSize = GRID_SIZE): number {
  return shiftKey ? gridSize : 1
}

export function keyboardMoveDelta(key: ArrowKey, shiftKey: boolean, gridSize = GRID_SIZE): Point {
  const step = keyboardStepSize(shiftKey, gridSize)
  switch (key) {
    case 'ArrowUp':
      return { x: 0, y: -step }
    case 'ArrowDown':
      return { x: 0, y: step }
    case 'ArrowLeft':
      return { x: -step, y: 0 }
    case 'ArrowRight':
      return { x: step, y: 0 }
    default:
      return { x: 0, y: 0 }
  }
}

// ── Alignment guides ─────────────────────────────────────────────────────

export interface AlignmentGuides {
  vertical: number[]
  horizontal: number[]
}

function rectCenterX(rect: Rect): number {
  return rect.x + rect.width / 2
}
function rectCenterY(rect: Rect): number {
  return rect.y + rect.height / 2
}
function rectRight(rect: Rect): number {
  return rect.x + rect.width
}
function rectBottom(rect: Rect): number {
  return rect.y + rect.height
}

function near(a: number, b: number, tolerance: number): boolean {
  return Math.abs(a - b) <= tolerance
}

/** Detect alignment guides for `rect` (the widget being dragged) against
 * the canvas center and the other widgets on the page. Returns the set of
 * logical positions where a guide line should be drawn. Pure — takes no
 * DOM state, only rects. */
export function detectAlignmentGuides(
  rect: Rect,
  others: Rect[],
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
  tolerance = GUIDE_TOLERANCE,
): AlignmentGuides {
  const vertical = new Set<number>()
  const horizontal = new Set<number>()

  const canvasCenterX = canvasWidth / 2
  const canvasCenterY = canvasHeight / 2

  if (near(rectCenterX(rect), canvasCenterX, tolerance)) vertical.add(canvasCenterX)
  if (near(rectCenterY(rect), canvasCenterY, tolerance)) horizontal.add(canvasCenterY)

  for (const other of others) {
    // Vertical guides: left edge, right edge, center
    if (near(rect.x, other.x, tolerance)) vertical.add(other.x)
    if (near(rectRight(rect), rectRight(other), tolerance)) vertical.add(rectRight(other))
    if (near(rectCenterX(rect), rectCenterX(other), tolerance)) vertical.add(rectCenterX(other))

    // Horizontal guides: top edge, bottom edge, center
    if (near(rect.y, other.y, tolerance)) horizontal.add(other.y)
    if (near(rectBottom(rect), rectBottom(other), tolerance)) horizontal.add(rectBottom(other))
    if (near(rectCenterY(rect), rectCenterY(other), tolerance)) horizontal.add(rectCenterY(other))
  }

  return { vertical: [...vertical], horizontal: [...horizontal] }
}

// ── Overlap measurement ───────────────────────────────────────────────

/** Returns the overlapping area (in square logical units) between two
 * rects, or 0 if they do not overlap. */
export function measureOverlapArea(a: Rect, b: Rect): number {
  const overlapWidth = Math.min(rectRight(a), rectRight(b)) - Math.max(a.x, b.x)
  const overlapHeight = Math.min(rectBottom(a), rectBottom(b)) - Math.max(a.y, b.y)
  if (overlapWidth <= 0 || overlapHeight <= 0) return 0
  return overlapWidth * overlapHeight
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return measureOverlapArea(a, b) > 0
}

// ── Geometry validity (used by migration/seeding) ───────────────────────

/** A widget rect is "placeholder-like" if it matches the historical
 * `x:0,y:0,width:1,height:1` stand-in used before this phase. */
export function isPlaceholderRect(rect: Rect): boolean {
  return rect.width <= 1 && rect.height <= 1
}

export function isFiniteRect(rect: Rect): boolean {
  return (
    Number.isFinite(rect.x) &&
    Number.isFinite(rect.y) &&
    Number.isFinite(rect.width) &&
    Number.isFinite(rect.height)
  )
}

export function isEntirelyOutsideCanvas(
  rect: Rect,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
): boolean {
  return (
    rectRight(rect) <= 0 ||
    rectBottom(rect) <= 0 ||
    rect.x >= canvasWidth ||
    rect.y >= canvasHeight
  )
}

/** True when a rect must be replaced by seeded geometry during migration
 * or import normalization. */
export function isInvalidGeometry(rect: Rect, canvasWidth = CANVAS_WIDTH, canvasHeight = CANVAS_HEIGHT): boolean {
  if (!isFiniteRect(rect)) return true
  if (rect.width <= 0 || rect.height <= 0) return true
  if (isPlaceholderRect(rect)) return true
  if (isEntirelyOutsideCanvas(rect, canvasWidth, canvasHeight)) return true
  return false
}
