import { useCallback, useEffect, useRef, useState } from 'react'
import { useDisplayComposerStore } from '../../features/display-composer/displayComposerStore'
import { toDisplaySafeScreen } from '../../features/display-composer/displaySafe'
import { useRandomNumberStore } from '../../features/random-number/randomNumberStore'
import { toDisplaySafeRandomNumberSnapshot } from '../../features/random-number/displaySafe'
import { SYNC_TOKEN_STORAGE_KEY, syncWsUrl, type SyncServerMessage } from './protocol'

export type ControlSyncAuthStatus = 'unauthenticated' | 'authenticated'

/**
 * 'connected': socket open right now.
 * 'reconnecting': a drop just happened; the retry loop (see connect() below)
 *   is on it, backoff is still small — most Wi-Fi blips resolve here.
 * 'disconnected': the retry loop has failed several times in a row. Still
 *   retrying underneath (it never gives up — see connect()'s doc comment),
 *   just telling the teacher this looks like more than a blip.
 */
export type ControlSyncConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

const DISCONNECTED_ATTEMPT_THRESHOLD = 3

export interface ControlSyncState {
  connectionStatus: ControlSyncConnectionStatus
  /** True once this device's socket has opened at least once, ever, this
   * session — and stays true afterward even through later drops. Callers
   * should gate the pairing prompt on THIS, not on connectionStatus ===
   * 'connected': plain `npm run dev` with no sync server running at all must
   * keep behaving exactly as before Stage 3 (no pairing gate, nothing
   * changes) — that's `hasConnectedOnce === false`, forever, since a socket
   * to nothing never opens. But a device that DID confirm it's unauthenticated
   * and then loses the connection mid-pairing should keep showing the
   * pairing gate, not fall back to the permissive "never seen a server"
   * behavior just because the socket is momentarily down. */
  hasConnectedOnce: boolean
  authStatus: ControlSyncAuthStatus
  pairError: string | null
  /** Non-null while this device is in a pairing-attempt cooldown (brute-force
   * rate limiting) — counts down to 0, then clears. UI should disable the
   * pair submit button and show it, not fail silently (requirement 3). */
  rateLimitedSeconds: number | null
  /** Submit the code shown on /display. */
  submitCode: (code: string) => void
  /** Revoke this device's pairing (requirement 4) — the server generates a
   * fresh pairing code and this device forgets its token immediately. */
  unpair: () => void
}

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(SYNC_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(SYNC_TOKEN_STORAGE_KEY, token)
    else window.localStorage.removeItem(SYNC_TOKEN_STORAGE_KEY)
  } catch {
    // Safari private mode / storage blocked — token just won't survive a
    // reload; pairing still works for the current session.
  }
}

/**
 * Mounted once on /control (see TeacherControlShell). Opens a best-effort
 * WebSocket to the classroom sync server (server/classroomSyncServer.ts)
 * and mirrors the same teacher state that already drives same-device
 * /display sync — Blank + active Display Composer screen (which is also how
 * "start a timer" reaches /display; see server/classroomSyncServer.ts's
 * scope note) and Random Number — as network actions too.
 *
 * Only ever SENDS the already display-safe projection (`toDisplaySafeScreen`,
 * `toDisplaySafeRandomNumberSnapshot`) — the raw screen (teacherNotes,
 * updatedAt, version, full widget settings) never gets serialized for the
 * wire in the first place, let alone leaves this browser.
 *
 * Entirely additive and best-effort: local store actions are untouched, so
 * same-device sync keeps working exactly as before regardless of whether a
 * sync server is reachable. If no server is running (e.g. plain `npm run
 * dev`), the socket fails to connect, a few retries back off, then it goes
 * quiet — nothing else changes.
 *
 * Stage 3 pairing: this device's token (if any) lives in localStorage and is
 * sent with every action. `authStatus` starts optimistic — "authenticated"
 * if a token is already stored, without waiting on a round trip, since the
 * common case (already-paired iPad reopening the tab) should feel instant.
 * If that token turns out to be stale (server restarted, or unpaired from
 * elsewhere), the first rejected action flips it back to 'unauthenticated'
 * and clears the stored token. This device never receives the pairing code
 * itself (requirement 3) — only ever submits what a human typed in.
 *
 * Reconnect: the retry loop never gives up (unlike the design doc's original
 * "~10-15 attempts then stop" suggestion) — capped exponential backoff with
 * jitter, forever. That original suggestion was written when there was no
 * visible connection state at all, so "silently retrying forever" was a real
 * concern; now that connectionStatus is surfaced to the teacher (see
 * ConnectionStatusIndicator), an outage is visible rather than silent, and
 * giving up permanently would otherwise stall the classroom until a manual
 * page reload — worse than an honest "disconnected" indicator that keeps
 * trying underneath it. On every successful (re)open this resends the full
 * current composer/random-number snapshot with whatever token is stored —
 * that's what makes a reconnect "self-healing" without a literal queue: the
 * latest state always gets sent again as soon as a connection exists, and a
 * restarted server (which revokes pairing by design) rejects it once, which
 * flips this device back to the pairing gate rather than acting silently
 * unpaired forever.
 */
export function useControlSyncClient(): ControlSyncState {
  const socketRef = useRef<WebSocket | null>(null)
  // Read localStorage directly for each initializer (rather than via
  // tokenRef.current) — accessing a ref's `.current` during render is a
  // react-hooks/refs violation even when reading, not just writing.
  const tokenRef = useRef<string | null>(readStoredToken())
  const [authStatus, setAuthStatus] = useState<ControlSyncAuthStatus>(readStoredToken() ? 'authenticated' : 'unauthenticated')
  const [pairError, setPairError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ControlSyncConnectionStatus>('reconnecting')
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false)
  // Whole seconds remaining in a pairing-attempt cooldown, counted down by
  // the interval below. Deliberately a plain seconds count set directly from
  // the server's retryAfterSeconds, not a wall-clock deadline recomputed via
  // Date.now() at render time — reading the clock during render isn't a pure
  // computation (React flags it), and every update below happens inside a
  // callback (a WebSocket message handler or a setInterval tick), never as a
  // bare synchronous call in an effect body.
  const [rateLimitedSeconds, setRateLimitedSeconds] = useState<number | null>(null)

  const setToken = useCallback((token: string | null) => {
    tokenRef.current = token
    writeStoredToken(token)
    setAuthStatus(token ? 'authenticated' : 'unauthenticated')
  }, [])

  const isRateLimited = rateLimitedSeconds !== null
  useEffect(() => {
    if (!isRateLimited) return
    const interval = setInterval(() => {
      setRateLimitedSeconds((s) => (s !== null && s > 1 ? s - 1 : null))
    }, 1000)
    return () => clearInterval(interval)
  }, [isRateLimited])

  useEffect(() => {
    let cancelled = false
    let attempt = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    function send(channel: 'composer' | 'randomNumber', payload: unknown) {
      const socket = socketRef.current
      if (socket?.readyState === WebSocket.OPEN && tokenRef.current) {
        socket.send(JSON.stringify({ type: 'action', channel, token: tokenRef.current, payload }))
      }
    }

    function sendComposerState() {
      const { displayBlanked, activeScreenId, screens } = useDisplayComposerStore.getState()
      const rawScreen = activeScreenId ? screens[activeScreenId] : undefined
      const safeScreen = toDisplaySafeScreen(rawScreen)
      send('composer', { blanked: displayBlanked, screenId: activeScreenId, screen: safeScreen })
    }

    function sendRandomNumberState() {
      const { lastResult, showOnDisplay } = useRandomNumberStore.getState()
      const snapshot = toDisplaySafeRandomNumberSnapshot(lastResult, showOnDisplay)
      send('randomNumber', { value: snapshot?.value ?? null })
    }

    function handleMessage(event: MessageEvent) {
      let msg: SyncServerMessage
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      if (msg.type === 'paired') {
        setToken(msg.token)
        setPairError(null)
        setRateLimitedSeconds(null)
        return
      }
      if (msg.type === 'pairError') {
        setRateLimitedSeconds(null)
        setPairError(msg.message)
        return
      }
      if (msg.type === 'rateLimited') {
        setPairError(null)
        setRateLimitedSeconds(msg.retryAfterSeconds)
        return
      }
      if (msg.type === 'unpaired') {
        setToken(null)
        return
      }
      if (msg.type === 'actionRejected') {
        // Stale/invalid token (server restarted, or unpaired elsewhere) —
        // drop it and fall back to the pairing prompt rather than silently
        // doing nothing forever.
        setToken(null)
      }
    }

    function connect() {
      if (cancelled) return
      const socket = new WebSocket(syncWsUrl('control'))
      socketRef.current = socket

      socket.onopen = () => {
        attempt = 0
        setConnectionStatus('connected')
        setHasConnectedOnce(true)
        setRateLimitedSeconds(null)
        sendComposerState()
        sendRandomNumberState()
      }
      socket.onmessage = handleMessage
      socket.onclose = () => {
        if (cancelled) return
        attempt += 1
        setConnectionStatus(attempt <= DISCONNECTED_ATTEMPT_THRESHOLD ? 'reconnecting' : 'disconnected')
        // No attempt ceiling — see this hook's doc comment on why giving up
        // permanently would be worse than an honest, still-retrying
        // "disconnected" indicator. Backoff still caps at 30s either way.
        const delay = Math.min(30000, 500 * 2 ** attempt) + Math.random() * 300
        retryTimer = setTimeout(connect, delay)
      }
      socket.onerror = () => socket.close()
    }

    connect()

    const unsubComposer = useDisplayComposerStore.subscribe((s, prev) => {
      const screenChanged = s.activeScreenId
        ? s.screens[s.activeScreenId] !== prev.screens[s.activeScreenId]
        : false
      if (s.displayBlanked !== prev.displayBlanked || s.activeScreenId !== prev.activeScreenId || screenChanged) {
        sendComposerState()
      }
    })

    const unsubRandomNumber = useRandomNumberStore.subscribe((s, prev) => {
      if (s.lastResult !== prev.lastResult || s.showOnDisplay !== prev.showOnDisplay) {
        sendRandomNumberState()
      }
    })

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      unsubComposer()
      unsubRandomNumber()
      socketRef.current?.close()
    }
  }, [setToken])

  const submitCode = useCallback((code: string) => {
    const socket = socketRef.current
    setPairError(null)
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'pair', code }))
    } else {
      setPairError('Not connected to the classroom sync server yet — try again in a moment.')
    }
  }, [])

  const unpair = useCallback(() => {
    const socket = socketRef.current
    const token = tokenRef.current
    if (socket?.readyState === WebSocket.OPEN && token) {
      socket.send(JSON.stringify({ type: 'unpair', token }))
      // Optimistic: clear locally right away rather than waiting on the
      // server's 'unpaired' ack. Only done here, inside the "socket is
      // actually open" branch — the unpair message did reach the server, so
      // there's no risk of this device forgetting its token while the
      // server still considers it valid. (UnpairControl disables this
      // action entirely while disconnected, so in practice this branch is
      // the only one ever reached — this guard is defense in depth, not the
      // primary mechanism.)
      setToken(null)
    }
  }, [setToken])

  return {
    connectionStatus,
    hasConnectedOnce,
    authStatus,
    pairError,
    rateLimitedSeconds,
    submitCode,
    unpair,
  }
}
