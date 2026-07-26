import type { SimpleTimerState } from '../data/timerTypes'

/** Extract timer recovery logic for unit testing. */
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
