/**
 * Phase 15L.2 — CanvasWidget overlap/collision detection.
 *
 * Targets CanvasWidget-based Display Composer / Display Studio screens only.
 * Operates on percentage-based x/y/w/h coordinates. Pure functions — no React,
 * no store, no DOM dependency.
 *
 * This detector is scoped to CanvasWidget. PageWidget-based classroom screens
 * use a different coordinate system (pixel x/y/width/height) and are not
 * covered here. See status doc for the risk assessment.
 *
 * Known limitations (deferred):
 * - Baked-in background text collisions and hollow templates remain open
 *   for 15L.4 (template completeness audit).
 * - Math Launch title-vs-timer, Mystery Student title/status, and Lunch
 *   crowding are partially addressed by reserved zones + slot system (15L.3),
 *   but full resolution depends on rendered font metrics and template layout.
 * - PageWidget (pixel-grid) overlap detection is deferred to Phase 15N.
 */

import type { CanvasWidget } from '../features/display-composer/types'

/** Overlap warning for a pair of widgets. */
export interface OverlapWarning {
  /** Unique warning id, stable per widget pair. */
  id: string
  /** IDs of the two overlapping widgets. */
  widgetA: string
  widgetB: string
  /** Labels for display. */
  labelA: string
  labelB: string
  /** How much they overlap. 'touching' = edges share a border, 'overlap' = intersection. */
  severity: 'touching' | 'overlap' | 'near-collision'
  /** Human-readable description for the teacher. */
  message: string
}

/** Result of running overlap detection on a set of widgets. */
export interface OverlapReport {
  warnings: OverlapWarning[]
  totalWidgets: number
  visibleWidgets: number
  /** Whether any warnings were found. */
  hasWarnings: boolean
}

/** A reserved zone on the Display Studio canvas (percentage coords).
 *  These are regions that should not be covered by user widgets because
 *  they overlap with title bars, clock displays, status badges, etc. */
export interface ReservedZone {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  description: string
}

/** Predefined reserved zones for Display Studio screens.
 *  These catch widget-vs-chrome collisions that widget-vs-widget overlap
 *  detection cannot detect on its own. */
export const DISPLAY_STUDIO_RESERVED_ZONES: ReservedZone[] = [
  {
    id: 'zone-top-title',
    label: 'Title Bar',
    x: 0,
    y: 0,
    w: 100,
    h: 10,
    description: 'Top title/clip region where screen title and mode badge appear',
  },
  {
    id: 'zone-clock-chrome',
    label: 'Clock Chrome',
    x: 65,
    y: 0,
    w: 35,
    h: 12,
    description: 'Clock display rendered in the screen header (fixed chrome, not a widget)',
  },
]

const NEAR_COLLISION_GAP_PCT = 3 // percentage points — widgets closer than this are flagged

function widgetRight(w: CanvasWidget): number {
  return w.x + w.w
}

function widgetBottom(w: CanvasWidget): number {
  return w.y + w.h
}

/**
 * Compute the overlap between two CanvasWidget bounding boxes (percentage coords).
 * Returns the overlapping area as a percentage value, or 0 if none.
 */
function overlapArea(a: CanvasWidget, b: CanvasWidget): number {
  const overlapW = Math.min(widgetRight(a), widgetRight(b)) - Math.max(a.x, b.x)
  const overlapH = Math.min(widgetBottom(a), widgetBottom(b)) - Math.max(a.y, b.y)
  if (overlapW <= 0 || overlapH <= 0) return 0
  return overlapW * overlapH
}

/**
 * Compute the smallest gap between two widgets on each axis (percentage coords).
 * Returns 0 if they overlap or touch.
 */
function gapArea(a: CanvasWidget, b: CanvasWidget): { gapX: number; gapY: number; minGap: number } {
  const ax2 = widgetRight(a)
  const ay2 = widgetBottom(a)
  const bx2 = widgetRight(b)
  const by2 = widgetBottom(b)

  // Horizontal gap: distance between their x-intervals
  const xOverlap = Math.min(ax2, bx2) - Math.max(a.x, b.x)
  const gapX = xOverlap >= 0 ? 0 : Math.max(a.x, b.x) - Math.min(ax2, bx2)

  // Vertical gap: distance between their y-intervals
  const yOverlap = Math.min(ay2, by2) - Math.max(a.y, b.y)
  const gapY = yOverlap >= 0 ? 0 : Math.max(a.y, b.y) - Math.min(ay2, by2)

  const minGap = Math.max(gapX, gapY)
  return { gapX, gapY, minGap }
}

/**
 * Detect overlap and collision risks among a set of CanvasWidgets.
 * Only considers visible widgets. Returns a structured report.
 */
export function detectCanvasWidgetOverlaps(widgets: CanvasWidget[]): OverlapReport {
  const visible = widgets.filter((w) => w.visible)
  const warnings: OverlapWarning[] = []

  for (let i = 0; i < visible.length; i++) {
    for (let j = i + 1; j < visible.length; j++) {
      const a = visible[i]
      const b = visible[j]

      const area = overlapArea(a, b)
      const { minGap } = gapArea(a, b)

      if (area > 0) {
        const pctOverlap = Math.round(area / Math.min(a.w * a.h, b.w * b.h) * 100)
        warnings.push({
          id: `overlap-${a.id}-${b.id}`,
          widgetA: a.id,
          widgetB: b.id,
          labelA: a.label,
          labelB: b.label,
          severity: pctOverlap <= 5 ? 'touching' : 'overlap',
          message:
            pctOverlap <= 5
              ? `"${a.label}" and "${b.label}" are touching or nearly overlapping on the canvas.`
              : `"${a.label}" and "${b.label}" overlap by ~${pctOverlap}% — students may not see both clearly.`,
        })
      } else if (minGap > 0 && minGap <= NEAR_COLLISION_GAP_PCT) {
        warnings.push({
          id: `near-${a.id}-${b.id}`,
          widgetA: a.id,
          widgetB: b.id,
          labelA: a.label,
          labelB: b.label,
          severity: 'near-collision',
          message: `"${a.label}" and "${b.label}" are very close together (${Math.round(minGap)}% gap) — consider adding more space.`,
        })
      }
    }
  }

  return {
    warnings,
    totalWidgets: widgets.length,
    visibleWidgets: visible.length,
    hasWarnings: warnings.length > 0,
  }
}

/**
 * Run overlap detection on a screen's widgets and return the report.
 * This is the primary entry point for consumers.
 */
export function detectScreenOverlaps(widgets: CanvasWidget[] | undefined): OverlapReport {
  if (!widgets || widgets.length < 2) {
    return { warnings: [], totalWidgets: widgets?.length ?? 0, visibleWidgets: 0, hasWarnings: false }
  }
  return detectCanvasWidgetOverlaps(widgets)
}

/** Whether a CanvasWidget bounding box intersects a reserved zone (percentage coords). */
function widgetIntersectsZone(w: CanvasWidget, zone: ReservedZone): boolean {
  const wRight = widgetRight(w)
  const wBottom = widgetBottom(w)
  const zRight = zone.x + zone.w
  const zBottom = zone.y + zone.h
  const overlapW = Math.min(wRight, zRight) - Math.max(w.x, zone.x)
  const overlapH = Math.min(wBottom, zBottom) - Math.max(w.y, zone.y)
  return overlapW > 0 && overlapH > 0
}

/**
 * Detect visible CanvasWidgets that overlap with reserved zones.
 * Returns warnings for any widget that intrudes into a reserved zone.
 * This catches widget-vs-chrome collisions that widget-vs-widget detection
 * cannot detect on its own.
 */
export function detectReservedZoneOverlaps(
  widgets: CanvasWidget[],
  zones: ReservedZone[] = DISPLAY_STUDIO_RESERVED_ZONES,
): OverlapWarning[] {
  const visible = widgets.filter((w) => w.visible)
  const warnings: OverlapWarning[] = []

  for (const zone of zones) {
    for (const w of visible) {
      if (widgetIntersectsZone(w, zone)) {
        warnings.push({
          id: `zone-${zone.id}-${w.id}`,
          widgetA: w.id,
          widgetB: `$${zone.id}`,
          labelA: w.label,
          labelB: zone.label,
          severity: 'overlap',
          message: `"${w.label}" overlaps the ${zone.label} area (${zone.description}) — it may be hidden behind the clock or title.`,
        })
      }
    }
  }

  return warnings
}

/**
 * Combined overlap report: widget-vs-widget + reserved-zone checks.
 * Merges both warning sets into a single report.
 */
export function detectScreenOverlapsWithZones(
  widgets: CanvasWidget[] | undefined,
  zones: ReservedZone[] = DISPLAY_STUDIO_RESERVED_ZONES,
): OverlapReport {
  const baseReport = detectScreenOverlaps(widgets)
  if (!widgets || widgets.length === 0) return baseReport

  const zoneWarnings = detectReservedZoneOverlaps(widgets, zones)
  const allWarnings = [...baseReport.warnings, ...zoneWarnings]

  return {
    ...baseReport,
    warnings: allWarnings,
    hasWarnings: allWarnings.length > 0,
  }
}
