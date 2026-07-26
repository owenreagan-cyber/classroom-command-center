import { shuffle } from '../student-picker/randomizerEngine'
import { getActivePrizes, weightedRandomPrize } from './prizeBank'
import { PRIZE_BOARD_SIZE } from './types'
import type {
  Prize,
  PrizeBoardSession,
  PrizeBoardTile,
  PrizeSettingsOverride,
} from './types'
import type { PickerPoolKey } from '../roster/types'

const generateId = () => Math.random().toString(36).slice(2, 10)

function emptyTiles(): PrizeBoardTile[] {
  return Array.from({ length: PRIZE_BOARD_SIZE }, (_, index) => ({
    index,
    kind: 'empty' as const,
  }))
}

export function createEmptyBoardSession(poolKey: PickerPoolKey): PrizeBoardSession {
  const now = Date.now()
  return {
    id: generateId(),
    poolKey,
    tiles: emptyTiles(),
    createdAt: now,
    updatedAt: now,
    revealHistory: [],
  }
}

export interface GenerateBoardOptions {
  prizeCount?: number
  studentIds?: Array<{ id: string; displayName: string }>
  rng?: () => number
}

/** Place prize and optional student tiles on a 100-tile board using rarity weighting. */
export function generateBoardTiles(
  bank: Prize[],
  overrides: Record<string, PrizeSettingsOverride>,
  options: GenerateBoardOptions = {},
): PrizeBoardTile[] {
  const tiles = emptyTiles()
  const activePrizes = getActivePrizes(bank, overrides)
  const rng = options.rng ?? Math.random
  const prizeCount = Math.min(options.prizeCount ?? 24, activePrizes.length * 3, PRIZE_BOARD_SIZE - 4)

  const indices = shuffle(Array.from({ length: PRIZE_BOARD_SIZE }, (_, i) => i))

  let cursor = 0
  for (let i = 0; i < prizeCount && cursor < indices.length; i++) {
    const picked = weightedRandomPrize(activePrizes, rng)
    if (!picked) break
    const tileIndex = indices[cursor]!
    tiles[tileIndex] = {
      index: tileIndex,
      kind: 'prize',
      prizeId: picked.id,
    }
    cursor++
  }

  const students = options.studentIds ?? []
  for (const student of students) {
    if (cursor >= indices.length) break
    const tileIndex = indices[cursor]!
    if (tiles[tileIndex].kind !== 'empty') {
      cursor++
      if (cursor >= indices.length) break
    }
    const assignIndex = indices[cursor]!
    tiles[assignIndex] = {
      index: assignIndex,
      kind: 'student',
      studentId: student.id,
      studentDisplayName: student.displayName,
    }
    cursor++
  }

  return tiles
}

export function boardUsesStableIds(tiles: PrizeBoardTile[]): boolean {
  return tiles.every((t) => {
    if (t.kind === 'student') return Boolean(t.studentId)
    if (t.kind === 'prize' || t.kind === 'revealed') return Boolean(t.prizeId)
    return true
  })
}
