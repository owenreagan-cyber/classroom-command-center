import type { AppMode } from '../data/types'
import type { PhaseStyleToken } from '../data/timerTypes'
import { formatTimerMs, minutesToMs } from '../lib/timerFormat'
import { boardCardShell } from '../lib/displayLayout'
import { usePhaseTimerTick } from '../hooks/useTimerTick'
import { useTimerStore } from '../store/timerStore'
import { TeacherHint } from './TeacherHint'

interface PhaseTimerCardProps {
  mode: AppMode
  className?: string
  /** Teacher-only hint — never shown in display mode. */
  teacherHint?: string
}

const controlBtn =
  'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50'

const primaryBtn =
  'rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800'

const displayPrimaryBtn =
  'board-timer-display-btn rounded-xl border border-slate-800 bg-slate-900 font-semibold uppercase tracking-wide text-white shadow-md transition hover:bg-slate-800'

const styleAccent: Record<PhaseStyleToken, string> = {
  calm: 'border-emerald-300/70 bg-emerald-50/80',
  focus: 'border-sky-300/70 bg-sky-50/80',
  cleanup: 'border-amber-300/70 bg-amber-50/80',
  transition: 'border-violet-300/70 bg-violet-50/80',
  default: 'border-slate-300/70 bg-slate-50/80',
}

export function PhaseTimerCard({
  mode,
  className = '',
  teacherHint,
}: PhaseTimerCardProps) {
  usePhaseTimerTick()

  const timer = useTimerStore((state) => state.phaseTimer)
  const start = useTimerStore((state) => state.startPhase)
  const pause = useTimerStore((state) => state.pausePhase)
  const resume = useTimerStore((state) => state.resumePhase)
  const reset = useTimerStore((state) => state.resetPhase)
  const setTitle = useTimerStore((state) => state.setPhaseTitle)
  const updatePhase = useTimerStore((state) => state.updatePhase)
  const setAppearance = useTimerStore((state) => state.setPhaseAppearance)
  const setChimeEnabled = useTimerStore((state) => state.setPhaseChimeEnabled)

  const isDisplay = mode === 'display'
  const isFinished = timer.status === 'finished'
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const current = timer.phases[timer.currentPhaseIndex]
  const next = timer.phases[timer.currentPhaseIndex + 1]
  const accent = styleAccent[current?.styleToken ?? 'default']

  const appearance = timer.appearance ?? 'calm'
  const chimeEnabled = timer.chimeEnabled ?? false

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

  const primaryButtonClass = isDisplay ? displayPrimaryBtn : primaryBtn

  // Calculate current phase total duration
  const currentPhaseDurationMs = current ? minutesToMs(current.durationMinutes) : 0
  const progressPercent = currentPhaseDurationMs > 0
    ? Math.max(0, Math.min(100, (timer.remainingMs / currentPhaseDurationMs) * 100))
    : 0

  const timerTextColors = {
    calm: {
      running: 'text-emerald-700',
      paused: 'text-slate-700',
      finished: 'text-emerald-700',
      idle: 'text-slate-700',
    },
    bold: {
      running: 'text-violet-950',
      paused: 'text-slate-900',
      finished: 'text-emerald-800',
      idle: 'text-slate-900',
    },
    minimal: {
      running: 'text-slate-800',
      paused: 'text-slate-800',
      finished: 'text-emerald-700',
      idle: 'text-slate-800',
    },
  } as const

  const progressBarColors = {
    calm: {
      running: 'bg-emerald-500',
      paused: 'bg-slate-300',
      finished: 'bg-emerald-500 animate-pulse',
      idle: 'bg-slate-300',
    },
    bold: {
      running: 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]',
      paused: 'bg-violet-300',
      finished: 'bg-emerald-500 animate-pulse',
      idle: 'bg-slate-300',
    },
    minimal: {
      running: 'bg-slate-600',
      paused: 'bg-slate-300',
      finished: 'bg-emerald-500 animate-pulse',
      idle: 'bg-slate-200',
    },
  } as const

  const currentTextClass = isFinished
    ? 'text-emerald-700'
    : isRunning
      ? timerTextColors[appearance].running
      : timerTextColors[appearance].paused

  return (
    <article className={`${boardCardShell(mode)} ${className}`}>
      {/* Complete celebratory pulsing overlay */}
      {isFinished && (
        <div className="absolute inset-0 bg-emerald-500/5 animate-[pulse_3s_infinite_ease-in-out] pointer-events-none z-10" />
      )}

      <div className={`flex min-h-0 flex-1 flex-col ${isDisplay ? 'gap-4' : 'gap-3'}`}>
        <div className="text-center relative flex flex-col items-center justify-center">
          {appearance !== 'minimal' && (
            <p
              className={`font-semibold uppercase tracking-[0.18em] text-slate-500 ${
                isDisplay ? 'text-base' : 'text-sm'
              }`}
            >
              {timer.title}
            </p>
          )}
          <p
            className={`mt-2 font-black tracking-tight tabular-nums ${currentTextClass} ${
              isFinished
                ? isDisplay
                  ? 'text-4xl md:text-5xl animate-[bounce_1.5s_infinite]'
                  : 'text-3xl md:text-4xl animate-[bounce_2s_infinite]'
                : isDisplay
                  ? 'text-6xl md:text-7xl lg:text-[4.5rem] lg:leading-none'
                  : 'text-5xl md:text-6xl lg:text-7xl'
            }`}
            aria-live="polite"
          >
            {displayTime}
          </p>

          {/* Optional Chime indicator badge */}
          {chimeEnabled && (
            <div className="absolute top-1 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-xs shadow-sm" title="Chime enabled">
              🔔
            </div>
          )}

          {appearance !== 'minimal' && (
            <p
              className={`mt-1 font-semibold uppercase tracking-[0.16em] text-slate-500 ${
                isDisplay ? 'text-sm' : 'text-xs'
              }`}
            >
              {statusLabel}
            </p>
          )}
        </div>

        {/* Phase progress indicator bar */}
        {!isFinished && current && (
          <div className="w-full flex justify-center px-1">
            <div className={`w-full max-w-[16rem] ${appearance === 'minimal' ? 'h-2' : 'h-3'} bg-slate-100 rounded-full overflow-hidden border border-slate-200/40`}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isRunning
                    ? progressBarColors[appearance].running
                    : isPaused
                      ? progressBarColors[appearance].paused
                      : progressBarColors[appearance].idle
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {!isFinished && current && (
          <div className={`rounded-2xl border p-3 ${accent} ${isDisplay ? 'p-4' : ''}`}>
            <p
              className={`font-semibold uppercase tracking-[0.14em] text-slate-500 ${
                isDisplay ? 'text-xs' : 'text-[11px]'
              }`}
            >
              Current phase
            </p>
            <p
              className={`mt-1 font-bold text-slate-900 ${
                isDisplay ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'
              }`}
            >
              {current.label}
            </p>
            <p
              className={`mt-1 text-slate-700 ${
                isDisplay ? 'text-base md:text-lg' : 'text-sm'
              }`}
            >
              {current.instructions}
            </p>
          </div>
        )}

        {!isFinished && !isDisplay && (
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
          <div
            className={`rounded-2xl border border-emerald-200 bg-emerald-50/80 text-center ${
              isDisplay ? 'p-4' : 'p-3'
            }`}
          >
            <p
              className={`font-bold text-emerald-800 ${
                isDisplay ? 'text-xl md:text-2xl' : 'text-lg'
              }`}
            >
              All phases complete
            </p>
            {!isDisplay && (
              <p className="mt-1 text-sm text-emerald-700">
                Reset when you are ready for the next group.
              </p>
            )}
          </div>
        )}

        {!isDisplay && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!isRunning && !isPaused && (
              <button type="button" className={primaryButtonClass} onClick={start}>
                Start
              </button>
            )}
            {isRunning && (
              <button type="button" className={primaryButtonClass} onClick={pause}>
                Pause
              </button>
            )}
            {isPaused && (
              <button type="button" className={primaryButtonClass} onClick={resume}>
                Resume
              </button>
            )}
            <button type="button" className={controlBtn} onClick={reset}>
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
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            />
          </label>

          {/* Appearance Presets Selection */}
          <div className="space-y-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Appearance Preset
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['calm', 'bold', 'minimal'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`rounded-lg py-1.5 text-xs font-semibold capitalize border ${
                    appearance === preset
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => setAppearance(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Chime sound safe placeholder toggle */}
          <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
            <input
              type="checkbox"
              id="phase-chime-toggle"
              checked={chimeEnabled}
              onChange={(e) => setChimeEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="phase-chime-toggle" className="cursor-pointer text-[11px] font-medium leading-normal text-slate-600 select-none">
              <span className="block font-bold text-slate-800">Chime Alert 🔔</span>
              Enable safe visual bell badge when routine finishes. Audio effects reserved for future local releases.
            </label>
          </div>

          {timer.phases.map((phase, index) => (
            <div
              key={phase.id}
              className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Phase {index + 1}
              </p>
              <label className="block text-xs font-semibold text-slate-600">
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
              <label className="block text-xs font-semibold text-slate-600">
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
              <label className="block text-xs font-semibold text-slate-600">
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

          <p className="text-[11px] text-slate-500">
            Phase durations are editable presets — not snack/lunch bell times.
          </p>
        </div>
      )}

      <TeacherHint mode={mode} text={teacherHint ?? ''} />
    </article>
  )
}
