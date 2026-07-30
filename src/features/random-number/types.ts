export interface RandomNumberDrawEntry {
  value: number
  drawnAt: number
}

export interface RandomNumberPersistedState {
  min: number
  max: number
  preventRepeat: boolean
  history: RandomNumberDrawEntry[]
  lastResult: number | null
  showOnDisplay: boolean
}

export interface RandomNumberValidation {
  valid: boolean
  min: number
  max: number
  message: string | null
}

export type DrawOutcome =
  | { ok: true; value: number; exhausted: false }
  | { ok: true; value: number; exhausted: true }
  | { ok: false; reason: 'invalid-range' | 'exhausted' | 'empty-range-handled' }

export const RANDOM_NUMBER_STORAGE_KEY = 'classroom-random-number-v1'
export const RANDOM_NUMBER_STORAGE_VERSION = 1 as const

export const DEFAULT_MIN = 1
export const DEFAULT_MAX = 100
