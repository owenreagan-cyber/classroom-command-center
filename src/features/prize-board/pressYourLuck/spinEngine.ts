import type { Prize, PrizeBoardTile, PrizeSettingsOverride } from '../types'
import { PRIZE_BOARD_SIZE } from '../types'
import { getPrizeById, isMysteryBoxPrize } from '../prizeBank'
import type { SpinOutcome } from './types'

export interface SpinPathOptions {
  tileCount?: number
  totalDurationMs?: number
  /** Deterministic RNG for tests */
  rng?: () => number
}

/** Precomputed highlight path from start to final tile with deceleration. */
export function buildSpinPath(
  finalIndex: number,
  options: SpinPathOptions = {},
): number[] {
  const tileCount = options.tileCount ?? PRIZE_BOARD_SIZE
  const rng = options.rng ?? Math.random
  const totalDurationMs = options.totalDurationMs ?? 12_000

  // More steps = longer visual spin; ~8–14 full laps then land
  const minLaps = 6
  const maxLaps = 10
  const laps = minLaps + Math.floor(rng() * (maxLaps - minLaps + 1))
  const approachSteps = 12 + Math.floor(rng() * 8)
  const totalSteps = laps * tileCount + approachSteps

  const path: number[] = []
  let index = Math.floor(rng() * tileCount)

  for (let step = 0; step < totalSteps; step++) {
    const progress = step / Math.max(1, totalSteps - 1)
    // Ease-out: early steps advance quickly, late steps linger
    const delayWeight = 0.35 + progress * progress * 2.5
    const repeats = Math.max(1, Math.round(delayWeight))

    index = (index + 1) % tileCount
    for (let r = 0; r < repeats; r++) {
      path.push(index)
    }
  }

  // Ensure path ends on final tile
  let cursor = path.length > 0 ? path[path.length - 1]! : index
  while (cursor !== finalIndex) {
    cursor = (cursor + 1) % tileCount
    path.push(cursor)
  }

  // Normalize path length to approximate duration at ~60fps tick equivalent
  const targetLen = Math.max(path.length, Math.floor(totalDurationMs / 80))
  while (path.length < targetLen) {
    path.push(finalIndex)
  }

  return path
}

/** Map elapsed spin time to highlighted tile index along a precomputed path. */
export function highlightAtElapsed(
  path: number[],
  elapsedMs: number,
  totalDurationMs: number,
): number {
  if (path.length === 0) return 0
  const t = Math.min(1, Math.max(0, elapsedMs / totalDurationMs))
  const idx = Math.min(path.length - 1, Math.floor(t * (path.length - 1)))
  return path[idx]!
}

export function pickRandomTileIndex(
  tiles: PrizeBoardTile[],
  rng: () => number = Math.random,
): number {
  if (tiles.length === 0) return 0
  return Math.floor(rng() * tiles.length)
}

export function resolveSpinOutcome(
  tile: PrizeBoardTile,
  prizeBank: Prize[],
  prizeOverrides: Record<string, PrizeSettingsOverride>,
): SpinOutcome {
  const base = { tileIndex: tile.index }

  if (tile.kind === 'empty') {
    return { kind: 'empty', ...base }
  }

  if (tile.kind === 'student') {
    return {
      kind: 'student',
      ...base,
      studentId: tile.studentId,
      studentDisplayName: tile.studentDisplayName,
    }
  }

  if (tile.kind === 'prize' && tile.prizeId) {
    const prize = getPrizeById(tile.prizeId, prizeBank, prizeOverrides)
    if (isMysteryBoxPrize(tile.prizeId)) {
      return {
        kind: 'mysteryBox',
        ...base,
        prizeId: tile.prizeId,
        prizeLabel: prize?.label ?? 'Mystery Box',
        prizeRarity: prize?.rarity,
      }
    }
    if (prize?.whammyEligible) {
      return {
        kind: 'whammy',
        ...base,
        prizeId: tile.prizeId,
        prizeLabel: prize?.label,
        prizeRarity: prize?.rarity,
      }
    }
    return {
      kind: 'prize',
      ...base,
      prizeId: tile.prizeId,
      prizeLabel: prize?.label ?? 'Prize',
      prizeRarity: prize?.rarity,
    }
  }

  return { kind: 'empty', ...base }
}

/** Whether display should enter fullscreen projector mode. */
export function shouldShowProjectorMode(phase: string): boolean {
  return phase === 'spinning' || phase === 'stopping' || phase === 'revealing'
    || phase === 'celebrating' || phase === 'miss'
}
