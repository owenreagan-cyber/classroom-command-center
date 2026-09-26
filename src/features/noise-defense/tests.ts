import { DEFAULT_ENGINE_CONFIG, DEFAULT_VOICE_PROTOCOL } from './constants'
import {
  applyManualBreak,
  applyManualRepair,
  applyRestoreAll,
  autoDisengageJammer,
  autoEngageJammer,
  createInitialEngineState,
  disengageJammer,
  end,
  engageJammer,
  ingestSample,
  rmsToDb,
  setMicDenied,
  setProtocol,
  start,
} from './engine'
import { decideScreenJamAction } from './hudGate'
import type { TimedEngineState, VoiceProtocol } from './types'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

const config = DEFAULT_ENGINE_CONFIG

/** A running, calibrated engine state — baseline set directly rather than
 * through the calibration flow so tests can control it precisely. */
function runningState(baselineDb = -40): TimedEngineState {
  const idle = { ...createInitialEngineState(config), baselineDb }
  return start(idle, 0)
}

/** RMS value that lands `offsetDb` above the given baseline. */
function rmsAtOffset(baselineDb: number, offsetDb: number): number {
  return Math.pow(10, (baselineDb + offsetDb) / 20)
}

/** Feeds `count` samples `stepMs` apart, all at the given offset above
 * baseline, starting from time `fromMs`. Returns the final state and the
 * time after the last sample. */
function feedSustained(
  state: TimedEngineState,
  offsetDb: number,
  count: number,
  stepMs: number,
  fromMs: number,
): { state: TimedEngineState; atMs: number } {
  const rms = rmsAtOffset(state.baselineDb ?? -40, offsetDb)
  let t = fromMs
  let s = state
  for (let i = 0; i < count; i++) {
    ;({ state: s } = ingestSample(s, rms, t))
    t += stepMs
  }
  return { state: s, atMs: t }
}

// ─────────────────────────────────────────────────────────────────────────
// 1. A single clap-length transient (short, loud) does NOT trigger a strike.
// ─────────────────────────────────────────────────────────────────────────
function testTransientDoesNotStrike() {
  let state = runningState()
  const loudRms = rmsAtOffset(-40, 25) // well above Combat's +16 dB threshold
  const quietRms = rmsAtOffset(-40, 0)

  ;({ state } = ingestSample(state, loudRms, 0)) // establishes lastSampleAtMs, dt=0
  ;({ state } = ingestSample(state, loudRms, 400)) // 0.4s loud -- under the 2s dwell
  ;({ state } = ingestSample(state, quietRms, 800)) // back to quiet

  assert(state.pressure === 0, `pressure should still be 0 after a sub-dwell transient, got ${state.pressure}`)
  assert(state.aboveThresholdSeconds === 0, 'dwell timer should have reset once the transient ended')
  assert(state.towers[0].hp === state.towers[0].maxHp, 'no tower should have taken damage from a transient')
  console.log('  PASS: a clap-length transient does not trigger a strike')
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Sustained noise above threshold builds pressure to 100% and fires
//    exactly one strike, then resets.
// ─────────────────────────────────────────────────────────────────────────
function testSustainedNoiseFiresExactlyOneStrike() {
  let state = runningState()
  let sawStrike = 0
  const rms = rmsAtOffset(-40, 40) // far above threshold -- pressure fills fast

  let t = 0
  for (let i = 0; i < 40; i++) {
    const result = ingestSample(state, rms, t)
    state = result.state
    sawStrike += result.events.filter((e) => e.type === 'strike').length
    t += 250
    if (sawStrike > 0) break
  }

  assert(sawStrike === 1, `expected exactly one strike, got ${sawStrike}`)
  assert(state.pressure === 0, 'pressure must reset to 0 immediately after a strike')
  assert(
    state.towers[0].hp === state.towers[0].maxHp - config.strikeDamage,
    `front tower should have taken exactly one strike's damage, got hp=${state.towers[0].hp}`,
  )
  console.log('  PASS: sustained noise builds pressure to 100% and fires exactly one strike, then resets')
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Sustained quiet drains pressure, and -- once past the recovery grace
//    period -- heals the active tower.
// ─────────────────────────────────────────────────────────────────────────
function testQuietDrainsPressureAndEventuallyHeals() {
  let state = runningState()
  // Build some pressure first (short of a strike) so we can watch it drain.
  // Needs to clear the 2s dwell guard first (patrol's default protocol, well
  // over its +9dB threshold at +40dB) before any pressure accumulates at all.
  let t: number
  ;({ state, atMs: t } = feedSustained(state, 40, 16, 250, 0))
  assert(state.pressure > 0, 'setup: pressure should have risen from sustained loud samples')

  // Damage the tower directly so there is something to heal.
  ;({ state } = applyManualBreak(state))
  const hpAfterBreak = state.towers[0].hp
  assert(hpAfterBreak < state.towers[0].maxHp, 'setup: front tower should be damaged before testing recovery')

  const pressureBeforeQuiet = state.pressure
  const quietRms = rmsAtOffset(-40, 0) // at baseline -- well under Patrol's recovery threshold

  for (let i = 0; i < 4; i++) {
    ;({ state } = ingestSample(state, quietRms, t))
    t += 250
  }
  assert(state.pressure < pressureBeforeQuiet, 'pressure should have drained during sustained quiet')
  assert(state.towers[0].hp === hpAfterBreak, 'recovery should not have started before the grace period elapsed')

  // Cross the 5s recovery-grace threshold (4 samples above = 1s; need >=20
  // total 0.25s samples to clear the 5s grace, plus a few more so at least
  // one heal tick has actually landed).
  for (let i = 0; i < 20; i++) {
    ;({ state } = ingestSample(state, quietRms, t))
    t += 250
  }
  assert(
    state.towers[0].hp > hpAfterBreak,
    `recovery should have started once the grace period elapsed, got hp=${state.towers[0].hp}`,
  )
  console.log('  PASS: sustained quiet drains pressure and, past the grace period, heals the active tower')
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Each voice protocol sets a different effective threshold, correctly
//    relative to a given calibrated baseline.
// ─────────────────────────────────────────────────────────────────────────
function testProtocolsSetDifferentEffectiveThresholds() {
  const baselineDb = -40
  const protocols: VoiceProtocol[] = ['stealth', 'patrol', 'combat']
  const offsets = protocols.map((p) => config.protocolThresholdOffsetDb[p])
  assert(offsets[0] < offsets[1] && offsets[1] < offsets[2], 'stealth < patrol < combat thresholds')

  // A level 6 dB above baseline (relative to the *given* baseline, never an
  // absolute level) should build pressure under Stealth (+4dB threshold, 2dB
  // of excess) but not under Combat (+16dB threshold, level is under it).
  let stealth = runningState(baselineDb)
  ;({ state: stealth } = setProtocol(stealth, 'stealth'))
  ;({ state: stealth } = feedSustained(stealth, 6, 10, 250, 0))
  assert(stealth.pressure > 0, 'Stealth (+4dB threshold): 6dB excess should build pressure')

  let combat = runningState(baselineDb)
  ;({ state: combat } = setProtocol(combat, 'combat'))
  ;({ state: combat } = feedSustained(combat, 6, 10, 250, 0))
  assert(combat.pressure === 0, 'Combat (+16dB threshold): 6dB excess should build zero pressure')

  console.log('  PASS: each voice protocol resolves a different effective threshold above the same baseline')
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Tower order and decay: active tower hits 0 -> crumbles -> next tower
//    becomes active, in fixed N->O->I->S->E order.
// ─────────────────────────────────────────────────────────────────────────
function testTowerOrderAndDecay() {
  let state = runningState()
  assert(state.towers.map((t) => t.id).join('') === 'NOISE', 'tower order must be fixed N-O-I-S-E')
  const strikesToFell = Math.ceil(config.maxTowerHp / config.strikeDamage)

  for (let i = 0; i < strikesToFell; i++) {
    const result = applyManualBreak(state)
    state = result.state
  }
  assert(state.towers[0].hp === 0, 'N should have fallen after enough Manual Breaks')
  assert(state.towers[1].hp === state.towers[1].maxHp, 'O should be untouched while N was still absorbing breaks')

  // One more break should now land on O (the new active tower), not N.
  ;({ state } = applyManualBreak(state))
  assert(state.towers[0].hp === 0, 'N should remain at 0 (fallen, inert)')
  assert(
    state.towers[1].hp === state.towers[1].maxHp - config.strikeDamage,
    `O should now be the active tower taking damage, got hp=${state.towers[1].hp}`,
  )
  console.log('  PASS: active tower advances N->O->I->S->E in fixed order as each one falls')
}

// ─────────────────────────────────────────────────────────────────────────
// 6. All-towers-down freezes pressure and enters Regroup; repairing one
//    tower (targeted or Restore All) clears it and resumes normal play.
// ─────────────────────────────────────────────────────────────────────────
function testRegroupFreezesAndClearsOnRepair() {
  let state = runningState()
  const strikesToFellOne = Math.ceil(config.maxTowerHp / config.strikeDamage)
  for (let towerIndex = 0; towerIndex < 5; towerIndex++) {
    for (let i = 0; i < strikesToFellOne; i++) {
      ;({ state } = applyManualBreak(state))
    }
  }
  assert(state.towers.every((t) => t.hp === 0), 'setup: all towers should be down')
  assert(state.status === 'regroup', `status should be 'regroup', got ${state.status}`)

  // Feed loud samples while in Regroup -- pressure must stay frozen (there is
  // nothing to strike).
  const loudRms = rmsAtOffset(-40, 40)
  const pressureAtRegroup = state.pressure
  let t = 10_000
  for (let i = 0; i < 20; i++) {
    ;({ state } = ingestSample(state, loudRms, t))
    t += 250
  }
  assert(state.pressure === pressureAtRegroup, `pressure must stay frozen during Regroup, got ${state.pressure}`)
  assert(state.status === 'regroup', 'status must remain regroup while every tower is down')

  // Targeted Manual Repair on the front tower clears Regroup.
  const targeted = applyManualRepair(state, 'N')
  assert(targeted.state.status === 'running', 'repairing N should clear Regroup back to running')
  assert(targeted.events.some((e) => e.type === 'regroupCleared'), 'repairing N should emit regroupCleared')

  // Restore All also clears Regroup, from scratch.
  const restored = applyRestoreAll(state)
  assert(restored.state.status === 'running', 'Restore All should clear Regroup back to running')
  assert(restored.state.towers.every((t) => t.hp === t.maxHp), 'Restore All should fully heal every tower')
  assert(restored.events.some((e) => e.type === 'allTowersRestored'), 'Restore All should emit allTowersRestored')

  console.log('  PASS: all-towers-down enters Regroup (pressure frozen); targeted repair or Restore All clears it')
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Comms Jammer freezes analysis (no pressure/HP/protocol change while
//    engaged) and resumes correctly on disengage.
// ─────────────────────────────────────────────────────────────────────────
function testCommsJammerFreezesAndResumes() {
  let state = runningState()
  ;({ state } = feedSustained(state, 40, 6, 250, 0))
  const pressureBefore = state.pressure
  const hpBefore = state.towers[0].hp
  const protocolBefore = state.protocol

  const engaged = engageJammer(state, 5000)
  assert(engaged.state.status === 'jammed', 'status should be jammed after engaging')
  assert(engaged.events.some((e) => e.type === 'jammerEngaged'), 'should emit jammerEngaged')
  state = engaged.state

  // Any samples "fed" while jammed must be complete no-ops.
  const loudRms = rmsAtOffset(-40, 40)
  const fedWhileJammed = ingestSample(state, loudRms, 6000)
  assert(fedWhileJammed.events.length === 0, 'jammed status must never emit game events from a sample')
  assert(fedWhileJammed.state.pressure === pressureBefore, 'pressure must not move while jammed')
  assert(fedWhileJammed.state.towers[0].hp === hpBefore, 'tower HP must freeze while jammed')
  assert(fedWhileJammed.state.protocol === protocolBefore, 'protocol must be unchanged while jammed')

  // hudAllowedOnThisScreen: true -- the screen currently on stage would show
  // the HUD, so a manual Disengage clears fully (see the hidden-screen
  // cases in `testDisengageEnginewiseRefusesToResumeBehindAHiddenScreen`).
  const disengaged = disengageJammer(state, 9000, true)
  assert(disengaged.state.status === 'running', 'should resume to running after disengage')
  assert(disengaged.events.some((e) => e.type === 'jammerDisengaged'), 'should emit jammerDisengaged')
  assert(disengaged.state.pressure === pressureBefore, 'pressure must be exactly as it was on resume')
  assert(disengaged.state.missionStats.jammedSeconds === 4, 'jammed seconds should be tallied (9000-5000ms = 4s)')
  assert(disengaged.state.missionStats.autoJammedSeconds === 0, 'a manual jam contributes nothing to autoJammedSeconds')
  console.log('  PASS: Comms Jammer freezes pressure/HP/protocol exactly, and resumes correctly on disengage')
}

// ─────────────────────────────────────────────────────────────────────────
// 7b. Decision #2 -- auto vs. manual Comms Jammer: an auto-engaged jam
//     auto-resumes; a manually-engaged jam never does (only the teacher's
//     own disengageJammer clears it), and neither auto path can ever start
//     from -- or resume into -- a state with no session running.
// ─────────────────────────────────────────────────────────────────────────
function testAutoJamResumesOnlyItsOwnJam() {
  // Direction 1: auto-engage pauses analysis exactly like a manual jam,
  // preserving pressure/HP/protocol, and tags the jam as 'auto'.
  let state = runningState()
  ;({ state } = feedSustained(state, 40, 6, 250, 0))
  const pressureBefore = state.pressure
  const hpBefore = state.towers[0].hp
  const protocolBefore = state.protocol

  const autoEngaged = autoEngageJammer(state, 5000)
  assert(autoEngaged.state.status === 'jammed', 'auto-engage should jam the engine')
  assert(autoEngaged.state.jamReason === 'auto', 'auto-engage must tag jamReason as auto')
  assert(
    autoEngaged.events.some((e) => e.type === 'jammerEngaged' && e.manual === false),
    'auto-engage should emit jammerEngaged tagged manual:false',
  )
  state = autoEngaged.state

  const fedWhileAutoJammed = ingestSample(state, rmsAtOffset(-40, 40), 6000)
  assert(fedWhileAutoJammed.events.length === 0, 'an auto jam must pause analysis exactly like a manual one')
  assert(fedWhileAutoJammed.state.pressure === pressureBefore, 'pressure must freeze under an auto jam')
  assert(fedWhileAutoJammed.state.towers[0].hp === hpBefore, 'tower HP must freeze under an auto jam')
  assert(fedWhileAutoJammed.state.protocol === protocolBefore, 'protocol must be unchanged under an auto jam')

  // Direction 2: showing an eligible screen again (simulated by the caller
  // invoking autoDisengageJammer) resumes an auto jam on its own.
  const resumed = autoDisengageJammer(state, 9000)
  assert(resumed.state.status === 'running', 'auto-disengage should resume an auto jam back to running')
  assert(resumed.state.jamReason === null, 'jamReason should clear once the auto jam resumes')
  assert(
    resumed.events.some((e) => e.type === 'jammerDisengaged' && e.manual === false),
    'auto-disengage should emit jammerDisengaged tagged manual:false',
  )
  assert(resumed.state.pressure === pressureBefore, 'resuming an auto jam must preserve pressure exactly')
  assert(resumed.state.missionStats.jammedSeconds === 4, 'the whole 5000-9000ms auto jam (4s) tallies into jammedSeconds')
  assert(
    resumed.state.missionStats.autoJammedSeconds === 4,
    'a jam that was auto the whole way through attributes its entire span to autoJammedSeconds too',
  )

  // Direction 2b (the critical guard): a *manually* engaged jam must never
  // be cleared by auto-disengage, no matter what screen is shown.
  const manuallyJammed = engageJammer(runningState(), 1000) // reason defaults to 'manual'
  assert(manuallyJammed.state.jamReason === 'manual', 'setup: a teacher-engaged jam should be tagged manual')
  const attemptedAutoResume = autoDisengageJammer(manuallyJammed.state, 4000)
  assert(attemptedAutoResume.state.status === 'jammed', 'auto-disengage must never clear a manual jam')
  assert(attemptedAutoResume.state.jamReason === 'manual', 'a manual jam must stay tagged manual across an ignored auto-resume attempt')
  assert(attemptedAutoResume.events.length === 0, 'a no-op auto-disengage attempt must emit no events')
  // Only the teacher's own disengageJammer clears it, regardless of reason
  // (screen eligible here, so it clears fully rather than converting).
  const manuallyCleared = disengageJammer(manuallyJammed.state, 4000, true)
  assert(manuallyCleared.state.status === 'running', "the teacher's own disengageJammer always clears any jam")

  // Direction 3 (the mic-never-runs-with-no-session guard): neither auto
  // path can ever act while no session is running at all -- auto-engage
  // no-ops from idle, and auto-disengage no-ops when the engine isn't
  // jammed in the first place (both reuse engageJammer's/disengageJammer's
  // own status guards, so there is no separate parallel mechanism to drift
  // out of sync with them).
  const idle = createInitialEngineState()
  const autoEngageFromIdle = autoEngageJammer(idle, 1000)
  assert(autoEngageFromIdle.state.status === 'idle', 'auto-engage must never jam (or otherwise touch status) while idle')
  assert(autoEngageFromIdle.events.length === 0, 'auto-engage from idle must be a total no-op')

  const autoDisengageFromIdle = autoDisengageJammer(idle, 1000)
  assert(autoDisengageFromIdle.state.status === 'idle', 'auto-disengage must never touch status while idle')
  assert(autoDisengageFromIdle.events.length === 0, 'auto-disengage from idle must be a total no-op')

  console.log(
    '  PASS: an auto-engaged Comms Jammer auto-resumes on its own; a manually-engaged one never does; neither auto path ever acts with no session running',
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 7c. In-room-test-brief fixes (2026-09-25, points 1/2): a jam's reason can
//     now change mid-pause in both directions, without ever clearing
//     `jammed` status, and `disengageJammer` itself (not just /display's
//     effect) refuses to resume behind a still-hidden screen.
// ─────────────────────────────────────────────────────────────────────────

/** Point 1: teacher hits /control's "Jammer" toggle (engageJammer, reason
 * defaults to 'manual') while an auto-jam is already engaged. Must become a
 * durable manual jam that survives switching back to an eligible screen --
 * previously a silent no-op (jamReason stuck on 'auto', auto-cleared the
 * instant the screen became eligible again, the opposite of what a teacher
 * clicking Jammer would expect).
 */
function testManualJammerClickWhileAutoJammedUpgradesToManual() {
  let state = runningState()
  ;({ state } = feedSustained(state, 40, 6, 250, 0))
  const pressureBefore = state.pressure
  const hpBefore = state.towers[0].hp

  const autoJammed = autoEngageJammer(state, 5000)
  assert(autoJammed.state.status === 'jammed' && autoJammed.state.jamReason === 'auto', 'setup: auto-jammed (screen hides HUD)')
  state = autoJammed.state

  const clickedJammer = engageJammer(state, 8000) // the /control "Jammer" toggle -- reason defaults to 'manual'
  assert(clickedJammer.state.status === 'jammed', 'stays jammed -- this is an upgrade in place, not a fresh engage')
  assert(clickedJammer.state.jamReason === 'manual', "jamReason is upgraded from 'auto' to 'manual' by the teacher's own click")
  assert(
    clickedJammer.events.some((e) => e.type === 'jammerReasonChanged' && e.jamReason === 'manual'),
    'should emit jammerReasonChanged tagged manual',
  )
  assert(clickedJammer.state.pressure === pressureBefore, 'pressure is preserved across the upgrade')
  assert(clickedJammer.state.towers[0].hp === hpBefore, 'tower HP is preserved across the upgrade')
  // The 5000-8000ms span (3s) was auto before the upgrade; closeJamSpan
  // attributes it to autoJammedSeconds even though the jam ends up manual.
  assert(clickedJammer.state.missionStats.jammedSeconds === 3, 'the pre-upgrade span (3s) tallies into jammedSeconds')
  assert(clickedJammer.state.missionStats.autoJammedSeconds === 3, 'the pre-upgrade span is attributed to autoJammedSeconds, not lost on upgrade')
  state = clickedJammer.state

  // The screen becoming eligible again must NOT auto-clear it anymore.
  const backOnEligibleScreen = decideScreenJamAction(state.status, state.jamReason, true)
  assert(backOnEligibleScreen === 'none', "hudGate must never touch a jam that is now tagged 'manual', even right after an upgrade")
  const attemptedAutoResume = autoDisengageJammer(state, 9000)
  assert(attemptedAutoResume.state.status === 'jammed' && attemptedAutoResume.state.jamReason === 'manual', 'auto-disengage must still refuse an upgraded (now-manual) jam')

  // Only the teacher's own Disengage clears it now, same as any manual jam.
  const manuallyCleared = disengageJammer(state, 9000, true)
  assert(manuallyCleared.state.status === 'running', "the teacher's own disengageJammer still clears an upgraded manual jam once the screen is eligible")
  assert(manuallyCleared.state.missionStats.jammedSeconds === 4, 'the post-upgrade span (8000-9000ms = 1s) adds to the pre-upgrade 3s -> 4s total')
  assert(manuallyCleared.state.missionStats.autoJammedSeconds === 3, 'the post-upgrade (manual) span never adds to autoJammedSeconds')

  console.log(
    "  PASS: auto-jam -> click Jammer -> upgraded to 'manual' in place (jammedSeconds/autoJammedSeconds split correctly across the upgrade) -> survives the screen becoming eligible again -> only the teacher's own Disengage clears it",
  )
}

/** Point 2: `disengageJammer` itself refuses to resume behind a screen that
 * is still hiding the HUD (previously it unconditionally cleared any jam,
 * relying entirely on /display's effect to immediately re-derive
 * `autoEngage` and re-jam it -- a clear-then-instant-re-jam round trip, not
 * a refusal). Now enforced in the engine via `hudAllowedOnThisScreen`.
 */
function testDisengageEnginewiseRefusesToResumeBehindAHiddenScreen() {
  // 2a. jamReason 'auto', screen still hidden -> total no-op (nothing to
  // release; /control disables the button in this state too).
  {
    let state = runningState()
    ;({ state } = feedSustained(state, 40, 6, 250, 0))
    const pressureBefore = state.pressure
    state = autoEngageJammer(state, 5000).state
    assert(state.jamReason === 'auto', 'setup: auto-jammed')

    const attempted = disengageJammer(state, 9000, false)
    assert(attempted.state === state, 'a Disengage attempt on an auto jam behind a still-hidden screen is a total no-op')
    assert(attempted.events.length === 0, 'no event should fire for this no-op')
    assert(attempted.state.status === 'jammed' && attempted.state.jamReason === 'auto', 'stays jammed, still tagged auto')
    assert(attempted.state.pressure === pressureBefore, 'pressure untouched by the no-op')
  }

  // 2b. jamReason 'manual', screen still hidden -> converts to 'auto'
  // (releases the teacher's hold, but does not resume into a state the
  // class can't see) -- and the existing auto-resume mechanism then takes
  // over correctly once the screen becomes eligible, with no further
  // teacher action required.
  {
    let state = runningState()
    ;({ state } = feedSustained(state, 40, 6, 250, 0))
    const pressureBefore = state.pressure
    const hpBefore = state.towers[0].hp
    state = engageJammer(state, 5000).state // manual, e.g. a fire drill
    assert(state.jamReason === 'manual', 'setup: manually jammed')

    const converted = disengageJammer(state, 9000, false)
    assert(converted.state.status === 'jammed', 'stays jammed -- does not resume behind a hidden screen')
    assert(converted.state.jamReason === 'auto', "converts 'manual' -> 'auto' instead of resuming unseen")
    assert(
      converted.events.some((e) => e.type === 'jammerReasonChanged' && e.jamReason === 'auto'),
      'should emit jammerReasonChanged tagged auto',
    )
    assert(converted.state.pressure === pressureBefore, 'pressure preserved across the conversion')
    assert(converted.state.towers[0].hp === hpBefore, 'tower HP preserved across the conversion')
    assert(converted.state.missionStats.jammedSeconds === 4, 'the pre-conversion manual span (5000-9000ms = 4s) tallies into jammedSeconds')
    assert(converted.state.missionStats.autoJammedSeconds === 0, 'a manual span never counts toward autoJammedSeconds, even once converted')

    // No further teacher action -- hudGate's existing auto-resume mechanism
    // (already covered by testAutoJamResumesOnlyItsOwnJam) now applies on
    // its own once the screen becomes eligible again.
    const backOnEligibleScreen = decideScreenJamAction(converted.state.status, converted.state.jamReason, true)
    assert(backOnEligibleScreen === 'autoDisengage', "hudGate now resumes it automatically, exactly as an ordinary auto jam, once the screen is eligible")
    const resumed = autoDisengageJammer(converted.state, 9500)
    assert(resumed.state.status === 'running', 'auto-disengage resumes the converted jam with no teacher action required')
    assert(resumed.state.missionStats.autoJammedSeconds === 0.5, 'the 9000-9500ms auto span (0.5s) after conversion tallies into autoJammedSeconds')
  }

  // 2c. jamReason 'auto', screen now eligible (the brief window before
  // hudGate's own effect fires) -> a plain Disengage still clears fully,
  // same as any other jam once the screen would show the HUD.
  {
    let state = runningState()
    state = autoEngageJammer(state, 5000).state
    const cleared = disengageJammer(state, 9000, true)
    assert(cleared.state.status === 'running', 'clears fully once the screen is HUD-allowed, regardless of jamReason')
    assert(cleared.state.jamReason === null, 'jamReason clears on a full disengage')
  }

  console.log(
    '  PASS: disengageJammer itself now refuses to resume behind a still-hidden screen -- a no-op when already auto, a manual->auto conversion otherwise -- and still clears fully once the screen would actually show the HUD',
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Manual Break/Repair and Restore All behave exactly as specified.
// ─────────────────────────────────────────────────────────────────────────
function testManualOverridesExact() {
  const state = runningState()
  const broken = applyManualBreak(state)
  assert(
    broken.state.towers[0].hp === config.maxTowerHp - config.strikeDamage,
    `Manual Break must deal exactly ${config.strikeDamage} HP, got ${config.maxTowerHp - broken.state.towers[0].hp}`,
  )

  const repaired = applyManualRepair(broken.state, 'N')
  assert(repaired.state.towers[0].hp === config.maxTowerHp, 'Manual Repair must fully restore to 100%')

  // Fell every tower, then confirm Restore All heals everyone + clears Regroup.
  let allDown = state
  const strikesToFell = Math.ceil(config.maxTowerHp / config.strikeDamage)
  for (let towerIndex = 0; towerIndex < 5; towerIndex++) {
    for (let i = 0; i < strikesToFell; i++) {
      ;({ state: allDown } = applyManualBreak(allDown))
    }
  }
  assert(allDown.status === 'regroup', 'setup: all towers down should be Regroup')
  const restoredAll = applyRestoreAll(allDown)
  assert(restoredAll.state.towers.every((t) => t.hp === t.maxHp), 'Restore All must heal every tower to 100%')
  assert(restoredAll.state.status === 'running', 'Restore All must clear Regroup')
  console.log('  PASS: Manual Break (25 HP), Manual Repair (full heal), Restore All (heal everyone + clear Regroup)')
}

// ─────────────────────────────────────────────────────────────────────────
// 9. Mic permission denied pauses the engine cleanly (no crash, no
//    fabricated data, towers frozen).
// ─────────────────────────────────────────────────────────────────────────
function testMicDeniedPausesCleanly() {
  let state = runningState()
  // Needs to clear the 2s dwell guard first (see the equivalent comment in
  // testQuietDrainsPressureAndEventuallyHeals) before any pressure accumulates.
  ;({ state } = feedSustained(state, 40, 16, 250, 0))
  assert(state.pressure > 0, 'setup: pressure should have risen from loud samples while running')

  state = setMicDenied(state)
  assert(state.status === 'mic-denied', 'status should be mic-denied')
  assert(state.aboveThresholdSeconds === 0, 'dwell timer should be cleared on mic-denied')
  assert(state.quietSeconds === 0, 'quiet timer should be cleared on mic-denied')

  const pressureAtDenial = state.pressure
  const towersAtDenial = state.towers.map((t) => t.hp)

  const result = ingestSample(state, rmsAtOffset(-40, 40), 5000)
  assert(result.events.length === 0, 'mic-denied should never emit game events from a sample')
  assert(result.state.pressure === pressureAtDenial, 'pressure must not move while mic-denied')
  assert(
    result.state.towers.every((t, i) => t.hp === towersAtDenial[i]),
    'tower HP must freeze while mic-denied',
  )
  console.log('  PASS: mic-denied freezes the engine cleanly, no crash, no fabricated data')
}

// ─────────────────────────────────────────────────────────────────────────
// 10. Mission-complete SFX tiering data: a zero-strike mission is "clean."
// ─────────────────────────────────────────────────────────────────────────
function testMissionCompleteCleanTiering() {
  const clean = end(runningState()).events.find((e) => e.type === 'missionComplete')
  assert(Boolean(clean) && (clean as { clean: boolean }).clean === true, 'a zero-strike mission must be tiered clean')

  const dirtyResult = applyManualBreak(runningState())
  const dirty = end(dirtyResult.state).events.find((e) => e.type === 'missionComplete')
  assert(Boolean(dirty) && (dirty as { clean: boolean }).clean === false, 'a mission with a strike must not be clean')
  console.log('  PASS: mission-complete SFX tiering — zero strikes is clean, any strike is standard')
}

// ─────────────────────────────────────────────────────────────────────────
// Sanity check on the level math itself.
// ─────────────────────────────────────────────────────────────────────────
function testRmsToDbSanity() {
  assert(rmsToDb(1) === 0, 'full-scale RMS should be 0 dB')
  assert(rmsToDb(0.5) < 0, 'below full-scale should be negative dB')
  assert(Number.isFinite(rmsToDb(0)), 'zero RMS should not produce -Infinity')
  console.log('  PASS: rmsToDb sanity checks')
}

function testDefaultProtocolConstant() {
  assert(createInitialEngineState().protocol === DEFAULT_VOICE_PROTOCOL, 'fresh engine should use the default protocol')
  console.log('  PASS: default voice protocol constant applied on a fresh engine')
}

testTransientDoesNotStrike()
testSustainedNoiseFiresExactlyOneStrike()
testQuietDrainsPressureAndEventuallyHeals()
testProtocolsSetDifferentEffectiveThresholds()
testTowerOrderAndDecay()
testRegroupFreezesAndClearsOnRepair()
testCommsJammerFreezesAndResumes()
testAutoJamResumesOnlyItsOwnJam()
testManualJammerClickWhileAutoJammedUpgradesToManual()
testDisengageEnginewiseRefusesToResumeBehindAHiddenScreen()
testManualOverridesExact()
testMicDeniedPausesCleanly()
testMissionCompleteCleanTiering()
testRmsToDbSanity()
testDefaultProtocolConstant()

console.log('Noise Defense engine tests passed.')
