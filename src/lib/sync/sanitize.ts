import { toDisplaySafeScreen } from '../../features/display-composer/displaySafe.ts'
import { toDisplaySafeRandomNumberSnapshot } from '../../features/random-number/displaySafe.ts'
import type { DisplayScreen } from '../../features/display-composer/types'
import type { ComposerWireScreen, ComposerWireState } from './protocol'

/**
 * Server-side re-sanitization. Runs on every incoming `composer`/`randomNumber`
 * action, regardless of what /control already filtered client-side — this is
 * the enforcement point the Stage 1 doc called for: "the safe/unsafe boundary
 * must be enforced by what the wire protocol carries, not by which function
 * the sender happened to call." A buggy or compromised /control client can
 * send anything; only what survives these functions ever gets stored in
 * canonical state or broadcast to /display.
 *
 * Reuses the app's real, already-tested filters (`toDisplaySafeScreen`,
 * `toDisplaySafeRandomNumberSnapshot`) rather than a second hand-rolled
 * allowlist, so there's one definition of "safe," not two that can drift.
 */

interface RawComposerActionPayload {
  blanked?: unknown
  screenId?: unknown
  screen?: unknown
}

export function sanitizeComposerAction(payload: unknown): ComposerWireState {
  const raw = (payload && typeof payload === 'object' ? payload : {}) as RawComposerActionPayload

  const blanked = raw.blanked === true

  // Treat whatever arrived as an untrusted DisplayScreen and run it back
  // through the real filter — toDisplaySafeScreen is written defensively
  // (fills safe defaults for missing fields) specifically so this is safe
  // to do even when the shape is incomplete or malformed. The honest
  // /control client never even includes `studentSafe` here (it only ever
  // sends the already-filtered DisplaySafeScreen, which omits that field —
  // it already gated on it before sending), so this defaults to true in
  // that normal case; a client sending an explicit `studentSafe: false`
  // (a crafted/malicious message, not something the real UI produces) is
  // still honored as a kill switch, not silently overridden.
  const candidate = raw.screen as (DisplayScreen & { studentSafe?: unknown }) | undefined
  const studentSafe = candidate?.studentSafe !== false
  const resafed = candidate ? toDisplaySafeScreen({ ...candidate, studentSafe }) : null

  const screenId = typeof raw.screenId === 'string' ? raw.screenId : null

  if (blanked || !resafed || !screenId) {
    return { blanked, screenId: blanked ? null : screenId, screen: null }
  }

  const screen: ComposerWireScreen = { ...resafed, studentSafe: true }
  return { blanked: false, screenId, screen }
}

interface RawRandomNumberActionPayload {
  value?: unknown
}

export function sanitizeRandomNumberAction(payload: unknown) {
  const raw = (payload && typeof payload === 'object' ? payload : {}) as RawRandomNumberActionPayload
  const value = typeof raw.value === 'number' ? raw.value : null
  return toDisplaySafeRandomNumberSnapshot(value, value !== null)
}
