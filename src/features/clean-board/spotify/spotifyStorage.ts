import type { SpotifyTokens } from './spotifyTypes'

/**
 * DB-2A — token/persistence helpers.
 *
 * All storage keys are namespaced under `clean-board.spotify.`. The code
 * verifier and state are short-lived (sessionStorage); the token response and
 * selected device id use localStorage. Storage access is defensive so the
 * module never throws in SSR or privacy-restricted contexts.
 */

export const SPOTIFY_STORAGE_PREFIX = 'clean-board.spotify.'

const KEY_VERIFIER = `${SPOTIFY_STORAGE_PREFIX}code_verifier`
const KEY_STATE = `${SPOTIFY_STORAGE_PREFIX}state`
const KEY_TOKENS = `${SPOTIFY_STORAGE_PREFIX}tokens`
const KEY_DEVICE = `${SPOTIFY_STORAGE_PREFIX}selected_device_id`

export function computeExpiresAt(expiresInSeconds: number, nowMs = Date.now()): number {
  return nowMs + expiresInSeconds * 1000
}

/** Token considered expired slightly early to avoid a late refresh race. */
export function isTokenExpired(
  tokens: { expiresAt: number },
  nowMs = Date.now(),
  skewMs = 30_000,
): boolean {
  return nowMs >= tokens.expiresAt - skewMs
}

function getStore(kind: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

// ── code verifier (session) ──
export function saveVerifier(verifier: string): void {
  getStore('session')?.setItem(KEY_VERIFIER, verifier)
}
export function getVerifier(): string | null {
  return getStore('session')?.getItem(KEY_VERIFIER) ?? null
}
export function clearVerifier(): void {
  getStore('session')?.removeItem(KEY_VERIFIER)
}

// ── state (session) ──
export function saveState(state: string): void {
  getStore('session')?.setItem(KEY_STATE, state)
}
export function getState(): string | null {
  return getStore('session')?.getItem(KEY_STATE) ?? null
}
export function clearState(): void {
  getStore('session')?.removeItem(KEY_STATE)
}

// ── token response (local) ──
export function saveTokens(tokens: SpotifyTokens): void {
  getStore('local')?.setItem(KEY_TOKENS, JSON.stringify(tokens))
}
export function loadTokens(): SpotifyTokens | null {
  const raw = getStore('local')?.getItem(KEY_TOKENS)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SpotifyTokens
    if (!parsed || typeof parsed.accessToken !== 'string') return null
    return parsed
  } catch {
    return null
  }
}
export function clearTokens(): void {
  getStore('local')?.removeItem(KEY_TOKENS)
}

// ── selected device id (local) ──
export function saveDeviceId(id: string): void {
  getStore('local')?.setItem(KEY_DEVICE, id)
}
export function loadDeviceId(): string | null {
  return getStore('local')?.getItem(KEY_DEVICE) ?? null
}
export function clearDeviceId(): void {
  getStore('local')?.removeItem(KEY_DEVICE)
}

/** Clear everything this module persisted (used on disconnect). */
export function clearAll(): void {
  clearVerifier()
  clearState()
  clearTokens()
  clearDeviceId()
}
