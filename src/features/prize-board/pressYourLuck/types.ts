import type { PickerPoolKey } from '../../roster/types'
import type { PrizeRarity } from '../types'

/** Press Your Luck game phases */
export type PressYourLuckPhase =
  | 'idle'
  | 'ready'
  | 'spinning'
  | 'stopping'
  | 'revealing'
  | 'celebrating'
  | 'miss'

export type SpinOutcomeKind = 'empty' | 'student' | 'prize' | 'mysteryBox' | 'whammy'

export interface SpinOutcome {
  kind: SpinOutcomeKind
  tileIndex: number
  studentId?: string
  studentDisplayName?: string
  prizeId?: string
  prizeLabel?: string
  prizeRarity?: PrizeRarity
}

export type RevealExperienceLevel = 'common' | 'rare' | 'veryRare' | 'legendary'

export type MysteryRevealPhase = 'announce' | 'shake' | 'select' | 'reveal'

export type WhammyPhase = 'fakeReward' | 'alarm' | 'whammyAppear' | 'message' | 'consequence'

export type WhammyConsequence = 'loseSpin' | 'consolationPrize' | 'downgradePrize'

export interface WhammyConfig {
  consequence: WhammyConsequence
  fakeRewardLabel: string
  consolationPrizeId?: string
}

export const DEFAULT_WHAMMY_CONFIG: WhammyConfig = {
  consequence: 'loseSpin',
  fakeRewardLabel: 'Homework Pass',
}

export const DEFAULT_SPIN_DURATION_MS = 12_000

export interface PressYourLuckPersistedState {
  soundEnabled: boolean
  remainingSpins: number
  maxSpins: number
  whammyConfig: WhammyConfig
  activePoolKey: PickerPoolKey | null
}

export interface PressYourLuckRuntimeState {
  phase: PressYourLuckPhase
  currentSpinCount: number
  highlightedTileId: number | null
  finalTileId: number | null
  spinStartTime: number | null
  spinDurationMs: number
  selectedStudentId: string | null
  selectedPrizeId: string | null
  outcome: SpinOutcome | null
  revealExperience: RevealExperienceLevel | null
  mysteryPhase: MysteryRevealPhase | null
  mysteryInnerPrizeId: string | null
  whammyPhase: WhammyPhase | null
  testCelebrationRarity: PrizeRarity | null
}

export interface PressYourLuckState extends PressYourLuckPersistedState, PressYourLuckRuntimeState {}

export function isActiveProjectorPhase(phase: PressYourLuckPhase): boolean {
  return phase !== 'idle' && phase !== 'ready'
}

export function rarityToRevealExperience(rarity: PrizeRarity): RevealExperienceLevel {
  if (rarity === 'legendary') return 'legendary'
  if (rarity === 'veryRare') return 'veryRare'
  if (rarity === 'rare' || rarity === 'uncommon') return 'rare'
  return 'common'
}
