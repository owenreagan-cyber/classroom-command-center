import type { AppMode, Visibility } from '../data/types'

/** Who is viewing the board — derived from edit/display mode today; routes later. */
export type ViewerContext = 'studentDisplay' | 'teacherEdit'

export function viewerContextFromMode(mode: AppMode): ViewerContext {
  return mode === 'display' ? 'studentDisplay' : 'teacherEdit'
}

export function isStudentDisplayMode(mode: AppMode): boolean {
  return mode === 'display'
}

/** True when content may appear on the student-facing projector display. */
export function isVisibleToStudentDisplay(visibility: Visibility = 'student'): boolean {
  return visibility === 'student'
}

/**
 * Whether a piece of content should render for the current mode.
 * Hidden content never renders until a management UI exists.
 */
export function shouldRenderForMode(
  visibility: Visibility = 'student',
  mode: AppMode,
): boolean {
  if (visibility === 'hidden') return false
  if (visibility === 'teacherOnly') return mode === 'edit'
  return true
}

export function filterVisibleItems<T extends { visibility?: Visibility }>(
  items: readonly T[],
  mode: AppMode,
): T[] {
  return items.filter((item) => shouldRenderForMode(item.visibility, mode))
}
