import type {
  CurriculumTrack,
  DailyBlockDefinition,
  HistoryScienceSubject,
  RoutineSuggestion,
  ScheduleBlockModel,
  TrackBlockOverride,
} from './routineTypes'

function timeToMinutes(time: string): number {
  const [hoursText, minutesText] = time.split(':')
  const hours = Number.parseInt(hoursText ?? '0', 10)
  const minutes = Number.parseInt(minutesText ?? '0', 10)
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

/** Track rotation anchor: first instructional Monday of 2026–2027 Q1W1. */
export const TRACK_ROTATION_EPOCH = new Date(2026, 7, 17, 0, 0, 0, 0)

/**
 * Temporary deterministic track helper until a teacher-editable track calendar exists.
 * Weekly rotation from TRACK_ROTATION_EPOCH resolves History vs Science for scheduling labels
 * and recess suggestions. A future schedule editor should allow manual teacher override.
 */

export const TRACK_HISTORY_SCIENCE_MAP: Record<CurriculumTrack, HistoryScienceSubject> = {
  1: 'history',
  2: 'science',
  3: 'history',
  4: 'science',
}

export const INSTRUCTIONAL_BLOCK_ORDER = [
  'math',
  'snack',
  'writing',
  'movement',
  'spelling',
  'reading',
  'lunch',
  'recess',
  'history-science',
  'specials',
  'pack-up',
  'carpool',
] as const

export function blockDurationMinutes(block: Pick<DailyBlockDefinition, 'startTime' | 'endTime' | 'durationMinutes'>): number {
  if (typeof block.durationMinutes === 'number') {
    return block.durationMinutes
  }
  return Math.max(0, timeToMinutes(block.endTime) - timeToMinutes(block.startTime))
}

export function toScheduleBlockModel(block: DailyBlockDefinition): ScheduleBlockModel {
  return {
    blockId: block.id,
    title: block.label,
    startTime: block.startTime,
    endTime: block.endTime,
    durationMinutes: blockDurationMinutes(block),
    trackOverrides: block.trackOverrides,
  }
}

export function resolveCurriculumTrack(date = new Date()): CurriculumTrack {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksElapsed = Math.floor((date.getTime() - TRACK_ROTATION_EPOCH.getTime()) / msPerWeek)
  const normalized = ((weeksElapsed % 4) + 4) % 4
  return (normalized + 1) as CurriculumTrack
}

export function resolveHistoryScienceSubject(track: CurriculumTrack): HistoryScienceSubject {
  return TRACK_HISTORY_SCIENCE_MAP[track]
}

export function resolveTrackBlockOverride(
  block: DailyBlockDefinition,
  track: CurriculumTrack,
): TrackBlockOverride | undefined {
  return block.trackOverrides?.[track]
}

export function resolveBlockDisplayLabel(block: DailyBlockDefinition, track: CurriculumTrack): string {
  const override = resolveTrackBlockOverride(block, track)
  if (override?.title) return override.title
  if (block.id === 'history-science') {
    return resolveHistoryScienceSubject(track) === 'history' ? 'History' : 'Science'
  }
  return block.label
}

export function resolveBlockScreenId(
  block: DailyBlockDefinition,
  track: CurriculumTrack,
): DailyBlockDefinition['screenId'] {
  const override = resolveTrackBlockOverride(block, track)
  if (override?.screenId) return override.screenId
  return block.screenId
}

/** Resolve track-aware page suggestions; recess → History/Science by curriculum track. */
export function resolveBlockPageSuggestion(
  block: DailyBlockDefinition,
  track: CurriculumTrack,
  historyScienceBlock?: DailyBlockDefinition,
): RoutineSuggestion | undefined {
  if (block.id === 'recess' && historyScienceBlock) {
    const subjectLabel = resolveBlockDisplayLabel(historyScienceBlock, track)
    const screenId = resolveBlockScreenId(historyScienceBlock, track)
    if (!screenId) return block.pageSuggestion
    return {
      label: `Open ${subjectLabel}`,
      screenId,
      pageId: 'history-science-get-ready',
    }
  }
  return block.pageSuggestion
}

export function resolveBlockPageSuggestionForDate(
  block: DailyBlockDefinition,
  date = new Date(),
  historyScienceBlock?: DailyBlockDefinition,
): RoutineSuggestion | undefined {
  return resolveBlockPageSuggestion(block, resolveCurriculumTrack(date), historyScienceBlock)
}

export function assertInstructionalBlockOrder(blocks: DailyBlockDefinition[]): boolean {
  const enabledIds = blocks.filter((block) => block.enabled).map((block) => block.id)
  let cursor = 0
  for (const expectedId of INSTRUCTIONAL_BLOCK_ORDER) {
    const index = enabledIds.indexOf(expectedId, cursor)
    if (index === -1) return false
    cursor = index + 1
  }
  return true
}
