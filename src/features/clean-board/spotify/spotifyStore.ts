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
import {
  createSdkPlayer,
  disconnectSdkPlayer,
  isSdkAvailable,
  loadSdk,
} from './spotifyPlaybackSdk'
import * as storage from './spotifyStorage'
import {
  onCommandFailure,
  onCommandStart,
  onCommandSuccess,
  onDevicesError,
  onDevicesLoaded,
  onPremiumRequired,
  onSdkReady,
  onSdkUnavailable,
} from './spotifyState'
import type { SpotifyCore } from './spotifyState'
import type { SpotifyAuthStatus, SpotifyOpStatus } from './spotifyTypes'
import type { NowPlaying, SpotifyDevice, SpotifyTokens } from './spotifyTypes'

/**
 * DB-2B — Spotify connection store (singleton).
 *
 * Auth (`authStatus`) is fully separated from operational state (`opStatus`).
 * A valid token keeps the session connected even when the SDK device is
 * unavailable, no devices are found, or a single command fails — so the panel
 * never flips back to "Connect Spotify" while authenticated.
 */

interface SpotifyStoreState {
  authStatus: SpotifyAuthStatus
  opStatus: SpotifyOpStatus
  clientId: string | null
  redirectUri: string | null
  tokens: SpotifyTokens | null
  devices: SpotifyDevice[]
  activeDeviceId: string | null
  nowPlaying: NowPlaying | null
  sdkReady: boolean
  sdkDeviceId: string | null
  /** Sanitized, human-readable error only — never tokens or secrets. */
  errorMessage: string | null
  /** Sanitized informational/warning message (transfer success, refresh failed). */
  noticeMessage: string | null
  init: () => Promise<void>
  connect: () => Promise<void>
  handleCallback: () => Promise<void>
  setupSdk: () => Promise<void>
  disconnect: () => void
  refreshDevices: () => Promise<void>
  refreshPlayback: () => Promise<boolean>
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

function coreOf(state: SpotifyStoreState): SpotifyCore {
  return { authStatus: state.authStatus, opStatus: state.opStatus }
}

// Prevents double-invocation of the callback exchange (React StrictMode runs
// effects twice in dev, and init() runs on every mount).
let callbackInFlight = false

export const useSpotifyStore = create<SpotifyStoreState>()((set, get) => ({
  authStatus: 'loggedOut',
  opStatus: 'idle',
  clientId: null,
  redirectUri: null,
  tokens: null,
  devices: [],
  activeDeviceId: null,
  nowPlaying: null,
  sdkReady: false,
  sdkDeviceId: null,
  errorMessage: null,
  noticeMessage: null,

  init: async () => {
    const cfg = readEnvConfig()
    set({ clientId: cfg.clientId, redirectUri: cfg.redirectUri })
    if (cfg.missing) {
      set({ authStatus: 'configMissing', errorMessage: 'Spotify setup needed.' })
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
      set({ authStatus: 'loggedOut' })
      return
    }
    if (storage.isTokenExpired(tokens)) {
      if (!tokens.refreshToken) {
        set({ authStatus: 'tokenExpired' })
        return
      }
      try {
        const refreshed = await refreshAccessToken({
          refreshToken: tokens.refreshToken,
          clientId: cfg.clientId as string,
        })
        storage.saveTokens(refreshed)
        set({ authStatus: 'connected', tokens: refreshed })
      } catch {
        set({ authStatus: 'tokenExpired' })
        return
      }
    } else {
      set({ authStatus: 'connected', tokens })
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
      set({ authStatus: 'configMissing', errorMessage: 'Spotify setup needed.' })
      return
    }
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    const state = generateState()
    storage.saveVerifier(verifier)
    storage.saveState(state)
    set({ authStatus: 'authorizing' })
    window.location.assign(
      buildAuthorizationUrl({ clientId, redirectUri, codeChallenge: challenge, state }),
    )
  },

  handleCallback: async () => {
    if (callbackInFlight) return
    callbackInFlight = true
    try {
      const { clientId, redirectUri } = get()
      if (!clientId || !redirectUri) {
        set({ authStatus: 'configMissing', errorMessage: 'Spotify setup needed.' })
        return
      }
      const cb = parseCallbackParams(
        typeof window !== 'undefined' ? window.location.search : '',
      )
      if (cb.error) {
        storage.clearAll()
        set({ authStatus: 'loggedOut', errorMessage: 'Spotify sign-in was cancelled or failed.' })
        return
      }
      if (!cb.code) return

      const expectedState = storage.getState()
      storage.clearState()
      if (expectedState && cb.state !== expectedState) {
        storage.clearVerifier()
        set({ authStatus: 'loggedOut', errorMessage: 'Sign-in state mismatch. Please try again.' })
        return
      }

      const verifier = storage.getVerifier()
      storage.clearVerifier()
      if (!verifier) {
        set({ authStatus: 'loggedOut', errorMessage: 'Sign-in session expired. Please try again.' })
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
          window.history.replaceState(null, '', `${window.location.pathname}?mode=edit`)
        }
        set({
          authStatus: 'connected',
          tokens,
          errorMessage: null,
          noticeMessage: null,
        })
        void get().setupSdk()
        void get().refreshDevices()
        void get().refreshPlayback()
      } catch {
        set({ authStatus: 'loggedOut', errorMessage: 'Could not complete Spotify sign-in.' })
      }
    } finally {
      callbackInFlight = false
    }
  },

  disconnect: () => {
    disconnectSdkPlayer()
    storage.clearAll()
    set({
      authStatus: 'loggedOut',
      opStatus: 'idle',
      tokens: null,
      devices: [],
      activeDeviceId: null,
      nowPlaying: null,
      sdkReady: false,
      sdkDeviceId: null,
      errorMessage: null,
      noticeMessage: null,
    })
  },

  setupSdk: async () => {
    const token = currentToken(get())
    if (!token) return
    if (!isSdkAvailable()) {
      try {
        await loadSdk()
      } catch {
        set((s) => ({
          ...onSdkUnavailable(coreOf(s)),
          errorMessage: 'Playback SDK could not load.',
        }))
        return
      }
    }
    try {
      createSdkPlayer(() => currentToken(get()), {
        onReady: (deviceId) =>
          set((s) => ({
            ...onSdkReady(coreOf(s)),
            sdkReady: true,
            sdkDeviceId: deviceId,
            activeDeviceId: deviceId,
          })),
        onAccountError: () =>
          set((s) => ({
            ...onPremiumRequired(coreOf(s)),
            errorMessage: 'Spotify Premium is required.',
          })),
        onInitError: () => set((s) => onSdkUnavailable(coreOf(s))),
        onNotReady: () => set((s) => onSdkUnavailable(coreOf(s))),
      })
    } catch {
      set((s) => onSdkUnavailable(coreOf(s)))
    }
  },

  refreshDevices: async () => {
    const token = currentToken(get())
    if (!token) return
    set({ errorMessage: null })
    try {
      const devices = await fetchDevices(token)
      const active = devices.find((d) => d.isActive)
      set((s) => ({
        devices,
        ...onDevicesLoaded(coreOf(s), devices.length),
        ...(active ? { activeDeviceId: active.id } : {}),
      }))
    } catch {
      set((s) => ({
        ...onDevicesError(coreOf(s)),
        errorMessage: 'Could not load Spotify devices.',
      }))
    }
  },

  refreshPlayback: async () => {
    const token = currentToken(get())
    if (!token) return false
    try {
      const np = await fetchCurrentlyPlaying(token)
      set({ nowPlaying: np })
      return true
    } catch {
      // Leave last-known now-playing; never surface tokens or demote auth.
      return false
    }
  },

  transferToDevice: async (id: string) => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null })
    try {
      await transferPlayback(token, id)
      storage.saveDeviceId(id)
      set((s) => ({
        ...onCommandSuccess(coreOf(s)),
        activeDeviceId: id,
        noticeMessage: 'Playback transferred — press Play to start.',
        errorMessage: null,
      }))
    } catch {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: 'Could not transfer playback.',
      }))
    }
  },

  transferToSdk: async () => {
    const id = get().sdkDeviceId
    if (!id) {
      set((s) => ({
        ...onSdkUnavailable(coreOf(s)),
        errorMessage: 'Board player is not ready yet.',
      }))
      return
    }
    await get().transferToDevice(id)
  },

  play: async () => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null })
    try {
      await play(token, { deviceId: get().activeDeviceId ?? undefined })
      const cur = get().nowPlaying
      if (cur) set({ nowPlaying: { ...cur, isPlaying: true } })
      set((s) => onCommandSuccess(coreOf(s)))
      set({ noticeMessage: 'Play command sent.' })
      const ok = await get().refreshPlayback()
      if (!ok) set({ noticeMessage: 'Play command sent; could not refresh playback.' })
    } catch {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: 'Could not start playback.',
      }))
    }
  },

  pause: async () => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null })
    try {
      await pause(token)
      const cur = get().nowPlaying
      if (cur) set({ nowPlaying: { ...cur, isPlaying: false } })
      set((s) => onCommandSuccess(coreOf(s)))
      const ok = await get().refreshPlayback()
      if (!ok) set({ noticeMessage: 'Pause command sent; could not refresh playback.' })
    } catch {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: 'Could not pause playback.',
      }))
    }
  },

  next: async () => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null })
    try {
      await next(token)
      set((s) => onCommandSuccess(coreOf(s)))
      const ok = await get().refreshPlayback()
      if (!ok) set({ noticeMessage: 'Next command sent; could not refresh playback.' })
    } catch {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: 'Could not skip forward.',
      }))
    }
  },

  previous: async () => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null })
    try {
      await previous(token)
      set((s) => onCommandSuccess(coreOf(s)))
      const ok = await get().refreshPlayback()
      if (!ok) set({ noticeMessage: 'Previous command sent; could not refresh playback.' })
    } catch {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: 'Could not skip back.',
      }))
    }
  },

  launchPreset: async (uri: string) => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null })
    try {
      await play(token, { deviceId: get().activeDeviceId ?? undefined, contextUri: uri })
      set((s) => onCommandSuccess(coreOf(s)))
      const ok = await get().refreshPlayback()
      if (!ok) set({ noticeMessage: 'Playlist launched; could not refresh playback.' })
    } catch {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: 'Could not start the playlist.',
      }))
    }
  },
}))

export { DEFAULT_PLAYLIST_PRESETS }
