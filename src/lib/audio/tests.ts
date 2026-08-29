import {
  getTierUnlockNotes,
  getVictoryFanfareMelody,
  playTierUnlock,
  playVictoryFanfare,
  unlockSynthesizer,
} from './synthesizer'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

function isStrictlyAscending(freqs: number[]): boolean {
  return freqs.every((f, i) => i === 0 || f > freqs[i - 1])
}

// --- getTierUnlockNotes ---

const tier1 = getTierUnlockNotes(1)
assert(tier1.length === 2, 'tier 1 unlock is a 2-note chirp')
assert(isStrictlyAscending(tier1.map((n) => n.freq)), 'tier 1 notes ascend')

const tier2 = getTierUnlockNotes(2)
assert(tier2.length === 3, 'tier 2 unlock is a 3-note arpeggio')
assert(isStrictlyAscending(tier2.map((n) => n.freq)), 'tier 2 notes ascend')

const tier3 = getTierUnlockNotes(3)
assert(tier3.length === 4, 'tier 3 unlock is a 4-note arpeggio')
assert(isStrictlyAscending(tier3.map((n) => n.freq)), 'tier 3 notes ascend')
assert(
  tier3[tier3.length - 1].freq === tier3[0].freq * 2,
  'tier 3 arpeggio resolves to the octave above its root',
)

assert(tier2[0].freq > tier1[0].freq, 'higher tiers start on a higher root note')
assert(tier3[0].freq > tier2[0].freq, 'tier 3 starts higher than tier 2')

for (const tier of [1, 2, 3] as const) {
  for (const note of getTierUnlockNotes(tier)) {
    assert(note.freq > 0, `tier ${tier} note frequency is positive`)
    assert(note.dur > 0, `tier ${tier} note duration is positive`)
  }
}

// --- getVictoryFanfareMelody ---

const melody = getVictoryFanfareMelody()
assert(melody.length === 4, 'victory fanfare melody has 4 notes')
assert(isStrictlyAscending(melody.map((n) => n.freq)), 'victory fanfare melody ascends')
assert(
  melody[melody.length - 1].dur > melody[0].dur,
  'victory fanfare melody holds its final note longer than its first',
)

// --- Playback functions never throw outside a browser (no AudioContext) ---
// This is the environment these compiled tests actually run in (plain Node),
// so it doubles as a regression guard against the module crashing during SSR
// or any non-browser import.

unlockSynthesizer()
playTierUnlock(1)
playTierUnlock(2)
playTierUnlock(3)
playVictoryFanfare()

console.log('Synthesizer tests passed.')
