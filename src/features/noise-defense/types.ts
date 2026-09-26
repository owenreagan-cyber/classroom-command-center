/**
 * Hero Academy Defense System (`docs/architecture/noise-game-design.md`) —
 * pure types for the "Villain Pressure" mechanics revision (§0a/§3). Deliberately
 * independent of `src/lib/noiseTowers.ts` and `src/data/types.ts`'s
 * `NoiseTrackerState`/`VoiceLevel` — see the design doc's §1.2 recommendation
 * to build this as a new, separate feature area rather than extend the old
 * manual widget.
 */

/** Five towers spelling N-O-I-S-E, front (N) to back (E). */
export type TowerId = 'N' | 'O' | 'I' | 'S' | 'E'

export const TOWER_ORDER: readonly TowerId[] = ['N', 'O', 'I', 'S', 'E'] as const

export type TowerCondition = 'intact' | 'damaged' | 'fallen'

export interface TowerState {
  id: TowerId
  hp: number
  maxHp: number
}

/**
 * Voice protocol (design-doc §3.4) — replaces the old 4-band ladder and the
 * legacy manual voice-level widget's job, for this game only. Each protocol
 * sets the single active pressure-fill threshold as a dB offset above the
 * calibrated baseline.
 */
export type VoiceProtocol = 'stealth' | 'patrol' | 'combat'

export const VOICE_PROTOCOL_ORDER: readonly VoiceProtocol[] = ['stealth', 'patrol', 'combat'] as const

/**
 * `idle` — configured but not sampling/evaluating (before first Start, or
 *   after Reset/Mission Complete).
 * `calibrating` — collecting a quiet-baseline sample window.
 * `running` — mic sampling + pressure/HP evaluation live, at least one tower
 *   intact.
 * `regroup` — distinctly-named engine state (§0b #1/§3.5): every tower has
 *   fallen. Mic sampling can continue, but pressure is frozen at its current
 *   value (nothing to strike) until a teacher repairs at least one tower.
 * `jammed` — Comms Jammer engaged (§3.7): a pause of audio analysis only,
 *   either teacher-initiated or auto-engaged (decision #2 — a HUD-hidden
 *   `/display` screen while a session is running/regrouping). Pressure,
 *   active-tower HP, and protocol are frozen exactly as they were;
 *   `preJamStatus` records what to resume into ('running' or 'regroup') on
 *   disengage, and `jamReason` records *why* it's engaged (see below).
 * `mic-denied` — permission denied/unavailable; HP/pressure frozen, distinct
 *   from `jammed` so the on-screen banner is never ambiguous about which one
 *   it is.
 * `ended` — mission ended by the teacher; frozen, session considered over.
 */
export type GameStatus =
  | 'idle'
  | 'calibrating'
  | 'running'
  | 'regroup'
  | 'jammed'
  | 'mic-denied'
  | 'ended'

export interface EngineConfig {
  /** Full HP for every tower. */
  maxTowerHp: number
  /** Flat damage dealt to the active tower on a villain strike (§3.2). */
  strikeDamage: number
  /** Seconds of continuous above-threshold level required before pressure
   * starts accumulating at all — the primary anti-transient guard (§2.4/§3.2). */
  pressureDwellSeconds: number
  /** Time constant (seconds) for how fast pressure climbs once the dwell
   * guard clears, scaled by excess-above-threshold dB. Smaller = rises faster. */
  pressureAttackTauSeconds: number
  /** Time constant (seconds) for how fast pressure decays while at/below
   * threshold. Smaller = decays faster. */
  pressureDecayTauSeconds: number
  /** Pressure %, on the way up, that fires a one-shot Warning event. */
  warningThresholdPct: number
  /** Pressure must fall back below this % before Warning can re-arm. */
  warningRearmPct: number
  /** dB below the active protocol's threshold that defines the recovery
   * threshold (§3.3) — recovery requires being meaningfully quieter than
   * "not building pressure." */
  recoveryMarginDb: number
  /** Seconds the level must sit continuously at/below the recovery threshold
   * before healing begins. */
  recoveryGraceSeconds: number
  /** HP healed per second once the recovery grace period is satisfied. */
  healPerSecond: number
  /** Voice protocol -> dB offset above the calibrated baseline (§3.4). Named,
   * tunable constants — never inlined magic numbers. */
  protocolThresholdOffsetDb: Record<VoiceProtocol, number>
}

/** Class-level-only mission statistics (§5.4) — no per-student data anywhere. */
export interface MissionStats {
  strikeCount: number
  towerFallCount: number
  recoveryCompleteCount: number
  /** Seconds spent under each protocol while `running`/`regroup` (i.e. while
   * the mission clock is live, jammed time excluded). */
  protocolSeconds: Record<VoiceProtocol, number>
  /** Total seconds spent with the Comms Jammer engaged this mission, manual
   * and auto combined -- the Report tab's "Jammed time." */
  jammedSeconds: number
  /** Subset of `jammedSeconds` spent specifically auto-paused because the
   * `/display` screen was hiding the HUD -- the Report tab's separate
   * "Paused — screen hidden" row (in-room-test brief, point 3). A jam that
   * changes reason mid-pause (a teacher's Jammer click upgrading an auto
   * jam to manual, or a hidden-screen Disengage converting a manual jam to
   * auto) is apportioned by sub-span, not credited wholesale to whichever
   * reason it happens to end on -- see `closeJamSpan` in `engine.ts`. */
  autoJammedSeconds: number
  /** Wall-clock ms the current mission started, or null before the first Start. */
  startedAtMs: number | null
}

export function createEmptyMissionStats(): MissionStats {
  return {
    strikeCount: 0,
    towerFallCount: 0,
    recoveryCompleteCount: 0,
    protocolSeconds: { stealth: 0, patrol: 0, combat: 0 },
    jammedSeconds: 0,
    autoJammedSeconds: 0,
    startedAtMs: null,
  }
}

export interface TimedEngineState {
  status: GameStatus
  config: EngineConfig
  towers: TowerState[]
  /** Calibrated quiet-room baseline, in dBFS-ish units (20*log10(rms)).
   * `null` until a calibration has completed at least once. */
  baselineDb: number | null
  /** Active voice protocol — independent of `status` (§3.4): switchable while
   * running, jammed, or regrouping. */
  protocol: VoiceProtocol
  /** Villain Pressure meter, 0..100 (§3.2). */
  pressure: number
  /** Seconds the signal has been continuously at/above the active protocol's
   * threshold (the pressure dwell guard). */
  aboveThresholdSeconds: number
  /** Seconds the signal has been continuously at/below the recovery
   * threshold (the recovery grace guard) — independent of the dwell timer. */
  quietSeconds: number
  /** True from the instant the recovery grace period is first satisfied
   * until the level rises back above the recovery threshold — used only to
   * detect the recovery-began edge (fire once, not every tick). */
  recovering: boolean
  /** True once pressure has crossed `warningThresholdPct` on the way up;
   * re-armed only once pressure falls back under `warningRearmPct` (§3.2). */
  warningArmed: boolean
  /** Most recent raw RMS sample fed in (0..1), for the /control readout. */
  lastRms: number
  /** Most recent dB level derived from `lastRms` (unclamped). */
  lastDb: number
  /** Monotonic ms timestamp of the last processed sample; null before the
   * first sample of this run. Used to compute `dt` between ingests. */
  lastSampleAtMs: number | null
  /** Calm Mode: theatrics are muted on `/display`, but this flag lives on
   * the engine (not just the display layer) so tests and other consumers
   * can see it's an orthogonal concern from `status`. */
  calmMode: boolean
  /** Scratch accumulator used only while `status === 'calibrating'`. */
  calibrationSamplesDb: number[]
  /** What to resume into when the Comms Jammer disengages — only meaningful
   * while `status === 'jammed'`. */
  preJamStatus: 'running' | 'regroup' | null
  /**
   * Why the Comms Jammer is currently engaged — only meaningful while
   * `status === 'jammed'`, `null` otherwise (decision #2). `'manual'` means
   * the teacher engaged it themselves (e.g. a fire drill) via
   * `engageJammer`/the `/control` toggle — this must stay engaged until the
   * teacher explicitly disengages it, even if the `/display` screen changes
   * in the meantime. `'auto'` means this engine itself engaged it because
   * the currently-shown `/display` screen would have hidden the HUD while a
   * session was running/regrouping (towers must never take damage the class
   * can't see) — this is the only case `autoDisengageJammer` is allowed to
   * clear automatically once an eligible screen is shown again; it must
   * never clear a `'manual'` jam. See `engageJammer`/`autoEngageJammer`/
   * `autoDisengageJammer` in `engine.ts`.
   *
   * A jam's reason can also change mid-pause without ever clearing `jammed`
   * status, in either direction (in-room-test brief, points 1/2):
   *   - the teacher's own Jammer click while already auto-jammed upgrades
   *     `'auto'` -> `'manual'` (`engageJammer`) so it survives the screen
   *     becoming eligible again instead of being silently ignored;
   *   - the teacher's own Disengage while the screen is still hiding the
   *     HUD converts `'manual'` -> `'auto'` (`disengageJammer`) instead of
   *     resuming into a state the class can't see, handing it off to the
   *     existing auto-resume mechanism.
   */
  jamReason: 'auto' | 'manual' | null
  /** Wall-clock ms the jammer was engaged, for jammed-time accounting;
   * only meaningful while `status === 'jammed'`. */
  jammedAtMs: number | null
  /** Class-level-only mission stats (§5.4) — reset on `reset()`. */
  missionStats: MissionStats
}

export type EngineEvent =
  | { type: 'protocolChanged'; protocol: VoiceProtocol }
  | { type: 'warning' }
  | { type: 'strike'; towerId: TowerId; hp: number; maxHp: number; manual: boolean }
  | { type: 'towerFallen'; towerId: TowerId; manual: boolean }
  | { type: 'towerRepaired'; towerId: TowerId; hp: number; maxHp: number; manual: boolean }
  | { type: 'recoveryBegan'; towerId: TowerId }
  | { type: 'recoveryComplete'; towerId: TowerId }
  | { type: 'regroupEntered' }
  | { type: 'regroupCleared' }
  | { type: 'allTowersRestored'; manual: boolean }
  | { type: 'jammerEngaged'; manual: boolean }
  | { type: 'jammerDisengaged'; manual: boolean }
  | { type: 'jammerReasonChanged'; jamReason: 'auto' | 'manual' }
  | { type: 'calibrationComplete' }
  | { type: 'missionComplete'; clean: boolean }

export interface EngineTickResult {
  state: TimedEngineState
  events: EngineEvent[]
}

/** Class-level-only end-of-session mission report (§5.4). No per-student data. */
export interface MissionReport {
  durationSeconds: number
  towerCondition: Record<TowerId, TowerCondition>
  strikeCount: number
  towerFallCount: number
  recoveryCompleteCount: number
  protocolSeconds: Record<VoiceProtocol, number>
  jammedSeconds: number
  autoJammedSeconds: number
  clean: boolean
}
