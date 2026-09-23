import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FULLSCREEN_DENIED_MESSAGE,
  FULLSCREEN_UNAVAILABLE_MESSAGE,
  isBrowserFullscreen,
  requestBrowserFullscreen,
} from '../../app/displayFullscreen'

const IDLE_TIMEOUT_MS = 3000

/**
 * Auto-hiding "Enter fullscreen" affordance + cursor auto-hide for /display.
 *
 * Fullscreen requires a real user gesture (browsers block programmatic
 * requestFullscreen() on page load), and the Fullscreen API is scoped to the
 * document that calls it -- the iPad remote can't trigger fullscreen on the
 * Mac's /display tab over the network, so this can't depend on a click from
 * /control. This button is for whoever is physically at the Mac (initial
 * setup, or a quick manual check); the real day-to-day path is the kiosk
 * launcher (scripts/launch-display.sh), which starts already fullscreen
 * with no browser chrome and needs no button at all.
 *
 * Hidden by default -- appears only on mouse movement and hides again after
 * a few seconds of inactivity, so it's never visible to students during a
 * normal lesson. The cursor hides on the same idle timer.
 */
export function DisplayFullscreenControl() {
  const [isIdle, setIsIdle] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(isBrowserFullscreen(document))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    onFullscreenChange()
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    }
  }, [])

  const resetIdleTimer = useCallback(() => {
    setIsIdle(false)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', resetIdleTimer)
    window.addEventListener('mousedown', resetIdleTimer)
    // Start idle (not a synchronous setState call -- just arms the same
    // timer resetIdleTimer would, so the initial `isIdle: false` above
    // times out on its own if the mouse never moves).
    idleTimerRef.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS)
    return () => {
      window.removeEventListener('mousemove', resetIdleTimer)
      window.removeEventListener('mousedown', resetIdleTimer)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [resetIdleTimer])

  useEffect(() => {
    document.body.classList.toggle('display-cursor-hidden', isIdle)
    return () => {
      document.body.classList.remove('display-cursor-hidden')
    }
  }, [isIdle])

  const handleClick = useCallback(async () => {
    const result = await requestBrowserFullscreen(document)
    setError(result.ok ? null : result.reason === 'unavailable' ? FULLSCREEN_UNAVAILABLE_MESSAGE : FULLSCREEN_DENIED_MESSAGE)
  }, [])

  if (fullscreen) return null

  return (
    <div
      className={`absolute bottom-6 left-6 z-50 transition-opacity duration-500 ${
        isIdle ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        className="min-h-[44px] rounded-full border border-slate-600 bg-slate-900/85 px-4 py-2 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur transition hover:bg-slate-800"
        data-display-enter-fullscreen
      >
        ⛶ Enter fullscreen
      </button>
      {error && (
        <p className="mt-2 max-w-[16rem] rounded-lg bg-slate-950/90 px-3 py-1.5 text-[11px] text-slate-300">
          {error}
        </p>
      )}
    </div>
  )
}
