import { useEffect } from 'react'
import { useTimerStore } from '../store/timerStore'
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
