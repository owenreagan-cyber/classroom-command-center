/**
 * Pure logic for the QR-cast URL — kept side-effect-free so it's unit
 * testable directly (mirrors the `stampLogic.ts`/`stampStore.ts` split).
 */

/** Trims and normalizes a candidate cast URL; empty/whitespace-only input becomes `null`. */
export function normalizeCastUrl(input: string): string | null {
  const trimmed = input.trim()
  return trimmed || null
}
