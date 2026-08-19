import { create } from 'zustand'
import { exchangeCodeForToken, refreshAccessToken } from './spotifyAuth'
import {
  fetchCurrentlyPlaying,
  fetchDevices,
  next,
  pause,
  play,
  previous,
  transferPlayback,
} from './spotifyApi'
import { DEFAULT_PLAYLIST_PRESETS, resolveSpotifyConfig } from './spotifyConfig'
import {
  buildAuthorizationUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  parseCallbackParams,
} from './spotifyPkce'
import { createSdkPlayer, isSdkAvailable, loadSdk } from './spotifyPlaybackSdk'
import * as storage from './spotifyStorage'
import type { NowPlaying, SpotifyDevice, SpotifyStatus, SpotifyTokens } from './spotifyTypes'

/**
 * DB-2A — Spotify connection store (singleton).
 *
 * Owns the PKCE handshake, token lifecycle, Web Playback SDK device, Web API
 * device/playback control, and a sanitized now-playing view. Teacher-only;
 * never rendered inside the student board.
 */

interface SpotifyStoreState {
  status: SpotifyStatus
  clientId: string | null
  redirectUri: string | null
  tokens: SpotifyTokens | null
  devices: SpotifyDevice[]
  activeDeviceId: string | null
  nowPlaying: NowPlaying | null
  sdkReady: boolean
  sdkDeviceId: string | null
  /** Sanitized, human-readable message only — never tokens or secrets. */
  errorMessage: string | null
  init: () => Promise<void>
  connect: () => Promise<void>
  handleCallback: () => Promise<void>
  setupSdk: () => Promise<void>
  disconnect: () => void
  refreshDevices: () => Promise<void>
  refreshPlayback: () => Promise<void>
  transferToDevice: (id: string) => Promise<void>
  transferToSdk: () => Promise<void>
  play: () => Promise<void>
  pause: () => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  launchPreset: (uri: string) => Promise<void>
}

function readEnvConfig() {
  return resolveSpotifyConfig(
    import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined,
    import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string | undefined,
  )
}

function currentToken(state: SpotifyStoreState): string | null {
  return state.tokens?.accessToken ?? null
}

export const useSpotifyStore = create<SpotifyStoreState>()((set, get) => ({
  status: 'loggedOut',
  clientId: null,
  redirectUri: null,
  tokens: null,
  devices: [],
  activeDeviceId: null,
  nowPlaying: null,
  sdkReady: false,
  sdkDeviceId: null,
  errorMessage: null,

  init: async () => {
    const cfg = readEnvConfig()
    set({ clientId: cfg.clientId, redirectUri: cfg.redirectUri })
    if (cfg.missing) {
      set({ status: 'configMissing', errorMessage: 'Spotify setup needed.' })
      return
    }

    const query = typeof window !== 'undefined' ? window.location.search : ''
    const cb = parseCallbackParams(query)
    if (cb.code || cb.error) {
      await get().handleCallback()
      return
    }

    const tokens = storage.loadTokens()
    if (!tokens) {
      set({ status: 'loggedOut' })
      return
    }
    if (storage.isTokenExpired(tokens)) {
      if (!tokens.refreshToken) {
        set({ status: 'tokenExpired' })
        return
      }
      try {
        const refreshed = await refreshAccessToken({
          refreshToken: tokens.refreshToken,
          clientId: cfg.clientId as string,
        })
        storage.saveTokens(refreshed)
        set({ status: 'connected', tokens: refreshed })
      } catch {
        set({ status: 'tokenExpired' })
        return
      }
    } else {
      set({ status: 'connected', tokens })
    }

    const savedDevice = storage.loadDeviceId()
    if (savedDevice) set({ activeDeviceId: savedDevice })

    void get().setupSdk()
    void get().refreshDevices()
    void get().refreshPlayback()
  },

  connect: async () => {
    const { clientId, redirectUri } = get()
    if (!clientId || !redirectUri) {
      set({ status: 'configMissing', errorMessage: 'Spotify setup needed.' })
      return
    }
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()
    storage.saveVerifier(verifier)
    storage.saveState(state)
    set({ status: 'authorizing' })
    window.location.assign(
      buildAuthorizationUrl({ clientId, redirectUri, codeChallenge: challenge, state }),
    )
  },

  handleCallback: async () => {
    const { clientId, redirectUri } = get()
    if (!clientId || !redirectUri) {
      set({ status: 'configMissing', errorMessage: 'Spotify setup needed.' })
      return
    }
    const cb = parseCallbackParams(
      typeof window !== 'undefined' ? window.location.search : '',
    )
    if (cb.error) {
      storage.clearAll()
      set({ status: 'apiError', errorMessage: 'Spotify sign-in was cancelled or failed.' })
      return
    }
    if (!cb.code) return

    const expectedState = storage.getState()
    storage.clearState()
    if (expectedState && cb.state !== expectedState) {
      storage.clearVerifier()
      set({ status: 'apiError', errorMessage: 'Sign-in state mismatch. Please try again.' })
      return
    }

    const verifier = storage.getVerifier()
    storage.clearVerifier()
    if (!verifier) {
      set({ status: 'apiError', errorMessage: 'Sign-in session expired. Please try again.' })
      return
    }

    try {
      const tokens = await exchangeCodeForToken({
        code: cb.code,
        redirectUri,
        clientId,
        codeVerifier: verifier,
      })
      storage.saveTokens(tokens)
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname)
      }
      set({ status: 'connected', tokens, errorMessage: null })
      void get().setupSdk()
      void get().refreshDevices()
      void get().refreshPlayback()
    } catch {
      set({ status: 'apiError', errorMessage: 'Could not complete Spotify sign-in.' })
    }
  },

  disconnect: () => {
    storage.clearAll()
    set({
      status: 'loggedOut',
      tokens: null,
      devices: [],
      activeDeviceId: null,
      nowPlaying: null,
      sdkReady: false,
      sdkDeviceId: null,
      errorMessage: null,
    })
  },

  setupSdk: async () => {
    const token = currentToken(get())
    if (!token) return
    if (!isSdkAvailable()) {
      try {
        await loadSdk()
      } catch {
        set({ status: 'sdkUnavailable', errorMessage: 'Playback SDK could not load.' })
        return
      }
    }
    try {
      createSdkPlayer(token, {
        onReady: (deviceId) =>
          set({
            sdkReady: true,
            sdkDeviceId: deviceId,
            activeDeviceId: deviceId,
            status: 'connected',
          }),
        onAccountError: () =>
          set({ status: 'premiumRequired', errorMessage: 'Spotify Premium is required.' }),
        onInitError: () => set({ status: 'sdkUnavailable' }),
        onNotReady: () => set({ status: 'sdkUnavailable' }),
      })
    } catch {
      set({ status: 'sdkUnavailable' })
    }
  },

  refreshDevices: async () => {
    const token = currentToken(get())
    if (!token) return
    try {
      const devices = await fetchDevices(token)
      set({ devices })
      if (devices.length === 0) {
        set({ status: 'deviceUnavailable' })
      } else if (get().status !== 'premiumRequired') {
        set({ status: 'connected' })
      }
      const active = devices.find((d) => d.isActive)
      if (active) set({ activeDeviceId: active.id })
    } catch {
      set({ status: 'apiError', errorMessage: 'Could not load Spotify devices.' })
    }
  },

  refreshPlayback: async () => {
    const token = currentToken(get())
    if (!token) return
    try {
      const np = await fetchCurrentlyPlaying(token)
      set({ nowPlaying: np })
    } catch {
      // Leave the last-known now-playing in place; do not surface tokens.
    }
  },

  transferToDevice: async (id: string) => {
    const token = currentToken(get())
    if (!token) return
    try {
      await transferPlayback(token, id)
      storage.saveDeviceId(id)
      set({
        activeDeviceId: id,
        errorMessage: 'Playback transferred — press Play to start.',
      })
    } catch {
      set({ status: 'apiError', errorMessage: 'Could not transfer playback.' })
    }
  },

  transferToSdk: async () => {
    const id = get().sdkDeviceId
    if (!id) {
      set({ status: 'sdkUnavailable', errorMessage: 'Board player is not ready yet.' })
      return
    }
    await get().transferToDevice(id)
  },

  play: async () => {
    const token = currentToken(get())
    if (!token) return
    try {
      await play(token, { deviceId: get().activeDeviceId ?? undefined })
      const cur = get().nowPlaying
      if (cur) set({ nowPlaying: { ...cur, isPlaying: true } })
    } catch {
      set({ status: 'apiError', errorMessage: 'Could not start playback.' })
    }
  },

  pause: async () => {
    const token = currentToken(get())
    if (!token) return
    try {
      await pause(token)
      const cur = get().nowPlaying
      if (cur) set({ nowPlaying: { ...cur, isPlaying: false } })
    } catch {
      set({ status: 'apiError', errorMessage: 'Could not pause playback.' })
    }
  },

  next: async () => {
    const token = currentToken(get())
    if (!token) return
    try {
      await next(token)
      void get().refreshPlayback()
    } catch {
      set({ status: 'apiError', errorMessage: 'Could not skip forward.' })
    }
  },

  previous: async () => {
    const token = currentToken(get())
    if (!token) return
    try {
      await previous(token)
      void get().refreshPlayback()
    } catch {
      set({ status: 'apiError', errorMessage: 'Could not skip back.' })
    }
  },

  launchPreset: async (uri: string) => {
    const token = currentToken(get())
    if (!token) return
    try {
      await play(token, { deviceId: get().activeDeviceId ?? undefined, contextUri: uri })
      void get().refreshPlayback()
    } catch {
      set({ status: 'apiError', errorMessage: 'Could not start the playlist.' })
    }
  },
}))

export { DEFAULT_PLAYLIST_PRESETS }
