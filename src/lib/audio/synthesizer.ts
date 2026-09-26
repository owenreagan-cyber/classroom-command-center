/**
 * Local Web Audio synthesizer for classroom milestone sounds — tier unlocks
 * and the victory fanfare. Every sound is generated at runtime from
 * oscillators and filters; no audio files, no network calls. Mirrors the
 * lazy-singleton-context pattern in
 * `src/features/prize-board/pressYourLuck/audioManager.ts`.
 */

export type SynthesizerTier = 1 | 2 | 3

export interface SynthesizerNote {
  freq: number
  dur: number
  type?: OscillatorType
  vol?: number
}

const TIER_ROOT_FREQ: Record<SynthesizerTier, number> = {
  1: 440, // A4
  2: 523.25, // C5
  3: 659.25, // E5
}

// Root, major third, perfect fifth, octave — a bright ascending arpeggio.
// Higher tiers take more of the sequence, so tier 3's chirp is longer and
// higher than tier 1's.
const ARPEGGIO_RATIOS = [1, 5 / 4, 3 / 2, 2]

/** Pure — the ascending arpeggio for a given tier's level-up chirp. */
export function getTierUnlockNotes(tier: SynthesizerTier): SynthesizerNote[] {
  const root = TIER_ROOT_FREQ[tier]
  const ratios = ARPEGGIO_RATIOS.slice(0, tier + 1)
  return ratios.map((ratio, i) => ({
    freq: Math.round(root * ratio * 100) / 100,
    dur: i === ratios.length - 1 ? 220 : 110,
    type: 'square',
    vol: i === ratios.length - 1 ? 0.11 : 0.09,
  }))
}

/** Pure — the Phase 2 triumphant melody that follows the noise blast. */
export function getVictoryFanfareMelody(): SynthesizerNote[] {
  return [
    { freq: 523.25, dur: 120, type: 'square', vol: 0.1 }, // C5
    { freq: 659.25, dur: 120, type: 'square', vol: 0.1 }, // E5
    { freq: 783.99, dur: 120, type: 'square', vol: 0.1 }, // G5
    { freq: 1046.5, dur: 260, type: 'square', vol: 0.13 }, // C6, held
  ]
}

let sharedContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedContext) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    sharedContext = new Ctx()
  }
  if (sharedContext.state === 'suspended') {
    void sharedContext.resume()
  }
  return sharedContext
}

/**
 * Call from within a real user-gesture handler (a click/tap) on pages —
 * like `/display` — where nobody otherwise interacts with the DOM before
 * the first fanfare needs to play. Browsers only allow an `AudioContext` to
 * actually produce sound once it's been resumed inside a genuine gesture at
 * least once; after that, this same shared context stays usable for every
 * later `playTierUnlock`/`playVictoryFanfare` call, gesture or not.
 */
export function unlockSynthesizer(): void {
  getContext()
}

/**
 * Exposes the same lazily-created, resume-on-gesture shared `AudioContext`
 * to sibling synthesizer modules (e.g. the noise-defense game's SFX) so a
 * second feature never has to spin up its own `AudioContext` or its own
 * gesture-unlock banner — see `src/features/noise-defense/noiseGameSynthesizer.ts`.
 * Returns `null` outside a browser or if `AudioContext` isn't available.
 */
export function getSharedAudioContext(): AudioContext | null {
  return getContext()
}

/** Builds and schedules one tone, cleaning up its graph once it finishes. */
function scheduleTone(ctx: AudioContext, note: SynthesizerNote, startAt: number): void {
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  osc.type = note.type ?? 'square'
  osc.frequency.value = note.freq
  filter.type = 'lowpass'
  filter.frequency.value = Math.min(note.freq * 4, 8000)
  gain.gain.value = note.vol ?? 0.08
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + note.dur / 1000)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  const stopAt = startAt + note.dur / 1000 + 0.05
  osc.onended = () => {
    osc.disconnect()
    filter.disconnect()
    gain.disconnect()
  }
  osc.start(startAt)
  osc.stop(stopAt)
}

/** Schedules a sequence of notes back-to-back, starting at `startAt`. */
function scheduleSequence(ctx: AudioContext, notes: SynthesizerNote[], startAt: number): void {
  let t = startAt
  for (const note of notes) {
    scheduleTone(ctx, note, t)
    t += (note.dur / 1000) * 0.85
  }
}

/** Phase 1 of the victory fanfare — a filtered white-noise blast. */
function scheduleNoiseBurst(
  ctx: AudioContext,
  durationMs: number,
  cutoffHz: number,
  volume: number,
  startAt: number,
): void {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * (durationMs / 1000)))
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = cutoffHz
  const gain = ctx.createGain()
  gain.gain.value = volume
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000)

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  source.onended = () => {
    source.disconnect()
    filter.disconnect()
    gain.disconnect()
  }
  source.start(startAt)
  source.stop(startAt + durationMs / 1000 + 0.05)
}

/** Ascending arpeggio / level-up chirp for reaching stamp tier `tier`. */
export function playTierUnlock(tier: SynthesizerTier): void {
  const ctx = getContext()
  if (!ctx) return
  scheduleSequence(ctx, getTierUnlockNotes(tier), ctx.currentTime)
}

const NOISE_BLAST_DURATION_MS = 220

/** Phase 1 low-pass noise blast, then Phase 2 triumphant melody. */
export function playVictoryFanfare(): void {
  const ctx = getContext()
  if (!ctx) return
  scheduleNoiseBurst(ctx, NOISE_BLAST_DURATION_MS, 900, 0.12, ctx.currentTime)
  const melodyStart = ctx.currentTime + (NOISE_BLAST_DURATION_MS / 1000) * 0.9
  scheduleSequence(ctx, getVictoryFanfareMelody(), melodyStart)
}
