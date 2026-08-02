import type {
  RoutineTimerState,
  SimpleTimerState,
  TaskTimerState,
  TransitionTimerState,
} from '../data/timerTypes'
import { minutesToMs } from '../lib/timerFormat'

/** Extract simple timer recovery logic for unit testing. */
export function recoverSimple(timer: SimpleTimerState, now = Date.now()): SimpleTimerState {
  if (timer.status !== 'running' || timer.endsAt === null) {
    return {
      ...timer,
      remainingMs: Math.max(0, timer.remainingMs),
      endsAt: timer.status === 'running' ? timer.endsAt : null,
    }
  }

  const remainingMs = Math.max(0, timer.endsAt - now)
  if (remainingMs <= 0) {
    return {
      ...timer,
      status: 'finished',
      remainingMs: 0,
      endsAt: null,
    }
  }

  return { ...timer, remainingMs }
}

export function recoverTransition(
  timer: TransitionTimerState,
  now = Date.now(),
): TransitionTimerState {
  return recoverSimple(timer, now)
}

function advanceThroughSteps<T extends { durationMinutes: number }>(
  steps: T[],
  startIndex: number,
  signedRemaining: number,
): { index: number; remainingMs: number; finished: boolean } {
  let currentIndex = startIndex
  let remaining = signedRemaining

  while (remaining <= 0) {
    const nextIndex = currentIndex + 1
    if (nextIndex >= steps.length) {
      return { index: steps.length - 1, remainingMs: 0, finished: true }
    }
    const overrun = -remaining
    currentIndex = nextIndex
    remaining = minutesToMs(steps[nextIndex].durationMinutes) - overrun
  }

  return { index: currentIndex, remainingMs: Math.max(0, remaining), finished: false }
}

export function recoverRoutine(
  timer: RoutineTimerState,
  now = Date.now(),
): RoutineTimerState {
  if (timer.steps.length === 0) {
    return {
      ...timer,
      status: 'finished',
      currentStepIndex: 0,
      remainingMs: 0,
      endsAt: null,
    }
  }

  let currentStepIndex = Math.min(
    Math.max(0, timer.currentStepIndex),
    timer.steps.length - 1,
  )
  let remainingMs = Math.max(0, timer.remainingMs)
  let endsAt = timer.endsAt
  const status = timer.status

  if (status === 'running' && endsAt !== null) {
    const signedRemaining = endsAt - now
    const advanced = advanceThroughSteps(timer.steps, currentStepIndex, signedRemaining)

    if (advanced.finished) {
      return {
        ...timer,
        status: 'finished',
        currentStepIndex: timer.steps.length - 1,
        remainingMs: 0,
        endsAt: null,
      }
    }

    currentStepIndex = advanced.index
    remainingMs = advanced.remainingMs
    endsAt = now + remainingMs
  }

  if (status === 'running' && remainingMs <= 0) {
    return {
      ...timer,
      status: 'finished',
      currentStepIndex: timer.steps.length - 1,
      remainingMs: 0,
      endsAt: null,
    }
  }

  return {
    ...timer,
    status,
    currentStepIndex,
    remainingMs,
    endsAt: status === 'running' ? endsAt : null,
  }
}

export function recoverTask(timer: TaskTimerState, now = Date.now()): TaskTimerState {
  if (timer.groups.length === 0) {
    return {
      ...timer,
      status: 'finished',
      currentGroupIndex: 0,
      remainingMs: 0,
      endsAt: null,
    }
  }

  let currentGroupIndex = Math.min(
    Math.max(0, timer.currentGroupIndex),
    timer.groups.length - 1,
  )
  let remainingMs = Math.max(0, timer.remainingMs)
  let endsAt = timer.endsAt
  const status = timer.status

  if (status === 'running' && endsAt !== null) {
    let signedRemaining = endsAt - now

    while (signedRemaining <= 0 && timer.autoAdvance) {
      const nextIndex = currentGroupIndex + 1
      if (nextIndex >= timer.groups.length) {
        return {
          ...timer,
          status: 'finished',
          currentGroupIndex: timer.groups.length - 1,
          remainingMs: 0,
          endsAt: null,
        }
      }
      const overrun = -signedRemaining
      currentGroupIndex = nextIndex
      signedRemaining = timer.durationPerGroupMs - overrun
    }

    if (signedRemaining <= 0) {
      return {
        ...timer,
        status: 'finished',
        currentGroupIndex,
        remainingMs: 0,
        endsAt: null,
      }
    }

    remainingMs = Math.max(0, signedRemaining)
    endsAt = now + remainingMs
  }

  if (status === 'running' && remainingMs <= 0) {
    return {
      ...timer,
      status: 'finished',
      currentGroupIndex: timer.groups.length - 1,
      remainingMs: 0,
      endsAt: null,
    }
  }

  return {
    ...timer,
    status,
    currentGroupIndex,
    remainingMs,
    endsAt: status === 'running' ? endsAt : null,
  }
}
