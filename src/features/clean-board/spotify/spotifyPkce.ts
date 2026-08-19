import { SPOTIFY_AUTH_BASE, SPOTIFY_SCOPES } from './spotifyTypes'

/**
 * DB-2A — Authorization Code with PKCE helpers (pure, Web Crypto only).
 *
 * Public clients have no client secret, so a PKCE code verifier/challenge
 * binds the authorization code to the original request. State adds CSRF
 * protection on the redirect.
 */

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  // btoa is available in browsers and Node 16+.
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** RFC 7636 code verifier: 43–128 URL-safe characters. */
export function generateCodeVerifier(length = 64): string {
  const n = Math.max(43, Math.min(128, Math.floor(length)))
  const bytes = randomBytes(n)
  let out = ''
  for (let i = 0; i < n; i++) out += BASE64URL_ALPHABET[bytes[i] % BASE64URL_ALPHABET.length]
  return out
}

/** S256 code challenge: base64url(SHA-256(verifier)). */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data)
  return bytesToBase64Url(new Uint8Array(digest))
}

/** Random opaque state token for CSRF protection on the redirect. */
export function generateState(byteLength = 16): string {
  const bytes = randomBytes(byteLength)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface BuildAuthorizationUrlInput {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state: string
  scopes?: readonly string[]
}

export function buildAuthorizationUrl(input: BuildAuthorizationUrlInput): string {
  const url = new URL(SPOTIFY_AUTH_BASE)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', input.clientId)
  url.searchParams.set('redirect_uri', input.redirectUri)
  url.searchParams.set('code_challenge', input.codeChallenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('state', input.state)
  url.searchParams.set('scope', (input.scopes ?? SPOTIFY_SCOPES).join(' '))
  return url.toString()
}

export interface CallbackParams {
  code: string | null
  state: string | null
  error: string | null
}

/** Parse the OAuth callback (accepts a full URL or a bare query string). */
export function parseCallbackParams(queryOrUrl: string): CallbackParams {
  const raw = queryOrUrl.includes('?') ? queryOrUrl.split('?')[1] ?? '' : queryOrUrl
  const params = new URLSearchParams(raw.startsWith('?') ? raw.slice(1) : raw)
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
  }
}
