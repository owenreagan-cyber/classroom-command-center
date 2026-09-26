import { DEFAULT_ENGINE_CONFIG, DEFAULT_VOICE_PROTOCOL, RMS_FLOOR } from './constants'
import { TOWER_ORDER, createEmptyMissionStats } from './types'
import type {
  EngineConfig,
  EngineEvent,
  EngineTickResult,
  GameStatus,
  MissionReport,
  MissionStats,
  TimedEngineState,
  TowerId,
  TowerState,
  VoiceProtocol,
} from './types'

// ─────────────────────────────────────────────────────────────────────────
// Construction / reset
// ─────────────────────────────────────────────────────────────────────────

export function createTowers(maxHp: number): TowerState[] {
  return TOWER_ORDER.map((id) => ({ id, hp: maxHp, maxHp }))
}

export function createInitialEngineState(
  config: EngineConfig = DEFAULT_ENGINE_CONFIG,
): TimedEngineState {
  return {
    status: 'idle',
    config,
    towers: createTowers(config.maxTowerHp),
    baselineDb: null,
    protocol: DEFAULT_VOICE_PROTOCOL,
    pressure: 0,
    aboveThresholdSeconds: 0,
    quietSeconds: 0,
    recovering: false,
    warningArmed: false,
    lastRms: 0,
    lastDb: rmsToDb(0),
    lastSampleAtMs: null,
    calmMode: false,
    calibrationSamplesDb: [],
    preJamStatus: null,
    jamReason: null,
    jammedAtMs: null,
    missionStats: createEmptyMissionStats(),
  }
}

/**
 * Full reset (§5.5 — what Mission Complete implies, and what a manual "Reset"
 * button does mid-period): towers back to full HP, pressure/dwell/grace
 * timers cleared, protocol back to its default (protocol is NOT carried into
 * the next session, per §5.5), mission stats cleared, status back to `idle`.
 * The calibrated baseline and Calm Mode preference are intentionally
 * preserved — a reset mid-period shouldn't force a recalibration, and Calm
 * Mode is a standing teacher preference, not per-mission state.
 */
export function reset(state: TimedEngineState): TimedEngineState {
  return {
    ...state,
    status: 'idle',
    towers: createTowers(state.config.maxTowerHp),
    protocol: DEFAULT_VOICE_PROTOCOL,
    pressure: 0,
    aboveThresholdSeconds: 0,
    quietSeconds: 0,
    recovering: false,
    warningArmed: false,
    lastSampleAtMs: null,
    preJamStatus: null,
    jamReason: null,
    jammedAtMs: null,
    missionStats: createEmptyMissionStats(),
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Session status transitions
// ─────────────────────────────────────────────────────────────────────────

/** Starts (or resumes into) a running mission. Requires a calibrated
 * baseline. Records the mission start time exactly once (a Start after a
 * Comms Jammer disengage, etc. never re-stamps it). */
export function start(state: TimedEngineState, nowMs: number): TimedEngineState {
  if (state.baselineDb === null) return state // must calibrate first
  const missionStats: MissionStats =
    state.missionStats.startedAtMs === null
      ? { ...state.missionStats, startedAtMs: nowMs }
      : state.missionStats
  return { ...state, status: 'running', lastSampleAtMs: null, missionStats }
}

/** Ends the mission (§5.4/§5.5). Emits `missionComplete`, tiered by the
 * confirmed §0b #5 rule: zero strikes this mission = "clean." Does not reset
 * towers/pressure itself — the caller (`resetGame`/UI) is expected to call
 * `reset()` next, matching the existing engine's `end()` + `reset()` split. */
export function end(state: TimedEngineState): EngineTickResult {
  const clean = state.missionStats.strikeCount === 0
  return {
    state: { ...state, status: 'ended', lastSampleAtMs: null },
    events: [{ type: 'missionComplete', clean }],
  }
}

/** Mic permission denied/unavailable — a distinct fault state from the
 * Comms Jammer (§3.7/§3.8). Freezes dwell/grace timers; never fabricates
 * data. Pressure and tower HP are left exactly as they were (no auto-strike,
 * no auto-heal while the mic is gone). */
export function setMicDenied(state: TimedEngineState): TimedEngineState {
  return {
    ...state,
    status: 'mic-denied',
    aboveThresholdSeconds: 0,
    quietSeconds: 0,
    recovering: false,
    lastSampleAtMs: null,
  }
}

/** Mic became available again after a `mic-denied` state — returns to
 * `idle` (never auto-resumes into `running`; the teacher/gesture flow
 * re-starts it explicitly). */
export function clearMicDenied(state: TimedEngineState): TimedEngineState {
  if (state.status !== 'mic-denied') return state
  return { ...state, status: 'idle' }
}

export function setCalmMode(state: TimedEngineState, calmMode: boolean): TimedEngineState {
  return { ...state, calmMode }
}

/** Voice protocol switch (§3.4) — instant, no recalibration needed, allowed
 * regardless of `status` (running, jammed, or regrouping). */
export function setProtocol(state: TimedEngineState, protocol: VoiceProtocol): EngineTickResult {
  if (protocol === state.protocol) return { state, events: [] }
  return { state: { ...state, protocol }, events: [{ type: 'protocolChanged', protocol }] }
}

// ─────────────────────────────────────────────────────────────────────────
// Comms Jammer (§3.7) — pauses audio analysis only; nothing else resets.
//
// Decision #2 (towers must never take damage the class can't see): the same
// mechanism now has two distinct origins, tracked via `jamReason` --
// `'manual'` (the teacher's own hand, e.g. `/control`'s toggle or a fire
// drill) and `'auto'` (this engine itself, the instant a HUD-hiding
// `/display` screen is shown while a session is running/regrouping). Only
// an auto-engaged jam is ever auto-disengaged; a manual jam always requires
// the teacher's own `disengageJammer` call, no matter what the screen does
// in the meantime. `jamReason` can also change mid-pause without ever
// clearing `jammed` status -- see `engageJammer`'s upgrade path and
// `disengageJammer`'s hidden-screen conversion, below.
// ─────────────────────────────────────────────────────────────────────────

/** Closes out the current jam sub-span (`jammedAtMs` -> `nowMs`) into
 * `missionStats`, attributed by the jam's CURRENT `jamReason` before it
 * changes. Used by every place a jam's reason changes or ends --
 * `engageJammer`'s auto->manual upgrade, `disengageJammer`'s manual->auto
 * conversion, and both disengage paths' final clear -- so a jam that
 * switches reason mid-pause still apportions "Jammed time" vs. "Paused —
 * screen hidden" by sub-span, not by whichever reason it happens to end on. */
function closeJamSpan(state: TimedEngineState, nowMs: number): MissionStats {
  const elapsedSeconds = state.jammedAtMs === null ? 0 : Math.max(0, (nowMs - state.jammedAtMs) / 1000)
  return {
    ...state.missionStats,
    jammedSeconds: state.missionStats.jammedSeconds + elapsedSeconds,
    autoJammedSeconds:
      state.missionStats.autoJammedSeconds + (state.jamReason === 'auto' ? elapsedSeconds : 0),
  }
}

export function engageJammer(
  state: TimedEngineState,
  nowMs: number,
  reason: 'auto' | 'manual' = 'manual',
): EngineTickResult {
  if (state.status === 'jammed') {
    // The teacher's own manual Jammer click while an auto-jam is already in
    // effect (in-room-test brief, point 1) must not be silently swallowed --
    // it takes over as a durable manual hold that survives the screen
    // becoming eligible again (only the teacher's own Disengage ever clears
    // a manual jam; hudGate's auto-resume never touches a manual one). An
    // auto-engage arriving over an existing jam of either reason stays a
    // no-op -- only the teacher's own hand ever upgrades a jam's reason.
    if (reason === 'manual' && state.jamReason === 'auto') {
      return {
        state: {
          ...state,
          jamReason: 'manual',
          jammedAtMs: nowMs,
          missionStats: closeJamSpan(state, nowMs),
        },
        events: [{ type: 'jammerReasonChanged', jamReason: 'manual' }],
      }
    }
    return { state, events: [] }
  }
  if (state.status !== 'running' && state.status !== 'regroup') return { state, events: [] }
  return {
    state: {
      ...state,
      status: 'jammed',
      preJamStatus: state.status,
      jamReason: reason,
      jammedAtMs: nowMs,
      lastSampleAtMs: null,
    },
    events: [{ type: 'jammerEngaged', manual: reason === 'manual' }],
  }
}

/** Auto-engage (decision #2): identical mechanism to `engageJammer`, called
 * by the `/display` wiring the instant the currently-shown screen would hide
 * the HUD (opt-in off, or Assessment Mode) while a session is
 * running/regrouping -- never by the teacher's own hand. A no-op (same as
 * `engageJammer`) unless a session is actually running/regrouping, so this
 * can never engage a jammer -- auto or otherwise -- while idle/ended/
 * mic-denied/already-jammed. */
export function autoEngageJammer(state: TimedEngineState, nowMs: number): EngineTickResult {
  return engageJammer(state, nowMs, 'auto')
}

function disengageJammerInternal(state: TimedEngineState, nowMs: number, manual: boolean): EngineTickResult {
  return {
    state: {
      ...state,
      status: state.preJamStatus ?? 'running',
      preJamStatus: null,
      jamReason: null,
      jammedAtMs: null,
      lastSampleAtMs: null,
      missionStats: closeJamSpan(state, nowMs),
    },
    events: [{ type: 'jammerDisengaged', manual }],
  }
}

/** The teacher's own explicit disengage (the `/control` toggle).
 *
 * `hudAllowedOnThisScreen` is the same HUD-eligibility value hudGate
 * computes for the screen currently on stage (in-room-test brief, point 2)
 * -- resuming into `running`/`regroup` while the screen is still hiding the
 * HUD would violate "towers must never take damage the class can't see"
 * the instant analysis resumed, so this only ever fully clears while the
 * screen would actually show the HUD. While the screen is still hidden:
 *   - `jamReason === 'manual'`: releases the teacher's own hold but does
 *     NOT resume -- converts to `'auto'` so the existing auto-resume
 *     mechanism (`autoDisengageJammer`/`decideScreenJamAction`) takes over
 *     the instant an eligible screen is shown, rather than silently
 *     resuming somewhere nobody can see it or requiring the teacher to
 *     remember to disengage again later.
 *   - `jamReason === 'auto'`: nothing to release -- already an auto jam,
 *     already correctly waiting on the screen. A total no-op; `/control`
 *     disables the Disengage button in this state (see
 *     `NoiseDefenseControlPanel`), and the engine refuses it too either way.
 * While the screen IS HUD-allowed, this always clears fully regardless of
 * `jamReason` -- the teacher's own Disengage remains the only way to clear
 * a manual jam.
 */
export function disengageJammer(
  state: TimedEngineState,
  nowMs: number,
  hudAllowedOnThisScreen: boolean,
): EngineTickResult {
  if (state.status !== 'jammed') return { state, events: [] }
  if (!hudAllowedOnThisScreen) {
    if (state.jamReason === 'auto') return { state, events: [] }
    return {
      state: {
        ...state,
        jamReason: 'auto',
        jammedAtMs: nowMs,
        missionStats: closeJamSpan(state, nowMs),
      },
      events: [{ type: 'jammerReasonChanged', jamReason: 'auto' }],
    }
  }
  return disengageJammerInternal(state, nowMs, true)
}

/** Auto-resume (decision #2): only disengages a jam this same auto-jam
 * mechanism engaged (`jamReason === 'auto'`) -- a no-op, preserving
 * everything exactly as-is, if the engine isn't jammed at all, or if it's
 * jammed for a teacher's own manual reason (a fire drill, etc. must stay
 * jammed until the teacher clears it themselves, no matter what the
 * `/display` screen does). Never starts the mic itself -- it only ever
 * flips `status` back to `preJamStatus` ('running' or 'regroup'), and the
 * mic-enable wiring reacts to that status exactly as it already does for a
 * manual disengage. */
export function autoDisengageJammer(state: TimedEngineState, nowMs: number): EngineTickResult {
  if (state.status !== 'jammed' || state.jamReason !== 'auto') return { state, events: [] }
  return disengageJammerInternal(state, nowMs, false)
}

// ─────────────────────────────────────────────────────────────────────────
// Calibration (§2.3)
// ─────────────────────────────────────────────────────────────────────────

export function beginCalibration(state: TimedEngineState): TimedEngineState {
  return { ...state, status: 'calibrating', calibrationSamplesDb: [] }
}

export function ingestCalibrationSample(
  state: TimedEngineState,
  rms: number,
): TimedEngineState {
  if (state.status !== 'calibrating') return state
  const db = rmsToDb(rms)
  return {
    ...state,
    lastRms: rms,
    lastDb: db,
    calibrationSamplesDb: [...state.calibrationSamplesDb, db],
  }
}

/** Averages the collected calibration window into a baseline and returns to
 * `idle`, ready for Start. No-ops (returns state unchanged, no event) if no
 * samples were collected. */
export function finishCalibration(state: TimedEngineState): EngineTickResult {
  if (state.calibrationSamplesDb.length === 0) {
    return { state: { ...state, status: 'idle' }, events: [] }
  }
  const mean =
    state.calibrationSamplesDb.reduce((sum, db) => sum + db, 0) /
    state.calibrationSamplesDb.length
  return {
    state: { ...state, status: 'idle', baselineDb: mean, calibrationSamplesDb: [] },
    events: [{ type: 'calibrationComplete' }],
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Level math
// ─────────────────────────────────────────────────────────────────────────

/** RMS (0..1) -> a dBFS-ish level. Floored so silence never yields -Infinity. */
export function rmsToDb(rms: number): number {
  return 20 * Math.log10(Math.max(rms, RMS_FLOOR))
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ─────────────────────────────────────────────────────────────────────────
// Tower targeting — active tower is always the front-most tower with hp > 0
// (§3.5). Pressure/strikes/recovery all target this single pointer.
// ─────────────────────────────────────────────────────────────────────────

function frontMostIntactIndex(towers: TowerState[]): number {
  return towers.findIndex((t) => t.hp > 0)
}

/** Applies `amount` HP of damage to one tower. Emits `towerFallen` iff the
 * tower was alive and this brought it to exactly 0 (never re-fires for an
 * already-fallen tower). */
function damageTower(
  towers: TowerState[],
  index: number,
  amount: number,
  manual: boolean,
): { towers: TowerState[]; events: EngineEvent[] } {
  if (index < 0 || amount <= 0) return { towers, events: [] }
  const events: EngineEvent[] = []
  const next = towers.map((t) => ({ ...t }))
  const target = next[index]
  const wasAlive = target.hp > 0
  target.hp = clamp(target.hp - amount, 0, target.maxHp)
  if (wasAlive && target.hp === 0) {
    events.push({ type: 'towerFallen', towerId: target.id, manual })
  }
  return { towers: next, events }
}

/** Heals one tower by `amount` HP, capped at `maxHp` (§3.3/§3.6). Emits
 * `towerRepaired` iff the tower was below max and this changed its HP. */
function healTower(
  towers: TowerState[],
  index: number,
  amount: number,
  manual: boolean,
): { towers: TowerState[]; events: EngineEvent[] } {
  if (index < 0 || amount <= 0) return { towers, events: [] }
  const events: EngineEvent[] = []
  const next = towers.map((t) => ({ ...t }))
  const target = next[index]
  const wasBelowMax = target.hp < target.maxHp
  target.hp = clamp(target.hp + amount, 0, target.maxHp)
  if (wasBelowMax && target.hp !== towers[index].hp) {
    events.push({ type: 'towerRepaired', towerId: target.id, hp: target.hp, maxHp: target.maxHp, manual })
  }
  return { towers: next, events }
}

/** If the engine was in Regroup and this change restored an active tower,
 * clears it back to `running` and emits `regroupCleared` (§3.5). */
function maybeClearRegroup(
  status: GameStatus,
  towers: TowerState[],
): { status: GameStatus; events: EngineEvent[] } {
  if (status === 'regroup' && frontMostIntactIndex(towers) >= 0) {
    return { status: 'running', events: [{ type: 'regroupCleared' }] }
  }
  return { status, events: [] }
}

function applyEventsToMissionStats(missionStats: MissionStats, events: EngineEvent[]): MissionStats {
  let next = missionStats
  for (const ev of events) {
    if (ev.type === 'strike') next = { ...next, strikeCount: next.strikeCount + 1 }
    else if (ev.type === 'towerFallen') next = { ...next, towerFallCount: next.towerFallCount + 1 }
    else if (ev.type === 'recoveryComplete') next = { ...next, recoveryCompleteCount: next.recoveryCompleteCount + 1 }
  }
  return next
}

function accumulateProtocolTime(
  missionStats: MissionStats,
  protocol: VoiceProtocol,
  dtSeconds: number,
): MissionStats {
  if (dtSeconds <= 0) return missionStats
  return {
    ...missionStats,
    protocolSeconds: {
      ...missionStats.protocolSeconds,
      [protocol]: missionStats.protocolSeconds[protocol] + dtSeconds,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Teacher manual overrides (§3.6) — always allowed, independent of `status`,
// independent of the Comms Jammer, independent of what the mic is reading.
// ─────────────────────────────────────────────────────────────────────────

/** Manual Break: one strike's worth of damage (`config.strikeDamage`) to a
 * specific tower, or the active tower with no id given. If this fells it,
 * decay applies exactly as if the mic had done it (crumble, advance, and —
 * if it was the last tower standing — enter Regroup). */
export function applyManualBreak(state: TimedEngineState, towerId?: TowerId): EngineTickResult {
  const index = towerId
    ? state.towers.findIndex((t) => t.id === towerId)
    : frontMostIntactIndex(state.towers)
  if (index < 0) return { state, events: [] }

  const target = state.towers[index]
  const { towers, events: fallEvents } = damageTower(state.towers, index, state.config.strikeDamage, true)
  const events: EngineEvent[] = [
    { type: 'strike', towerId: target.id, hp: towers[index].hp, maxHp: target.maxHp, manual: true },
    ...fallEvents,
  ]

  let status = state.status
  if (frontMostIntactIndex(towers) < 0 && (status === 'running' || status === 'regroup')) {
    if (status !== 'regroup') events.push({ type: 'regroupEntered' })
    status = 'regroup'
  }

  const missionStats = applyEventsToMissionStats(state.missionStats, events)
  return { state: { ...state, towers, status, missionStats }, events }
}

/** Manual Repair: fully restores one tower to 100% HP in one action — the
 * active tower with no id given, or any tower (fallen or not) by explicit
 * id, which is the only way to target a *fallen* tower directly (§3.6). If
 * this revives the front-most tower, clears Regroup. */
export function applyManualRepair(state: TimedEngineState, towerId?: TowerId): EngineTickResult {
  const index = towerId
    ? state.towers.findIndex((t) => t.id === towerId)
    : frontMostIntactIndex(state.towers)
  if (index < 0) return { state, events: [] }

  const target = state.towers[index]
  const { towers, events: healEvents } = healTower(state.towers, index, target.maxHp, true)
  const clear = maybeClearRegroup(state.status, towers)
  const events = [...healEvents, ...clear.events]
  const missionStats = applyEventsToMissionStats(state.missionStats, events)
  return { state: { ...state, towers, status: clear.status, missionStats }, events }
}

/** Restore All (§0b #1/§3.6): a single one-tap action, distinct from
 * per-tower Manual Repair, that heals every tower to full HP and clears
 * Regroup immediately, regardless of which towers were down. */
export function applyRestoreAll(state: TimedEngineState): EngineTickResult {
  const anyBelowMax = state.towers.some((t) => t.hp < t.maxHp)
  const towers = state.towers.map((t) => ({ ...t, hp: t.maxHp }))
  const events: EngineEvent[] = []
  if (anyBelowMax) events.push({ type: 'allTowersRestored', manual: true })
  const clear = maybeClearRegroup(state.status, towers)
  events.push(...clear.events)
  const missionStats = applyEventsToMissionStats(state.missionStats, events)
  return { state: { ...state, towers, status: clear.status, missionStats }, events }
}

// ─────────────────────────────────────────────────────────────────────────
// The mic-driven game tick (§2.4, §3.1-3.3)
// ─────────────────────────────────────────────────────────────────────────

const MAX_DT_SECONDS = 2 // guards against a huge dt after a tab was backgrounded

/**
 * Feeds one raw RMS sample (0..1) into the engine at time `nowMs`. A no-op
 * (returns state unchanged, no events) unless `status` is `running` or
 * `regroup` — mic-denied/jammed/idle/calibrating/ended states never
 * accumulate pressure, never move a dwell/grace timer, and never fabricate a
 * strike or heal.
 *
 * While `regroup`, only bookkeeping (`lastRms`/`lastDb`/mission-clock
 * protocol-seconds) updates — pressure, the dwell/grace timers, and warning
 * arm state are all frozen exactly where they were the instant the last
 * tower fell (§3.5: "further loud stretches don't fill a meter with nothing
 * to hit"), since there is no active tower to target.
 */
export function ingestSample(
  state: TimedEngineState,
  rms: number,
  nowMs: number,
): EngineTickResult {
  if (state.status !== 'running' && state.status !== 'regroup') {
    return { state, events: [] }
  }
  if (state.baselineDb === null) {
    return { state, events: [] }
  }

  const dtSeconds =
    state.lastSampleAtMs === null
      ? 0
      : clamp((nowMs - state.lastSampleAtMs) / 1000, 0, MAX_DT_SECONDS)

  const db = rmsToDb(rms)
  const relativeDb = db - state.baselineDb
  const config = state.config

  const events: EngineEvent[] = []
  let towers = state.towers
  let pressure = state.pressure
  let recovering = state.recovering
  let warningArmed = state.warningArmed
  let aboveThresholdSeconds = state.aboveThresholdSeconds
  let quietSeconds = state.quietSeconds
  let status: GameStatus = state.status

  if (status === 'running') {
    const thresholdDb = config.protocolThresholdOffsetDb[state.protocol]
    const recoveryThresholdDb = Math.max(0, thresholdDb - config.recoveryMarginDb)
    const aboveThreshold = relativeDb >= thresholdDb
    const atOrBelowRecovery = relativeDb <= recoveryThresholdDb

    aboveThresholdSeconds = aboveThreshold ? aboveThresholdSeconds + dtSeconds : 0
    quietSeconds = atOrBelowRecovery ? quietSeconds + dtSeconds : 0

    const activeIndex = frontMostIntactIndex(towers)

    // ── Pressure fill/decay (§3.2) ──
    const dwellSatisfied = aboveThresholdSeconds >= config.pressureDwellSeconds
    if (aboveThreshold && dwellSatisfied && dtSeconds > 0) {
      const excessDb = Math.max(0, relativeDb - thresholdDb)
      pressure = clamp(
        pressure + (excessDb * dtSeconds) / config.pressureAttackTauSeconds,
        0,
        100,
      )
    } else if (!aboveThreshold && dtSeconds > 0) {
      pressure = pressure * Math.exp(-dtSeconds / config.pressureDecayTauSeconds)
    }
    // else: above threshold but dwell not yet satisfied -- pressure holds,
    // neither rises nor decays (§2.4's anti-transient guard).

    // ── Warning (one-shot, re-arm below `warningRearmPct`) ──
    if (!warningArmed && pressure >= config.warningThresholdPct) {
      warningArmed = true
      events.push({ type: 'warning' })
    } else if (warningArmed && pressure < config.warningRearmPct) {
      warningArmed = false
    }

    // ── Strike: pressure caps out -> one bounded hit, then reset to 0 ──
    if (pressure >= 100 && activeIndex >= 0) {
      const target = towers[activeIndex]
      const result = damageTower(towers, activeIndex, config.strikeDamage, false)
      towers = result.towers
      pressure = 0
      warningArmed = false
      events.push({
        type: 'strike',
        towerId: target.id,
        hp: towers[activeIndex].hp,
        maxHp: target.maxHp,
        manual: false,
      })
      events.push(...result.events)
    }

    // ── Recovery (§3.3) — distinct from pressure decay ──
    const graceSatisfied = quietSeconds >= config.recoveryGraceSeconds
    const healIndex = frontMostIntactIndex(towers)
    if (graceSatisfied && healIndex >= 0) {
      if (!recovering) {
        recovering = true
        events.push({ type: 'recoveryBegan', towerId: towers[healIndex].id })
      }
      if (dtSeconds > 0) {
        const result = healTower(towers, healIndex, config.healPerSecond * dtSeconds, false)
        towers = result.towers
        for (const ev of result.events) {
          if (ev.type === 'towerRepaired') events.push({ type: 'recoveryComplete', towerId: ev.towerId })
        }
      }
    } else {
      recovering = false
    }

    // ── Decay -> Regroup (§3.5) ──
    if (frontMostIntactIndex(towers) < 0) {
      status = 'regroup'
      events.push({ type: 'regroupEntered' })
    }
  }
  // else status === 'regroup': everything above stays frozen; only the
  // bookkeeping below (lastRms/lastDb/mission-clock) still updates.

  const missionStats = applyEventsToMissionStats(
    accumulateProtocolTime(state.missionStats, state.protocol, dtSeconds),
    events,
  )

  return {
    state: {
      ...state,
      towers,
      pressure,
      aboveThresholdSeconds,
      quietSeconds,
      recovering,
      warningArmed,
      status,
      lastRms: rms,
      lastDb: db,
      lastSampleAtMs: nowMs,
      missionStats,
    },
    events,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Mission report (§5.4) — class-level only, no per-student data anywhere.
// ─────────────────────────────────────────────────────────────────────────

export function buildMissionReport(state: TimedEngineState, nowMs: number): MissionReport {
  const towerCondition = {} as MissionReport['towerCondition']
  for (const t of state.towers) {
    towerCondition[t.id] = t.hp <= 0 ? 'fallen' : t.hp >= t.maxHp ? 'intact' : 'damaged'
  }
  const startedAtMs = state.missionStats.startedAtMs
  const rawDurationSeconds = startedAtMs === null ? 0 : Math.max(0, (nowMs - startedAtMs) / 1000)
  return {
    durationSeconds: Math.max(0, rawDurationSeconds - state.missionStats.jammedSeconds),
    towerCondition,
    strikeCount: state.missionStats.strikeCount,
    towerFallCount: state.missionStats.towerFallCount,
    recoveryCompleteCount: state.missionStats.recoveryCompleteCount,
    protocolSeconds: state.missionStats.protocolSeconds,
    jammedSeconds: state.missionStats.jammedSeconds,
    autoJammedSeconds: state.missionStats.autoJammedSeconds,
    clean: state.missionStats.strikeCount === 0,
  }
}
