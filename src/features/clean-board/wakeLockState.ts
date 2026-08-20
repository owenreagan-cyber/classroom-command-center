/**
 * DB-2D — pure wake-lock state helpers (no React, no DOM, no navigator).
 *
 * Kept separate from the React hook so the status/decision logic can be unit
 * tested without a browser. Browser code can only use the Screen Wake Lock
 * API; it cannot run macOS `caffeinate` directly.
 */

export type WakeLockStatus =
  | 'disabled'
  | 'active'
  | 'unsupported'
  | 'released'
  | 'reacquiring'

/** Minimal wake-lock shape — decouples helpers from `lib.dom` WakeLock types. */
export interface WakeLockLike {
  request?: (type: string) => Promise<unknown>
}

export interface NavigatorLike {
  wakeLock?: WakeLockLike | null
}

/** Whether this environment can request a screen wake lock. */
export function isWakeLockSupported(nav: NavigatorLike | null | undefined): boolean {
  return Boolean(nav && nav.wakeLock && typeof nav.wakeLock.request === 'function')
}

/** Human-readable label for the teacher Keep Awake status line. */
export function describeWakeLockStatus(status: WakeLockStatus): string {
  switch (status) {
    case 'active':
      return 'Keep Awake active'
    case 'unsupported':
      return 'Wake Lock unsupported in this browser'
    case 'released':
      return 'Wake Lock released; click to re-enable'
    case 'reacquiring':
      return 'Reacquiring…'
    case 'disabled':
      return 'Keep Awake off'
  }
}

/**
 * Whether the hook should (re)acquire a lock right now. Encodes the three
 * invariants: toggle enabled, tab visible, and no sentinel already held.
 */
export function shouldReacquire(
  enabled: boolean,
  isVisible: boolean,
  hasSentinel: boolean,
): boolean {
  return enabled && isVisible && !hasSentinel
}
