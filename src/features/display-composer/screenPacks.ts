import type { DisplayScreen, DisplayScreenMode } from './types'

/**
 * Phase 14D — Screen Packs.
 *
 * A "pack" groups saved display screens for browsing/filtering in the Teacher
 * Dock panel. Packs are derived from the existing DisplayScreenMode field
 * rather than a new persisted dimension — every screen already has a mode,
 * so no store/schema change is needed and no migration is required.
 */
export interface DisplayScreenPack {
  id: DisplayScreenMode
  label: string
  description: string
}

export const DISPLAY_SCREEN_PACKS: DisplayScreenPack[] = [
  { id: 'arrival', label: 'Arrival', description: 'Morning arrival routines.' },
  { id: 'transition', label: 'Transitions', description: 'Between-activity transition screens.' },
  { id: 'lessonLaunch', label: 'Lesson Launch', description: 'Start-of-lesson screens.' },
  { id: 'workTime', label: 'Work Time', description: 'Independent or group work time screens.' },
  { id: 'lunch', label: 'Lunch', description: 'Lunch routine screens.' },
  { id: 'specials', label: 'Specials', description: 'Specials (art/music/PE) transition screens.' },
  { id: 'packUp', label: 'Pack Up', description: 'End-of-day pack up and dismissal screens.' },
  { id: 'custom', label: 'Custom', description: 'Teacher-created screens.' },
]

const PACKS_BY_ID = new Map(DISPLAY_SCREEN_PACKS.map((pack) => [pack.id, pack]))

export function getScreenPackById(id: string): DisplayScreenPack | undefined {
  return PACKS_BY_ID.get(id as DisplayScreenMode)
}

/** Unknown pack ids (typos, stale filters) are simply invalid — never a crash. */
export function isValidPackId(id: string): boolean {
  return PACKS_BY_ID.has(id as DisplayScreenMode)
}

/** Unknown or empty pack ids both resolve to an empty list, never throw. */
export function filterScreensByPack(screens: DisplayScreen[], packId: string): DisplayScreen[] {
  if (!isValidPackId(packId)) return []
  return screens.filter((screen) => screen.mode === packId)
}

export function countScreensByPack(screens: DisplayScreen[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const pack of DISPLAY_SCREEN_PACKS) {
    counts[pack.id] = 0
  }
  for (const screen of screens) {
    if (screen.mode in counts) {
      counts[screen.mode] += 1
    }
  }
  return counts
}
