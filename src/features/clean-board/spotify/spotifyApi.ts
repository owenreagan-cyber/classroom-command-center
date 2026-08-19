import { SPOTIFY_API_BASE } from './spotifyTypes'
import type { FetchLike, HttpResponse, NowPlaying, SpotifyDevice } from './spotifyTypes'

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
  if (!res.ok) throw new Error(`${action} failed (${res.status})`)
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
