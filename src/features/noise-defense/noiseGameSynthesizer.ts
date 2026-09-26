/**
 * Hero Academy Defense System SFX (design-doc §6) — reuses the shared,
 * lazily-created `AudioContext` singleton from `src/lib/audio/synthesizer.ts`
 * (`getSharedAudioContext`) rather than building a second audio engine or a
 * second gesture-unlock banner. Every sound here is generated at runtime from
 * oscillators/filters/noise buffers; no audio files, no network calls.
 *
 * `playVictoryFanfare`/`playAllTowersRestoredSfx`'s mission-complete tiering
 * (§0b #5) reuses `synthesizer.ts`'s `playVictoryFanfare` directly for a
 * clean (zero-strike) mission -- see `NoiseDefenseHUD.tsx`'s mission-complete
 * handling, not duplicated here.
 *
 * Deliberately no sound at all for Comms Jammer engage/disengage or for the
 * mic-denied fault banner (§6's own table: a calm, deliberate teacher action
 * and a silent fault banner shouldn't compete for attention with whatever's
 * actually happening in the room).
 */

import { getSharedAudioContext } from '../../lib/audio/synthesizer'

function scheduleTone(
  ctx: AudioContext,
  freq: number,
  durMs: number,
  startAt: number,
  opts: { type?: OscillatorType; vol?: number; sweepToFreq?: number } = {},
): void {
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()

  osc.type = opts.type ?? 'sawtooth'
  osc.frequency.setValueAtTime(freq, startAt)
  if (opts.sweepToFreq) {
    osc.frequency.linearRampToValueAtTime(opts.sweepToFreq, startAt + durMs / 1000)
  }
  filter.type = 'lowpass'
  filter.frequency.value = Math.min(Math.max(freq, opts.sweepToFreq ?? freq) * 3, 6000)
  gain.gain.value = opts.vol ?? 0.1
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durMs / 1000)

  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)

  osc.onended = () => {
    osc.disconnect()
    filter.disconnect()
    gain.disconnect()
  }
  osc.start(startAt)
  osc.stop(startAt + durMs / 1000 + 0.05)
}

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
    // A gentle decay envelope inside the buffer itself gives the burst a
    // percussive "thud/crumble/impact" shape rather than a flat noise gate.
    const decay = 1 - i / bufferSize
    data[i] = (Math.random() * 2 - 1) * decay
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

/** Protocol change (Stealth <-> Patrol <-> Combat): a short, clean
 * "chirp-click" -- an administrative tone, not celebratory or alarming. */
export function playProtocolChangeSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  scheduleTone(ctx, 520, 70, ctx.currentTime, { type: 'triangle', vol: 0.06 * volume })
  scheduleTone(ctx, 720, 70, ctx.currentTime + 0.08, { type: 'triangle', vol: 0.06 * volume })
}

/** Calibration complete: a single clean bell tone, distinct from any
 * heal/victory chime so it never reads as "something good just happened in
 * the game." */
export function playCalibrationCompleteSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  scheduleTone(ctx, 660, 420, ctx.currentTime, { type: 'sine', vol: 0.09 * volume })
}

/** Pressure crosses the Warning threshold (75%, one-shot per crossing): a
 * short, mild ascending blip -- a nudge, not an alarm. */
export function playWarningFlashSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  scheduleTone(ctx, 260, 160, ctx.currentTime, {
    type: 'triangle',
    sweepToFreq: 340,
    vol: 0.07 * volume,
  })
}

/** The tone half of a Strike -- a short, sharp descending hit. Exported
 * standalone since `playStrikeSfx` layers it with an impact burst, and the
 * design doc names this shape specifically as the one to reuse. */
export function playDangerHitSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  scheduleTone(ctx, 420, 180, ctx.currentTime, {
    type: 'sawtooth',
    sweepToFreq: 180,
    vol: 0.11 * volume,
  })
}

/** Strike: `playDangerHitSfx`'s descending hit layered with a brief
 * low-pass noise "impact" burst -- reads as one decisive blow. */
export function playStrikeSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  playDangerHitSfx(volume)
  scheduleNoiseBurst(ctx, 140, 2200, 0.1 * volume, ctx.currentTime)
}

/** Tower Fall (decay): a filtered noise "crumble" burst (longer, lower
 * cutoff than the Strike's impact burst) plus a low descending thud -- the
 * bigger, sadder cousin of the Strike sound. */
export function playTowerCrumbleSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  scheduleNoiseBurst(ctx, 420, 1400, 0.16 * volume, ctx.currentTime)
  scheduleTone(ctx, 160, 380, ctx.currentTime, { type: 'sine', sweepToFreq: 60, vol: 0.13 * volume })
}

/** Regroup (all towers down): a single low, ominous descending 3-note
 * minor-feeling sweep -- deliberately not a repeating siren loop. */
export function playRegroupSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  const notes = [220, 185, 146.83] // A3 -> F#3-ish -> D3, a descending minor-feeling sweep
  let t = ctx.currentTime
  for (const freq of notes) {
    scheduleTone(ctx, freq, 260, t, { type: 'square', sweepToFreq: freq * 0.85, vol: 0.09 * volume })
    t += 0.2
  }
}

/** Recovery begins: a soft, single rising sine tone, quiet volume -- a
 * gentle "something good is starting" cue, distinct from and quieter than
 * Recovery Complete. */
export function playRecoveryBeginSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  scheduleTone(ctx, 330, 260, ctx.currentTime, { type: 'sine', sweepToFreq: 440, vol: 0.05 * volume })
}

/** Recovery complete: a bright 3-note ascending major arpeggio. */
export function playHealChimeSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  const notes = [523.25, 659.25, 783.99] // C5 E5 G5
  let t = ctx.currentTime
  for (const freq of notes) {
    scheduleTone(ctx, freq, 130, t, { type: 'triangle', vol: 0.09 * volume })
    t += 0.09
  }
}

/** Mission Complete, standard tier (any mission with >=1 strike, §0b #5): a
 * 4-note ascending triangle sequence -- also reused for Restore All. */
export function playAllTowersRestoredSfx(volume = 1): void {
  const ctx = getSharedAudioContext()
  if (!ctx) return
  const notes = [523.25, 659.25, 783.99, 1046.5]
  let t = ctx.currentTime
  for (const freq of notes) {
    scheduleTone(ctx, freq, 160, t, { type: 'triangle', vol: 0.1 * volume })
    t += 0.11
  }
}
