import type { ClassGroup, PickerPoolKey } from '../roster/types'

export type TitleRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

/** Shared titles appear in all pools; class-locked titles only match their class. */
export type TitleClassLock = ClassGroup | 'shared'

export interface RecognitionTitle {
  id: string
  label: string
  classLock: TitleClassLock
  rarity: TitleRarity
}

export interface TitleUsageEntry {
  titleId: string
  titleLabel: string
  poolKey: PickerPoolKey
  timestamp: number
  slotRole?: 'high-flier' | 'star'
}
