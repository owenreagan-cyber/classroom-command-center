/**
 * DB-2A — Spotify Web Playback SDK loader + player factory.
 *
 * The SDK creates a browser-based Spotify Connect device. Playback through the
 * SDK requires a Spotify Premium account; `account_error` maps to a graceful
 * premium-required state. All access here is guarded for non-browser contexts.
 */

interface SdkPlayerEvent {
  device_id?: string
  message?: string
}

interface SdkPlayer {
  addListener(name: string, cb: (event: SdkPlayerEvent) => void): void
  connect(): Promise<boolean>
  disconnect(): void
}

interface SdkWindow {
  Spotify?: {
    Player: new (opts: {
      name: string
      getOAuthToken: (cb: (token: string) => void) => void
    }) => SdkPlayer
  }
  onSpotifyWebPlaybackSDKReady?: () => void
}

const SDK_SCRIPT_URL = 'https://sdk.scdn.co/spotify-player.js'

export function isSdkAvailable(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean((window as unknown as SdkWindow).Spotify)
}

let sdkLoadPromise: Promise<void> | null = null

export function loadSdk(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Spotify SDK requires a browser'))
  }
  if (isSdkAvailable()) return Promise.resolve()
  if (sdkLoadPromise) return sdkLoadPromise

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    const win = window as unknown as SdkWindow
    const previous = win.onSpotifyWebPlaybackSDKReady
    win.onSpotifyWebPlaybackSDKReady = () => {
      previous?.()
      resolve()
    }
    const script = document.createElement('script')
    script.src = SDK_SCRIPT_URL
    script.async = true
    script.onerror = () => {
      sdkLoadPromise = null
      reject(new Error('Spotify playback SDK failed to load'))
    }
    document.head.appendChild(script)
  })
  return sdkLoadPromise
}

export interface SdkCallbacks {
  onReady: (deviceId: string) => void
  onAccountError: () => void
  onInitError: () => void
  onNotReady: () => void
}

// Retain the active player so the SDK device stays connected (the SDK keeps an
// internal reference, but holding it here also lets us disconnect cleanly).
let activePlayer: SdkPlayer | null = null

export function isPlayerActive(): boolean {
  return activePlayer !== null
}

/** Disconnect and release the current browser device, if any. */
export function disconnectSdkPlayer(): void {
  if (!activePlayer) return
  try {
    activePlayer.disconnect()
  } catch {
    // Best-effort; the SDK may already have torn the device down.
  }
  activePlayer = null
}

/**
 * Create and connect a browser Spotify Connect device (Premium required).
 * `getToken` is invoked lazily by the SDK whenever it needs a fresh token, so
 * a mid-session token refresh is picked up automatically.
 */
export function createSdkPlayer(getToken: () => string | null, callbacks: SdkCallbacks): void {
  if (typeof window === 'undefined') throw new Error('Spotify SDK requires a browser')
  const Spotify = (window as unknown as SdkWindow).Spotify
  if (!Spotify) throw new Error('Spotify SDK is not loaded')
  if (activePlayer) return

  const player = new Spotify.Player({
    name: 'Clean Board',
    getOAuthToken: (cb) => {
      const token = getToken()
      if (token) cb(token)
    },
  })

  activePlayer = player

  player.addListener('ready', (e) => {
    if (e.device_id) callbacks.onReady(e.device_id)
  })
  player.addListener('not_ready', () => callbacks.onNotReady())
  player.addListener('initialization_error', () => callbacks.onInitError())
  player.addListener('authentication_error', () => callbacks.onInitError())
  player.addListener('account_error', () => callbacks.onAccountError())

  void player.connect()
}
