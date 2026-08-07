import type { DrawResult } from './types'

/**
 * Draw unique random numbers from the available pool.
 * Pure function — does not mutate inputs, testable with injected RNG.
 */
export function drawUniqueNumbers(
  available: number[],
  count: number,
  rng: () => number = Math.random,
): DrawResult {
  if (count <= 0) return { ok: false, numbers: [], remainingAfter: available.length, message: 'Draw count must be at least 1.' }
  if (available.length === 0) return { ok: false, numbers: [], remainingAfter: 0, message: 'No numbers remaining. Reset the board to draw again.' }

  const drawCount = Math.min(count, available.length)
  const pool = [...available]

  // Fisher-Yates partial shuffle to pick drawCount elements
  const drawn: number[] = []
  for (let i = 0; i < drawCount; i++) {
    const j = i + Math.floor(rng() * (pool.length - i))
    const temp = pool[i]!
    pool[i] = pool[j]!
    pool[j] = temp
    drawn.push(pool[i]!)
  }

  const remainingAfter = available.length - drawn.length

  return {
    ok: true,
    numbers: drawn,
    remainingAfter,
    message: remainingAfter === 0 ? 'All numbers have been drawn!' : undefined,
  }
}

/** Fisher-Yates shuffle helper (non-mutating). */
export function shuffleNumbers(arr: number[], rng: () => number = Math.random): number[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function createInitialNumbers(rangeStart: number, rangeEnd: number): number[] {
  const numbers: number[] = []
  for (let i = rangeStart; i <= rangeEnd; i++) numbers.push(i)
  return numbers
}
