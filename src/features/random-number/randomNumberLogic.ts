import type { DrawOutcome, RandomNumberDrawEntry, RandomNumberPersistedState, RandomNumberValidation } from './types'
import { DEFAULT_MAX, DEFAULT_MIN } from './types'

export type Rng = () => number

export const defaultRng: Rng = () => Math.random()

export function parseBoundInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return null
  return Math.trunc(value)
}

export function validateRange(minInput: number | null, maxInput: number | null): RandomNumberValidation {
  const min = minInput ?? DEFAULT_MIN
  const max = maxInput ?? DEFAULT_MAX

  if (minInput === null || maxInput === null) {
    return { valid: false, min, max, message: 'Enter both minimum and maximum values.' }
  }

  if (min > max) {
    return { valid: false, min, max, message: 'Minimum cannot exceed maximum.' }
  }

  return { valid: true, min, max, message: null }
}

export function getUsedValues(history: RandomNumberDrawEntry[]): Set<number> {
  return new Set(history.map((entry) => entry.value))
}

export function getAvailableValues(
  min: number,
  max: number,
  history: RandomNumberDrawEntry[],
  preventRepeat: boolean,
): number[] {
  const rangeSize = max - min + 1
  const all = Array.from({ length: rangeSize }, (_, index) => min + index)
  if (!preventRepeat) return all
  const used = getUsedValues(history)
  return all.filter((value) => !used.has(value))
}

export function isRangeExhausted(
  min: number,
  max: number,
  history: RandomNumberDrawEntry[],
  preventRepeat: boolean,
): boolean {
  if (!preventRepeat) return false
  return getAvailableValues(min, max, history, true).length === 0
}

export function drawRandomNumber(
  min: number,
  max: number,
  history: RandomNumberDrawEntry[],
  preventRepeat: boolean,
  rng: Rng = defaultRng,
): DrawOutcome {
  const validation = validateRange(min, max)
  if (!validation.valid) {
    return { ok: false, reason: 'invalid-range' }
  }

  const available = getAvailableValues(min, max, history, preventRepeat)
  if (available.length === 0) {
    return { ok: false, reason: 'exhausted' }
  }

  const index = Math.floor(rng() * available.length)
  const value = available[index]!
  const exhausted = preventRepeat && available.length === 1

  return { ok: true, value, exhausted }
}

export function undoLastDraw(
  history: RandomNumberDrawEntry[],
): { history: RandomNumberDrawEntry[]; lastResult: number | null } {
  if (history.length === 0) {
    return { history: [], lastResult: null }
  }
  const nextHistory = history.slice(0, -1)
  const lastResult = nextHistory.length > 0 ? nextHistory[nextHistory.length - 1]!.value : null
  return { history: nextHistory, lastResult }
}

export function sanitizeBound(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.trunc(value)
}

export function hydrateRandomNumberState(persisted: unknown): RandomNumberPersistedState {
  const raw = (persisted ?? {}) as Partial<RandomNumberPersistedState>
  const min = sanitizeBound(raw.min, DEFAULT_MIN)
  const max = sanitizeBound(raw.max, DEFAULT_MAX)
  const history = Array.isArray(raw.history)
    ? raw.history
        .filter(
          (entry): entry is RandomNumberDrawEntry =>
            entry != null
            && typeof entry === 'object'
            && typeof (entry as RandomNumberDrawEntry).value === 'number'
            && Number.isFinite((entry as RandomNumberDrawEntry).value),
        )
        .map((entry) => ({
          value: Math.trunc(entry.value),
          drawnAt: typeof entry.drawnAt === 'number' ? entry.drawnAt : Date.now(),
        }))
    : []

  const lastResult =
    typeof raw.lastResult === 'number' && Number.isFinite(raw.lastResult)
      ? Math.trunc(raw.lastResult)
      : history.length > 0
        ? history[history.length - 1]!.value
        : null

  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    preventRepeat: Boolean(raw.preventRepeat),
    history,
    lastResult,
    showOnDisplay: Boolean(raw.showOnDisplay),
  }
}
