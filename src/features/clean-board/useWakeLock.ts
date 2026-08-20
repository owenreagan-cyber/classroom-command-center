import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  describeWakeLockStatus,
  shouldReacquire,
  type NavigatorLike,
  type WakeLockStatus,
} from './wakeLockState'

/**
 * DB-2D — screen wake-lock hook (client-only).
 *
 * Browser code cannot run macOS `caffeinate`; it can only request a screen
 * wake lock via `navigator.wakeLock.request('screen')` where supported. This
 * hook holds the sentinel, re-acquires after the tab returns to the
 * foreground, and releases on disable/unmount/browser-release. It never throws
 * when `navigator` or `document` are unavailable (SSR/build/tests).
 */

interface WakeLockSentinel {
  released: boolean
  addEventListener: (type: 'release', listener: () => void) => void
  removeEventListener: (type: 'release', listener: () => void) => void
  release: () => Promise<void>
}

function getWakeLockApi(): { request: (type: 'screen') => Promise<WakeLockSentinel> } | null {
  if (typeof navigator === 'undefined') return null
  const wl = (navigator as unknown as NavigatorLike).wakeLock
  if (!wl || typeof wl.request !== 'function') return null
  return wl as { request: (type: 'screen') => Promise<WakeLockSentinel> }
}

/** The live lock state once the toggle is enabled on a supported browser. */
type LockState = 'reacquiring' | 'active' | 'released'

export function useWakeLock(enabled: boolean): {
  status: WakeLockStatus
  statusText: string
  supported: boolean
} {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const enabledRef = useRef(enabled)
  const [lockState, setLockState] = useState<LockState>('reacquiring')

  // Keep the latest toggle value readable from async callbacks without
  // re-creating them on every render.
  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  const supported = useMemo(() => getWakeLockApi() !== null, [])

  const release = useCallback(async () => {
    const sentinel = sentinelRef.current
    sentinelRef.current = null
    if (sentinel && !sentinel.released) {
      try {
        await sentinel.release()
      } catch {
        // Release is best-effort; the browser may have already dropped it.
      }
    }
  }, [])

  // Request a sentinel without touching React state — the caller applies the
  // result so state transitions stay inside async callbacks/event handlers.
  const request = useCallback(async (): Promise<WakeLockSentinel | null> => {
    const api = getWakeLockApi()
    if (!api) return null
    try {
      return await api.request('screen')
    } catch {
      return null
    }
  }, [])

  const adopt = useCallback((sentinel: WakeLockSentinel) => {
    if (!enabledRef.current) {
      void sentinel.release()
      return
    }
    sentinelRef.current = sentinel
    sentinel.addEventListener('release', () => {
      if (sentinelRef.current === sentinel) sentinelRef.current = null
      setLockState('released')
    })
    setLockState('active')
  }, [])

  useEffect(() => {
    if (!enabled) {
      void release()
      return
    }
    if (!supported) return
    let cancelled = false
    void request().then((sentinel) => {
      if (cancelled) {
        if (sentinel) void sentinel.release()
        return
      }
      if (!sentinel) {
        setLockState('released')
        return
      }
      adopt(sentinel)
    })
    return () => {
      cancelled = true
    }
  }, [enabled, supported, request, adopt, release])

  // Re-acquire when the tab returns to the foreground while still enabled.
  useEffect(() => {
    if (!enabled || !supported) return
    const onVisibility = () => {
      if (typeof document === 'undefined') return
      const visible = document.visibilityState === 'visible'
      if (!shouldReacquire(enabledRef.current, visible, Boolean(sentinelRef.current))) return
      setLockState('reacquiring')
      void request().then((sentinel) => {
        if (!sentinel) {
          setLockState('released')
          return
        }
        adopt(sentinel)
      })
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
  }, [enabled, supported, request, adopt])

  // Release on unmount.
  useEffect(() => {
    return () => {
      void release()
    }
  }, [release])

  const status: WakeLockStatus = !enabled ? 'disabled' : !supported ? 'unsupported' : lockState

  return { status, statusText: describeWakeLockStatus(status), supported }
}
