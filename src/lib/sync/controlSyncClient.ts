import { useCallback, useEffect, useRef, useState } from 'react'
import { useDisplayComposerStore } from '../../features/display-composer/displayComposerStore'
import { toDisplaySafeScreen } from '../../features/display-composer/displaySafe'
import { useRandomNumberStore } from '../../features/random-number/randomNumberStore'
import { toDisplaySafeRandomNumberSnapshot } from '../../features/random-number/displaySafe'
import { SYNC_TOKEN_STORAGE_KEY, syncWsUrl, type SyncServerMessage } from './protocol'

export type ControlSyncAuthStatus = 'unauthenticated' | 'authenticated'

export interface ControlSyncState {
  /** False until this device's socket has actually opened at least once.
   * Callers should NOT gate the UI on `authStatus` while this is false —
   * e.g. plain `npm run dev` with no sync server running at all must keep
   * behaving exactly as before Stage 3 (no pairing gate, nothing changes),
   * the same "entirely additive, best-effort" invariant Stage 2 already
   * established. Only once a real server has confirmed we're unauthenticated
   * should the pairing prompt appear. */
  connected: boolean
  authStatus: ControlSyncAuthStatus
  pairError: string | null
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
 */
export function useControlSyncClient(): ControlSyncState {
  const socketRef = useRef<WebSocket | null>(null)
  // Read localStorage directly for each initializer (rather than via
  // tokenRef.current) — accessing a ref's `.current` during render is a
  // react-hooks/refs violation even when reading, not just writing.
  const tokenRef = useRef<string | null>(readStoredToken())
  const [authStatus, setAuthStatus] = useState<ControlSyncAuthStatus>(readStoredToken() ? 'authenticated' : 'unauthenticated')
  const [pairError, setPairError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  const setToken = useCallback((token: string | null) => {
    tokenRef.current = token
    writeStoredToken(token)
    setAuthStatus(token ? 'authenticated' : 'unauthenticated')
  }, [])

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
        return
      }
      if (msg.type === 'pairError') {
        setPairError(msg.message)
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
        setConnected(true)
        sendComposerState()
        sendRandomNumberState()
      }
      socket.onmessage = handleMessage
      socket.onclose = () => {
        setConnected(false)
        if (cancelled) return
        attempt += 1
        if (attempt > 10) return
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
    }
    // Optimistic: clear locally right away even if the send above can't
    // reach the server (e.g. offline) — this device shouldn't keep acting
    // as "paired" once the teacher has asked to unpair it.
    setToken(null)
  }, [setToken])

  return { connected, authStatus, pairError, submitCode, unpair }
}
