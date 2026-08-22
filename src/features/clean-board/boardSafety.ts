import type { BoardMode, BoardObject, BoardObjectConfig, BoardPage } from './types'

/**
 * DB-1 — Clean Board student-safety projection.
 *
 * Mirrors the codebase-wide displaySafe convention: present mode receives a
 * sanitized page with teacher-only fields stripped, hidden objects dropped,
 * objects ordered by layer, and widget configs reduced to student-safe data.
 */

/** Keys that must never reach present mode. */
const FORBIDDEN_BOARD_KEYS = [
  'teacherNotes',
  'updatedAt',
  'version',
  'accessToken',
  'refreshToken',
  'deviceId',
  'accountId',
  'clientSecret',
] as const

/** Reduces a widget config to student-safe fields only. */
function sanitizeConfig(config: BoardObjectConfig): BoardObjectConfig {
  if (config.kind === 'spotifyNowPlayingPlaceholder') {
    // Never forward account/token/device detail — label only.
    return { kind: 'spotifyNowPlayingPlaceholder', label: config.label }
  }
  return config
}

/** Whether an object carries any teacher/secret key at the top level. */
export function hasForbiddenBoardKey(obj: object): boolean {
  return FORBIDDEN_BOARD_KEYS.some((key) => key in obj)
}

/** Return a copy of the objects ordered by ascending layer (bottom-first). */
export function sortByLayer(objects: BoardObject[]): BoardObject[] {
  return [...objects].sort((a, b) => a.layer - b.layer)
}

/** Whether a page already contains an object of the given kind. */
export function pageHasKind(objects: BoardObject[], kind: BoardObject['kind']): boolean {
  return objects.some((o) => o.kind === kind)
}

/**
 * Whether teacher-only controls (e.g. Spotify media controls) may render for
 * the given board mode. Present/student mode must never show them. This is the
 * single source of truth gating board-embedded teacher controls.
 */
export function showTeacherControls(mode: BoardMode): boolean {
  return mode === 'edit'
}

/**
 * Student-safe projection of a page. Strips teacherNotes, filters hidden
 * objects, sorts by layer, and sanitizes widget configs. The returned object
 * is a plain BoardPage that omits teacher-only fields.
 */
export function toSafeBoardPage(page: BoardPage): BoardPage {
  return {
    id: page.id,
    title: page.title,
    background: page.background,
    theme: page.theme,
    objects: sortByLayer(
      page.objects
        .filter((o) => o.visible)
        .map((o) => ({ ...o, config: sanitizeConfig(o.config) })),
    ),
  }
}

/** Assert a projected page (and its objects) carry no forbidden keys. */
export function safeBoardPageHasNoForbiddenKeys(safe: BoardPage): boolean {
  return (
    !hasForbiddenBoardKey(safe) &&
    safe.objects.every((o) => !hasForbiddenBoardKey(o))
  )
}
