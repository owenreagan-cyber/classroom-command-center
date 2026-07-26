/** Classroom-safe Web Audio manager — generated tones, no external files. */

let audioCtx: AudioContext | null = null
let unlocked = false

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctx = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    audioCtx = new Ctx()
  }
  return audioCtx
}

/** Call after user gesture to satisfy iPad autoplay policy. */
export function unlockAudio(): boolean {
  const ctx = getContext()
  if (!ctx) return false
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  unlocked = true
  return true
}

export function isAudioUnlocked(): boolean {
  return unlocked
}

function playTone(
  frequency: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
  enabled = true,
): void {
  if (!enabled || !unlocked) return
  const ctx = getContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = volume
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + durationMs / 1000 + 0.05)
}

function playSequence(
  notes: Array<{ freq: number; dur: number; type?: OscillatorType; vol?: number }>,
  enabled: boolean,
): void {
  if (!enabled || !unlocked) return
  let offset = 0
  for (const note of notes) {
    setTimeout(() => {
      playTone(note.freq, note.dur, note.type ?? 'sine', note.vol ?? 0.08, enabled)
    }, offset)
    offset += note.dur * 0.85
  }
}

export interface PrizeBoardAudio {
  spinStart: (enabled?: boolean) => void
  spinTick: (enabled?: boolean) => void
  commonWin: (enabled?: boolean) => void
  rareWin: (enabled?: boolean) => void
  legendaryWin: (enabled?: boolean) => void
  whammyAlert: (enabled?: boolean) => void
  whammyLaugh: (enabled?: boolean) => void
}

export function createPrizeBoardAudio(): PrizeBoardAudio {
  return {
    spinStart(enabled = true) {
      playSequence([
        { freq: 220, dur: 80, type: 'square', vol: 0.05 },
        { freq: 330, dur: 80, type: 'square', vol: 0.05 },
        { freq: 440, dur: 120, type: 'square', vol: 0.06 },
      ], enabled)
    },
    spinTick(enabled = true) {
      playTone(880 + Math.random() * 120, 30, 'square', 0.03, enabled)
    },
    commonWin(enabled = true) {
      playSequence([
        { freq: 523, dur: 100 },
        { freq: 659, dur: 120 },
      ], enabled)
    },
    rareWin(enabled = true) {
      playSequence([
        { freq: 440, dur: 80 },
        { freq: 554, dur: 80 },
        { freq: 659, dur: 100 },
        { freq: 880, dur: 150, vol: 0.1 },
      ], enabled)
    },
    legendaryWin(enabled = true) {
      playSequence([
        { freq: 392, dur: 70 },
        { freq: 523, dur: 70 },
        { freq: 659, dur: 70 },
        { freq: 784, dur: 70 },
        { freq: 988, dur: 200, vol: 0.12 },
      ], enabled)
    },
    whammyAlert(enabled = true) {
      playSequence([
        { freq: 180, dur: 150, type: 'sawtooth', vol: 0.1 },
        { freq: 140, dur: 150, type: 'sawtooth', vol: 0.1 },
        { freq: 100, dur: 200, type: 'sawtooth', vol: 0.12 },
      ], enabled)
    },
    whammyLaugh(enabled = true) {
      playSequence([
        { freq: 300, dur: 60, type: 'triangle', vol: 0.07 },
        { freq: 250, dur: 60, type: 'triangle', vol: 0.07 },
        { freq: 200, dur: 80, type: 'triangle', vol: 0.08 },
        { freq: 150, dur: 100, type: 'triangle', vol: 0.09 },
      ], enabled)
    },
  }
}

export const prizeBoardAudio = createPrizeBoardAudio()
