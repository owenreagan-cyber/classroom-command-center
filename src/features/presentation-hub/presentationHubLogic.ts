/**
 * Phase 15L.2 — Presentation Hub logic.
 *
 * Pure, deterministic helpers for the presentation-first home surface on
 * /control. No React, no store, no DOM. Consumed by PresentationHub.tsx and by
 * the display-studio test suite so the Current/Next and status resolution
 * behavior is executable rather than implicit.
 */

/** Student-safe display status for the hub's live indicator. */
export type PresentationDisplayStatus = 'live' | 'blanked' | 'idle'

export interface PresentationStateInput {
  activeScreenId: string | null
  displayBlanked: boolean
}

/** Resolve the single display status from persisted composer state. */
export function resolvePresentationStatus(input: PresentationStateInput): PresentationDisplayStatus {
  if (input.displayBlanked) return 'blanked'
  if (input.activeScreenId) return 'live'
  return 'idle'
}

/** Whether a screen id is the one currently live on /display. */
export function isScreenLive(
  screenId: string,
  activeScreenId: string | null,
  displayBlanked: boolean,
): boolean {
  return !displayBlanked && activeScreenId !== null && activeScreenId === screenId
}

/**
 * The adjacent screen id in `order` for the presentation Previous/Next controls.
 * Clamps at the ends (no wrap) so the controls disable at the first/last screen.
 * When `currentId` is not found in `order`, "next" resolves to the first screen
 * and "previous" resolves to the last — a safe fallback for an empty selection.
 */
export function getAdjacentScreenId(
  order: readonly string[],
  currentId: string | null,
  direction: 'prev' | 'next',
): string | null {
  if (order.length === 0) return null
  const index = currentId ? order.indexOf(currentId) : -1
  if (index === -1) {
    return direction === 'next' ? order[0] : order[order.length - 1]
  }
  const target = direction === 'next' ? index + 1 : index - 1
  if (target < 0 || target >= order.length) return null
  return order[target]
}

export function getNextScreenId(order: readonly string[], currentId: string | null): string | null {
  return getAdjacentScreenId(order, currentId, 'next')
}

export function getPreviousScreenId(order: readonly string[], currentId: string | null): string | null {
  return getAdjacentScreenId(order, currentId, 'prev')
}

/**
 * Resolve the screen id the hub should treat as "selected" (the one the primary
 * Send-to-Display action targets and the preview shows when nothing else is
 * selected). Falls back to the live screen, then the first screen in order.
 */
export function resolveFallbackScreenId(
  order: readonly string[],
  selectedScreenId: string | null,
  activeScreenId: string | null,
): string | null {
  if (selectedScreenId && order.includes(selectedScreenId)) return selectedScreenId
  if (activeScreenId && order.includes(activeScreenId)) return activeScreenId
  return order[0] ?? null
}
