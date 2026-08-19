/**
 * DB-2A — Spotify Level 2 types and constants (pure, no env, no DOM).
 */

export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'playlist-modify-private',
] as const

export const SPOTIFY_AUTH_BASE = 'https://accounts.spotify.com/authorize'
export const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

/**
 * Auth lifecycle — the only axis that decides "Connect Spotify" vs "Disconnect".
 */
export type SpotifyAuthStatus =
  | 'configMissing'
  | 'loggedOut'
  | 'authorizing'
  | 'connected'
  | 'tokenExpired'

/**
 * Operational state within an authenticated session. These never demote the
 * auth status: a valid token stays "connected" even when the SDK browser
 * device is unavailable, no devices are found, or a single command fails.
 */
export type SpotifyOpStatus =
  | 'idle'
  | 'premiumRequired'
  | 'sdkUnavailable'
  | 'deviceUnavailable'
  | 'playbackRestricted'
  | 'apiError'

/** @deprecated prefer `SpotifyAuthStatus | SpotifyOpStatus`. */
export type SpotifyStatus = SpotifyAuthStatus | SpotifyOpStatus

export interface SpotifyDevice {
  id: string
  name: string
  type: string
  isActive: boolean
}

/** Teacher-facing now-playing metadata. Contains no account/device/token data. */
export interface NowPlaying {
  trackName: string
  artistName: string
  albumName?: string
  artworkUrl?: string
  isPlaying: boolean
}

export interface SpotifyTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: number
}

export interface ResolvedSpotifyConfig {
  clientId: string | null
  redirectUri: string | null
  missing: boolean
}

/** A curated classroom playlist preset. Empty until a teacher configures one. */
export interface PlaylistPreset {
  id: string
  label: string
  uri: string
  category: string
}

/** Minimal current-user profile — only the id is used for playlist creation. */
export interface SpotifyUserProfile {
  id: string
  displayName?: string
}

/** A playlist owned/followed by the current user. */
export interface SpotifyPlaylistSummary {
  id: string
  name: string
  uri: string
  isPublic: boolean
  ownerName?: string
}

/** A search-hit track card. `explicit` is surfaced, never hidden. */
export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  artistName: string
  albumName?: string
  artworkUrl?: string
  durationMs?: number
  explicit: boolean
}

/** A deterministic classroom playlist recipe (teacher-reviewed, template-based). */
export interface PlaylistRecipe {
  id: string
  title: string
  classroomUse: string
  suggestedDurationMinutes: number
  energy: 'low' | 'medium' | 'high'
  avoid: string[]
  searchQueries: string[]
  teacherNote: string
}

/** Minimal fetch response shape — decouples the API wrapper from DOM types. */
export interface HttpResponse {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<HttpResponse>
