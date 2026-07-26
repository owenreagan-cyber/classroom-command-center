import { parsePoolKey } from '../roster/poolKey'
import type { PickerPoolKey } from '../roster/types'
import { DEFAULT_TITLE_BANK } from './defaultTitles'
import type { RecognitionTitle, TitleUsageEntry } from './types'

const RECENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000

export function classGroupForPool(poolKey: PickerPoolKey): 'homeroom' | 'math' | 'reading' {
  return parsePoolKey(poolKey).classGroup
}

/** Titles eligible for a pool: shared + matching class-locked titles. */
export function filterTitlesForPool(
  titles: RecognitionTitle[],
  poolKey: PickerPoolKey,
): RecognitionTitle[] {
  const classGroup = classGroupForPool(poolKey)
  return titles.filter(
    (t) => t.classLock === 'shared' || t.classLock === classGroup,
  )
}

export function getRecentTitleIds(
  usage: TitleUsageEntry[],
  poolKey: PickerPoolKey,
  now = Date.now(),
): Set<string> {
  const cutoff = now - RECENT_WINDOW_MS
  const recent = new Set<string>()
  for (const entry of usage) {
    if (entry.poolKey === poolKey && entry.timestamp >= cutoff) {
      recent.add(entry.titleId)
    }
  }
  return recent
}

/** Prefer titles not recently used in this pool; shared titles may repeat across pools. */
export function pickTitleForPool(
  poolKey: PickerPoolKey,
  usage: TitleUsageEntry[],
  options?: {
    titles?: RecognitionTitle[]
    slotRole?: 'high-flier' | 'star'
    rng?: () => number
  },
): RecognitionTitle | null {
  const bank = options?.titles ?? DEFAULT_TITLE_BANK
  const eligible = filterTitlesForPool(bank, poolKey)
  if (eligible.length === 0) return null

  const recentIds = getRecentTitleIds(usage, poolKey)
  const rng = options?.rng ?? Math.random

  let candidates = eligible.filter((t) => !recentIds.has(t.id))
  if (candidates.length === 0) {
    candidates = eligible
  }

  if (options?.slotRole === 'star') {
    const rarePlus = candidates.filter((t) => t.rarity === 'rare' || t.rarity === 'legendary')
    if (rarePlus.length > 0) candidates = rarePlus
  } else if (options?.slotRole === 'high-flier') {
    const sharedHighFlier = candidates.find((t) => t.id === 'shared-high-flier')
    if (sharedHighFlier && rng() < 0.35) return sharedHighFlier
  }

  const idx = Math.floor(rng() * candidates.length)
  return candidates[idx] ?? null
}

export function findTitleById(titleId: string, titles = DEFAULT_TITLE_BANK): RecognitionTitle | undefined {
  return titles.find((t) => t.id === titleId)
}
