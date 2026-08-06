/**
 * Central prize catalog for Command Center.
 *
 * This file re-exports the canonical prize bank from prize-board/defaultPrizes
 * and provides documentation-only exports for cross-feature consumption.
 *
 * Source of truth: src/features/prize-board/defaultPrizes.ts
 *
 * Prize Rarities (Phase 15H):
 * - premiumUltraRare: Lunch with a Friend, Large 3D Print
 * - veryRare: Medium 3D Print, Teacher Chair
 * - rare: Small 3D Print, Treasure Box, Desk Pet Pass, Seat Swap,
 *         No Comp Pass, Show & Tell, Toy at Recess,
 *         Small Stuffed Animal, Sit by a Friend
 * - common: Sticker, Shoes Off Pass, Power Up Leader, Word Attack Leader
 *
 * Special / Inactive:
 * - +5 Points on Test (specialEvent, inactive by default)
 * - Surprise Bait / Whammy (specialEvent, inactive)
 *
 * Removed / Deprecated (Phase 15H):
 * - Homework Pass, Scroll of Exemption, Math-only Homework Pass,
 *   Reading-only Homework Pass, +3/+5/+10 Stamps,
 *   Stuffed Animal or Toy at Recess (split)
 *
 * Student Safety:
 * - /display uses toDisplaySafeBoardSnapshot to strip prize IDs and student data
 * - PYL displayPrivacy ensures no teacher config leaks to projector
 * - Mystery Student identities never appear on /display
 */

export { DEFAULT_PRIZE_BANK as CLASSROOM_PRIZE_CATALOG, DEPRECATED_PRIZE_IDS, MYSTERY_BOX_PRIZE_ID } from '../features/prize-board/defaultPrizes'
export type { Prize, PrizeRarity, PrizeCategory } from '../features/prize-board/types'
export { getActivePrizes, getPrizeById, isMysteryBoxPrize, getMysteryEligiblePrizes, RARITY_WEIGHTS } from '../features/prize-board/prizeBank'
export { RARITY_STYLES, RARITY_LABELS } from '../features/prize-board/rarityStyles'

/**
 * Prize cost guidance for reference (not enforced unless app implements economy).
 * These are suggested defaults — pricing is teacher-configurable through overrides.
 */
export const PRIZE_COST_GUIDANCE: Record<string, number> = {
  'prize-lunch-friend': 1000,
  'prize-large-3d': 1000,
  'prize-medium-3d': 600,
  'prize-teacher-chair': 600,
  'prize-small-3d': 350,
  'prize-treasure-box': 250,
  'prize-desk-pet': 300,
  'prize-switch-seat': 250,
  'prize-no-comp': 350,
  'prize-show-tell': 300,
  'prize-toy-recess': 300,
  'prize-small-stuffed': 300,
  'prize-sit-by-friend': 300,
  'prize-sticker': 50,
  'prize-no-shoes': 50,
  'prize-power-up': 100,
  'prize-word-attack': 100,
  'prize-points-test': 500,
}
