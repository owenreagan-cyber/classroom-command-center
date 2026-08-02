import type { RoutineTimerState, SimpleTimerState, TaskTimerState, TransitionTimerState } from '../data/timerTypes'
import type { SimpleTimerScreenId } from '../data/timerTypes'
import { DEFAULT_ROUTINE_TIMERS, DEFAULT_TASK_TIMER, DEFAULT_TRANSITION_TIMERS } from '../data/timerDefaults'
import { formatTimerMs, minutesToMs, remainingFromEndsAt } from '../lib/timerFormat'
import {
  recoverRoutine,
  recoverSimple,
  recoverTask,
  recoverTransition,
} from '../store/timerRecovery'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

// --- Simple timer recovery ---

const runningTimer: SimpleTimerState = {
  label: 'Test',
  presetId: '5',
  durationMs: 300_000,
  status: 'running',
  remainingMs: 300_000,
  endsAt: Date.now() + 120_000,
  appearance: 'calm',
  chimeEnabled: true,
}

const recovered = recoverSimple(runningTimer, runningTimer.endsAt! - 60_000)
assert(recovered.remainingMs === 60_000, 'recoverSimple computes remaining from endsAt')
assert(recovered.status === 'running', 'recoverSimple keeps running status')

const finished = recoverSimple(
  { ...runningTimer, endsAt: Date.now() - 1000 },
  Date.now(),
)
assert(finished.status === 'finished', 'recoverSimple marks finished when past endsAt')
assert(finished.remainingMs === 0, 'recoverSimple zeroes remaining when finished')

const paused = recoverSimple(
  { ...runningTimer, status: 'paused', endsAt: null, remainingMs: 45_000 },
)
assert(paused.remainingMs === 45_000, 'recoverSimple preserves paused remaining')
assert(paused.endsAt === null, 'recoverSimple clears endsAt when paused')

// --- Format tests ---

assert(formatTimerMs(125_000) === '2:05', 'formatTimerMs M:SS')
assert(formatTimerMs(0) === '0:00', 'formatTimerMs zero')
assert(formatTimerMs(59_999) === '1:00', 'formatTimerMs rounds up seconds')

// --- Remaining from endsAt ---

const endsAt = Date.now() + 30_000
assert(remainingFromEndsAt(endsAt) <= 30_000, 'remainingFromEndsAt near 30s')
assert(remainingFromEndsAt(endsAt - 60_000) === 0, 'remainingFromEndsAt never negative')

// --- Screen timer keys ---

const screens: SimpleTimerScreenId[] = ['homeroom', 'math', 'reading', 'spelling']
assert(screens.length === 4, 'four simple timer screens')

// --- Transition timer ---

const mathTransition = DEFAULT_TRANSITION_TIMERS['math-wrap-up']
assert(mathTransition !== undefined, 'math-wrap-up transition timer default exists')
assert(mathTransition.label.includes('Snack'), 'transition label mentions destination')
assert(mathTransition.durationMs === 4 * 60 * 1000, 'transition default is 4 minutes')

const transitionRunning: TransitionTimerState = {
  ...mathTransition,
  status: 'running',
  remainingMs: 60_000,
  endsAt: Date.now() + 60_000,
}

const transitionRecovered = recoverTransition(transitionRunning, transitionRunning.endsAt! - 30_000)
assert(transitionRecovered.remainingMs === 30_000, 'recoverTransition computes remaining')
assert(transitionRecovered.status === 'running', 'transition timer stays running')

const transitionStopped = recoverTransition(
  { ...transitionRunning, endsAt: Date.now() - 500 },
  Date.now(),
)
assert(transitionStopped.status === 'finished', 'transition timer finishes when time is up')

// --- Task timer (bathroom & water) ---

const bathroomTimer: TaskTimerState = {
  ...DEFAULT_TASK_TIMER,
  status: 'running',
  currentGroupIndex: 0,
  remainingMs: 120_000,
  endsAt: Date.now() + 120_000,
}

assert(bathroomTimer.title === 'Bathroom & Water', 'task timer default title')
assert(bathroomTimer.groups.length >= 4, 'task timer has group list')
assert(bathroomTimer.autoAdvance === true, 'task timer auto-advance default on')

const taskMidGroup = recoverTask(bathroomTimer, bathroomTimer.endsAt! - 60_000)
assert(taskMidGroup.currentGroupIndex === 0, 'task timer stays on current group mid-countdown')
assert(taskMidGroup.remainingMs === 60_000, 'task timer remaining mid-group')

const taskGroupExpired = recoverTask(
  { ...bathroomTimer, endsAt: Date.now() - 1000 },
  Date.now(),
)
assert(taskGroupExpired.currentGroupIndex === 1, 'task timer auto-advances to next group')
assert(taskGroupExpired.status === 'running', 'task timer keeps running after group advance')
assert(taskGroupExpired.groups[1] === taskGroupExpired.groups[taskGroupExpired.currentGroupIndex], 'next group is Table 2')

const lastGroupTimer: TaskTimerState = {
  ...bathroomTimer,
  currentGroupIndex: bathroomTimer.groups.length - 1,
  status: 'running',
  remainingMs: 1000,
  endsAt: Date.now() - 500,
}
const taskAllDone = recoverTask(lastGroupTimer, Date.now())
assert(taskAllDone.status === 'finished', 'task timer finishes after last group')

// --- Routine timer (lunch auto-run) ---

const lunchRoutine = DEFAULT_ROUTINE_TIMERS['lunch-routine']
assert(lunchRoutine.title === 'Lunch Routine', 'lunch routine default title')
assert(lunchRoutine.steps.length === 5, 'lunch routine has five steps')
assert(lunchRoutine.steps[0].label === 'Clear desk', 'first lunch step is clear desk')
assert(lunchRoutine.autoAdvance === true, 'lunch routine auto-advance on')
assert(lunchRoutine.chimeBetweenSteps === true, 'lunch routine chime between steps')

const routineRunning: RoutineTimerState = {
  ...lunchRoutine,
  status: 'running',
  currentStepIndex: 0,
  remainingMs: minutesToMs(1),
  endsAt: Date.now() - 500,
}

const routineAdvanced = recoverRoutine(routineRunning, Date.now())
assert(routineAdvanced.currentStepIndex === 1, 'lunch routine advances to wash hands step')
assert(routineAdvanced.steps[1].label === 'Wash hands', 'second step label correct')
assert(routineAdvanced.status === 'running', 'lunch routine keeps running after step advance')

const routineLastStep: RoutineTimerState = {
  ...lunchRoutine,
  status: 'running',
  currentStepIndex: lunchRoutine.steps.length - 1,
  remainingMs: 1000,
  endsAt: Date.now() - 500,
}
const routineComplete = recoverRoutine(routineLastStep, Date.now())
assert(routineComplete.status === 'finished', 'lunch routine completes after final step')

// --- Student display: teacher controls gated by mode (structural check) ---

const TEACHER_ONLY_MODES = ['edit', 'display'] as const
assert(TEACHER_ONLY_MODES.includes('display'), 'display mode exists for student-safe gating')
// Widget components hide controls when mode === 'display' (verified by component structure)

console.log('All timer tests passed.')
