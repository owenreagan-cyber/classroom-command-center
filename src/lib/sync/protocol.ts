import type { DisplaySafeScreen } from '../../features/display-composer/displaySafe'
import type { RandomNumberDisplaySnapshot } from '../../features/random-number/displaySafe'

/**
 * Cross-device sync protocol between /control, the classroom sync server,
 * and /display. See docs/architecture/cross-device-control.md (Stage 1
 * design) for the full rationale.
 *
 * Stage 2 (state): action-based protocol, "core" channels only — Blank +
 * Display Composer active screen + Random Number. Prize Board and the noise
 * meter are deliberately deferred (see server/classroomSyncServer.ts).
 * Every channel is safe-by-construction: a screen is never put on this wire
 * without first passing through `toDisplaySafeScreen`, both on the sending
 * (/control) side and again on the server before it re-broadcasts — so a
 * bug in one place can't leak teacher-only fields on its own.
 *
 * Stage 3 (pairing/security, added below): only a paired /control may send
 * actions; /display remains open/read-only to any viewer (it only ever
 * receives the already-safe projection, same as before).
 */

export const SYNC_WS_PATH = '/__classroom-sync'

/** localStorage key /control uses to remember its paired token across page
 * loads (Safari on the iPad — a different origin/device than the Mac, no
 * conflict with anything Command Center already stores). */
export const SYNC_TOKEN_STORAGE_KEY = 'classroom-sync-token'

/** Builds the role-tagged WebSocket URL both client bridges connect with.
 * The server reads `role` off the upgrade request's query string once, at
 * connection time, and never trusts anything else to say who a socket is. */
export function syncWsUrl(role: 'control' | 'display'): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}${SYNC_WS_PATH}?role=${role}`
}

/** studentSafe is re-added after filtering (it's not itself sensitive — it's
 * the kill-switch flag DisplayOverlayHost/DisplayComposerOverlay check —
 * but DisplaySafeScreen deliberately omits it, so the wire shape re-adds it
 * explicitly rather than smuggling the whole raw DisplayScreen across). */
export type ComposerWireScreen = DisplaySafeScreen & { studentSafe: true }

export interface ComposerWireState {
  blanked: boolean
  screenId: string | null
  screen: ComposerWireScreen | null
}

export interface SyncCanonicalState {
  composer: ComposerWireState
  randomNumber: RandomNumberDisplaySnapshot | null
}

export type SyncChannel = 'composer' | 'randomNumber'

/**
 * Stage 3 — pairing/security (docs/architecture/cross-device-control.md §4).
 *
 * A connection identifies its role via `?role=control|display` on the
 * WebSocket URL (see SYNC_WS_PATH usage in controlSyncClient.ts /
 * displaySyncClient.ts). This is what lets the server enforce "the pairing
 * code never shows on /control, and nothing about the token reaches
 * /display": pairingStatus (which carries the code) is only ever sent to
 * display-role sockets; paired/authResult (which carry or confirm a token)
 * are only ever sent as a direct reply to the requesting control socket,
 * never broadcast.
 *
 * Session length is "pair once per server boot," not "pair once per
 * connection" — re-pairing on every reconnect would be classroom-hostile
 * (the iPad sleeps/reconnects constantly through a school day). The token
 * is valid until explicitly unpaired or the server restarts (both of which
 * regenerate the pairing code, so a stale code from before a restart can
 * never be reused). See the design doc's explicit call-out that this is a
 * "keep a stranger from casually taking over the display" boundary for a
 * single classroom on school Wi-Fi, not a hardened multi-tenant auth system.
 */
export type SyncRole = 'control' | 'display'

/** /control -> server, submitting the code shown on /display. */
export interface SyncPairMessage {
  type: 'pair'
  code: string
}

/** /control -> server, revoking the current pairing (see requirement 4:
 * a way to recover if the iPad is lost or swapped). */
export interface SyncUnpairMessage {
  type: 'unpair'
  token: string
}

/** /control -> server. `payload` is untrusted and unsanitized on the wire —
 * the server always re-derives a safe payload from it before storing or
 * broadcasting, never forwards it verbatim. `token` must match the current
 * paired token or the server silently drops the action (requirement 2). */
export interface SyncActionMessage {
  type: 'action'
  channel: SyncChannel
  token: string
  payload: unknown
}

/** Sent once, right after a connection opens, with the server's full current
 * (already-safe) canonical state. Identical for both roles — canonical
 * state itself is already display-safe, so there's nothing role-sensitive
 * in it (pairing/token info travels on separate message types instead). */
export interface SyncHelloMessage {
  type: 'hello'
  state: SyncCanonicalState
}

/** server -> all clients, broadcast whenever canonical state changes. */
export interface SyncStateMessage {
  type: 'state'
  channel: SyncChannel
  payload: unknown
}

/** server -> display-role sockets only. `code` is null once paired (display
 * hides its pairing badge); non-null (and freshly regenerated) whenever
 * unpaired, including right after an unpair/reset. */
export interface SyncPairingStatusMessage {
  type: 'pairingStatus'
  code: string | null
}

/** server -> the one control socket that sent the `pair` message. */
export interface SyncPairedMessage {
  type: 'paired'
  token: string
}

/** server -> the one control socket that sent an invalid `pair` code. */
export interface SyncPairErrorMessage {
  type: 'pairError'
  message: string
}

/** server -> a control socket whose action/token was rejected, so the UI
 * can drop its stale token and show the pairing prompt again instead of
 * silently doing nothing forever. */
export interface SyncActionRejectedMessage {
  type: 'actionRejected'
  reason: string
}

/** server -> the one control socket that successfully unpaired. */
export interface SyncUnpairedMessage {
  type: 'unpaired'
}

export type SyncServerMessage =
  | SyncHelloMessage
  | SyncStateMessage
  | SyncPairingStatusMessage
  | SyncPairedMessage
  | SyncPairErrorMessage
  | SyncActionRejectedMessage
  | SyncUnpairedMessage

export type SyncClientMessage = SyncActionMessage | SyncPairMessage | SyncUnpairMessage

export function defaultCanonicalState(): SyncCanonicalState {
  return {
    composer: { blanked: false, screenId: null, screen: null },
    randomNumber: null,
  }
}
