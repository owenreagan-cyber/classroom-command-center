import { SpotifyApiError } from './spotifyDiagnostics'
import { SPOTIFY_API_BASE } from './spotifyTypes'
import type {
  FetchLike,
  HttpResponse,
  NowPlaying,
  SpotifyDevice,
  SpotifyPlaylistSummary,
  SpotifyTrack,
  SpotifyUserProfile,
} from './spotifyTypes'

/**
 * DB-2A — Spotify Web API wrapper (pure, fetch-injectable).
 *
 * Never logs tokens, secrets, or full request bodies. Errors throw with a
 * status-only message so callers map them to a sanitized UI state.
 */

interface SpotifyDeviceJson {
  id: string
  name: string
  type: string
  is_active: boolean
}

interface SpotifyDevicesResponse {
  devices?: SpotifyDeviceJson[]
}

interface SpotifyArtistJson {
  name?: string
}

interface SpotifyImageJson {
  url?: string
}

interface SpotifyItemJson {
  name?: string
  artists?: SpotifyArtistJson[]
  album?: { name?: string; images?: SpotifyImageJson[] }
}

interface SpotifyCurrentlyPlayingResponse {
  is_playing?: boolean
  item?: SpotifyItemJson | null
}

const defaultFetch: FetchLike = (url, init) => fetch(url, init)

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function parseOrThrow(res: HttpResponse, action: string): Promise<unknown> {
  if (!res.ok) throw new SpotifyApiError(action, res.status)
  if (res.status === 204) return null
  return res.json()
}

export async function fetchDevices(
  token: string,
  fetchFn: FetchLike = defaultFetch,
): Promise<SpotifyDevice[]> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/me/player/devices`, {
    method: 'GET',
    headers: authHeaders(token),
  })
  const json = (await parseOrThrow(res, 'fetchDevices')) as SpotifyDevicesResponse | null
  return (json?.devices ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    isActive: Boolean(d.is_active),
  }))
}

export async function fetchCurrentlyPlaying(
  token: string,
  fetchFn: FetchLike = defaultFetch,
): Promise<NowPlaying | null> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/me/player/currently-playing`, {
    method: 'GET',
    headers: authHeaders(token),
  })
  if (res.status === 204) return null
  const json = (await parseOrThrow(res, 'fetchCurrentlyPlaying')) as
    | SpotifyCurrentlyPlayingResponse
    | null
  if (!json?.item) return null

  const artists = (json.item.artists ?? [])
    .map((a) => a.name)
    .filter((n): n is string => Boolean(n))
    .join(', ')

  return {
    trackName: json.item.name ?? 'Unknown track',
    artistName: artists || 'Unknown artist',
    albumName: json.item.album?.name,
    artworkUrl: json.item.album?.images?.[0]?.url,
    isPlaying: Boolean(json.is_playing),
  }
}

export async function transferPlayback(
  token: string,
  deviceId: string,
  fetchFn: FetchLike = defaultFetch,
): Promise<void> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/me/player`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ device_ids: [deviceId], play: false }),
  })
  await parseOrThrow(res, 'transferPlayback')
}

export interface PlayOptions {
  deviceId?: string
  contextUri?: string
}

export async function play(
  token: string,
  options: PlayOptions = {},
  fetchFn: FetchLike = defaultFetch,
): Promise<void> {
  const url = new URL(`${SPOTIFY_API_BASE}/me/player/play`)
  if (options.deviceId) url.searchParams.set('device_id', options.deviceId)

  const body: { context_uri?: string } = {}
  if (options.contextUri) body.context_uri = options.contextUri

  const res = await fetchFn(url.toString(), {
    method: 'PUT',
    headers: authHeaders(token),
    body: options.contextUri ? JSON.stringify(body) : undefined,
  })
  await parseOrThrow(res, 'play')
}

export async function pause(
  token: string,
  fetchFn: FetchLike = defaultFetch,
): Promise<void> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/me/player/pause`, {
    method: 'PUT',
    headers: authHeaders(token),
  })
  await parseOrThrow(res, 'pause')
}

export async function next(
  token: string,
  fetchFn: FetchLike = defaultFetch,
): Promise<void> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/me/player/next`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  await parseOrThrow(res, 'next')
}

export async function previous(
  token: string,
  fetchFn: FetchLike = defaultFetch,
): Promise<void> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/me/player/previous`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  await parseOrThrow(res, 'previous')
}

// ── Playlist builder / search API (DB-2C) ──

interface SpotifyUserJson {
  id?: string
  display_name?: string
}

interface SpotifyPlaylistJson {
  id?: string
  name?: string
  uri?: string
  public?: boolean
  owner?: { display_name?: string }
}

interface SpotifyPlaylistsResponse {
  items?: SpotifyPlaylistJson[]
}

interface SpotifyTrackJson {
  id?: string
  name?: string
  uri?: string
  explicit?: boolean
  duration_ms?: number
  artists?: SpotifyArtistJson[]
  album?: { name?: string; images?: SpotifyImageJson[] }
}

interface SpotifySearchResponse {
  tracks?: { items?: SpotifyTrackJson[] }
}

interface SpotifyCreatePlaylistResponse {
  id?: string
  name?: string
  uri?: string
}

/**
 * Build a private-only create-playlist body. `public` is always false in this
 * phase — public creation is deliberately deferred (no UI toggle yet).
 */
export function buildCreatePlaylistBody(
  name: string,
  description?: string,
): { name: string; description?: string; public: boolean } {
  return { name, ...(description ? { description } : {}), public: false }
}

/** Build an add-tracks body from a list of track URIs. */
export function buildAddTracksBody(uris: string[]): { uris: string[] } {
  return { uris }
}

function mapTrackJson(t: SpotifyTrackJson): SpotifyTrack {
  const artists = (t.artists ?? [])
    .map((a) => a.name)
    .filter((n): n is string => Boolean(n))
    .join(', ')
  return {
    id: t.id ?? '',
    name: t.name ?? 'Unknown track',
    uri: t.uri ?? '',
    artistName: artists || 'Unknown artist',
    albumName: t.album?.name,
    artworkUrl: t.album?.images?.[0]?.url,
    durationMs: t.duration_ms,
    explicit: Boolean(t.explicit),
  }
}

export async function fetchUserProfile(
  token: string,
  fetchFn: FetchLike = defaultFetch,
): Promise<SpotifyUserProfile> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/me`, {
    method: 'GET',
    headers: authHeaders(token),
  })
  const json = (await parseOrThrow(res, 'fetchUserProfile')) as SpotifyUserJson
  return { id: json.id ?? '', displayName: json.display_name }
}

export async function fetchUserPlaylists(
  token: string,
  fetchFn: FetchLike = defaultFetch,
): Promise<SpotifyPlaylistSummary[]> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/me/playlists`, {
    method: 'GET',
    headers: authHeaders(token),
  })
  const json = (await parseOrThrow(res, 'fetchUserPlaylists')) as SpotifyPlaylistsResponse | null
  return (json?.items ?? []).map((p) => ({
    id: p.id ?? '',
    name: p.name ?? 'Untitled playlist',
    uri: p.uri ?? '',
    isPublic: Boolean(p.public),
    ownerName: p.owner?.display_name,
  }))
}

export async function searchTracks(
  token: string,
  query: string,
  limit = 20,
  fetchFn: FetchLike = defaultFetch,
): Promise<SpotifyTrack[]> {
  const url = new URL(`${SPOTIFY_API_BASE}/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('type', 'track')
  url.searchParams.set('limit', String(limit))
  const res = await fetchFn(url.toString(), {
    method: 'GET',
    headers: authHeaders(token),
  })
  const json = (await parseOrThrow(res, 'searchTracks')) as SpotifySearchResponse | null
  return (json?.tracks?.items ?? []).map(mapTrackJson)
}

export async function createPlaylist(
  token: string,
  userId: string,
  name: string,
  description?: string,
  fetchFn: FetchLike = defaultFetch,
): Promise<SpotifyPlaylistSummary> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/users/${encodeURIComponent(userId)}/playlists`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(buildCreatePlaylistBody(name, description)),
  })
  const json = (await parseOrThrow(res, 'createPlaylist')) as SpotifyCreatePlaylistResponse
  return { id: json.id ?? '', name: json.name ?? name, uri: json.uri ?? '', isPublic: false }
}

export async function addTracksToPlaylist(
  token: string,
  playlistId: string,
  trackUris: string[],
  fetchFn: FetchLike = defaultFetch,
): Promise<void> {
  const res = await fetchFn(`${SPOTIFY_API_BASE}/playlists/${encodeURIComponent(playlistId)}/tracks`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(buildAddTracksBody(trackUris)),
  })
  await parseOrThrow(res, 'addTracksToPlaylist')
}
