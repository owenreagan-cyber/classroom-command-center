/**
 * DB-2A — Spotify Level 2 types and constants (pure, no env, no DOM).
 */

export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
] as const

export const SPOTIFY_AUTH_BASE = 'https://accounts.spotify.com/authorize'
export const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

/**
 * Connection/availability status surfaced to the teacher. `apiError` covers
 * unexpected Web API failures; the human-readable message is always sanitized.
 */
export type SpotifyStatus =
  | 'configMissing'
  | 'loggedOut'
  | 'authorizing'
  | 'connected'
  | 'tokenExpired'
  | 'premiumRequired'
  | 'sdkUnavailable'
  | 'deviceUnavailable'
  | 'playbackRestricted'
  | 'apiError'

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
