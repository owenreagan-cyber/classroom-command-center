import type { WhammyConsequence, WhammyPhase } from './types'

const WHAMMY_SEQUENCE: WhammyPhase[] = [
  'fakeReward',
  'alarm',
  'whammyAppear',
  'message',
  'consequence',
]

const PHASE_DURATIONS_MS: Record<WhammyPhase, number> = {
  fakeReward: 1800,
  alarm: 1200,
  whammyAppear: 1500,
  message: 2000,
  consequence: 1500,
}

export function nextWhammyPhase(current: WhammyPhase | null): WhammyPhase | null {
  if (!current) return 'fakeReward'
  const idx = WHAMMY_SEQUENCE.indexOf(current)
  if (idx < 0 || idx >= WHAMMY_SEQUENCE.length - 1) return null
  return WHAMMY_SEQUENCE[idx + 1]!
}

export function whammyPhaseDuration(phase: WhammyPhase): number {
  return PHASE_DURATIONS_MS[phase]
}

export function applyWhammyConsequence(
  consequence: WhammyConsequence,
  remainingSpins: number,
): { remainingSpins: number; message: string } {
  switch (consequence) {
    case 'loseSpin':
      return {
        remainingSpins: Math.max(0, remainingSpins - 1),
        message: 'You lose a spin!',
      }
    case 'consolationPrize':
      return {
        remainingSpins,
        message: 'Consolation prize awarded.',
      }
    case 'downgradePrize':
      return {
        remainingSpins,
        message: 'Prize downgraded.',
      }
    default:
      return { remainingSpins, message: '' }
  }
}

export function isWhammyComplete(phase: WhammyPhase | null): boolean {
  return phase === 'consequence'
}
