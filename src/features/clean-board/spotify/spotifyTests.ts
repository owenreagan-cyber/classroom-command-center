/**
 * DB-2A — Spotify Level 2 pure-logic tests.
 *
 * Run via: bash scripts/test-clean-board-spotify.sh
 * No React/DOM, no real OAuth — PKCE, config, expiry, API wrapper (token
 * logging guard), and student-safe projection.
 */

declare const process: { exit(code?: number): never }

import { fetchCurrentlyPlaying, fetchDevices } from './spotifyApi'
import { resolveSpotifyConfig, SPOTIFY_SCOPES } from './spotifyConfig'
import {
  buildAuthorizationUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  hasCallbackParams,
  parseCallbackParams,
} from './spotifyPkce'
import { safeNowPlayingHasNoForbiddenKeys, toSafeNowPlaying } from './spotifySafety'
import { computeExpiresAt, isTokenExpired } from './spotifyStorage'
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

  console.log(`\nClean Board Spotify Tests: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

void main()
