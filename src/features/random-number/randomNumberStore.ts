import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  drawRandomNumber,
  hydrateRandomNumberState,
  isRangeExhausted,
  undoLastDraw,
  validateRange,
  type Rng,
} from './randomNumberLogic'
import {
  DEFAULT_MAX,
  DEFAULT_MIN,
  RANDOM_NUMBER_STORAGE_KEY,
  RANDOM_NUMBER_STORAGE_VERSION,
  type RandomNumberDrawEntry,
} from './types'

export interface RandomNumberStoreState {
  min: number
  max: number
  preventRepeat: boolean
  history: RandomNumberDrawEntry[]
  lastResult: number | null
  showOnDisplay: boolean
  setBounds: (min: number, max: number) => { ok: boolean; message: string | null }
  setPreventRepeat: (enabled: boolean) => void
  drawNumber: (rng?: Rng) => { ok: boolean; value?: number; message?: string }
  undoDraw: () => void
  resetHistory: () => void
  sendToDisplay: () => void
  clearDisplay: () => void
}

const initialState = {
  min: DEFAULT_MIN,
  max: DEFAULT_MAX,
  preventRepeat: false,
  history: [] as RandomNumberDrawEntry[],
  lastResult: null as number | null,
  showOnDisplay: false,
}

export const useRandomNumberStore = create<RandomNumberStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setBounds: (min, max) => {
        const validation = validateRange(min, max)
        if (!validation.valid) {
          return { ok: false, message: validation.message }
        }
        set({ min: validation.min, max: validation.max })
        return { ok: true, message: null }
      },

      setPreventRepeat: (enabled) => {
        set({ preventRepeat: enabled })
      },

      drawNumber: (rng) => {
        const { min, max, history, preventRepeat } = get()
        const outcome = drawRandomNumber(min, max, history, preventRepeat, rng)
        if (!outcome.ok) {
          if (outcome.reason === 'exhausted') {
            return { ok: false, message: 'All numbers in this range have been used. Reset history or turn off no-repeat.' }
          }
          return { ok: false, message: 'Invalid range. Check minimum and maximum.' }
        }

        const entry: RandomNumberDrawEntry = { value: outcome.value, drawnAt: Date.now() }
        const nextHistory = [...history, entry]
        set({
          history: nextHistory,
          lastResult: outcome.value,
          showOnDisplay: true,
        })
        return { ok: true, value: outcome.value }
      },

      undoDraw: () => {
        const { history, showOnDisplay } = get()
        const { history: nextHistory, lastResult } = undoLastDraw(history)
        set({
          history: nextHistory,
          lastResult,
          showOnDisplay: showOnDisplay && lastResult !== null,
        })
      },

      resetHistory: () => {
        set({ history: [], lastResult: null, showOnDisplay: false })
      },

      sendToDisplay: () => {
        const { lastResult } = get()
        if (lastResult !== null) {
          set({ showOnDisplay: true })
        }
      },

      clearDisplay: () => {
        set({ showOnDisplay: false })
      },
    }),
    {
      name: RANDOM_NUMBER_STORAGE_KEY,
      version: RANDOM_NUMBER_STORAGE_VERSION,
      partialize: (state) => ({
        min: state.min,
        max: state.max,
        preventRepeat: state.preventRepeat,
        history: state.history,
        lastResult: state.lastResult,
        showOnDisplay: state.showOnDisplay,
      }),
      migrate: (persisted) => hydrateRandomNumberState(persisted),
    },
  ),
)

export function selectIsExhausted(state: RandomNumberStoreState): boolean {
  return isRangeExhausted(state.min, state.max, state.history, state.preventRepeat)
}

export { RANDOM_NUMBER_STORAGE_KEY }
