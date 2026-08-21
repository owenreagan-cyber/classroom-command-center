import { create } from 'zustand'
import { exchangeCodeForToken, refreshAccessToken } from './spotifyAuth'
import {
  addTracksToPlaylist as apiAddTracks,
  createPlaylist as apiCreatePlaylist,
  fetchCurrentlyPlaying,
  fetchDevices,
  fetchUserPlaylists as apiFetchUserPlaylists,
  fetchUserProfile as apiFetchUserProfile,
  next,
  pause,
  play,
  previous,
  searchTracks as apiSearchTracks,
  transferPlayback,
} from './spotifyApi'
import { DEFAULT_PLAYLIST_PRESETS, resolveSpotifyConfig } from './spotifyConfig'
import { classifySpotifyError, describeSpotifyError } from './spotifyDiagnostics'
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
  onPlaybackRefreshed,
  onPollingError,
  onPremiumRequired,
  onSdkReady,
  onSdkUnavailable,
  shouldPollPlayback,
} from './spotifyState'
import type { SpotifyCore } from './spotifyState'
import type { SpotifyAuthStatus, SpotifyOpStatus } from './spotifyTypes'
import type {
  NowPlaying,
  PlaylistPreset,
  SpotifyDevice,
  SpotifyPlaylistSummary,
  SpotifyTokens,
  SpotifyTrack,
  SpotifyUserProfile,
} from './spotifyTypes'

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
  userProfile: SpotifyUserProfile | null
  playlists: SpotifyPlaylistSummary[]
  presets: PlaylistPreset[]
  searchResults: SpotifyTrack[]
  searchQuery: string
  searching: boolean
  builderBusy: boolean
  /** Sanitized playlist-builder message — never tokens/secrets/account data. */
  builderMessage: string | null
  selectedPlaylistId: string | null
  /** True while a transport command (play/pause/next/previous/launch) is in flight. */
  transportBusy: boolean
  init: () => Promise<void>
  connect: () => Promise<void>
  handleCallback: () => Promise<void>
  setupSdk: () => Promise<void>
  disconnect: () => void
  refreshDevices: () => Promise<void>
  refreshPlayback: () => Promise<'ok' | 'empty' | 'error'>
  startPlaybackPolling: (intervalMs?: number) => void
  stopPlaybackPolling: () => void
  pollPlaybackOnce: () => Promise<void>
  transferToDevice: (id: string) => Promise<void>
  transferToSdk: () => Promise<void>
  play: () => Promise<void>
  pause: () => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  launchPreset: (uri: string) => Promise<void>
  loadUserPlaylists: () => Promise<void>
  searchForTracks: (query: string) => Promise<void>
  createClassroomPlaylist: (name: string) => Promise<void>
  addApprovedTracks: (playlistId: string, trackUris: string[]) => Promise<void>
  selectPlaylist: (id: string | null) => void
  savePreset: (label: string, uri: string, category: string) => void
  removePreset: (id: string) => void
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

// Polling loop — module-level so there is exactly one owner regardless of how
// many components subscribe to the store.
let playbackPollTimer: ReturnType<typeof setInterval> | null = null
let playbackRefreshInFlight = false

const PLAYBACK_POLL_INTERVAL_MS = 7000

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
  userProfile: null,
  playlists: [],
  presets: [],
  searchResults: [],
  searchQuery: '',
  searching: false,
  builderBusy: false,
  builderMessage: null,
  selectedPlaylistId: null,
  transportBusy: false,

  init: async () => {
    // Playlist presets are local, non-secret config — load regardless of auth.
    set({ presets: storage.loadPresets() })
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
        set({
          authStatus: 'connected',
          tokens: refreshed,
          errorMessage: null,
          noticeMessage: null,
        })
      } catch {
        set({ authStatus: 'tokenExpired' })
        return
      }
    } else {
      set({ authStatus: 'connected', tokens, errorMessage: null, noticeMessage: null })
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
    get().stopPlaybackPolling()
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
      // Account-derived data must not linger after sign-out.
      userProfile: null,
      playlists: [],
      searchResults: [],
      searchQuery: '',
      builderMessage: null,
      selectedPlaylistId: null,
      transportBusy: false,
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
    if (!token) return 'error'
    // A fresh playback read is health-check proof — clear any stale command
    // error banner while the read is in flight.
    set({ errorMessage: null })
    try {
      const np = await fetchCurrentlyPlaying(token)
      set((s) => ({ nowPlaying: np, ...onPlaybackRefreshed(coreOf(s)) }))
      return np ? 'ok' : 'empty'
    } catch {
      // Leave last-known now-playing; never surface tokens or demote auth.
      return 'error'
    }
  },

  startPlaybackPolling: (intervalMs = PLAYBACK_POLL_INTERVAL_MS) => {
    // Idempotent: always tear down any prior loop before starting a new one.
    get().stopPlaybackPolling()
    playbackPollTimer = setInterval(() => {
      void get().pollPlaybackOnce()
    }, intervalMs)
  },

  stopPlaybackPolling: () => {
    if (playbackPollTimer !== null) {
      clearInterval(playbackPollTimer)
      playbackPollTimer = null
    }
  },

  pollPlaybackOnce: async () => {
    if (playbackRefreshInFlight) return
    if (!shouldPollPlayback(get().authStatus)) return
    playbackRefreshInFlight = true
    try {
      const result = await get().refreshPlayback()
      if (result === 'error') {
        set((s) => ({
          ...onPollingError(coreOf(s)),
          noticeMessage: 'Could not refresh playback. Will keep trying.',
        }))
      } else {
        // A successful read clears the degraded warning.
        set({ noticeMessage: null })
      }
    } finally {
      playbackRefreshInFlight = false
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
    set({ errorMessage: null, transportBusy: true })
    try {
      await play(token, { deviceId: get().activeDeviceId ?? undefined })
      const cur = get().nowPlaying
      if (cur) set({ nowPlaying: { ...cur, isPlaying: true } })
      set((s) => onCommandSuccess(coreOf(s)))
      const result = await get().refreshPlayback()
      if (result === 'error') {
        set({ noticeMessage: 'Play command sent; could not refresh playback.' })
      } else if (result === 'empty') {
        set({ noticeMessage: 'Command sent. Waiting for Spotify playback state.' })
      }
    } catch (e) {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: describeSpotifyError(classifySpotifyError(e)),
      }))
    } finally {
      set({ transportBusy: false })
    }
  },

  pause: async () => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null, transportBusy: true })
    try {
      await pause(token)
      const cur = get().nowPlaying
      if (cur) set({ nowPlaying: { ...cur, isPlaying: false } })
      set((s) => onCommandSuccess(coreOf(s)))
      const result = await get().refreshPlayback()
      if (result === 'error') {
        set({ noticeMessage: 'Pause command sent; could not refresh playback.' })
      } else if (result === 'empty') {
        set({ noticeMessage: 'Command sent. Waiting for Spotify playback state.' })
      }
    } catch (e) {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: describeSpotifyError(classifySpotifyError(e)),
      }))
    } finally {
      set({ transportBusy: false })
    }
  },

  next: async () => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null, transportBusy: true })
    try {
      await next(token)
      set((s) => onCommandSuccess(coreOf(s)))
      const result = await get().refreshPlayback()
      if (result === 'error') {
        set({ noticeMessage: 'Next command sent; could not refresh playback.' })
      } else if (result === 'empty') {
        set({ noticeMessage: 'Command sent. Waiting for Spotify playback state.' })
      }
    } catch (e) {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: describeSpotifyError(classifySpotifyError(e)),
      }))
    } finally {
      set({ transportBusy: false })
    }
  },

  previous: async () => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null, transportBusy: true })
    try {
      await previous(token)
      set((s) => onCommandSuccess(coreOf(s)))
      const result = await get().refreshPlayback()
      if (result === 'error') {
        set({ noticeMessage: 'Previous command sent; could not refresh playback.' })
      } else if (result === 'empty') {
        set({ noticeMessage: 'Command sent. Waiting for Spotify playback state.' })
      }
    } catch (e) {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: describeSpotifyError(classifySpotifyError(e)),
      }))
    } finally {
      set({ transportBusy: false })
    }
  },

  launchPreset: async (uri: string) => {
    const token = currentToken(get())
    if (!token) return
    set((s) => onCommandStart(coreOf(s)))
    set({ errorMessage: null, transportBusy: true })
    try {
      await play(token, { deviceId: get().activeDeviceId ?? undefined, contextUri: uri })
      set((s) => onCommandSuccess(coreOf(s)))
      const result = await get().refreshPlayback()
      if (result === 'error') {
        set({ noticeMessage: 'Playlist launched; could not refresh playback.' })
      } else if (result === 'empty') {
        set({ noticeMessage: 'Command sent. Waiting for Spotify playback state.' })
      }
    } catch (e) {
      set((s) => ({
        ...onCommandFailure(coreOf(s)),
        errorMessage: describeSpotifyError(classifySpotifyError(e)),
      }))
    } finally {
      set({ transportBusy: false })
    }
  },

  loadUserPlaylists: async () => {
    const token = currentToken(get())
    if (!token) return
    set({ builderBusy: true, builderMessage: null })
    try {
      const playlists = await apiFetchUserPlaylists(token)
      set({ playlists })
    } catch (e) {
      set({ builderMessage: describeSpotifyError(classifySpotifyError(e)) })
    } finally {
      set({ builderBusy: false })
    }
  },

  searchForTracks: async (query: string) => {
    const token = currentToken(get())
    if (!token) return
    const q = query.trim()
    if (!q) {
      set({ searchResults: [], searchQuery: '' })
      return
    }
    set({ searching: true, searchQuery: q })
    try {
      const results = await apiSearchTracks(token, q)
      set({
        searchResults: results,
        builderMessage: results.length === 0 ? 'Search returned no results' : null,
      })
    } catch (e) {
      set({
        searchResults: [],
        builderMessage: describeSpotifyError(classifySpotifyError(e)),
      })
    } finally {
      set({ searching: false })
    }
  },

  createClassroomPlaylist: async (name: string) => {
    const token = currentToken(get())
    if (!token) return
    const trimmed = name.trim()
    if (!trimmed) return
    set({ builderBusy: true, builderMessage: null })
    try {
      let profile = get().userProfile
      if (!profile) {
        profile = await apiFetchUserProfile(token)
        set({ userProfile: profile })
      }
      const playlist = await apiCreatePlaylist(
        token,
        profile.id,
        trimmed,
        'Classroom playlist — teacher reviewed',
      )
      set((s) => ({
        playlists: [playlist, ...s.playlists],
        selectedPlaylistId: playlist.id,
        builderMessage: `Created private playlist "${playlist.name}".`,
      }))
    } catch (e) {
      set({ builderMessage: describeSpotifyError(classifySpotifyError(e, true)) })
    } finally {
      set({ builderBusy: false })
    }
  },

  addApprovedTracks: async (playlistId: string, trackUris: string[]) => {
    const token = currentToken(get())
    if (!token) return
    if (!playlistId || trackUris.length === 0) return
    set({ builderBusy: true, builderMessage: null })
    try {
      await apiAddTracks(token, playlistId, trackUris)
      set({ builderMessage: `Added ${trackUris.length} track(s) — teacher approved.` })
    } catch (e) {
      set({ builderMessage: describeSpotifyError(classifySpotifyError(e, true)) })
    } finally {
      set({ builderBusy: false })
    }
  },

  selectPlaylist: (id) => {
    set({ selectedPlaylistId: id })
  },

  savePreset: (label, uri, category) => {
    const preset: PlaylistPreset = {
      id: `preset-${Date.now()}`,
      label: label.trim(),
      uri,
      category,
    }
    const presets = storage.sanitizePresets([...get().presets, preset])
    storage.savePresets(presets)
    set({ presets })
  },

  removePreset: (id) => {
    const presets = get().presets.filter((p) => p.id !== id)
    storage.savePresets(presets)
    set({ presets })
  },
}))

export { DEFAULT_PLAYLIST_PRESETS }
