import { useEffect, useState } from 'react'
import { useDisplayComposerStore } from '../../features/display-composer/displayComposerStore'
import type { DisplayScreen } from '../../features/display-composer/types'
import { useRandomNumberStore } from '../../features/random-number/randomNumberStore'
import { syncWsUrl, type ComposerWireState, type SyncServerMessage } from './protocol'
import type { RandomNumberDisplaySnapshot } from '../../features/random-number/displaySafe'

function applyComposer(composer: ComposerWireState) {
  useDisplayComposerStore.setState((state) => ({
    displayBlanked: composer.blanked,
    activeScreenId: composer.screenId,
    // composer.screen is a ComposerWireScreen (DisplaySafeScreen + studentSafe),
    // deliberately narrower than the real DisplayScreen (no mode/updatedAt/
    // version/teacherNotes) — safe here because on /display this record is
    // only ever read by DisplayOverlayHost and DisplayComposerOverlay, and
    // both only touch the fields this wire shape actually carries.
    screens: composer.screen
      ? { ...state.screens, [composer.screen.id]: composer.screen as unknown as DisplayScreen }
      : state.screens,
  }))
}

function applyRandomNumber(snapshot: RandomNumberDisplaySnapshot | null) {
  useRandomNumberStore.setState({
    lastResult: snapshot?.value ?? null,
    showOnDisplay: snapshot !== null,
  })
}

/**
 * Mounted once on /display (BoardHostDisplay). Mirrors server-broadcast,
 * already display-safe state directly into the same local Zustand stores
 * DisplayOverlayHost/DisplayComposerOverlay already read from — so those
 * components need zero changes. A remote update looks exactly like the
 * existing same-device `storage`-event bridge (see
 * displayComposerStore.ts's own doc comment on that pattern), just
 * triggered over the network instead of a same-browser storage event.
 *
 * Best-effort: if no sync server is reachable, this silently no-ops after a
 * few retries and /display behaves exactly as it does today (same-device
 * localStorage sync only).
 *
 * Stage 3 pairing: connects with `?role=display`, which is what makes the
 * server willing to send it `pairingStatus` (the code) — a control-role
 * socket never receives that message type at all (requirement 3). Per
 * requirement 2, this connection needs no token of its own: /display is
 * read-only and receives the safe projection regardless of pairing state.
 */
export function useDisplaySyncClient(): { pairingCode: string | null } {
  const [pairingCode, setPairingCode] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let attempt = 0
    let socket: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    function handleMessage(event: MessageEvent) {
      let msg: SyncServerMessage
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      if (msg.type === 'hello') {
        applyComposer(msg.state.composer)
        applyRandomNumber(msg.state.randomNumber)
        return
      }
      if (msg.type === 'state' && msg.channel === 'composer') {
        applyComposer(msg.payload as ComposerWireState)
        return
      }
      if (msg.type === 'state' && msg.channel === 'randomNumber') {
        applyRandomNumber(msg.payload as RandomNumberDisplaySnapshot | null)
        return
      }
      if (msg.type === 'pairingStatus') {
        setPairingCode(msg.code)
      }
    }

    function connect() {
      if (cancelled) return
      socket = new WebSocket(syncWsUrl('display'))
      socket.onmessage = handleMessage
      socket.onopen = () => {
        attempt = 0
      }
      socket.onclose = () => {
        if (cancelled) return
        attempt += 1
        if (attempt > 10) return
        const delay = Math.min(30000, 500 * 2 ** attempt) + Math.random() * 300
        retryTimer = setTimeout(connect, delay)
      }
      socket.onerror = () => socket?.close()
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      socket?.close()
    }
  }, [])

  return { pairingCode }
}
