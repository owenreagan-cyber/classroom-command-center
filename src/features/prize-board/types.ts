import type { PickerPoolKey } from '../roster/types'

export type PrizeRarity = 'common' | 'uncommon' | 'rare' | 'veryRare' | 'legendary' | 'premiumUltraRare'

export type PrizeCategory =
  | 'physical'
  | 'privilege'
  | 'stamps'
  | 'container'
  | 'experience'
  | 'specialEvent'

export interface Prize {
  id: string
  label: string
  description: string
  rarity: PrizeRarity
  active: boolean
  category: PrizeCategory
  stock?: number | null
  notes?: string
  /** Teacher-only notes never shown on /display */
  teacherNotes?: string
  suggestedCost?: number
  physicalPrize?: boolean
  passPrivilege?: boolean
  displayEmoji?: string
  mysteryBoxEligible?: boolean
  /** Reserved for Phase 12C+ Whammy behavior */
  whammyEligible?: boolean
}

export type PrizeBoardTileKind = 'empty' | 'student' | 'prize' | 'revealed'

export interface PrizeBoardTile {
  index: number
  kind: PrizeBoardTileKind
  studentId?: string
  studentDisplayName?: string
  prizeId?: string
  /** When Mystery Box is revealed, the inner prize id */
  revealedPrizeId?: string
  revealedAt?: number
}

export interface PrizeRevealEntry {
  id: string
  tileIndex: number
  prizeId: string
  prizeLabel: string
  studentId?: string
  studentDisplayName?: string
  revealedPrizeId?: string
  revealedPrizeLabel?: string
  timestamp: number
}

export interface PrizeBoardSession {
  id: string
  poolKey: PickerPoolKey
  tiles: PrizeBoardTile[]
  createdAt: number
  updatedAt: number
  revealHistory: PrizeRevealEntry[]
}

export interface PrizeSettingsOverride {
  active?: boolean
  stock?: number | null
}

export interface PrizeBoardStoreState {
  prizeBank: Prize[]
  prizeOverrides: Record<string, PrizeSettingsOverride>
  boards: Record<string, PrizeBoardSession | null>

  setPrizeActive: (prizeId: string, active: boolean) => void
  updatePrizeOverride: (prizeId: string, override: PrizeSettingsOverride) => void
  resetPrizeOverrides: () => void

  generateBoard: (poolKey: PickerPoolKey, studentIds?: string[]) => void
  resetBoard: (poolKey: PickerPoolKey) => void
  assignStudentToTile: (
    poolKey: PickerPoolKey,
    tileIndex: number,
    studentId: string,
    displayName: string,
  ) => void
  clearTile: (poolKey: PickerPoolKey, tileIndex: number) => void
  revealTile: (poolKey: PickerPoolKey, tileIndex: number) => void
  openMysteryBox: (
    poolKey: PickerPoolKey,
    tileIndex: number,
    innerPrizeId: string,
  ) => void
}

export const PRIZE_BOARD_SIZE = 100

export const VALID_PRIZE_RARITIES: readonly PrizeRarity[] = [
  'common',
  'uncommon',
  'rare',
  'veryRare',
  'legendary',
  'premiumUltraRare',
]
