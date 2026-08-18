/**
 * Phase 15L.3 — Status Widget Slot System.
 *
 * Defines named, pre-calculated safe positions for always-on status widgets
 * (noise-meter, work-symbols, clock toggle) on the Display Studio percentage
 * canvas.  Slots are placed outside the reserved zones defined in
 * canvasWidgetOverlapDetector.ts so that slot-managed widgets do not trigger
 * reserved-zone overlap warnings.
 *
 * Slots represent percentage coordinates on the 100×100 canvas.
 * They are pure data — no React, no store, no DOM dependency.
 */

/** A named slot on the Display Studio percentage canvas. */
export interface StatusSlot {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  description: string
}

/** Which widget types should be slot-managed in this phase. */
export const MANAGED_STATUS_TYPES = ['noise-meter', 'work-symbols'] as const

/**
 * Phase 15L.1 — simple corner vocabulary for always-present status elements,
 * so multiple badges (clock, voice level, mode, materials, music, mystery star)
 * do not independently default to the same corner.
 */
export type DisplaySlot =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/** Maps a DisplaySlot corner name to the nearest existing StatusSlot id. */
export const DISPLAY_SLOT_TO_STATUS_SLOT: Record<DisplaySlot, string> = {
  'top-left': 'slot-top-left-status',
  'top-center': 'slot-top-left-status',
  'top-right': 'slot-top-right-status',
  'bottom-left': 'slot-bottom-left-status',
  'bottom-center': 'slot-bottom-left-status',
  'bottom-right': 'slot-bottom-right-status',
}

/** Absolute percentage position for a stacked status item. */
export interface StackedItemPosition {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Stack multiple always-present status items within a slot with safe vertical
 * spacing instead of letting them all land on the same coordinates. Items are
 * laid out top-to-bottom inside the slot's column; if the slot is too short,
 * they wrap into additional columns. Pure and deterministic.
 */
export function stackInSlot(
  slotId: string,
  count: number,
  itemH = 8,
  gap = 2,
): StackedItemPosition[] {
  const slot = getSlotById(slotId)
  if (!slot || count <= 0) return []

  const positions: StackedItemPosition[] = []
  const columns = Math.max(1, Math.floor((slot.h + gap) / (itemH + gap)))
  const perColumn = Math.ceil(count / columns)

  for (let i = 0; i < count; i++) {
    const col = Math.floor(i / perColumn)
    const row = i % perColumn
    const colWidth = slot.w / columns
    positions.push({
      x: round2(slot.x + col * colWidth),
      y: round2(slot.y + row * (itemH + gap)),
      w: round2(colWidth),
      h: itemH,
    })
  }
  return positions
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Predefined status slots.
 *
 * ┌────────────────────────────────────────┐
 * │ Title Bar    (reserved: 0,0,100,10)     │
 * │              (Clock chrome)             │
 * ├─ top-left ───────────────── top-right ─┤
 * │  (status)                       (status)│
 * │                                         │
 * │         (free content area)             │
 * │                                         │
 * │                                         │
 * ├─ bottom-left ────────── bottom-right ──┤
 * │  (status)                       (status)│
 * └────────────────────────────────────────┘
 */
export const STATUS_SLOTS: StatusSlot[] = [
  {
    id: 'slot-top-right-status',
    label: 'Top-Right Status',
    x: 72,
    y: 14,
    w: 20,
    h: 16,
    description:
      'Small status widget slot below the clock area — safe for noise-meter, voice-level, or mode badge.',
  },
  {
    id: 'slot-top-left-status',
    label: 'Top-Left Status',
    x: 2,
    y: 14,
    w: 20,
    h: 16,
    description:
      'Status widget slot on the top-left, below the title bar — safe for mode badge or secondary status elements.',
  },
  {
    id: 'slot-bottom-right-status',
    label: 'Bottom-Right Status',
    x: 72,
    y: 70,
    w: 20,
    h: 16,
    description:
      'Status widget slot at bottom-right — alternative position when top-right is occupied.',
  },
  {
    id: 'slot-bottom-left-status',
    label: 'Bottom-Left Status',
    x: 2,
    y: 70,
    w: 20,
    h: 16,
    description:
      'Status widget slot at bottom-left — for work-symbols or secondary status when the top-left slot is not ideal.',
  },
]

/**
 * Default widget-type to slot mapping.
 * When a status widget of a managed type is present on a screen
 * without explicit positioning, this map picks its default slot.
 *
 * - noise-meter → top-right (below clock)
 * - work-symbols → top-left (away from title/clock)
 */
export const DEFAULT_SLOT_MAP: Record<string, string> = {
  'noise-meter': 'slot-top-right-status',
  'work-symbols': 'slot-top-left-status',
}

/** Look up a slot by id. Returns undefined if not found. */
export function getSlotById(id: string): StatusSlot | undefined {
  return STATUS_SLOTS.find((s) => s.id === id)
}

/** Look up the default slot for a widget type. */
export function getDefaultSlotForType(widgetType: string): StatusSlot | undefined {
  const slotId = DEFAULT_SLOT_MAP[widgetType]
  if (!slotId) return undefined
  return getSlotById(slotId)
}

/**
 * Return slot x/y/w/h for a widget, falling back to its existing position
 * if no slot is defined for its type.
 */
export function slotPositionFor(
  widgetType: string,
  currentX: number,
  currentY: number,
  currentW: number,
  currentH: number,
): { x: number; y: number; w: number; h: number } {
  const slot = getDefaultSlotForType(widgetType)
  if (!slot) return { x: currentX, y: currentY, w: currentW, h: currentH }
  return { x: slot.x, y: slot.y, w: slot.w, h: slot.h }
}

/**
 * Verify that all slots fall outside the given reserved zones.
 * Returns a list of slot id + zone id pairs for any overlap found.
 * An empty array means all slots are clean.
 */
export function validateSlotsAgainstZones(
  zones: { id: string; x: number; y: number; w: number; h: number }[],
): string[] {
  const violations: string[] = []
  for (const slot of STATUS_SLOTS) {
    const sRight = slot.x + slot.w
    const sBottom = slot.y + slot.h
    for (const zone of zones) {
      const zRight = zone.x + zone.w
      const zBottom = zone.y + zone.h
      const overlapW = Math.min(sRight, zRight) - Math.max(slot.x, zone.x)
      const overlapH = Math.min(sBottom, zBottom) - Math.max(slot.y, zone.y)
      if (overlapW > 0 && overlapH > 0) {
        violations.push(`${slot.id} overlaps ${zone.id}`)
      }
    }
  }
  return violations
}
