import { useTimerStore, ensureTransitionTimer, ensureRoutineTimer } from '../../store/timerStore'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import type { CanvasWidget } from '../display-composer/types'

export function TimerWidgetContent({ widget }: { widget: CanvasWidget }) {
  const screen = useDisplayComposerStore((s) => {
    for (const id of s.order) {
      const scr = s.screens[id]
      if (scr?.widgets?.some((w) => w.id === widget.id)) return scr
    }
    return undefined
  })
  const timerKind = (widget.settings.timerKind as string) ?? screen?.timerWidget.kind ?? 'general'
  const timerId = ((widget.settings.timerId as string) ?? screen?.timerWidget.timerId ?? 'default') as string
  const timer = useTimerStore((s) => {
    if (timerKind === 'routine') return ensureRoutineTimer(s.routineTimers, timerId)
    return ensureTransitionTimer(s.transitionTimers, timerId)
  })
  const running = timer.status === 'running'
  const remaining = timer.remainingMs ?? 0
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  const label = (timer as { label?: string }).label ?? widget.label

  return (
    <div className="flex h-full flex-col items-center justify-center p-3 text-center">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 mb-1">{label}</span>
      <span className={`text-2xl font-black tabular-nums ${running ? 'text-cyan-300' : 'text-slate-200'}`}>
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-1">
        {timer.status === 'idle' ? 'Ready' : timer.status === 'running' ? 'Running' : timer.status === 'paused' ? 'Paused' : 'Done'}
      </span>
    </div>
  )
}

export function RoutineTimerContent({ widget }: { widget: CanvasWidget }) {
  const routineId = (widget.settings.routineId as string) ?? 'lunch-routine'
  const timer = useTimerStore((s) => ensureRoutineTimer(s.routineTimers, routineId))
  const steps = (timer as { steps?: Array<{ id: string; label: string; durationMinutes: number }> }).steps ?? []
  const currentStepIndex = (timer as { currentStepIndex?: number }).currentStepIndex ?? 0
  const currentStep = steps[currentStepIndex]
  const nextStep = currentStepIndex < steps.length - 1 ? steps[currentStepIndex + 1] : null
  const remaining = timer.remainingMs ?? 0
  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  const running = timer.status === 'running'

  return (
    <div className="flex h-full flex-col justify-center p-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 mb-1.5 text-center">
        {widget.label}
      </span>
      {currentStep ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-semibold text-cyan-200 truncate">{currentStep.label}</span>
            <span className={`text-base font-black tabular-nums shrink-0 ${running ? 'text-cyan-300' : 'text-slate-300'}`}>
              {mins}:{secs.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all duration-1000"
              style={{ width: `${currentStep.durationMinutes > 0 ? (remaining / (currentStep.durationMinutes * 60000)) * 100 : 0}%` }}
            />
          </div>
          {nextStep && <span className="text-[10px] text-slate-500 mt-1">Next: {nextStep.label}</span>}
        </>
      ) : (
        <span className="text-[11px] text-slate-400 text-center">No routine loaded</span>
      )}
    </div>
  )
}
