import type { DisplayScreen, CanvasWidget } from './types'

/**
 * Student-safe projection of a DisplayScreen — strips internal bookkeeping
 * (updatedAt/version), teacherNotes, and enforces the studentSafe kill-switch.
 * Mirrors the codebase-wide displaySafe.ts convention.
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
  /** Only visible, unlocked widgets that don't expose teacher data. */
  widgets?: CanvasWidget[]
}

/** Safe fallback when a screen record is missing a required field — e.g. an
 * older/malformed persisted record. Renders as "no background image", never a crash. */
const SAFE_DEFAULT_BACKGROUND: DisplayScreen['background'] = { type: 'gradient', token: 'calm-focus' }
const SAFE_DEFAULT_TIMER_WIDGET: DisplayScreen['timerWidget'] = { kind: 'none' }

/**
 * Returns null when the screen must never reach /display. Runtime-hardened
 * (Phase 14E): fills safe defaults for fields that could be missing from an
 * old/malformed persisted record rather than trusting them present, so a bad
 * hydration state degrades to "plain screen" instead of crashing the renderer.
 */
export function toDisplaySafeScreen(screen: DisplayScreen | undefined): DisplaySafeScreen | null {
  if (!screen) return null
  if (!screen.studentSafe) return null

  // Filter widgets: only visible, non-teacher-data widgets pass through
  const safeWidgets = (screen.widgets ?? [])
    .filter((w) => w.visible)
    .map((w) => {
      // Strip settings that could leak teacher data
      const safeSettings: Record<string, unknown> = {}
      const allowedKeys = ['text', 'heading', 'items', 'count', 'mode', 'symbol']
      for (const key of allowedKeys) {
        if (key in w.settings) safeSettings[key] = w.settings[key]
      }
      return { ...w, settings: safeSettings }
    })

  return {
    id: screen.id,
    title: screen.title ?? 'Classroom',
    background: screen.background ?? SAFE_DEFAULT_BACKGROUND,
    showClock: screen.showClock ?? true,
    timerWidget: screen.timerWidget ?? SAFE_DEFAULT_TIMER_WIDGET,
    materialsCard: screen.materialsCard,
    checklistCard: screen.checklistCard,
    studentMessage: screen.studentMessage,
    widgets: safeWidgets.length > 0 ? safeWidgets : undefined,
  }
}

const DISPLAY_SAFE_FORBIDDEN_KEYS = ['updatedAt', 'version', 'teacherNotes'] as const

/** Assert no teacher-only bookkeeping keys leak into a display-safe payload. */
export function displaySafeScreenHasNoForbiddenKeys(safe: DisplaySafeScreen): boolean {
  return DISPLAY_SAFE_FORBIDDEN_KEYS.every((key) => !(key in safe))
}
