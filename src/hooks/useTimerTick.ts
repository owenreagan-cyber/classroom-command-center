import { useEffect } from 'react'
import { useTimerStore, ensureTransitionTimer, ensureTaskTimer, ensureRoutineTimer } from '../store/timerStore'
import type { SimpleTimerScreenId } from '../data/timerTypes'

/** Keeps running timers accurate via wall-clock sync (~4×/sec). */
export function useSimpleTimerTick(screenId: SimpleTimerScreenId) {
  const status = useTimerStore((state) => state.simpleTimers[screenId].status)
  const sync = useTimerStore((state) => state.syncSimple)

  useEffect(() => {
    sync(screenId)
    if (status !== 'running') return

    const id = window.setInterval(() => sync(screenId), 250)
    return () => window.clearInterval(id)
  }, [screenId, status, sync])
}

export function usePhaseTimerTick() {
  const status = useTimerStore((state) => state.phaseTimer.status)
  const sync = useTimerStore((state) => state.syncPhase)

  useEffect(() => {
    sync()
    if (status !== 'running') return

    const id = window.setInterval(() => sync(), 250)
    return () => window.clearInterval(id)
  }, [status, sync])
}

export function useTransitionTimerTick(pageId: string) {
  const status = useTimerStore(
    (state) => ensureTransitionTimer(state.transitionTimers, pageId).status,
  )
  const sync = useTimerStore((state) => state.syncTransition)

  useEffect(() => {
    sync(pageId)
    if (status !== 'running') return

    const id = window.setInterval(() => sync(pageId), 250)
    return () => window.clearInterval(id)
  }, [pageId, status, sync])
}

export function useTaskTimerTick(taskId: string) {
  const status = useTimerStore(
    (state) => ensureTaskTimer(state.taskTimers, taskId).status,
  )
  const sync = useTimerStore((state) => state.syncTask)

  useEffect(() => {
    sync(taskId)
    if (status !== 'running') return

    const id = window.setInterval(() => sync(taskId), 250)
    return () => window.clearInterval(id)
  }, [taskId, status, sync])
}

export function useRoutineTimerTick(routineId: string) {
  const status = useTimerStore(
    (state) => ensureRoutineTimer(state.routineTimers, routineId).status,
  )
  const sync = useTimerStore((state) => state.syncRoutineTimer)

  useEffect(() => {
    sync(routineId)
    if (status !== 'running') return

    const id = window.setInterval(() => sync(routineId), 250)
    return () => window.clearInterval(id)
  }, [routineId, status, sync])
}
