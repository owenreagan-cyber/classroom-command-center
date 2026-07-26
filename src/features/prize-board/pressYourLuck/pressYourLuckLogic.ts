import type { PickerPoolKey } from '../../roster/types'
import { pickRandomMysteryContents } from '../prizeBank'
import { usePrizeBoardStore } from '../prizeBoardStore'
import type { PrizeBoardTile } from '../types'
import { buildSpinPath, pickRandomTileIndex, resolveSpinOutcome } from './spinEngine'
import { isMysteryComplete, nextMysteryPhase } from './mysteryReveal'
import { applyWhammyConsequence, isWhammyComplete, nextWhammyPhase } from './whammyState'
import {
  DEFAULT_SPIN_DURATION_MS,
  DEFAULT_WHAMMY_CONFIG,
  rarityToRevealExperience,
  type PressYourLuckPhase,
  type PressYourLuckState,
  type SpinOutcome,
  type WhammyConfig,
} from './types'

export const PRESS_YOUR_LUCK_STORAGE_KEY = 'classroom-press-your-luck-v1'

/** Ephemeral spin path — never persisted */
let activeSpinPath: number[] = []

export function getActiveSpinPath(): number[] {
  return activeSpinPath
}

export function setActiveSpinPath(path: number[]): void {
  activeSpinPath = path
}

const runtimeDefaults = {
  phase: 'idle' as PressYourLuckPhase,
  currentSpinCount: 0,
  highlightedTileId: null as number | null,
  finalTileId: null as number | null,
  spinStartTime: null as number | null,
  spinDurationMs: DEFAULT_SPIN_DURATION_MS,
  selectedStudentId: null as string | null,
  selectedPrizeId: null as string | null,
  outcome: null as SpinOutcome | null,
  revealExperience: null,
  mysteryPhase: null,
  mysteryInnerPrizeId: null as string | null,
  whammyPhase: null,
  testCelebrationRarity: null,
}

export type PressYourLuckActions = {
  setSoundEnabled: (enabled: boolean) => void
  setRemainingSpins: (count: number) => void
  setMaxSpins: (count: number) => void
  setWhammyConfig: (config: Partial<WhammyConfig>) => void
  prepareSpin: (poolKey: PickerPoolKey) => void
  startSpin: (poolKey: PickerPoolKey, rng?: () => number) => boolean
  requestStop: () => void
  completeSpin: () => void
  advanceReveal: () => void
  skipReveal: () => void
  resetSpin: () => void
  testCelebration: (rarity: PressYourLuckState['testCelebrationRarity']) => void
  syncHighlight: (tileId: number) => void
}

export function createInitialPressYourLuckState(): PressYourLuckState {
  return {
    soundEnabled: true,
    remainingSpins: 3,
    maxSpins: 3,
    whammyConfig: { ...DEFAULT_WHAMMY_CONFIG },
    activePoolKey: null,
    ...runtimeDefaults,
  }
}

export function transitionAfterSpinComplete(
  _state: PressYourLuckState,
  tile: PrizeBoardTile,
  prizeBank: ReturnType<typeof usePrizeBoardStore.getState>['prizeBank'],
  prizeOverrides: ReturnType<typeof usePrizeBoardStore.getState>['prizeOverrides'],
): Partial<PressYourLuckState> {
  const outcome = resolveSpinOutcome(tile, prizeBank, prizeOverrides)

  if (outcome.kind === 'empty') {
    return {
      phase: 'miss',
      outcome,
      selectedStudentId: null,
      selectedPrizeId: null,
      revealExperience: null,
      mysteryPhase: null,
      whammyPhase: null,
    }
  }

  if (outcome.kind === 'student') {
    return {
      phase: 'revealing',
      outcome,
      selectedStudentId: outcome.studentId ?? null,
      selectedPrizeId: null,
      revealExperience: 'common',
      mysteryPhase: null,
      whammyPhase: null,
    }
  }

  if (outcome.kind === 'whammy') {
    return {
      phase: 'revealing',
      outcome,
      selectedPrizeId: outcome.prizeId ?? null,
      whammyPhase: 'fakeReward',
      mysteryPhase: null,
      revealExperience: null,
    }
  }

  if (outcome.kind === 'mysteryBox') {
    const inner = pickRandomMysteryContents(prizeBank, prizeOverrides)
    return {
      phase: 'revealing',
      outcome,
      selectedPrizeId: outcome.prizeId ?? null,
      mysteryPhase: 'announce',
      mysteryInnerPrizeId: inner?.id ?? null,
      whammyPhase: null,
      revealExperience: null,
    }
  }

  return {
    phase: 'revealing',
    outcome,
    selectedPrizeId: outcome.prizeId ?? null,
    revealExperience: outcome.prizeRarity
      ? rarityToRevealExperience(outcome.prizeRarity)
      : 'common',
    mysteryPhase: null,
    whammyPhase: null,
  }
}

export function advanceRevealState(state: PressYourLuckState): Partial<PressYourLuckState> {
  if (state.phase === 'revealing' && state.whammyPhase) {
    const next = nextWhammyPhase(state.whammyPhase)
    if (!next || isWhammyComplete(state.whammyPhase)) {
      const result = applyWhammyConsequence(state.whammyConfig.consequence, state.remainingSpins)
      return {
        phase: 'miss',
        whammyPhase: null,
        remainingSpins: result.remainingSpins,
      }
    }
    return { whammyPhase: next }
  }

  if (state.phase === 'revealing' && state.mysteryPhase) {
    const next = nextMysteryPhase(state.mysteryPhase)
    if (!next || isMysteryComplete(state.mysteryPhase)) {
      const inner = state.mysteryInnerPrizeId
        ? usePrizeBoardStore.getState().prizeBank.find((p) => p.id === state.mysteryInnerPrizeId)
        : undefined
      return {
        phase: 'celebrating',
        mysteryPhase: null,
        revealExperience: inner?.rarity
          ? rarityToRevealExperience(inner.rarity)
          : 'rare',
      }
    }
    return { mysteryPhase: next }
  }

  if (state.phase === 'revealing') {
    return { phase: 'celebrating' }
  }

  if (state.phase === 'celebrating' || state.phase === 'miss') {
    return {
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
    }
  }

  return {}
}

export function startSpinTransition(
  state: PressYourLuckState,
  poolKey: PickerPoolKey,
  tiles: PrizeBoardTile[],
  rng: () => number = Math.random,
): Partial<PressYourLuckState> | null {
  if (state.remainingSpins <= 0) return null
  if (state.phase === 'spinning' || state.phase === 'stopping') return null

  const finalIndex = pickRandomTileIndex(tiles, rng)
  const path = buildSpinPath(finalIndex, {
    rng,
    totalDurationMs: state.spinDurationMs || DEFAULT_SPIN_DURATION_MS,
  })
  setActiveSpinPath(path)

  return {
    phase: 'spinning',
    activePoolKey: poolKey,
    currentSpinCount: state.currentSpinCount + 1,
    remainingSpins: state.remainingSpins - 1,
    finalTileId: finalIndex,
    highlightedTileId: path[0] ?? finalIndex,
    spinStartTime: Date.now(),
    outcome: null,
    revealExperience: null,
    mysteryPhase: null,
    mysteryInnerPrizeId: null,
    whammyPhase: null,
    testCelebrationRarity: null,
  }
}

export function resetSpinState(): Partial<PressYourLuckState> {
  setActiveSpinPath([])
  return { ...runtimeDefaults, activePoolKey: null }
}

/**
 * Recover from interrupted page reload during an active spin.
 * Refunds the consumed spin and clears final tile — never auto-awards an outcome.
 */
export function recoverInterruptedSpin(state: PressYourLuckState): Partial<PressYourLuckState> | null {
  if (state.phase !== 'spinning' && state.phase !== 'stopping') {
    return null
  }

  setActiveSpinPath([])

  return {
    phase: 'ready',
    highlightedTileId: null,
    finalTileId: null,
    spinStartTime: null,
    outcome: null,
    revealExperience: null,
    mysteryPhase: null,
    mysteryInnerPrizeId: null,
    whammyPhase: null,
    selectedStudentId: null,
    selectedPrizeId: null,
    testCelebrationRarity: null,
    remainingSpins: state.remainingSpins + 1,
    currentSpinCount: Math.max(0, state.currentSpinCount - 1),
  }
}
