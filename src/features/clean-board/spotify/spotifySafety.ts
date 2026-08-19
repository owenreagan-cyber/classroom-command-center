import type { NowPlaying } from './spotifyTypes'

/**
 * DB-2A — student-safe now-playing projection.
 *
 * The teacher view may carry extra fields over time; present mode must only
 * ever receive track metadata. This whitelist drops tokens, account, device,
 * and any other private data by construction.
 */

export interface SafeNowPlaying {
  trackName: string
  artistName: string
  albumName?: string
  artworkUrl?: string
  isPlaying: boolean
}

const SAFE_NOW_PLAYING_KEYS = [
  'trackName',
  'artistName',
  'albumName',
  'artworkUrl',
  'isPlaying',
] as const

const FORBIDDEN_NOW_PLAYING_KEYS = [
  'accessToken',
  'refreshToken',
  'user',
  'email',
  'accountId',
  'deviceId',
  'clientSecret',
] as const

/** Reduce a (possibly over-populated) now-playing object to safe fields only. */
export function toSafeNowPlaying(np: NowPlaying | null | undefined): SafeNowPlaying | null {
  if (!np) return null
  return {
    trackName: np.trackName,
    artistName: np.artistName,
    albumName: np.albumName,
    artworkUrl: np.artworkUrl,
    isPlaying: np.isPlaying,
  }
}

/** Assert a safe now-playing object carries only allowed, non-private keys. */
export function safeNowPlayingHasNoForbiddenKeys(safe: SafeNowPlaying): boolean {
  return (
    Object.keys(safe).every((k) =>
      (SAFE_NOW_PLAYING_KEYS as readonly string[]).includes(k),
    ) && FORBIDDEN_NOW_PLAYING_KEYS.every((k) => !(k in (safe as unknown as object)))
  )
}
