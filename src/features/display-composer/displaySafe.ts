import type { DisplayScreen } from './types'

/**
 * Student-safe projection of a DisplayScreen — strips internal bookkeeping
 * (updatedAt/version) and enforces the studentSafe kill-switch. Mirrors the
 * codebase-wide displaySafe.ts convention (see prize-board, roster, random-number).
 */
export interface DisplaySafeScreen {
  id: string
  title: string
  background: DisplayScreen['background']
  showClock: boolean
  timerWidget: DisplayScreen['timerWidget']
  materialsCard?: DisplayScreen['materialsCard']
  checklistCard?: DisplayScreen['checklistCard']
  studentMessage?: string
}

/** Returns null when the screen must never reach /display. */
export function toDisplaySafeScreen(screen: DisplayScreen | undefined): DisplaySafeScreen | null {
  if (!screen) return null
  if (!screen.studentSafe) return null

  return {
    id: screen.id,
    title: screen.title,
    background: screen.background,
    showClock: screen.showClock,
    timerWidget: screen.timerWidget,
    materialsCard: screen.materialsCard,
    checklistCard: screen.checklistCard,
    studentMessage: screen.studentMessage,
  }
}

const DISPLAY_SAFE_FORBIDDEN_KEYS = ['updatedAt', 'version'] as const

/** Assert no teacher-only bookkeeping keys leak into a display-safe payload. */
export function displaySafeScreenHasNoForbiddenKeys(safe: DisplaySafeScreen): boolean {
  return DISPLAY_SAFE_FORBIDDEN_KEYS.every((key) => !(key in safe))
}
