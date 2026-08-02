import type { AppMode } from '../data/types'
import type { PhaseStyleToken } from '../data/timerTypes'
import { formatTimerMs, minutesToMs } from '../lib/timerFormat'
import { boardCardShell } from '../lib/displayLayout'
import { useRoutineTimerTick } from '../hooks/useTimerTick'
import { useTimerStore, ensureRoutineTimer } from '../store/timerStore'
import { TeacherHint } from './TeacherHint'

const DEFAULT_ROUTINE_ID = 'lunch-routine'

interface RoutineTimerWidgetProps {
  routineId?: string
  mode: AppMode
  className?: string
  teacherHint?: string
}

const controlBtn =
  'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50'

const primaryBtn =
  'rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800'

const styleAccent: Record<PhaseStyleToken, string> = {
  calm: 'border-emerald-300/70 bg-emerald-50/80',
  focus: 'border-sky-300/70 bg-sky-50/80',
  cleanup: 'border-amber-300/70 bg-amber-50/80',
  transition: 'border-violet-300/70 bg-violet-50/80',
  default: 'border-slate-300/70 bg-slate-50/80',
}

export function RoutineTimerWidget({
  routineId = DEFAULT_ROUTINE_ID,
  mode,
  className = '',
  teacherHint,
}: RoutineTimerWidgetProps) {
  useRoutineTimerTick(routineId)

  const timer = useTimerStore((state) => ensureRoutineTimer(state.routineTimers, routineId))
  const start = useTimerStore((state) => state.startRoutine)
  const pause = useTimerStore((state) => state.pauseRoutineTimer)
  const resume = useTimerStore((state) => state.resumeRoutineTimer)
  const reset = useTimerStore((state) => state.resetRoutineTimer)
  const setTitle = useTimerStore((state) => state.setRoutineTitle)
  const setAutoAdvance = useTimerStore((state) => state.setRoutineAutoAdvance)
  const setChimeBetweenSteps = useTimerStore((state) => state.setRoutineChimeBetweenSteps)
  const updateStep = useTimerStore((state) => state.updateRoutineStep)

  const isDisplay = mode === 'display'
  const isFinished = timer.status === 'finished'
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const current = timer.steps[timer.currentStepIndex]
  const next = timer.steps[timer.currentStepIndex + 1]
  const accent = styleAccent[current?.styleToken ?? 'default']

  const currentStepDurationMs = current ? minutesToMs(current.durationMinutes) : 0
  const progressPercent = currentStepDurationMs > 0
    ? Math.max(0, Math.min(100, (timer.remainingMs / currentStepDurationMs) * 100))
    : 0

  const displayTime = isFinished ? 'Routine Complete' : formatTimerMs(timer.remainingMs)

  return (
    <article className={`${boardCardShell(mode)} ${className}`}>
      {isFinished && (
        <div className="absolute inset-0 bg-emerald-500/5 animate-[pulse_3s_infinite_ease-in-out] pointer-events-none z-10" />
      )}

      <div className={`flex min-h-0 flex-1 flex-col ${isDisplay ? 'gap-4' : 'gap-3'}`}>
        <div className="text-center">
          <p className={`font-semibold uppercase tracking-[0.18em] text-slate-500 ${isDisplay ? 'text-base' : 'text-sm'}`}>
            {timer.title}
          </p>
          <p
            className={`mt-2 font-black tabular-nums tracking-tight ${
              isFinished ? 'text-emerald-700' : 'text-emerald-800'
            } ${isDisplay ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl'}`}
            aria-live="polite"
          >
            {displayTime}
          </p>
          {timer.chimeBetweenSteps && (
            <span className="mt-1 inline-block text-xs text-amber-700" title="Chime between steps">
              🔔
            </span>
          )}
        </div>

        {!isFinished && current && (
          <>
            <div className="mx-auto h-3 w-full max-w-[16rem] rounded-full overflow-hidden border border-slate-200/40 bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isRunning ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className={`rounded-2xl border p-3 ${accent} ${isDisplay ? 'p-4' : ''}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Current step
              </p>
              <p className={`mt-1 font-bold text-slate-900 ${isDisplay ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                {current.label}
              </p>
              {current.instructions && (
                <p className={`mt-1 text-slate-700 ${isDisplay ? 'text-base' : 'text-sm'}`}>
                  {current.instructions}
                </p>
              )}
            </div>

            {next && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Next step
                </p>
                <p className={`mt-1 font-semibold text-slate-800 ${isDisplay ? 'text-lg' : 'text-base'}`}>
                  {next.label}
                </p>
              </div>
            )}
          </>
        )}

        {isFinished && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
            <p className="font-bold text-emerald-800">All steps complete</p>
          </div>
        )}

        {!isDisplay && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!isRunning && !isPaused && (
              <button type="button" className={primaryBtn} onClick={() => start(routineId)}>
                Start
              </button>
            )}
            {isRunning && (
              <button type="button" className={primaryBtn} onClick={() => pause(routineId)}>
                Pause
              </button>
            )}
            {isPaused && (
              <button type="button" className={primaryBtn} onClick={() => resume(routineId)}>
                Resume
              </button>
            )}
            <button type="button" className={controlBtn} onClick={() => reset(routineId)}>
              Reset
            </button>
          </div>
        )}
      </div>

      {mode === 'edit' && (
        <div className="mt-3 max-h-[42%] space-y-3 overflow-y-auto border-t border-slate-200/80 pt-3 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Routine title
            <input
              type="text"
              value={timer.title}
              onChange={(e) => setTitle(routineId, e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={timer.autoAdvance}
              onChange={(e) => setAutoAdvance(routineId, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Auto-advance steps
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={timer.chimeBetweenSteps}
              onChange={(e) => setChimeBetweenSteps(routineId, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Chime between steps 🔔
          </label>
          {timer.steps.map((step, index) => (
            <div key={step.id} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Step {index + 1}
              </p>
              <label className="block text-xs font-semibold text-slate-600">
                Label
                <input
                  type="text"
                  value={step.label}
                  onChange={(e) => updateStep(routineId, step.id, { label: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Duration (minutes)
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={step.durationMinutes}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    if (Number.isFinite(value)) {
                      updateStep(routineId, step.id, {
                        durationMinutes: Math.max(0, Math.min(99, value)),
                      })
                    }
                  }}
                  className="mt-1 w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                />
              </label>
            </div>
          ))}
        </div>
      )}

      <TeacherHint mode={mode} text={teacherHint ?? ''} />
    </article>
  )
}
