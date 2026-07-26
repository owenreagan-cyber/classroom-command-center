import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PickerPoolKey } from '../../roster/types'
import { unlockAudio } from './audioManager'
import {
  advanceRevealState,
  createInitialPressYourLuckState,
  PRESS_YOUR_LUCK_STORAGE_KEY,
  recoverInterruptedSpin,
  resetSpinState,
  startSpinTransition,
  transitionAfterSpinComplete,
  type PressYourLuckActions,
} from './pressYourLuckLogic'
import type { PressYourLuckState } from './types'
import { usePrizeBoardStore } from '../prizeBoardStore'

type Store = PressYourLuckState & PressYourLuckActions

export const usePressYourLuckStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createInitialPressYourLuckState(),

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

      setRemainingSpins: (count) => set({ remainingSpins: Math.max(0, count) }),

      setMaxSpins: (count) => set({ maxSpins: Math.max(1, count), remainingSpins: Math.max(1, count) }),

      setWhammyConfig: (config) => set((s) => ({
        whammyConfig: { ...s.whammyConfig, ...config },
      })),

      prepareSpin: (poolKey) => {
        unlockAudio()
        set({ activePoolKey: poolKey, phase: 'ready' })
      },

      startSpin: (poolKey, rng) => {
        unlockAudio()
        const state = get()
        const board = usePrizeBoardStore.getState().boards[poolKey]
        if (!board) return false

        const patch = startSpinTransition(state, poolKey, board.tiles, rng)
        if (!patch) return false
        set(patch)
        return true
      },

      requestStop: () => {
        const { phase } = get()
        if (phase === 'spinning') {
          set({
            phase: 'stopping',
            spinStartTime: Date.now(),
          })
          // Fallback when rAF is throttled (headless browsers, background tabs)
          setTimeout(() => {
            const current = get()
            if (current.phase === 'stopping') {
              get().completeSpin()
            }
          }, 850)
        }
      },

      completeSpin: () => {
        const state = get()
        const poolKey = state.activePoolKey
        if (!poolKey || state.finalTileId === null) return

        const board = usePrizeBoardStore.getState().boards[poolKey]
        const tile = board?.tiles[state.finalTileId]
        if (!tile) return

        const prizeState = usePrizeBoardStore.getState()
        const patch = transitionAfterSpinComplete(
          state,
          tile,
          prizeState.prizeBank,
          prizeState.prizeOverrides,
        )
        set({
          ...patch,
          highlightedTileId: state.finalTileId,
          phase: patch.phase ?? 'revealing',
        })

        // Persist board reveal for prize/student tiles (teacher store)
        if (tile.kind === 'prize' && patch.outcome?.kind === 'prize') {
          prizeState.revealTile(poolKey, state.finalTileId)
        } else if (tile.kind === 'student') {
          prizeState.revealTile(poolKey, state.finalTileId)
        } else if (tile.kind === 'prize' && patch.outcome?.kind === 'mysteryBox') {
          // Mystery box stays unrevealed until sequence completes
        }
      },

      advanceReveal: () => {
        const state = get()
        const patch = advanceRevealState(state)

        // Open mystery box on reveal completion
        if (
          state.mysteryPhase === 'select'
          && patch.phase === 'celebrating'
          && state.activePoolKey
          && state.finalTileId !== null
          && state.mysteryInnerPrizeId
        ) {
          usePrizeBoardStore.getState().openMysteryBox(
            state.activePoolKey,
            state.finalTileId,
            state.mysteryInnerPrizeId,
          )
        }

        set(patch)
      },

      skipReveal: () => {
        set({
          phase: 'ready',
          outcome: null,
          highlightedTileId: null,
          finalTileId: null,
          spinStartTime: null,
          selectedStudentId: null,
          selectedPrizeId: null,
          revealExperience: null,
          mysteryPhase: null,
          mysteryInnerPrizeId: null,
          whammyPhase: null,
          testCelebrationRarity: null,
        })
      },

      resetSpin: () => set(resetSpinState()),

      testCelebration: (rarity) => {
        unlockAudio()
        if (!rarity) return
        set({
          phase: 'celebrating',
          testCelebrationRarity: rarity,
          revealExperience: rarity === 'legendary' ? 'legendary'
            : rarity === 'veryRare' ? 'veryRare'
              : rarity === 'rare' || rarity === 'uncommon' ? 'rare'
                : 'common',
          outcome: {
            kind: 'prize',
            tileIndex: 0,
            prizeLabel: 'Test Prize',
            prizeRarity: rarity,
          },
        })
      },

      syncHighlight: (tileId) => {
        const { highlightedTileId } = get()
        if (highlightedTileId !== tileId) {
          set({ highlightedTileId: tileId })
        }
      },
    }),
    {
      name: PRESS_YOUR_LUCK_STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        remainingSpins: state.remainingSpins,
        maxSpins: state.maxSpins,
        whammyConfig: state.whammyConfig,
        activePoolKey: state.activePoolKey,
        phase: state.phase,
        currentSpinCount: state.currentSpinCount,
        finalTileId: state.finalTileId,
        spinStartTime: state.spinStartTime,
        spinDurationMs: state.spinDurationMs,
        highlightedTileId: state.highlightedTileId,
        selectedStudentId: state.selectedStudentId,
        selectedPrizeId: state.selectedPrizeId,
        outcome: state.outcome,
        revealExperience: state.revealExperience,
        mysteryPhase: state.mysteryPhase,
        mysteryInnerPrizeId: state.mysteryInnerPrizeId,
        whammyPhase: state.whammyPhase,
      }),
      onRehydrateStorage: () => (rehydrated) => {
        if (!rehydrated) return
        const recovery = recoverInterruptedSpin(rehydrated as PressYourLuckState)
        if (recovery) {
          Object.assign(rehydrated, recovery)
        }
      },
    },
  ),
)

usePressYourLuckStore.persist.onFinishHydration(() => {
  const state = usePressYourLuckStore.getState()
  const recovery = recoverInterruptedSpin(state)
  if (recovery) {
    usePressYourLuckStore.setState(recovery)
  }
})

export { PRESS_YOUR_LUCK_STORAGE_KEY } from './pressYourLuckLogic'
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key !== PRESS_YOUR_LUCK_STORAGE_KEY || !event.newValue) return
    try {
      const parsed = JSON.parse(event.newValue) as { state?: Partial<PressYourLuckState> }
      const restored = parsed.state ?? parsed
      usePressYourLuckStore.setState(restored as Partial<PressYourLuckState>)
    } catch {
      // ignore malformed storage
    }
  })
}

export function getActivePoolKey(): PickerPoolKey | null {
  return usePressYourLuckStore.getState().activePoolKey
}
