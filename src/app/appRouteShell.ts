import type { AppMode } from '../data/types'
import type { AppShellRoute } from './appRoute'

/** Teacher Dock and teacher-only panels mount only on the control route. */
export function shouldMountTeacherDock(route: AppShellRoute): boolean {
  return route === 'control'
}

/** BoardFrame teacher overlays (coaching, mystery reveal, edit entry) are control-only. */
export function shouldShowTeacherBoardChrome(route: AppShellRoute): boolean {
  return route === 'control'
}

/** Display route forces read-only presentation without mutating persisted mode. */
export function getEffectiveBoardMode(route: AppShellRoute, persistedMode: AppMode): AppMode {
  if (route === 'display') return 'display'
  return persistedMode
}

/** Studio edit actions (beautify, preview toggle) are control-only. */
export function shouldAllowStudioEditActions(route: AppShellRoute, persistedMode: AppMode): boolean {
  return route === 'control' && persistedMode === 'edit'
}
