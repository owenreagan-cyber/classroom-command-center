import { decideScreenJamAction, isNoiseHudAllowed, shouldShowMicSilentWarning } from './hudGate'
import { DISPLAY_MODE_IDS } from '../clean-board/displayModes'
import type { DisplayModeId } from '../clean-board/types'
import type { GameStatus } from './types'

/**
 * Stage 0 — HUD opt-in gate tests (noise-game design-doc "STAGE 0"). Confirms
 * the HUD is absent by default on every screen, and stays absent on
 * Assessment Mode specifically even if some other screen's opt-in were
 * (hypothetically) on -- i.e. Assessment Mode's exclusion is independent of
 * the opt-in map's contents, not just "off by default."
 */

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

function testAbsentByDefaultEverywhere() {
  for (const id of DISPLAY_MODE_IDS) {
    assert(
      isNoiseHudAllowed(id, {}) === false,
      `HUD must be absent by default on ${id} with no opt-in set at all`,
    )
  }
  console.log('  PASS: HUD is absent by default on every screen (empty opt-in map)')
}

function testEligibleScreensCanBeOptedIn() {
  const eligibleIds = DISPLAY_MODE_IDS.filter((id) => id !== 'assessment')
  assert(eligibleIds.length > 0, 'setup: there should be at least one eligible screen')
  for (const id of eligibleIds) {
    assert(
      isNoiseHudAllowed(id, { [id]: true }) === true,
      `${id} should show the HUD once explicitly opted in`,
    )
    assert(
      isNoiseHudAllowed(id, { [id]: false }) === false,
      `${id} should stay hidden while explicitly opted out`,
    )
  }
  console.log('  PASS: every eligible screen can be individually opted in/out')
}

function testAssessmentModeStructurallyExcluded() {
  assert(
    isNoiseHudAllowed('assessment', {}) === false,
    'Assessment Mode must be excluded with an empty opt-in map',
  )
  // The critical case: even if a bad write got 'assessment: true' into the
  // opt-in map (a bug, a corrupted localStorage value, a copy-paste from
  // another screen's toggle), the structural eligibility check in
  // `displayModes.ts` must still block it -- this is what makes the
  // exclusion "not just defaulted off."
  const corruptedOptIn: Partial<Record<DisplayModeId, boolean>> = { assessment: true }
  assert(
    isNoiseHudAllowed('assessment', corruptedOptIn) === false,
    'Assessment Mode must stay excluded even if its own opt-in entry were forced true',
  )
  console.log('  PASS: Assessment Mode is structurally excluded independent of the opt-in map contents')
}

function testOtherScreensOptInDoesNotLeakToAssessment() {
  // A very "on" opt-in map for every other screen must still never leak
  // permission to Assessment Mode.
  const allOthersOn: Partial<Record<DisplayModeId, boolean>> = {}
  for (const id of DISPLAY_MODE_IDS) allOthersOn[id] = true
  assert(
    isNoiseHudAllowed('assessment', allOthersOn) === false,
    'Assessment Mode must stay excluded even when every other screen is opted in',
  )
  for (const id of DISPLAY_MODE_IDS.filter((i) => i !== 'assessment')) {
    assert(isNoiseHudAllowed(id, allOthersOn) === true, `${id} should be allowed when opted in`)
  }
  console.log('  PASS: a fully-on opt-in map never leaks HUD visibility to Assessment Mode')
}

/**
 * Decision #2 -- the pure "what should the Comms Jammer do right now"
 * decision (`decideScreenJamAction`), covering both directions the task
 * asks for plus the guards that keep it from ever fighting a teacher's own
 * manual jam or acting with no session running at all.
 */
function testSwitchingToHiddenScreenAutoEngages() {
  for (const status of ['running', 'regroup'] as GameStatus[]) {
    assert(
      decideScreenJamAction(status, null, false) === 'autoEngage',
      `switching to a HUD-hidden screen while ${status} must auto-engage the jammer`,
    )
  }
  console.log('  PASS: switching to a HUD-hidden screen while a session is running/regroup auto-engages the jammer')
}

function testSwitchingBackAutoResumesOnlyAnAutoJam() {
  assert(
    decideScreenJamAction('jammed', 'auto', true) === 'autoDisengage',
    'switching back to a HUD-eligible screen must auto-resume an auto-engaged jam',
  )
  assert(
    decideScreenJamAction('jammed', 'manual', true) === 'none',
    "switching back to a HUD-eligible screen must NEVER auto-resume a teacher's manual jam",
  )
  console.log(
    '  PASS: switching back to a HUD-eligible screen auto-resumes only an auto-engaged jam, never a manual one',
  )
}

function testNeverActsWithNoSessionRunning() {
  const noSessionStatuses: GameStatus[] = ['idle', 'ended', 'mic-denied', 'calibrating']
  for (const status of noSessionStatuses) {
    assert(
      decideScreenJamAction(status, null, false) === 'none',
      `must never auto-engage while ${status} (no session running)`,
    )
    assert(
      decideScreenJamAction(status, null, true) === 'none',
      `must never act while ${status} even on an eligible screen`,
    )
  }
  // Already-jammed (any reason) on a still-hidden screen must not attempt a
  // second auto-engage (engageJammer's own status guard would no-op it
  // anyway, but the decision function itself should never even ask).
  assert(
    decideScreenJamAction('jammed', 'auto', false) === 'none',
    'an already-jammed engine on a still-hidden screen should not be told to auto-engage again',
  )
  console.log('  PASS: the auto-jam decision never fires (engage or resume) while no session is running')
}

/**
 * In-room-test fix (2026-09-26) -- the "microphone isn't running on the
 * display" warning shown on `/control` when calibration gets no samples
 * within a few seconds, instead of Baseline silently staying "—" until the
 * full calibration window times out.
 */
function testMicSilentWarningOnlyDuringCalibrating() {
  for (const status of ['idle', 'running', 'regroup', 'jammed', 'mic-denied', 'ended'] as GameStatus[]) {
    assert(
      shouldShowMicSilentWarning(status, 0, 1000, 10000, 3000) === false,
      `must never show the mic-silent warning while ${status}, even with stale timing`,
    )
  }
  console.log('  PASS: mic-silent warning never fires outside calibrating')
}

function testMicSilentWarningNeedsAStartTimestamp() {
  assert(
    shouldShowMicSilentWarning('calibrating', 0, null, 10000, 3000) === false,
    'must not show the warning before a calibration start time is known',
  )
  console.log('  PASS: mic-silent warning needs a known calibration start time')
}

function testMicSilentWarningWaitsForTheThreshold() {
  assert(
    shouldShowMicSilentWarning('calibrating', 0, 1000, 1000, 3000) === false,
    'must not show the warning the instant calibration begins',
  )
  assert(
    shouldShowMicSilentWarning('calibrating', 0, 1000, 3999, 3000) === false,
    'must not show the warning just under the threshold',
  )
  assert(
    shouldShowMicSilentWarning('calibrating', 0, 1000, 4000, 3000) === true,
    'must show the warning once the threshold has elapsed with zero samples',
  )
  console.log('  PASS: mic-silent warning waits for the configured threshold before firing')
}

function testMicSilentWarningClearsOnceASampleArrives() {
  assert(
    shouldShowMicSilentWarning('calibrating', 1, 1000, 10000, 3000) === false,
    'a single collected sample must clear the warning even long after the threshold',
  )
  console.log('  PASS: mic-silent warning clears the instant a real sample has been collected')
}

testAbsentByDefaultEverywhere()
testEligibleScreensCanBeOptedIn()
testAssessmentModeStructurallyExcluded()
testOtherScreensOptInDoesNotLeakToAssessment()
testSwitchingToHiddenScreenAutoEngages()
testSwitchingBackAutoResumesOnlyAnAutoJam()
testNeverActsWithNoSessionRunning()
testMicSilentWarningOnlyDuringCalibrating()
testMicSilentWarningNeedsAStartTimestamp()
testMicSilentWarningWaitsForTheThreshold()
testMicSilentWarningClearsOnceASampleArrives()

console.log('Noise Defense HUD opt-in gate tests passed.')
