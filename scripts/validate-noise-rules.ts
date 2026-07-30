import { getNoiseTrackerIdForScreen } from '../src/lib/noiseTowers'
import type { ScreenId, NoiseTrackerId } from '../src/data/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

const testCases: { screen: ScreenId; expected: NoiseTrackerId | null }[] = [
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
  { screen: 'recess', expected: 'homeroom' },
  { screen: 'movement', expected: 'homeroom' },
]

let passed = true

console.log('--- CCC Noise Tracker Screen Assignment Validation ---')

for (const { screen, expected } of testCases) {
  const actual = getNoiseTrackerIdForScreen(screen)
  if (actual === expected) {
    console.log(`✓ Screen "${screen}" correctly assigned to tracker "${actual}"`)
  } else {
    console.error(`✗ Screen "${screen}" FAILED. Expected "${expected}", got "${actual}"`)
    passed = false
  }
}

console.log('\n--- Exclusions / Future Screens Validation ---')
const vibeActual = getNoiseTrackerIdForScreen('vibe' as unknown as ScreenId)
if (vibeActual === null) {
  console.log('✓ Non-existent / future "vibe" screen correctly excluded (returned null)')
} else {
  console.error(`✗ Future screen "vibe" FAILED. Expected null, got "${vibeActual}"`)
  passed = false
}

if (passed) {
  console.log('\n✓ All CCC Noise Tracker Assignment Rules validated successfully!')
  process.exit(0)
} else {
  console.error('\n✗ One or more validation checks failed.')
  process.exit(1)
}
