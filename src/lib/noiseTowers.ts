import type {
  NoiseTowerLetter,
  NoiseTowerState,
  NoiseTrackerId,
  NoiseTrackerState,
  VoiceLevel,
} from '../data/types'

const TRACKER_DEFAULTS: Record<
  NoiseTrackerId,
  Pick<NoiseTrackerState, 'label' | 'voiceLevel'>
> = {
  homeroom: { label: 'Homeroom Noise', voiceLevel: 'whisper' },
  math: { label: 'Math Noise', voiceLevel: 'normal' },
  reading: { label: 'Reading Noise', voiceLevel: 'whisper' },
}

export const NOISE_TOWER_LETTERS: NoiseTowerLetter[] = ['N', 'O', 'I', 'S', 'E']

export function createDefaultNoiseTowers(): NoiseTowerState[] {
  return NOISE_TOWER_LETTERS.map((letter) => ({
    letter,
    hp: 2,
    maxHp: 2,
  }))
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function isVoiceLevel(value: unknown): value is VoiceLevel {
  return value === 'silent' || value === 'whisper' || value === 'normal' || value === 'off'
}

function normalizeTower(
  letter: NoiseTowerLetter,
  tower?: Partial<NoiseTowerState>,
): NoiseTowerState {
  const maxHp = Math.max(1, Number.isFinite(tower?.maxHp) ? Number(tower?.maxHp) : 2)
  const nextHp = Number.isFinite(tower?.hp) ? Number(tower?.hp) : maxHp
  return {
    letter,
    maxHp,
    hp: clamp(nextHp, 0, maxHp),
  }
}

export function normalizeNoiseTowers(
  towers?: Array<Partial<NoiseTowerState>> | null,
): NoiseTowerState[] {
  const source = Array.isArray(towers) ? towers : []

  return NOISE_TOWER_LETTERS.map((letter, index) =>
    normalizeTower(
      letter,
      source.find((tower) => tower?.letter === letter) ?? source[index],
    ),
  )
}

export function createDefaultNoiseTracker(trackerId: NoiseTrackerId): NoiseTrackerState {
  const defaults = TRACKER_DEFAULTS[trackerId]
  return {
    id: trackerId,
    label: defaults.label,
    voiceLevel: defaults.voiceLevel,
    noisyPoints: 0,
    lapMinutes: 0,
    meterLevel: 0,
    isPaused: false,
    towers: createDefaultNoiseTowers(),
  }
}

export function createDefaultNoiseTrackers(): Record<NoiseTrackerId, NoiseTrackerState> {
  return {
    homeroom: createDefaultNoiseTracker('homeroom'),
    math: createDefaultNoiseTracker('math'),
    reading: createDefaultNoiseTracker('reading'),
  }
}

export function normalizeNoiseTrackerState(
  trackerId: NoiseTrackerId,
  tracker?: Partial<NoiseTrackerState> | null,
): NoiseTrackerState {
  const defaults = TRACKER_DEFAULTS[trackerId]
  const voiceLevel = isVoiceLevel(tracker?.voiceLevel)
    ? tracker.voiceLevel
    : defaults.voiceLevel

  return {
    id: trackerId,
    label: typeof tracker?.label === 'string' && tracker.label.trim().length > 0
      ? tracker.label
      : defaults.label,
    voiceLevel,
    noisyPoints: Number.isFinite(tracker?.noisyPoints)
      ? Math.max(0, Math.floor(Number(tracker?.noisyPoints)))
      : 0,
    lapMinutes: Number.isFinite(tracker?.lapMinutes)
      ? Math.max(0, Math.floor(Number(tracker?.lapMinutes)))
      : 0,
    meterLevel: Number.isFinite(tracker?.meterLevel)
      ? clamp(Math.floor(Number(tracker?.meterLevel)), 0, 100)
      : 0,
    isPaused: voiceLevel === 'off' ? true : Boolean(tracker?.isPaused ?? false),
    towers: normalizeNoiseTowers(tracker?.towers ?? null),
  }
}

export function normalizeNoiseTrackerMap(
  trackers?: Partial<Record<NoiseTrackerId, Partial<NoiseTrackerState>>> | null,
): Record<NoiseTrackerId, NoiseTrackerState> {
  return {
    homeroom: normalizeNoiseTrackerState('homeroom', trackers?.homeroom),
    math: normalizeNoiseTrackerState('math', trackers?.math),
    reading: normalizeNoiseTrackerState('reading', trackers?.reading),
  }
}

export function getNoiseTowerCondition(tower: NoiseTowerState): 'intact' | 'damaged' | 'destroyed' {
  if (tower.hp <= 0) return 'destroyed'
  if (tower.hp >= tower.maxHp) return 'intact'
  return 'damaged'
}

export function getNoiseTowerConditionLabel(tower: NoiseTowerState): string {
  const condition = getNoiseTowerCondition(tower)
  switch (condition) {
    case 'intact':
      return 'Intact'
    case 'damaged':
      return 'Damaged'
    case 'destroyed':
      return 'Destroyed'
  }
}

export function getNoiseTowerMeterLabel(tower: NoiseTowerState): string {
  return `${tower.hp}/${tower.maxHp}`
}

export function getNoiseTowerSummary(towers: NoiseTowerState[]): string {
  return towers
    .map((tower) => `${tower.letter} ${getNoiseTowerMeterLabel(tower)}`)
    .join(' · ')
}

export function getNoiseTrackerTowerStatus(tracker: NoiseTrackerState): string {
  if (tracker.towers.every((tower) => tower.hp <= 0)) {
    return 'All towers down. Repair to rebuild the defense line.'
  }

  if (tracker.towers.some((tower) => tower.hp <= 0)) {
    return 'A tower has fallen. Repair from the right to rebuild.'
  }

  const nextDamaged = tracker.towers.find((tower) => tower.hp > 0 && tower.hp < tower.maxHp)
  if (nextDamaged) {
    return `${nextDamaged.letter} is damaged. Keep the volume low.`
  }

  return 'Defense line stable. Keep voices in range.'
}

export function applyNoisyPointToTracker(tracker: NoiseTrackerState): NoiseTrackerState {
  const next = structuredClone(tracker)
  next.noisyPoints += 1
  next.meterLevel = 100

  const targetIndex = next.towers.findIndex((tower) => tower.hp > 0)
  if (targetIndex === -1) {
    return next
  }

  const target = next.towers[targetIndex]
  const previousHp = target.hp
  target.hp = clamp(target.hp - 1, 0, target.maxHp)

  if (previousHp > 0 && target.hp === 0) {
    next.lapMinutes += 2
  }

  return next
}

export function applyRepairTickToTracker(tracker: NoiseTrackerState): NoiseTrackerState {
  const next = structuredClone(tracker)
  const targetIndex = [...next.towers]
    .reverse()
    .findIndex((tower) => tower.hp < tower.maxHp)

  if (targetIndex === -1) {
    return next
  }

  const actualIndex = next.towers.length - 1 - targetIndex
  const target = next.towers[actualIndex]
  const previousHp = target.hp
  target.hp = clamp(target.hp + 1, 0, target.maxHp)

  if (previousHp === 0 && target.hp === target.maxHp) {
    next.lapMinutes = Math.max(0, next.lapMinutes - 2)
  }

  return next
}

export function resetNoiseTrackerState(trackerId: NoiseTrackerId): NoiseTrackerState {
  return createDefaultNoiseTracker(trackerId)
}
