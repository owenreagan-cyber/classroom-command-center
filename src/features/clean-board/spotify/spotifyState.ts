import type { SpotifyAuthStatus, SpotifyOpStatus } from './spotifyTypes'

/**
 * DB-2B — pure Spotify state transitions.
 *
 * The critical invariant fixed here: a valid token must keep the session
 * "connected" (auth) regardless of SDK/device/playback outcomes (op). These
 * reducers encode that invariant and are unit-tested without a browser.
 */

export interface SpotifyCore {
  authStatus: SpotifyAuthStatus
  opStatus: SpotifyOpStatus
}

export function isAuthConnected(authStatus: SpotifyAuthStatus): boolean {
  return authStatus === 'connected'
}

/** Clear a transient op error back to idle, preserving a hard premium state. */
function clearToIdle(core: SpotifyCore): SpotifyCore {
  if (core.opStatus === 'premiumRequired') return core
  return core.opStatus === 'idle' ? core : { ...core, opStatus: 'idle' }
}

/** Human-readable label for the teacher status line. */
export function describeStatus(core: SpotifyCore): string {
  switch (core.authStatus) {
    case 'configMissing':
      return 'Spotify setup needed'
    case 'loggedOut':
      return 'Not connected'
    case 'authorizing':
      return 'Signing in…'
    case 'tokenExpired':
      return 'Session expired'
    case 'connected':
      switch (core.opStatus) {
        case 'idle':
          return 'Connected'
        case 'premiumRequired':
          return 'Premium required'
        case 'sdkUnavailable':
          return 'Board player unavailable'
        case 'deviceUnavailable':
          return 'No devices found'
        case 'playbackRestricted':
          return 'Playback restricted'
        case 'apiError':
          return 'Error'
      }
  }
}

/** Clear a stale transient error before issuing a fresh command. */
export function onCommandStart(core: SpotifyCore): SpotifyCore {
  if (!isAuthConnected(core.authStatus)) return core
  return core.opStatus === 'apiError' ? { ...core, opStatus: 'idle' } : core
}

/** A command failed: surface an op error, but NEVER demote the auth session. */
export function onCommandFailure(core: SpotifyCore): SpotifyCore {
  if (!isAuthConnected(core.authStatus)) return core
  return { ...core, opStatus: 'apiError' }
}

/** A command succeeded: clear any stale op error back to idle. */
export function onCommandSuccess(core: SpotifyCore): SpotifyCore {
  if (!isAuthConnected(core.authStatus)) return core
  return clearToIdle(core)
}

/** Devices loaded: empty → deviceUnavailable warning; otherwise idle. */
export function onDevicesLoaded(core: SpotifyCore, deviceCount: number): SpotifyCore {
  if (!isAuthConnected(core.authStatus)) return core
  if (deviceCount === 0) return { ...core, opStatus: 'deviceUnavailable' }
  return clearToIdle(core)
}

/**
 * Playback state was fetched successfully (track present or confirmed empty).
 * This clears a stale command error because a valid playback read is proof the
 * session is healthy — a "Nothing playing" read is NOT an error.
 */
export function onPlaybackRefreshed(core: SpotifyCore): SpotifyCore {
  if (!isAuthConnected(core.authStatus)) return core
  return clearToIdle(core)
}

/** Device fetch failed: keep auth connected, surface an op error. */
export function onDevicesError(core: SpotifyCore): SpotifyCore {
  return onCommandFailure(core)
}

/** SDK could not create a board device — keep API controls usable. */
export function onSdkUnavailable(core: SpotifyCore): SpotifyCore {
  if (!isAuthConnected(core.authStatus)) return core
  return { ...core, opStatus: 'sdkUnavailable' }
}

export function onPremiumRequired(core: SpotifyCore): SpotifyCore {
  if (!isAuthConnected(core.authStatus)) return core
  return { ...core, opStatus: 'premiumRequired' }
}

export function onSdkReady(core: SpotifyCore): SpotifyCore {
  if (!isAuthConnected(core.authStatus)) return core
  return clearToIdle(core)
}
