import type { Prize } from '../prize-board/types'
import type { BoardOutcome, BoardOutcomeKind } from './types'
import { getActivePrizes } from '../prize-board/prizeBank'
import type { PrizeSettingsOverride } from '../prize-board/types'

export interface GenerateOutcomesOptions {
  prizeBank: Prize[]
  prizeOverrides: Record<string, PrizeSettingsOverride>
  rng?: () => number
}

const TRY_AGAIN_LABEL = 'Try Again!'
const WHAMMY_LABEL = 'Whoops!'

/** Distribution weights for 100-board outcomes. */
const DISTRIBUTION: { kind: BoardOutcomeKind; count: number }[] = [
  { kind: 'prize', count: 55 },
  { kind: 'tryAgain', count: 30 },
  { kind: 'whammy', count: 10 },
  { kind: 'bonus', count: 5 },
]

/** Rarity distribution within the 55 prize tiles. */
const PRIZE_RARITY_DISTRIBUTION: { rarity: string; count: number }[] = [
  { rarity: 'premiumUltraRare', count: 2 },
  { rarity: 'veryRare', count: 4 },
  { rarity: 'rare', count: 14 },
  { rarity: 'common', count: 35 },
]

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function generateId(): string {
  return `hb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getPrizesByRarity(prizes: Prize[], rarity: string): Prize[] {
  return prizes.filter((p) => p.rarity === rarity)
}

export function generateBoardOutcomes(options: GenerateOutcomesOptions): BoardOutcome[] {
  const rng = options.rng ?? Math.random
  const active = getActivePrizes(options.prizeBank, options.prizeOverrides)
    .filter((p) => !p.whammyEligible) // exclude whammy bait from prize pool

  const outcomes: BoardOutcome[] = []

  // Generate prize outcomes
  for (const dist of PRIZE_RARITY_DISTRIBUTION) {
    const candidates = getPrizesByRarity(active, dist.rarity)
    const shuffled = shuffle(candidates, rng)
    for (let i = 0; i < dist.count; i++) {
      const prize = shuffled[i % Math.max(1, shuffled.length)]
      if (prize) {
        outcomes.push({
          id: generateId(),
          kind: 'prize',
          prizeId: prize.id,
          label: prize.label,
          displayLabel: prize.label,
          rarity: prize.rarity,
          displayEmoji: prize.displayEmoji,
          teacherNote: prize.teacherNotes,
        })
      }
    }
  }

  // Generate try-again outcomes
  for (let i = 0; i < DISTRIBUTION.find((d) => d.kind === 'tryAgain')!.count; i++) {
    outcomes.push({
      id: generateId(),
      kind: 'tryAgain',
      label: TRY_AGAIN_LABEL,
      displayLabel: TRY_AGAIN_LABEL,
      displayEmoji: '🔄',
    })
  }

  // Generate whammy outcomes
  for (let i = 0; i < DISTRIBUTION.find((d) => d.kind === 'whammy')!.count; i++) {
    outcomes.push({
      id: generateId(),
      kind: 'whammy',
      label: WHAMMY_LABEL,
      displayLabel: WHAMMY_LABEL,
      displayEmoji: '😅',
    })
  }

  // Generate bonus outcomes
  const bonusLabels = ['Free Pick!', 'Pick Again!', 'Double Chance!', 'Teacher Surprise!', 'Bonus Spin!']
  for (let i = 0; i < DISTRIBUTION.find((d) => d.kind === 'bonus')!.count; i++) {
    const label = bonusLabels[i % bonusLabels.length]!
    outcomes.push({
      id: generateId(),
      kind: 'bonus',
      label,
      displayLabel: label,
      displayEmoji: '✨',
    })
  }

  return shuffle(outcomes, rng)
}

export function generateBoardTiles(outcomes: BoardOutcome[], rng?: (() => number)): { tiles: import('./types').BoardTile[]; sortedOutcomes: BoardOutcome[] } {
  const r = rng ?? Math.random
  const sortedOutcomes = shuffle(outcomes, r)
  const tiles: import('./types').BoardTile[] = Array.from({ length: 100 }, (_, i): import('./types').BoardTile => ({
    tileNumber: i + 1,
    state: 'unopened',
    outcomeIndex: null,
    revealedAt: null,
  }))

  for (let i = 0; i < 100 && i < sortedOutcomes.length; i++) {
    tiles[i] = { ...tiles[i], outcomeIndex: i }
  }

  // Do not shuffle tiles — keep visual order 1-100. Randomness is in outcome placement.
  return { tiles, sortedOutcomes }
}
