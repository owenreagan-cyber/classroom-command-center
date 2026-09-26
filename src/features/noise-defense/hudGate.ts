import { getDisplayModeConfig } from '../clean-board/displayModes'
import type { DisplayModeId } from '../clean-board/types'
import type { GameStatus } from './types'

/**
 * Stage 0 — Noise HUD opt-in (noise-game design-doc "STAGE 0"). The HUD may
 * render only when ALL of these hold:
 *   1. A noise-monitoring session is actively running (checked by the
 *      caller — `NoiseDefenseHUD.tsx` — via the engine's own `status`).
 *   2. The current `/display` screen's mode is *eligible* at all — this is
 *      structural, not a default: `getDisplayModeConfig(id).noiseHudEligible`
 *      is typed to the literal `false` for Assessment Mode (see
 *      `clean-board/displayModes.ts`'s `DisplayModeConfig` discriminated
 *      union), so no per-screen toggle, bug, or copy-pasted config can ever
 *      flip it on there.
 *   3. A teacher's own per-screen opt-in is explicitly on (default OFF for
 *      every eligible screen too — see `noiseGameStore.ts`'s `hudOptIn` map).
 *
 * This function checks (2) and (3); the caller is responsible for (1).
 */
export function isNoiseHudAllowed(
  displayModeId: DisplayModeId,
  hudOptIn: Partial<Record<DisplayModeId, boolean>>,
): boolean {
  if (!getDisplayModeConfig(displayModeId).noiseHudEligible) return false
  return Boolean(hudOptIn[displayModeId])
}

/**
 * Decision #2 (towers must never take damage the class can't see) — the
 * pure "what should the Comms Jammer do right now" decision, factored out
 * of the `/display` wiring so it's unit-testable without a browser/React
 * renderer. Called every time either the engine's `status`/`jamReason` or
 * this screen's HUD-allowed-ness (`isNoiseHudAllowed` above) changes:
 *
 * - The currently-shown screen would hide the HUD (ineligible, or opted
 *   out) while a session is `running`/`regroup` -> **auto-engage**. This is
 *   the only path that can ever start a jam here — it reuses
 *   `engageJammer`'s own status guard (via `autoEngageJammer` in
 *   `engine.ts`), so it can never fire while idle/ended/mic-denied/already
 *   jammed.
 * - The currently-shown screen is HUD-allowed again, the engine is
 *   `jammed`, and that jam's `jamReason` is `'auto'` (never `'manual'`) ->
 *   **auto-disengage**. A manual jam (a fire drill, etc.) is never touched
 *   here — only the teacher's own explicit disengage clears it, no matter
 *   what the screen does in the meantime.
 * - Everything else -> **none**, including every case where no session is
 *   running at all (idle/ended/mic-denied/calibrating), so this can never
 *   be the thing that starts the mic with no session in progress.
 */
export type ScreenJamAction = 'autoEngage' | 'autoDisengage' | 'none'

export function decideScreenJamAction(
  status: GameStatus,
  jamReason: 'auto' | 'manual' | null,
  hudAllowedOnThisScreen: boolean,
): ScreenJamAction {
  if (!hudAllowedOnThisScreen && (status === 'running' || status === 'regroup')) {
    return 'autoEngage'
  }
  if (hudAllowedOnThisScreen && status === 'jammed' && jamReason === 'auto') {
    return 'autoDisengage'
  }
  return 'none'
}

/**
 * In-room-test fix (2026-09-26) — the pure "should /control show the
 * 'microphone isn't running on the display' warning" decision, factored out
 * so it's unit-testable without a browser/timer. `/control` supplies
 * `calibrationStartedAtMs` itself (the engine has no such field — it only
 * knows it's `'calibrating'`, not since when) and re-evaluates this on an
 * interval while calibrating; the moment a real sample arrives
 * (`calibrationSamplesCollected` becomes > 0), this flips back to `false` on
 * its own, no separate "clear" action needed.
 */
export function shouldShowMicSilentWarning(
  status: GameStatus,
  calibrationSamplesCollected: number,
  calibrationStartedAtMs: number | null,
  nowMs: number,
  thresholdMs: number,
): boolean {
  if (status !== 'calibrating') return false
  if (calibrationStartedAtMs === null) return false
  if (calibrationSamplesCollected > 0) return false
  return nowMs - calibrationStartedAtMs >= thresholdMs
}
