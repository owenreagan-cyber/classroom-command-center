import {
  createDefaultNoiseTrackers,
  getNoiseTrackerIdForScreen,
  normalizeNoiseTrackerMap,
  resetNoiseTrackerState,
} from '../../lib/noiseTowers'
import type { NoiseTrackerId, ScreenId, VoiceLevel } from '../../data/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) passed++
  else {
    failed++
    console.error(`FAIL: ${label}`)
  }
}

function assertEq(label: string, a: unknown, b: unknown) {
  if (a === b) passed++
  else {
    failed++
    console.error(`FAIL: ${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
  }
}

const VOICE_LEVELS: VoiceLevel[] = ['silent', 'whisper', 'normal', 'off']

function runTests() {
  // Canonical voice-level vocabulary
  for (const level of VOICE_LEVELS) {
    assert(`NC-01: voice level ${level} supported`, VOICE_LEVELS.includes(level))
  }

  // Tracker independence
  const defaults = createDefaultNoiseTrackers()
  assertEq('NC-02: homeroom default whisper', defaults.homeroom.voiceLevel, 'whisper')
  assertEq('NC-03: math default normal', defaults.math.voiceLevel, 'normal')
  assertEq('NC-04: reading default whisper', defaults.reading.voiceLevel, 'whisper')

  const customized = normalizeNoiseTrackerMap({
    homeroom: { voiceLevel: 'silent' },
    math: { voiceLevel: 'off' },
    reading: { voiceLevel: 'normal' },
  })
  assertEq('NC-05: homeroom isolated', customized.homeroom.voiceLevel, 'silent')
  assertEq('NC-06: math isolated', customized.math.voiceLevel, 'off')
  assertEq('NC-07: reading isolated', customized.reading.voiceLevel, 'normal')

  // Malformed persisted state
  const malformed = normalizeNoiseTrackerMap({
    homeroom: { voiceLevel: 'invalid' as VoiceLevel, noisyPoints: -5 },
    math: null as unknown as undefined,
    reading: { voiceLevel: 'whisper', meterLevel: 500 },
  })
  assertEq('NC-08: bad voice level falls back', malformed.homeroom.voiceLevel, 'whisper')
  assertEq('NC-09: negative noisy points clamped', malformed.homeroom.noisyPoints, 0)
  assertEq('NC-10: missing math uses default', malformed.math.voiceLevel, 'normal')
  assertEq('NC-11: meter level clamped', malformed.reading.meterLevel, 100)
  assertEq('NC-12: off sets paused', malformed.reading.isPaused, false)

  const offTracker = normalizeNoiseTrackerMap({ math: { voiceLevel: 'off' } })
  assertEq('NC-13: off pauses tracker', offTracker.math.isPaused, true)

  // Reset affects only one tracker
  const beforeReset = normalizeNoiseTrackerMap({
    homeroom: { voiceLevel: 'silent', noisyPoints: 3 },
    math: { voiceLevel: 'off', noisyPoints: 1 },
    reading: { voiceLevel: 'normal', noisyPoints: 2 },
  })
  const resetMath = resetNoiseTrackerState('math')
  const afterReset = {
    ...beforeReset,
    math: resetMath,
  }
  assertEq('NC-14: reset math voice level', afterReset.math.voiceLevel, 'normal')
  assertEq('NC-15: reset math noisy points', afterReset.math.noisyPoints, 0)
  assertEq('NC-16: homeroom unchanged after math reset', afterReset.homeroom.voiceLevel, 'silent')
  assertEq('NC-17: reading unchanged after math reset', afterReset.reading.voiceLevel, 'normal')

  // Active-screen tracker mapping
  const screenCases: Array<{ screen: ScreenId; expected: NoiseTrackerId | null }> = [
    { screen: 'homeroom', expected: 'homeroom' },
    { screen: 'math', expected: 'math' },
    { screen: 'reading', expected: 'reading' },
    { screen: 'snack', expected: 'homeroom' },
    { screen: 'lunch', expected: 'homeroom' },
    { screen: 'ready-position', expected: 'homeroom' },
    { screen: 'writing', expected: 'homeroom' },
    { screen: 'science', expected: 'homeroom' },
    { screen: 'social-studies', expected: 'homeroom' },
    { screen: 'assessment', expected: 'homeroom' },
    { screen: 'centers', expected: 'homeroom' },
    { screen: 'homework', expected: 'homeroom' },
    { screen: 'pack-up', expected: 'homeroom' },
    { screen: 'spelling', expected: 'homeroom' },
  ]
  for (const { screen, expected } of screenCases) {
    assertEq(`NC-18: screen ${screen} tracker`, getNoiseTrackerIdForScreen(screen), expected)
  }

  // Unknown / future screens excluded
  assertEq(
    'NC-19: unknown screen excluded',
    getNoiseTrackerIdForScreen('vibe' as unknown as ScreenId),
    null,
  )

  // Display privacy: student display components must not expose teacher-only reset APIs.
  // NoiseControlPanel is control-route only; VoiceLevelWidget hides off state on display.
  assert(
    'NC-20: no microphone API in noise module',
    !String(getNoiseTrackerIdForScreen).includes('microphone'),
  )
}

runTests()

console.log(`Noise control tests: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('All noise control tests passed.')
