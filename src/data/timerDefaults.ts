import type {
  PhaseTimerState,
  SimpleTimerScreenId,
  SimpleTimerState,
  TimerPreset,
} from './timerTypes'
import { DEFAULT_ROUTINE_CONTROLS } from './routineSchedule'

/** Duration presets only — not school bell / schedule clock times. */
export const TIMER_PRESETS: TimerPreset[] = [
  { id: '2', label: '2 min', minutes: 2 },
  { id: '5', label: '5 min', minutes: 5 },
  { id: '10', label: '10 min', minutes: 10 },
  { id: '15', label: '15 min', minutes: 15 },
  { id: '20', label: '20 min', minutes: 20 },
  { id: 'custom', label: 'Custom', minutes: null },
]

export const DEFAULT_TIMER_DURATION_MS = 5 * 60 * 1000

export function createDefaultSimpleTimer(
  label = 'Timer',
): SimpleTimerState {
  return {
    label,
    presetId: '5',
    durationMs: DEFAULT_TIMER_DURATION_MS,
    status: 'idle',
    remainingMs: DEFAULT_TIMER_DURATION_MS,
    endsAt: null,
    appearance: 'calm',
    chimeEnabled: false,
  }
}

export const DEFAULT_SIMPLE_TIMERS: Record<
  SimpleTimerScreenId,
  SimpleTimerState
> = {
  homeroom: createDefaultSimpleTimer('Homeroom Timer'),
  math: createDefaultSimpleTimer('Math Timer'),
  reading: createDefaultSimpleTimer('Reading Timer'),
  spelling: createDefaultSimpleTimer('Spelling Timer'),
}

/**
 * Editable duration presets for Snack/Lunch flow control.
 * Not tied to last year’s bell schedule or fixed clock times.
 */
export const DEFAULT_PHASE_TIMER: PhaseTimerState = {
  title: 'Snack / Lunch Routine',
  phases: [
    {
      id: 'eating-quiet',
      label: 'Eating / Quiet Voices',
      durationMinutes: 10,
      instructions: 'Eat at your table. Use quiet voices.',
      styleToken: 'calm',
    },
    {
      id: 'silent-cleanup',
      label: 'Silent Cleanup',
      durationMinutes: 3,
      instructions: 'Throw away trash. Wipe crumbs. Push in chairs.',
      styleToken: 'cleanup',
    },
    {
      id: 'bathroom-locker',
      label: 'Bathroom / Locker',
      durationMinutes: 5,
      instructions: 'Bathroomroom if needed. Get what you need from your locker.',
      styleToken: 'transition',
    },
  ],
  status: 'idle',
  currentPhaseIndex: 0,
  remainingMs: 10 * 60 * 1000,
  endsAt: null,
  appearance: 'calm',
  chimeEnabled: false,
}

export { DEFAULT_ROUTINE_CONTROLS }

export const SIMPLE_TIMER_SCREEN_IDS: SimpleTimerScreenId[] = [
  'homeroom',
  'math',
  'reading',
  'spelling',
]
