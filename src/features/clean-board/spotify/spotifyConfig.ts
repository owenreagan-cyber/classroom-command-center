import type { PlaylistPreset, ResolvedSpotifyConfig } from './spotifyTypes'

export { SPOTIFY_SCOPES } from './spotifyTypes'

/**
 * DB-2A — Spotify config resolution (pure).
 *
 * Reads no environment directly; the store passes `import.meta.env` values in.
 * Kept pure so tests can assert the missing-config path without Vite.
 */
export function resolveSpotifyConfig(
  clientId?: string | null,
  redirectUri?: string | null,
): ResolvedSpotifyConfig {
  const cid = clientId?.trim() ? clientId.trim() : null
  const uri = redirectUri?.trim() ? redirectUri.trim() : null
  return { clientId: cid, redirectUri: uri, missing: !cid || !uri }
}

/**
 * Curated classroom playlist presets. Intentionally empty until a teacher
 * provides their own non-secret `spotify:playlist:<id>` URIs. No hardcoded
 * Spotify catalog URIs, no fake functioning buttons.
 */
export const DEFAULT_PLAYLIST_PRESETS: PlaylistPreset[] = []
