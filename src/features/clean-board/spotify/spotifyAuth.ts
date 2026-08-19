import { SPOTIFY_TOKEN_ENDPOINT } from './spotifyTypes'
import type { FetchLike, SpotifyTokens } from './spotifyTypes'
import { computeExpiresAt } from './spotifyStorage'

/**
 * DB-2A — token exchange + refresh (Authorization Code with PKCE).
 *
 * No client secret is ever used. The access token is returned to the caller
 * (the store) which persists it; nothing is logged here.
 */

interface TokenResponseJson {
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

const defaultFetch: FetchLike = (url, init) => fetch(url, init)

function assertToken(json: TokenResponseJson): SpotifyTokens {
  if (!json.access_token) throw new Error('token exchange returned no access token')
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: computeExpiresAt(json.expires_in ?? 3600),
  }
}

export interface ExchangeCodeInput {
  code: string
  redirectUri: string
  clientId: string
  codeVerifier: string
}

export async function exchangeCodeForToken(
  input: ExchangeCodeInput,
  fetchFn: FetchLike = defaultFetch,
): Promise<SpotifyTokens> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: input.code,
    redirect_uri: input.redirectUri,
    client_id: input.clientId,
    code_verifier: input.codeVerifier,
  })
  const res = await fetchFn(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`token exchange failed (${res.status})`)
  return assertToken((await res.json()) as TokenResponseJson)
}

export interface RefreshInput {
  refreshToken: string
  clientId: string
}

export async function refreshAccessToken(
  input: RefreshInput,
  fetchFn: FetchLike = defaultFetch,
): Promise<SpotifyTokens> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: input.refreshToken,
    client_id: input.clientId,
  })
  const res = await fetchFn(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`token refresh failed (${res.status})`)
  const json = (await res.json()) as TokenResponseJson
  // The refresh grant may omit refresh_token; carry the prior one forward.
  return assertToken({
    ...json,
    refresh_token: json.refresh_token ?? input.refreshToken,
  })
}
