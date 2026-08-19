/**
 * DB-2A — Spotify Level 2 pure-logic tests.
 *
 * Run via: bash scripts/test-clean-board-spotify.sh
 * No React/DOM, no real OAuth — PKCE, config, expiry, API wrapper (token
 * logging guard), and student-safe projection.
 */

declare const process: { exit(code?: number): never }

import {
  addTracksToPlaylist,
  buildAddTracksBody,
  buildCreatePlaylistBody,
  createPlaylist,
  fetchCurrentlyPlaying,
  fetchDevices,
  fetchUserPlaylists,
  fetchUserProfile,
  play,
  searchTracks,
} from './spotifyApi'
import { resolveSpotifyConfig, SPOTIFY_SCOPES } from './spotifyConfig'
import {
  buildAuthorizationUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  hasCallbackParams,
  parseCallbackParams,
} from './spotifyPkce'
import { CLASSROOM_PLAYLIST_RECIPES, getRecipeById } from './playlistRecipes'
import { safeNowPlayingHasNoForbiddenKeys, toSafeNowPlaying } from './spotifySafety'
import {
  describeStatus,
  isAuthConnected,
  onCommandFailure,
  onCommandStart,
  onCommandSuccess,
  onDevicesError,
  onDevicesLoaded,
  onPlaybackRefreshed,
  onPollingError,
  onPremiumRequired,
  onSdkReady,
  onSdkUnavailable,
  shouldPollPlayback,
} from './spotifyState'
import {
  computeExpiresAt,
  isTokenExpired,
  isValidPresetUri,
  sanitizePresets,
} from './spotifyStorage'
import type { SpotifyCore } from './spotifyState'
import type { FetchLike, NowPlaying } from './spotifyTypes'

let passed = 0
let failed = 0

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}`)
    console.error(e instanceof Error ? e.message : String(e))
  }
}

function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) throw new Error(message ?? 'Assertion failed')
}

async function main(): Promise<void> {
  // ── PKCE ──

  await test('generateCodeVerifier produces 43-128 URL-safe chars', () => {
    const v = generateCodeVerifier()
    assert(v.length >= 43 && v.length <= 128, `verifier length ${v.length}`)
    assert(/^[A-Za-z0-9_-]+$/.test(v), 'verifier uses URL-safe alphabet')
  })

  await test('generateCodeVerifier is random across calls', () => {
    assert(generateCodeVerifier() !== generateCodeVerifier())
  })

  await test('generateCodeChallenge produces a 43-char S256 base64url string', async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    assert(/^[A-Za-z0-9_-]{43}$/.test(challenge), `challenge "${challenge}"`)
  })

  await test('generateCodeChallenge is deterministic and verifier-sensitive', async () => {
    const a = generateCodeVerifier()
    const b = generateCodeVerifier()
    assert(a !== b)
    assert((await generateCodeChallenge(a)) === (await generateCodeChallenge(a)))
    assert((await generateCodeChallenge(a)) !== (await generateCodeChallenge(b)))
  })

  await test('generateState returns a 32-char hex string', () => {
    assert(/^[0-9a-f]{32}$/.test(generateState()))
  })

  // ── Authorization URL ──

  await test('buildAuthorizationUrl includes all required params', () => {
    const url = new URL(
      buildAuthorizationUrl({
        clientId: 'client-abc',
        redirectUri: 'http://localhost:5173/board-lab',
        codeChallenge: 'challenge123',
        state: 'state456',
      }),
    )
    assert(url.origin === 'https://accounts.spotify.com')
    assert(url.pathname === '/authorize')
    assert(url.searchParams.get('response_type') === 'code')
    assert(url.searchParams.get('client_id') === 'client-abc')
    assert(url.searchParams.get('redirect_uri') === 'http://localhost:5173/board-lab')
    assert(url.searchParams.get('code_challenge') === 'challenge123')
    assert(url.searchParams.get('code_challenge_method') === 'S256')
    assert(url.searchParams.get('state') === 'state456')
    const scope = url.searchParams.get('scope') ?? ''
    for (const s of SPOTIFY_SCOPES) assert(scope.includes(s), `scope missing ${s}`)
  })

  // ── Callback parsing ──

  await test('parseCallbackParams handles code/state', () => {
    const p = parseCallbackParams('?code=abc123&state=s1')
    assert(p.code === 'abc123' && p.state === 's1' && p.error === null)
  })

  await test('parseCallbackParams handles error', () => {
    const p = parseCallbackParams('?error=access_denied&state=s1')
    assert(p.code === null && p.error === 'access_denied')
  })

  await test('parseCallbackParams handles a full redirect URL', () => {
    const p = parseCallbackParams('http://localhost:5173/board-lab?code=c&state=s')
    assert(p.code === 'c' && p.state === 's')
  })

  await test('parseCallbackParams handles empty input', () => {
    const p = parseCallbackParams('')
    assert(p.code === null && p.state === null && p.error === null)
  })

  await test('hasCallbackParams detects code and error, rejects plain URLs', () => {
    assert(hasCallbackParams('/board-lab?code=c&state=s') === true)
    assert(hasCallbackParams('?error=access_denied') === true)
    assert(hasCallbackParams('/board-lab?mode=edit') === false)
    assert(hasCallbackParams('') === false)
    assert(hasCallbackParams('/board-lab') === false)
  })

  // ── Config ──

  await test('missing config resolves to configMissing without crashing', () => {
    assert(resolveSpotifyConfig(undefined, undefined).missing === true)
    assert(resolveSpotifyConfig('', '').missing === true)
    assert(resolveSpotifyConfig('  ', 'http://x').missing === true)
  })

  await test('present config resolves cleanly', () => {
    const cfg = resolveSpotifyConfig('abc', 'http://localhost:5173/board-lab')
    assert(cfg.missing === false)
    assert(cfg.clientId === 'abc')
    assert(cfg.redirectUri === 'http://localhost:5173/board-lab')
  })

  // ── Token expiry ──

  await test('computeExpiresAt adds milliseconds', () => {
    assert(computeExpiresAt(3600, 0) === 3_600_000)
    assert(computeExpiresAt(1, 1000) === 2000)
  })

  await test('isTokenExpired respects the skew window', () => {
    assert(isTokenExpired({ expiresAt: 1000 }, 1000) === true)
    assert(isTokenExpired({ expiresAt: 100_000 }, 0) === false)
    assert(isTokenExpired({ expiresAt: 100_000 }, 80_000, 30_000) === true)
  })

  // ── API wrapper token hygiene + mapping ──

  await test('fetchDevices maps devices and never logs the token', async () => {
    const token = 'tok_SECRET_should_never_appear'
    let logged = ''
    const original = console.log
    console.log = (...args: unknown[]) => {
      logged += args.map(String).join(' ')
    }
    try {
      const fake: FetchLike = async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          devices: [{ id: 'd1', name: 'Board', type: 'Computer', is_active: true }],
        }),
      })
      const devices = await fetchDevices(token, fake)
      assert(devices.length === 1)
      assert(devices[0].id === 'd1' && devices[0].name === 'Board')
      assert(devices[0].isActive === true)
      assert(logged === '', 'API wrapper must not write to console.log')
    } finally {
      console.log = original
    }
  })

  await test('fetchCurrentlyPlaying returns null on 204', async () => {
    const fake: FetchLike = async () => ({ ok: true, status: 204, json: async () => null })
    const np = await fetchCurrentlyPlaying('tok', fake)
    assert(np === null)
  })

  // ── Student-safe now-playing projection ──

  await test('toSafeNowPlaying strips token/user/device data', () => {
    const dirty = {
      trackName: 'Track',
      artistName: 'Artist',
      albumName: 'Album',
      artworkUrl: 'https://example.com/art.jpg',
      isPlaying: true,
      accessToken: 'SECRET_TOKEN',
      refreshToken: 'REFRESH',
      user: 'teacher@school.edu',
      email: 'teacher@school.edu',
      accountId: 'acct-1',
      deviceId: 'device-123',
    } as unknown as NowPlaying
    const safe = toSafeNowPlaying(dirty)
    assert(safe !== null)
    const keys = Object.keys(safe as object)
    const allowed = ['trackName', 'artistName', 'albumName', 'artworkUrl', 'isPlaying']
    assert(keys.every((k) => allowed.includes(k)), `unexpected key in ${keys.join(',')}`)
    for (const bad of [
      'accessToken',
      'refreshToken',
      'user',
      'email',
      'accountId',
      'deviceId',
    ]) {
      assert(!keys.includes(bad), `private key ${bad} leaked`)
    }
    assert(
      safeNowPlayingHasNoForbiddenKeys(
        safe as NonNullable<ReturnType<typeof toSafeNowPlaying>>,
      ),
    )
  })

  await test('toSafeNowPlaying returns null for empty input', () => {
    assert(toSafeNowPlaying(null) === null)
    assert(toSafeNowPlaying(undefined) === null)
  })

  await test('safeNowPlayingHasNoForbiddenKeys rejects a contaminated object', () => {
    const contaminated = {
      trackName: 'T',
      artistName: 'A',
      isPlaying: false,
      accessToken: 'X',
    }
    assert(
      safeNowPlayingHasNoForbiddenKeys(
        contaminated as unknown as NonNullable<ReturnType<typeof toSafeNowPlaying>>,
      ) === false,
    )
  })

  // ── State reducer: auth vs op separation ──

  const connectedIdle: SpotifyCore = { authStatus: 'connected', opStatus: 'idle' }

  await test('isAuthConnected is true only for the connected auth state', () => {
    assert(isAuthConnected('connected') === true)
    assert(isAuthConnected('loggedOut') === false)
    assert(isAuthConnected('tokenExpired') === false)
    assert(isAuthConnected('configMissing') === false)
    assert(isAuthConnected('authorizing') === false)
  })

  await test('a playback/device command failure never demotes auth to logged-out', () => {
    const next = onCommandFailure(connectedIdle)
    assert(next.authStatus === 'connected', 'auth stays connected')
    assert(next.opStatus === 'apiError', 'op error is recorded')
  })

  await test('a successful command clears a stale apiError back to idle', () => {
    const stale: SpotifyCore = { authStatus: 'connected', opStatus: 'apiError' }
    const next = onCommandSuccess(stale)
    assert(next.authStatus === 'connected')
    assert(next.opStatus === 'idle', 'stale op error cleared')
  })

  await test('onCommandStart clears a stale apiError before a fresh attempt', () => {
    const stale: SpotifyCore = { authStatus: 'connected', opStatus: 'apiError' }
    const next = onCommandStart(stale)
    assert(next.opStatus === 'idle')
    assert(next.authStatus === 'connected')
  })

  await test('device refresh failure keeps auth connected', () => {
    const next = onDevicesError(connectedIdle)
    assert(next.authStatus === 'connected', 'auth never erased on device error')
  })

  await test('no-device result becomes a warning, not a disconnected state', () => {
    const next = onDevicesLoaded(connectedIdle, 0)
    assert(next.authStatus === 'connected')
    assert(next.opStatus === 'deviceUnavailable')
    assert(isAuthConnected(next.authStatus) === true)
  })

  await test('devices present resolves the no-device warning to idle', () => {
    const noDevices: SpotifyCore = { authStatus: 'connected', opStatus: 'deviceUnavailable' }
    const next = onDevicesLoaded(noDevices, 2)
    assert(next.opStatus === 'idle')
    assert(next.authStatus === 'connected')
  })

  await test('SDK unavailable / premium-required keep auth connected', () => {
    assert(onSdkUnavailable(connectedIdle).authStatus === 'connected')
    assert(onSdkUnavailable(connectedIdle).opStatus === 'sdkUnavailable')
    assert(onPremiumRequired(connectedIdle).authStatus === 'connected')
    assert(onPremiumRequired(connectedIdle).opStatus === 'premiumRequired')
    assert(onSdkReady({ authStatus: 'connected', opStatus: 'sdkUnavailable' }).opStatus === 'idle')
  })

  await test('reducers leave non-connected auth states untouched', () => {
    const loggedOut: SpotifyCore = { authStatus: 'loggedOut', opStatus: 'idle' }
    assert(onCommandFailure(loggedOut).authStatus === 'loggedOut')
    assert(onCommandFailure(loggedOut).opStatus === 'idle')
    assert(onDevicesError(loggedOut).authStatus === 'loggedOut')
  })

  await test('describeStatus reflects auth and op states', () => {
    assert(describeStatus({ authStatus: 'loggedOut', opStatus: 'idle' }) === 'Not connected')
    assert(describeStatus(connectedIdle) === 'Connected')
    assert(
      describeStatus({ authStatus: 'connected', opStatus: 'deviceUnavailable' }) ===
        'No devices found',
    )
    assert(
      describeStatus({ authStatus: 'connected', opStatus: 'premiumRequired' }) ===
        'Premium required',
    )
    assert(describeStatus({ authStatus: 'tokenExpired', opStatus: 'idle' }) === 'Session expired')
  })

  await test('device refresh success clears a stale playback apiError', () => {
    const stale: SpotifyCore = { authStatus: 'connected', opStatus: 'apiError' }
    const next = onDevicesLoaded(stale, 1)
    assert(next.authStatus === 'connected')
    assert(next.opStatus === 'idle', 'device found clears stale error')
    assert(describeStatus(next) === 'Connected', 'no longer shows Error')
  })

  await test('connected with devices found does not render Error', () => {
    const next = onDevicesLoaded(
      { authStatus: 'connected', opStatus: 'apiError' },
      2,
    )
    assert(describeStatus(next) === 'Connected')
    assert(next.opStatus !== 'apiError')
  })

  await test('successful playback refresh clears a stale apiError', () => {
    const stale: SpotifyCore = { authStatus: 'connected', opStatus: 'apiError' }
    const next = onPlaybackRefreshed(stale)
    assert(next.authStatus === 'connected')
    assert(next.opStatus === 'idle', 'playback read clears stale command error')
    assert(describeStatus(next) === 'Connected')
  })

  await test('successful playback refresh with empty item stays neutral, not error', () => {
    const stale: SpotifyCore = { authStatus: 'connected', opStatus: 'apiError' }
    // An empty current track is a healthy read, not a failure.
    const next = onPlaybackRefreshed(stale)
    assert(next.opStatus === 'idle')
    assert(next.authStatus === 'connected')
    assert(describeStatus(next) !== 'Error')
  })

  await test('now-playing projection updates when current playback has item data', () => {
    const np: NowPlaying = {
      trackName: 'A Song',
      artistName: 'An Artist',
      albumName: 'An Album',
      artworkUrl: 'https://example.com/art.png',
      isPlaying: true,
    }
    const safe = toSafeNowPlaying(np)
    assert(safe !== null)
    assert(safe.trackName === 'A Song')
    assert(safe.artistName === 'An Artist')
    assert(safe.artworkUrl === 'https://example.com/art.png')
    assert(safeNowPlayingHasNoForbiddenKeys(safe as NonNullable<ReturnType<typeof toSafeNowPlaying>>))
  })

  // ── Polling ──

  await test('shouldPollPlayback is true only while connected', () => {
    assert(shouldPollPlayback('connected') === true)
    assert(shouldPollPlayback('loggedOut') === false)
    assert(shouldPollPlayback('tokenExpired') === false)
    assert(shouldPollPlayback('configMissing') === false)
    assert(shouldPollPlayback('authorizing') === false)
  })

  await test('a polling transient error keeps auth connected and does not render Error', () => {
    const next = onPollingError(connectedIdle)
    assert(next.authStatus === 'connected', 'auth never demoted on poll error')
    assert(next.opStatus === 'idle', 'op state unchanged — no hard Error')
    assert(describeStatus(next) !== 'Error')
  })

  await test('successful polling after a stale error clears it back to idle', () => {
    const stale: SpotifyCore = { authStatus: 'connected', opStatus: 'apiError' }
    const afterPoll = onPollingError(stale) // transient poll failure keeps prior state
    assert(afterPoll.authStatus === 'connected')
    const recovered = onPlaybackRefreshed(afterPoll)
    assert(recovered.opStatus === 'idle', 'successful refresh clears stale error')
    assert(describeStatus(recovered) === 'Connected')
  })

  await test('empty playback read stays neutral "Nothing playing", not an error', () => {
    const next = onPlaybackRefreshed({ authStatus: 'connected', opStatus: 'apiError' })
    assert(next.opStatus === 'idle')
    assert(describeStatus(next) !== 'Error')
  })

  // ── DB-2C — playlist builder / search / presets ──

  await test('scopes include private playlist read/write, never public write', () => {
    const scopes: readonly string[] = SPOTIFY_SCOPES
    assert(scopes.includes('playlist-read-private'))
    assert(scopes.includes('playlist-modify-private'))
    assert(!scopes.includes('playlist-modify-public'), 'public write is not requested by default')
  })

  await test('buildCreatePlaylistBody always defaults to private', () => {
    const withDesc = buildCreatePlaylistBody('Morning', 'desc')
    assert(withDesc.public === false)
    assert(withDesc.name === 'Morning')
    assert(withDesc.description === 'desc')
    const bare = buildCreatePlaylistBody('Focus')
    assert(bare.public === false)
    assert(!('description' in bare))
  })

  await test('buildAddTracksBody wraps track URIs', () => {
    const body = buildAddTracksBody(['spotify:track:1', 'spotify:track:2'])
    assert(JSON.stringify(body.uris) === JSON.stringify(['spotify:track:1', 'spotify:track:2']))
  })

  await test('createPlaylist posts a private-only body', async () => {
    let capturedBody = ''
    const fake: FetchLike = async (_url, init) => {
      capturedBody = init?.body ?? ''
      return {
        ok: true,
        status: 201,
        json: async () => ({ id: 'p1', name: 'Classroom', uri: 'spotify:playlist:abc' }),
      }
    }
    const p = await createPlaylist('tok', 'user1', 'Classroom', undefined, fake)
    const parsed = JSON.parse(capturedBody) as { public: boolean; name: string }
    assert(parsed.public === false)
    assert(parsed.name === 'Classroom')
    assert(p.uri === 'spotify:playlist:abc')
    assert(p.isPublic === false)
  })

  await test('addTracksToPlaylist posts the uris to the playlist tracks endpoint', async () => {
    let capturedUrl = ''
    let capturedBody = ''
    const fake: FetchLike = async (url, init) => {
      capturedUrl = url
      capturedBody = init?.body ?? ''
      return { ok: true, status: 201, json: async () => null }
    }
    await addTracksToPlaylist('tok', 'playlistId1', ['spotify:track:1', 'spotify:track:2'], fake)
    assert(capturedUrl.includes('/playlists/playlistId1/tracks'))
    const parsed = JSON.parse(capturedBody) as { uris: string[] }
    assert(parsed.uris.length === 2)
  })

  await test('searchTracks surfaces the explicit flag and metadata, never hides it', async () => {
    const fake: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        tracks: {
          items: [
            {
              id: 't1',
              name: 'Song',
              uri: 'spotify:track:t1',
              explicit: true,
              duration_ms: 100_000,
              artists: [{ name: 'Artist A' }],
              album: { name: 'Album', images: [{ url: 'http://x/art.jpg' }] },
            },
          ],
        },
      }),
    })
    const results = await searchTracks('tok', 'q', 20, fake)
    assert(results.length === 1)
    assert(results[0].explicit === true, 'explicit must be surfaced')
    assert(results[0].durationMs === 100_000)
    assert(results[0].artistName === 'Artist A')
    assert(results[0].artworkUrl === 'http://x/art.jpg')
  })

  await test('searchTracks only reads — it never auto-adds to a playlist', async () => {
    let capturedUrl = ''
    let capturedMethod = ''
    const fake: FetchLike = async (url, init) => {
      capturedUrl = url
      capturedMethod = init?.method ?? ''
      return { ok: true, status: 200, json: async () => ({ tracks: { items: [] } }) }
    }
    await searchTracks('tok', 'q', 20, fake)
    assert(capturedMethod === 'GET')
    assert(capturedUrl.includes('/search'))
    assert(!capturedUrl.includes('/playlists'), 'search must not write to a playlist')
  })

  await test('launching a playlist uses a context URI, not a secret', async () => {
    let capturedBody = ''
    const fake: FetchLike = async (_url, init) => {
      capturedBody = init?.body ?? ''
      return { ok: true, status: 204, json: async () => null }
    }
    await play('tok', { contextUri: 'spotify:playlist:abc' }, fake)
    assert(capturedBody.includes('spotify:playlist:abc'))
  })

  await test('API headers carry only the bearer token, never a client secret', async () => {
    let capturedHeaders: Record<string, string> = {}
    const fake: FetchLike = async (_url, init) => {
      capturedHeaders = init?.headers ?? {}
      return { ok: true, status: 200, json: async () => ({ id: 'u1', display_name: 'Teacher' }) }
    }
    const profile = await fetchUserProfile('tok', fake)
    assert(profile.id === 'u1')
    assert(capturedHeaders.Authorization === 'Bearer tok')
    assert(!('client_secret' in capturedHeaders))
    assert(!JSON.stringify(capturedHeaders).toLowerCase().includes('secret'))
  })

  await test('fetchUserPlaylists maps private flag and owner', async () => {
    const fake: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          { id: 'p1', name: 'Math', uri: 'spotify:playlist:p1', public: false, owner: { display_name: 'Teacher' } },
        ],
      }),
    })
    const lists = await fetchUserPlaylists('tok', fake)
    assert(lists.length === 1)
    assert(lists[0].isPublic === false)
    assert(lists[0].ownerName === 'Teacher')
  })

  await test('isValidPresetUri accepts only playlist URIs', () => {
    assert(isValidPresetUri('spotify:playlist:abc123') === true)
    assert(isValidPresetUri('spotify:track:abc') === false)
    assert(isValidPresetUri('https://open.spotify.com/playlist/abc') === false)
    assert(isValidPresetUri('') === false)
  })

  await test('sanitizePresets drops invalid entries and strips extra/private keys', () => {
    const raw = [
      { id: '1', label: 'Morning', uri: 'spotify:playlist:abc', category: 'classroom' },
      { id: '2', label: 'Bad', uri: 'spotify:track:x', category: '' },
      { id: '3', label: '', uri: 'spotify:playlist:def', category: '' },
      null,
      { id: '4', label: 'HasToken', uri: 'spotify:playlist:ghi', category: '', accessToken: 'SECRET' },
    ]
    const out = sanitizePresets(raw)
    assert(out.length === 2, `expected 2 valid presets, got ${out.length}`)
    assert(out[0].label === 'Morning')
    assert(out[1].label === 'HasToken')
    assert(!('accessToken' in (out[1] as object)), 'extra private key must be dropped')
  })

  await test('playlist recipes are deterministic and mark teacher review', () => {
    assert(CLASSROOM_PLAYLIST_RECIPES.length >= 7)
    const requiredIds = [
      'morning-arrival-calm',
      'independent-work-focus',
      'math-work-instrumental',
      'writing-time-piano',
      'clean-up-cue',
      'rainy-day-calm',
      'test-mode-quiet',
    ]
    for (const id of requiredIds) {
      const r = getRecipeById(id)
      assert(r !== undefined, `missing recipe ${id}`)
      assert(r.title.length > 0)
      assert(r.searchQueries.length > 0)
      assert(r.avoid.length > 0)
      assert(r.energy === 'low' || r.energy === 'medium' || r.energy === 'high')
      assert(r.teacherNote.toLowerCase().includes('review'), `recipe ${id} must note teacher review`)
    }
  })

  await test('student-safe projection drops playlist-builder fields', () => {
    const dirty = {
      trackName: 'T',
      artistName: 'A',
      isPlaying: true,
      playlists: [{ id: 'p' }],
      presets: [{ uri: 'spotify:playlist:x' }],
      searchResults: [{ explicit: true }],
    } as unknown as NowPlaying
    const safe = toSafeNowPlaying(dirty)
    assert(safe !== null)
    assert(!('playlists' in (safe as object)), 'playlists leaked into safe projection')
    assert(!('presets' in (safe as object)), 'presets leaked into safe projection')
    assert(!('searchResults' in (safe as object)), 'search results leaked into safe projection')
  })

  console.log(`\nClean Board Spotify Tests: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

void main()
