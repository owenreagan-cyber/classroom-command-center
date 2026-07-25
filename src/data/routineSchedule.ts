import type { BlockRoutineWindow, DailyBlockDefinition, DailyBlockState, RoutineControlState, RoutinePhaseDefinition, RoutinePhaseState, RoutineSchedule, RoutineSuggestion, RoutineWeekday } from './routineTypes'

export function normalizeRoutineSuggestion(
  suggestion: RoutineSuggestion | undefined,
): RoutineSuggestion | undefined {
  if (!suggestion) return undefined

  // Map legacy page IDs
  const pageMap: Record<string, string> = {
    'carpool-checkout': 'recess-play',
    'snack-routine': 'snack-quiet-snack',
    'lunch-routine': 'lunch-quiet-lunch-a',
    'homeroom-arrival': 'homeroom-morning-arrival',
    'history-science-get-ready': 'history-science-get-ready',
    'history-science-wrap-up': 'history-science-wrap-up',
    'movement-routine': 'ready-position-default',
    'spelling-get-ready': 'spelling-get-ready',
    'reading-get-ready': 'reading-get-ready',
    'reading-wrap-up': 'reading-wrap-up',
    'writing-get-ready': 'shurley-get-ready',
    'writing-wrap-up': 'shurley-wrap-up',
    'shurley-writing-get-ready': 'shurley-get-ready',
    'shurley-writing-wrap-up': 'shurley-wrap-up',
    'recess-play': 'recess-play',
  }

  const screenMap: Record<string, string> = {
    'ready-position': 'recess',
    'snack-lunch': 'snack',
    'homework-packup': 'homework',
  }

  const result = { ...suggestion }
  if (result.pageId && pageMap[result.pageId]) {
    result.pageId = pageMap[result.pageId] as typeof result.pageId
  }
  if (result.screenId && screenMap[result.screenId]) {
    result.screenId = screenMap[result.screenId] as typeof result.screenId
  }

  return result
}

export function normalizeRoutineControlState(
  control: RoutineControlState | undefined,
): RoutineControlState | undefined {
  if (!control) return control
  const normalizedSuggestion = normalizeRoutineSuggestion(control.suggestion)

  const pageMap: Record<string, string> = {
    'carpool-checkout': 'ready-position-default',
    'snack-routine': 'snack-quiet-snack',
    'lunch-routine': 'lunch-quiet-lunch-a',
    'homeroom-arrival': 'homeroom-morning-arrival',
    'math-get-ready': 'math-get-ready',
    'math-wrap-up': 'math-wrap-up',
    'history-science-get-ready': 'history-science-get-ready',
    'history-science-wrap-up': 'history-science-wrap-up',
    'movement-routine': 'ready-position-default',
    'spelling-get-ready': 'spelling-get-ready',
    'reading-get-ready': 'reading-get-ready',
    'reading-wrap-up': 'reading-wrap-up',
    'writing-get-ready': 'shurley-get-ready',
    'writing-wrap-up': 'shurley-wrap-up',
    'shurley-writing-get-ready': 'shurley-get-ready',
    'shurley-writing-wrap-up': 'shurley-wrap-up',
    'recess-play': 'recess-play',
  }

  return {
    ...control,
    pageId: control.pageId && pageMap[control.pageId]
      ? (pageMap[control.pageId] as typeof control.pageId)
      : control.pageId,
    suggestion: normalizedSuggestion,
  }
}

export const SCHEDULE_CHANGE_NOTES = [
  'Shurley and History/Science swapped places and times; exact schedule pending teacher confirmation.',
] as const

export const CLASS_MODE_USES: Record<'homeroom' | 'math' | 'reading', string[]> = {
  homeroom: ['morning time', 'snack', 'Shurley', 'lunch', 'history/science', 'dismissal'],
  math: ['math'],
  reading: ['spelling', 'reading'],
}

export const CANONICAL_DAILY_BLOCKS: DailyBlockDefinition[] = [
  {
    id: 'carpool-homeroom',
    label: 'Carpool/Homeroom',
    startTime: '7:20',
    endTime: '7:45',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'homeroom',
    nextScreenId: 'math',
    pageSuggestion: {
      label: 'Open Math',
      screenId: 'math',
      pageId: 'math-get-ready',
    },
  },
  {
    id: 'math',
    label: 'Math',
    startTime: '7:50',
    endTime: '9:00',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'math',
  },
  {
    id: 'snack',
    label: 'Snack',
    startTime: '9:05',
    endTime: '9:15',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'snack',
    nextScreenId: 'science',
    pageSuggestion: {
      label: 'Open History/Science',
      screenId: 'science',
      pageId: 'history-science-get-ready',
    },
  },
  {
    id: 'history-science',
    label: 'History/Science',
    startTime: '9:20',
    endTime: '10:00',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'science',
  },
  {
    id: 'movement',
    label: 'Movement',
    startTime: '10:05',
    endTime: '10:35',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'science',
  },
  {
    id: 'spelling',
    label: 'Spelling',
    startTime: '10:40',
    endTime: '11:10',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'spelling',
  },
  {
    id: 'reading',
    label: 'Reading',
    startTime: '11:10',
    endTime: '12:10',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'reading',
  },
  {
    id: 'lunch',
    label: 'Lunch',
    startTime: '12:15',
    endTime: '12:45',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'lunch',
    nextScreenId: 'recess',
    pageSuggestion: {
      label: 'Open Recess',
      screenId: 'recess',
      pageId: 'recess-play',
    },
  },
  {
    id: 'recess',
    label: 'Recess',
    startTime: '12:50',
    endTime: '13:10',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'recess',
  },
  {
    id: 'writing',
    label: 'Shurley/Writing/Handwriting',
    startTime: '13:15',
    endTime: '13:45',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'writing',
  },
  {
    id: 'specials',
    label: 'Specials',
    startTime: '13:50',
    endTime: '14:35',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'assessment',
  },
  {
    id: 'pack-up',
    label: 'Pack Up',
    startTime: '14:35',
    endTime: '14:40',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'pack-up',
  },
  {
    id: 'carpool',
    label: 'Carpool',
    startTime: '14:40',
    endTime: '15:05',
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    enabled: true,
    screenId: 'homeroom',
  },
]

export const ROUTINE_SCHEDULES: RoutineSchedule[] = [
  {
    id: 'homeroom-arrival',
    classVibeId: 'homeroom',
    pageId: 'homeroom-morning-arrival',
    label: 'Homeroom Morning Arrival',
    enabled: true,
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    phases: [
      {
        id: 'silent-work',
        label: 'Silent Work',
        instructions: ['Unpack', 'Turn in homework', 'Get your materials', 'Begin silently'],
        startTime: '7:20',
        endTime: '7:47',
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        transitionChime: false,
        pageId: 'homeroom-silent-work',
        nextPageSuggestion: {
          label: 'Open Math',
          screenId: 'math',
          pageId: 'math-get-ready',
        },
      },
      {
        id: 'clean-up',
        label: 'Clean Up',
        instructions: ['Finish your work', 'Put it away', 'Get ready for Math'],
        startTime: '7:47',
        endTime: '7:49',
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        transitionChime: true,
        pageId: 'homeroom-clean-up-math',
        nextPageSuggestion: {
          label: 'Open Math',
          screenId: 'math',
          pageId: 'math-get-ready',
        },
      },
    ],
  },
  {
    id: 'snack-routine',
    classVibeId: 'snack',
    pageId: 'snack-quiet-snack',
    label: 'Snack Routine',
    enabled: true,
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    phases: [
      {
        id: 'quiet-snack',
        label: 'Quiet Snack',
        instructions: ['Eat quietly', 'Keep your area tidy'],
        startTime: '9:05',
        endTime: '9:12',
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        pageId: 'snack-quiet-snack',
      },
      {
        id: 'silent-clean-up',
        label: 'Silent Clean Up',
        instructions: ['Throw away trash', 'Push in chairs', 'Pack up quietly'],
        startTime: '9:12',
        endTime: '9:15',
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        transitionChime: true,
        pageId: 'snack-silent-clean-up',
        nextPageSuggestion: {
          label: 'Open History/Science',
          screenId: 'science',
          pageId: 'history-science-get-ready',
        },
      },
    ],
  },
  {
    id: 'lunch-routine',
    classVibeId: 'lunch',
    pageId: 'lunch-quiet-lunch-a',
    label: 'Lunch Routine',
    enabled: true,
    weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    phases: [
      {
        id: 'quiet-lunch-a',
        label: 'Quiet Lunch',
        instructions: ['Eat quietly', 'Stay seated'],
        startTime: '12:15',
        endTime: '12:20',
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        pageId: 'lunch-quiet-lunch-a',
      },
      {
        id: 'silent-chew',
        label: 'Silent Chew',
        instructions: ['Chew with no talking', 'Stay calm'],
        startTime: '12:20',
        endTime: '12:28',
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        pageId: 'lunch-silent-chew',
      },
      {
        id: 'quiet-lunch-b',
        label: 'Quiet Lunch',
        instructions: ['Finish eating', 'Stay calm at the table'],
        startTime: '12:28',
        endTime: '12:41',
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        pageId: 'lunch-quiet-lunch-b',
      },
      {
        id: 'silent-clean-up-lunch',
        label: 'Silent Clean Up',
        instructions: ['Throw away trash', 'Push in chairs', 'Line up quietly'],
        startTime: '12:41',
        endTime: '12:45',
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        transitionChime: true,
        pageId: 'lunch-silent-clean-up',
        nextPageSuggestion: {
          label: 'Open Recess',
          screenId: 'recess',
          pageId: 'recess-play',
        },
      },
    ],
  },
]

export const BLOCK_ROUTINE_WINDOWS: BlockRoutineWindow[] = [
  {
    id: 'math-get-ready',
    blockId: 'math',
    label: 'Get Ready',
    startTime: '7:50',
    endTime: '7:52',
    instructions: ['Sit down', 'Get materials out', 'Follow the board'],
    enabled: true,
  },
  {
    id: 'math-wrap-up',
    blockId: 'math',
    label: 'Wrap Up',
    startTime: '8:58',
    endTime: '9:00',
    instructions: ['Clean your area', 'Put materials away', 'Ready Position'],
    enabled: true,
  },
  {
    id: 'history-science-get-ready',
    blockId: 'history-science',
    label: 'Get Ready',
    startTime: '9:20',
    endTime: '9:22',
    instructions: ['Sit down', 'Get materials out', 'Follow the board'],
    enabled: true,
  },
  {
    id: 'history-science-wrap-up',
    blockId: 'history-science',
    label: 'Wrap Up',
    startTime: '9:58',
    endTime: '10:00',
    instructions: ['Clean your area', 'Put materials away', 'Ready Position'],
    enabled: true,
  },
  {
    id: 'spelling-get-ready',
    blockId: 'spelling',
    label: 'Get Ready',
    startTime: '10:40',
    endTime: '10:42',
    instructions: ['Sit down', 'Get materials out', 'Follow the board'],
    enabled: true,
  },
  {
    id: 'reading-get-ready',
    blockId: 'reading',
    label: 'Get Ready',
    startTime: '11:10',
    endTime: '11:12',
    instructions: ['Sit down', 'Get materials out', 'Follow the board'],
    enabled: true,
  },
  {
    id: 'reading-wrap-up',
    blockId: 'reading',
    label: 'Wrap Up',
    startTime: '12:08',
    endTime: '12:10',
    instructions: ['Clean your area', 'Put materials away', 'Ready Position'],
    enabled: true,
  },
  {
    id: 'shurley-writing-get-ready',
    blockId: 'writing',
    label: 'Get Ready',
    startTime: '13:15',
    endTime: '13:17',
    instructions: ['Sit down', 'Get materials out', 'Follow the board'],
    enabled: true,
  },
  {
    id: 'shurley-writing-wrap-up',
    blockId: 'writing',
    label: 'Wrap Up',
    startTime: '13:43',
    endTime: '13:45',
    instructions: ['Clean your area', 'Put materials away', 'Ready Position'],
    enabled: true,
  },
]

export const DEFAULT_ROUTINE_CONTROLS: Record<string, RoutineControlState> = {
  'homeroom-arrival': { mode: 'auto', dateKey: null, phaseId: null },
  'snack-routine': { mode: 'auto', dateKey: null, phaseId: null },
  'lunch-routine': { mode: 'auto', dateKey: null, phaseId: null },
}

export function getRoutineScheduleById(scheduleId: string): RoutineSchedule | undefined {
  return ROUTINE_SCHEDULES.find((schedule) => schedule.id === scheduleId)
}

export function getDailyBlockById(blockId: string): DailyBlockDefinition | undefined {
  return CANONICAL_DAILY_BLOCKS.find((block) => block.id === blockId)
}

export function phaseDurationMs(phase: Pick<RoutinePhaseDefinition, 'startTime' | 'endTime'>): number {
  return timeToMinutes(phase.endTime) - timeToMinutes(phase.startTime) < 0
    ? 0
    : (timeToMinutes(phase.endTime) - timeToMinutes(phase.startTime)) * 60_000
}

export function timeToMinutes(time: string): number {
  const [hoursText, minutesText] = time.split(':')
  const hours = Number.parseInt(hoursText ?? '0', 10)
  const minutes = Number.parseInt(minutesText ?? '0', 10)
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

export function getDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function getRoutineWeekday(date = new Date()): RoutineWeekday | null {
  const day = date.getDay()
  if (day === 1) return 'mon'
  if (day === 2) return 'tue'
  if (day === 3) return 'wed'
  if (day === 4) return 'thu'
  if (day === 5) return 'fri'
  return null
}

export function isWeekdayEnabled(weekdays: RoutineWeekday[] | undefined, date = new Date()): boolean {
  if (!weekdays || weekdays.length === 0) return true
  const day = date.getDay()
  const mapped: RoutineWeekday | null =
    day === 1 ? 'mon'
      : day === 2 ? 'tue'
        : day === 3 ? 'wed'
          : day === 4 ? 'thu'
            : day === 5 ? 'fri'
              : null
  return mapped !== null ? weekdays.includes(mapped) : false
}

export function getDateTimeForMinutes(baseDate: Date, minutes: number): number {
  const next = new Date(baseDate)
  next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return next.getTime()
}

export function makeDailyBlockState(block: DailyBlockDefinition, now = new Date()): DailyBlockState {
  const startsAt = getDateTimeForMinutes(now, timeToMinutes(block.startTime))
  const endsAt = getDateTimeForMinutes(now, timeToMinutes(block.endTime))
  return {
    ...block,
    dateKey: getDayKey(now),
    startsAt,
    endsAt,
    remainingMs: Math.max(0, endsAt - now.getTime()),
  }
}

export function makeRoutinePhaseState(
  phase: RoutinePhaseDefinition,
  now = new Date(),
  overrides?: Partial<RoutinePhaseState>,
): RoutinePhaseState {
  const startsAt = getDateTimeForMinutes(now, timeToMinutes(phase.startTime))
  const endsAt = getDateTimeForMinutes(now, timeToMinutes(phase.endTime))
  return {
    ...phase,
    dateKey: getDayKey(now),
    startsAt,
    endsAt,
    remainingMs: Math.max(0, endsAt - now.getTime()),
    isActive: true,
    isPaused: false,
    isManualOverride: false,
    ...overrides,
  }
}

export function makeManualRoutineControl(
  phase: RoutinePhaseDefinition,
  now = new Date(),
  mode: RoutineControlState['mode'] = 'manual',
): RoutineControlState {
  const endsAt = getDateTimeForMinutes(now, timeToMinutes(phase.endTime))
  return {
    mode,
    dateKey: getDayKey(now),
    phaseId: phase.id,
    phaseLabel: phase.label,
    remainingMs: Math.max(0, endsAt - now.getTime()),
    endsAt,
    pageId: phase.pageId,
    suggestion: normalizeRoutineSuggestion(phase.nextPageSuggestion),
  }
}

export function getSuggestionForBlock(block: DailyBlockDefinition): RoutineSuggestion | undefined {
  return block.pageSuggestion
}

export function getBlockRoutineWindowById(windowId: string): BlockRoutineWindow | undefined {
  return BLOCK_ROUTINE_WINDOWS.find((window) => window.id === windowId)
}
