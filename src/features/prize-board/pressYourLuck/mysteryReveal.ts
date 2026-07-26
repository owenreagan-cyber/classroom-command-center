import type { MysteryRevealPhase } from './types'

const MYSTERY_SEQUENCE: MysteryRevealPhase[] = [
  'announce',
  'shake',
  'select',
  'reveal',
]

const PHASE_DURATIONS_MS: Record<MysteryRevealPhase, number> = {
  announce: 2000,
  shake: 1800,
  select: 1500,
  reveal: 2500,
}

export function nextMysteryPhase(current: MysteryRevealPhase | null): MysteryRevealPhase | null {
  if (!current) return 'announce'
  const idx = MYSTERY_SEQUENCE.indexOf(current)
  if (idx < 0 || idx >= MYSTERY_SEQUENCE.length - 1) return null
  return MYSTERY_SEQUENCE[idx + 1]!
}

export function mysteryPhaseDuration(phase: MysteryRevealPhase): number {
  return PHASE_DURATIONS_MS[phase]
}

export function isMysteryComplete(phase: MysteryRevealPhase | null): boolean {
  return phase === 'reveal'
}
