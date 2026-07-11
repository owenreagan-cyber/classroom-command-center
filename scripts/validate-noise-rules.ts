import { getNoiseTrackerIdForScreen } from '../src/lib/noiseTowers.ts'
import type { ScreenId, NoiseTrackerId } from '../src/data/types'

const testCases: { screen: ScreenId; expected: NoiseTrackerId | null }[] = [
  { screen: 'homeroom', expected: 'homeroom' },
  { screen: 'math', expected: 'math' },
  { screen: 'reading', expected: 'reading' },
  { screen: 'snack-lunch', expected: 'homeroom' },
  { screen: 'ready-position', expected: 'homeroom' },
  { screen: 'writing', expected: 'homeroom' },
  { screen: 'science', expected: 'homeroom' },
  { screen: 'social-studies', expected: 'homeroom' },
  { screen: 'intervention', expected: 'homeroom' },
  { screen: 'assessment', expected: 'homeroom' },
  { screen: 'flexible-groups', expected: 'homeroom' },
  { screen: 'centers', expected: 'homeroom' },
  { screen: 'homework-packup', expected: 'homeroom' },
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

// Explicit test of Future Screen / Exclusions behavior
console.log('\n--- Exclusions / Future Screens Validation ---')
const spellingActual = getNoiseTrackerIdForScreen('spelling' as unknown as ScreenId)
if (spellingActual === null) {
  console.log('✓ Non-existent / future "spelling" screen correctly excluded (returned null)')
} else {
  console.error(`✗ Future screen "spelling" FAILED. Expected null, got "${spellingActual}"`)
  passed = false
}

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
