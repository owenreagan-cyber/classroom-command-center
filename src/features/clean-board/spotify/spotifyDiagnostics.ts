/**
 * DB-2E — Spotify diagnostics helpers (pure, no env, no DOM, no secrets).
 *
 * The API wrapper throws a typed `SpotifyApiError` carrying only the HTTP
 * status; this module maps that status to a teacher-safe error category and a
 * human-readable message. No token, secret, email, or device identifier is
 * ever included here or logged.
 */

export type SpotifyErrorCategory =
  | 'sessionExpired'
  | 'missingScope'
  | 'apiUnavailable'
  | 'playlistPermissionMissing'
  | 'networkError'

/** An error thrown by the API wrapper. Carries status only — never a body. */
export class SpotifyApiError extends Error {
  readonly status: number

  constructor(action: string, status: number) {
    super(`${action} failed (${status})`)
    this.name = 'SpotifyApiError'
    this.status = status
  }
}

/**
 * Classify an unknown thrown value into a teacher-safe category.
 *
 * `playlistWrite` marks calls that mutate playlists, so a 403 is reported as
 * "Playlist permission missing" rather than the generic "Missing permission
 * scope".
 */
export function classifySpotifyError(error: unknown, playlistWrite = false): SpotifyErrorCategory {
  if (error instanceof SpotifyApiError) {
    if (error.status === 401) return 'sessionExpired'
    if (error.status === 403) return playlistWrite ? 'playlistPermissionMissing' : 'missingScope'
    if (error.status === 429 || error.status >= 500) return 'apiUnavailable'
    return 'apiUnavailable'
  }
  return 'networkError'
}

const CATEGORY_MESSAGES: Record<SpotifyErrorCategory, string> = {
  sessionExpired: 'Spotify session expired',
  missingScope: 'Missing permission scope',
  apiUnavailable: 'Spotify API unavailable',
  playlistPermissionMissing: 'Playlist permission missing',
  networkError: 'Spotify is unreachable',
}

/** Teacher-safe, human-readable message for an error category. */
export function describeSpotifyError(category: SpotifyErrorCategory): string {
  return CATEGORY_MESSAGES[category]
}

/**
 * Never include token-like values in any surfaced message. This guard exists
 * so a future message edit can be tested against accidental leakage.
 */
export function messageIsSafe(message: string): boolean {
  return !/access[\s_-]?token|refresh[\s_-]?token|client[\s_-]?secret|bearer\s/i.test(message)
}
