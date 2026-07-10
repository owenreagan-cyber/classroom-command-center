import type { AppMode } from '../data/types'
import type { PhaseStyleToken } from '../data/timerTypes'
import { formatTimerMs } from '../lib/timerFormat'
import { usePhaseTimerTick } from '../hooks/useTimerTick'
import { useTimerStore } from '../store/timerStore'

interface PhaseTimerCardProps {
  mode: AppMode
  className?: string
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

export function PhaseTimerCard({ mode, className = '' }: PhaseTimerCardProps) {
  usePhaseTimerTick()

  const timer = useTimerStore((state) => state.phaseTimer)
  const start = useTimerStore((state) => state.startPhase)
  const pause = useTimerStore((state) => state.pausePhase)
  const resume = useTimerStore((state) => state.resumePhase)
  const reset = useTimerStore((state) => state.resetPhase)
  const setTitle = useTimerStore((state) => state.setPhaseTitle)
  const updatePhase = useTimerStore((state) => state.updatePhase)

  const isFinished = timer.status === 'finished'
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const current = timer.phases[timer.currentPhaseIndex]
  const next = timer.phases[timer.currentPhaseIndex + 1]
  const accent = styleAccent[current?.styleToken ?? 'default']

  const displayTime = isFinished
    ? 'Routine Complete'
    : formatTimerMs(timer.remainingMs)

  const statusLabel =
    timer.status === 'running'
      ? 'Running'
      : timer.status === 'paused'
        ? 'Paused'
        : timer.status === 'finished'
          ? 'Complete'
          : 'Ready'

  return (
    <article
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/92 p-4 shadow-lg backdrop-blur-sm md:p-5 ${className}`}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {timer.title}
          </p>
          <p
            className={`mt-2 font-bold tracking-tight ${
              isFinished
                ? 'text-3xl text-emerald-700 md:text-4xl'
                : 'text-5xl text-slate-900 tabular-nums md:text-6xl lg:text-7xl'
            }`}
            aria-live="polite"
          >
            {displayTime}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {statusLabel}
          </p>
        </div>

        {!isFinished && current && (
          <div className={`rounded-2xl border p-3 ${accent}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Current phase
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
              {current.label}
            </p>
            <p className="mt-1 text-sm text-slate-700">{current.instructions}</p>
          </div>
        )}

        {!isFinished && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Next phase
            </p>
            <p className="mt-1 text-base font-semibold text-slate-800">
              {next ? next.label : 'Routine ends after this phase'}
            </p>
          </div>
        )}

        {isFinished && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
            <p className="text-lg font-bold text-emerald-800">
              All phases complete
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              Reset when you are ready for the next group.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2">
          {!isRunning && !isPaused && (
            <button type="button" className={primaryBtn} onClick={start}>
              Start
            </button>
          )}
          {isRunning && (
            <button type="button" className={primaryBtn} onClick={pause}>
              Pause
            </button>
          )}
          {isPaused && (
            <button type="button" className={primaryBtn} onClick={resume}>
              Resume
            </button>
          )}
          <button type="button" className={controlBtn} onClick={reset}>
            Reset
          </button>
        </div>
      </div>

      {mode === 'edit' && (
        <div className="mt-3 max-h-[42%] space-y-3 overflow-y-auto border-t border-slate-200/80 pt-3">
          <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            Routine title
            <input
              type="text"
              value={timer.title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            />
          </label>

          {timer.phases.map((phase, index) => (
            <div
              key={phase.id}
              className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Phase {index + 1}
              </p>
              <label className="block text-left text-xs font-semibold text-slate-600">
                Label
                <input
                  type="text"
                  value={phase.label}
                  onChange={(event) =>
                    updatePhase(phase.id, { label: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                />
              </label>
              <label className="block text-left text-xs font-semibold text-slate-600">
                Duration (minutes)
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={phase.durationMinutes}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    if (Number.isFinite(value)) {
                      updatePhase(phase.id, {
                        durationMinutes: Math.max(0, Math.min(99, value)),
                      })
                    }
                  }}
                  className="mt-1 w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                />
              </label>
              <label className="block text-left text-xs font-semibold text-slate-600">
                Instructions
                <textarea
                  value={phase.instructions}
                  rows={2}
                  onChange={(event) =>
                    updatePhase(phase.id, { instructions: event.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900"
                />
              </label>
            </div>
          ))}

          <p className="text-left text-[11px] text-slate-500">
            Phase durations are editable presets — not snack/lunch bell times.
          </p>
        </div>
      )}
    </article>
  )
}
