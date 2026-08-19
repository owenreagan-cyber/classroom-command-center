/**
 * DB-1 — Clean Board geometry.
 *
 * Geometry choice (documented in the DB-1 status doc): a fixed 1920x1080
 * logical canvas. Object geometry is stored in logical pixels; the renderer
 * applies a single uniform scale-to-fit ("contain") transform so the board
 * never reflows, regardless of the target display size.
 */

export const BOARD_LOGICAL_WIDTH = 1920
export const BOARD_LOGICAL_HEIGHT = 1080
export const BOARD_ASPECT_RATIO = BOARD_LOGICAL_WIDTH / BOARD_LOGICAL_HEIGHT

export interface BoardFit {
  /** Uniform scale factor (logical px -> rendered px). */
  scale: number
  /** Letterbox offsets to center the board in its container. */
  offsetX: number
  offsetY: number
  /** Rendered (post-scale) dimensions. */
  width: number
  height: number
}

/** Uniform scale-to-fit of the 1920x1080 board inside a container. */
export function fitBoardToContainer(containerW: number, containerH: number): BoardFit {
  const scale = Math.min(
    containerW / BOARD_LOGICAL_WIDTH,
    containerH / BOARD_LOGICAL_HEIGHT,
  )
  const width = BOARD_LOGICAL_WIDTH * scale
  const height = BOARD_LOGICAL_HEIGHT * scale
  return {
    scale,
    width,
    height,
    offsetX: (containerW - width) / 2,
    offsetY: (containerH - height) / 2,
  }
}

/** True when the given dimensions match 16:9 within the tolerance. */
export function isAspect16by9(w: number, h: number, epsilon = 0.001): boolean {
  if (w <= 0 || h <= 0) return false
  return Math.abs(w / h - BOARD_ASPECT_RATIO) < epsilon
}
