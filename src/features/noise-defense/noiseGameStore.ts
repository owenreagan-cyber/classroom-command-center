import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_ENGINE_CONFIG } from './constants'
import * as engine from './engine'
import type { DisplayModeId } from '../clean-board/types'
import type { MissionReport, TowerId, TimedEngineState, VoiceProtocol } from './types'
import type { MicFailureReason } from './micEngine'

/**
 * Hero Academy Defense System — single-machine/localhost-only game state.
 * `/display` (which has the microphone) is the sole writer of mic-driven
 * ticks; `/control` calls the same session/manual-override actions but never
 * runs the mic itself. Cross-tab sync mirrors `qrCastStore.ts`/
 * `stampStore.ts`'s existing pattern exactly: `persist` to localStorage + a
 * `storage` event listener applies remote writes locally. This is
 * intentionally the *existing* local-first, same-origin pattern — no new
 * architecture, no sync-server dependency.
 */

export const NOISE_GAME_STORAGE_KEY = 'classroom-command-center-noise-defense'

interface NoiseGameState {
  engine: TimedEngineState
  micFailureReason: MicFailureReason | null
  /** Stage 0 — per-screen HUD opt-in (default OFF everywhere). Keyed by
   * `DisplayModeId`; Assessment Mode's entry is structurally ignored
   * regardless of this map's contents — see `hudGate.ts`. */
  hudOptIn: Partial<Record<DisplayModeId, boolean>>
  /** The most recently generated mission report (End Mission), or null
   * before any mission has ended this session. Class-level-only (§5.4). */
  lastMissionReport: MissionReport | null
}

interface NoiseGameStore extends NoiseGameState {
  start: () => void
  endGame: () => void
  resetGame: () => void
  beginCalibration: () => void
  finishCalibration: () => void
  /** The mic engine's single feed point — dispatches to calibration-sample
   * capture or the running/regroup pressure engine depending on current
   * status; a silent no-op in every other status (§3.5/§3.8 — never
   * fabricate ticks). */
  ingestSample: (rms: number, atMs: number) => void
  setMicDenied: (reason: MicFailureReason) => void
  clearMicDenied: () => void
  setCalmMode: (calmMode: boolean) => void
  setProtocol: (protocol: VoiceProtocol) => void
  engageJammer: () => void
  /** `hudAllowedOnThisScreen`: whether the screen currently on stage would
   * actually show the HUD (`isNoiseHudAllowed` for the active
   * `displayModeId` + this session's `hudOptIn`) -- required so the engine
   * itself (not just `/control`'s UI) refuses to resume into a state the
   * class can't see. See `engine.ts`'s `disengageJammer` doc comment. */
  disengageJammer: (hudAllowedOnThisScreen: boolean) => void
  /** Decision #2 — auto-engage/auto-disengage, driven by the `/display`
   * screen-eligibility watcher (see `hudGate.ts`'s `decideScreenJamAction`
   * and `NoiseDefenseHUD.tsx`'s effect that calls it). Never called by any
   * teacher-facing control -- `/control`'s Jammer toggle only ever calls
   * `engageJammer`/`disengageJammer` above. */
  autoEngageJammer: () => void
  autoDisengageJammer: () => void
  manualBreak: (towerId?: TowerId) => void
  manualRepair: (towerId?: TowerId) => void
  restoreAll: () => void
  setHudOptIn: (displayModeId: DisplayModeId, allowed: boolean) => void
}

const initialState: NoiseGameState = {
  engine: engine.createInitialEngineState(DEFAULT_ENGINE_CONFIG),
  micFailureReason: null,
  hudOptIn: {},
  lastMissionReport: null,
}

export const useNoiseGameStore = create<NoiseGameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      start: () => set({ engine: engine.start(get().engine, Date.now()) }),
      endGame: () => {
        const { state, events } = engine.end(get().engine)
        const missionCompleteEvent = events.find((e) => e.type === 'missionComplete')
        const report = engine.buildMissionReport(state, Date.now())
        set({
          engine: state,
          lastMissionReport: missionCompleteEvent ? report : get().lastMissionReport,
        })
      },
      resetGame: () => set({ engine: engine.reset(get().engine) }),

      beginCalibration: () => set({ engine: engine.beginCalibration(get().engine) }),
      finishCalibration: () => {
        const { state } = engine.finishCalibration(get().engine)
        set({ engine: state })
      },

      ingestSample: (rms, atMs) => {
        const current = get().engine
        if (current.status === 'calibrating') {
          set({ engine: engine.ingestCalibrationSample(current, rms) })
          return
        }
        if (current.status === 'running' || current.status === 'regroup') {
          const { state } = engine.ingestSample(current, rms, atMs)
          set({ engine: state })
        }
        // Any other status: intentionally a no-op.
      },

      setMicDenied: (reason) =>
        set({ engine: engine.setMicDenied(get().engine), micFailureReason: reason }),
      clearMicDenied: () =>
        set({ engine: engine.clearMicDenied(get().engine), micFailureReason: null }),

      setCalmMode: (calmMode) => set({ engine: engine.setCalmMode(get().engine, calmMode) }),

      setProtocol: (protocol) => {
        const { state } = engine.setProtocol(get().engine, protocol)
        set({ engine: state })
      },
      engageJammer: () => {
        const { state } = engine.engageJammer(get().engine, Date.now())
        set({ engine: state })
      },
      disengageJammer: (hudAllowedOnThisScreen) => {
        const { state } = engine.disengageJammer(get().engine, Date.now(), hudAllowedOnThisScreen)
        set({ engine: state })
      },
      autoEngageJammer: () => {
        const { state } = engine.autoEngageJammer(get().engine, Date.now())
        set({ engine: state })
      },
      autoDisengageJammer: () => {
        const { state } = engine.autoDisengageJammer(get().engine, Date.now())
        set({ engine: state })
      },

      manualBreak: (towerId) => {
        const { state } = engine.applyManualBreak(get().engine, towerId)
        set({ engine: state })
      },
      manualRepair: (towerId) => {
        const { state } = engine.applyManualRepair(get().engine, towerId)
        set({ engine: state })
      },
      restoreAll: () => {
        const { state } = engine.applyRestoreAll(get().engine)
        set({ engine: state })
      },

      setHudOptIn: (displayModeId, allowed) =>
        set({ hudOptIn: { ...get().hudOptIn, [displayModeId]: allowed } }),
    }),
    {
      name: NOISE_GAME_STORAGE_KEY,
      version: 2,
    },
  ),
)

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key !== NOISE_GAME_STORAGE_KEY || !event.newValue) return
    try {
      const parsed = JSON.parse(event.newValue) as { state?: Partial<NoiseGameState> }
      const restored = parsed.state ?? parsed
      useNoiseGameStore.setState(restored as Partial<NoiseGameState>)
    } catch {
      // ignore malformed storage
    }
  })
}
