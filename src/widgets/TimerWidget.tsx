import type { AppMode } from '../data/types'
import { TIMER_PRESETS } from '../data/timerDefaults'
import type { SimpleTimerScreenId, TimerPresetId } from '../data/timerTypes'
import { formatTimerMs, msToWholeMinutes } from '../lib/timerFormat'
import { boardCardShell } from '../lib/displayLayout'
import { useSimpleTimerTick } from '../hooks/useTimerTick'
import { useTimerStore } from '../store/timerStore'
import { TeacherHint } from './TeacherHint'

interface TimerWidgetProps {
  screenId: SimpleTimerScreenId
  mode: AppMode
  className?: string
  /** Larger type for display-mode classroom projection. */
  large?: boolean
  /** Teacher-only hint — never shown in display mode. */
  teacherHint?: string
}

const controlBtn =
  'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

const primaryBtn =
  'rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

const displayPrimaryBtn =
  'board-timer-display-btn rounded-xl border border-slate-800 bg-slate-900 font-semibold uppercase tracking-wide text-white shadow-md transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

export function TimerWidget({
  screenId,
  mode,
  className = '',
  large = true,
  teacherHint,
}: TimerWidgetProps) {
  // Use our tick hook for wall-clock timer recovery/decrementing
  useSimpleTimerTick(screenId)

  const timer = useTimerStore((state) => state.simpleTimers[screenId])
  const start = useTimerStore((state) => state.startSimple)
  const pause = useTimerStore((state) => state.pauseSimple)
  const resume = useTimerStore((state) => state.resumeSimple)
  const reset = useTimerStore((state) => state.resetSimple)
  const addMinute = useTimerStore((state) => state.addMinuteSimple)
  const subtractMinute = useTimerStore((state) => state.subtractMinuteSimple)
  const setLabel = useTimerStore((state) => state.setSimpleLabel)
  const setPreset = useTimerStore((state) => state.setSimplePreset)
  const setCustomMinutes = useTimerStore((state) => state.setSimpleCustomMinutes)
  const setAppearance = useTimerStore((state) => state.setSimpleAppearance)
  const setChimeEnabled = useTimerStore((state) => state.setSimpleChimeEnabled)

  const isDisplay = mode === 'display'
  const isFinished = timer.status === 'finished'
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const displayTime = isFinished ? "Time's Up" : formatTimerMs(timer.remainingMs)

  const appearance = timer.appearance ?? 'calm'
  const chimeEnabled = timer.chimeEnabled ?? false

  const statusLabel =
    timer.status === 'running'
      ? 'Running'
      : timer.status === 'paused'
        ? 'Paused'
        : timer.status === 'finished'
          ? 'Finished'
          : 'Ready'

  const primaryButtonClass = isDisplay ? displayPrimaryBtn : primaryBtn

  // Percentage of remaining time (full = 100%, finished = 0%)
  const progressPercent = timer.durationMs > 0
    ? Math.max(0, Math.min(100, (timer.remainingMs / timer.durationMs) * 100))
    : 0

  const timerTextColors = {
    calm: {
      running: 'text-emerald-700',
      paused: 'text-slate-700',
      finished: 'text-rose-700',
      idle: 'text-slate-700',
    },
    bold: {
      running: 'text-indigo-950',
      paused: 'text-slate-900',
      finished: 'text-rose-700',
      idle: 'text-slate-900',
    },
    minimal: {
      running: 'text-slate-800',
      paused: 'text-slate-800',
      finished: 'text-rose-600',
      idle: 'text-slate-800',
    },
  } as const

  const progressBarColors = {
    calm: {
      running: 'bg-emerald-500',
      paused: 'bg-slate-300',
      finished: 'bg-rose-500 animate-pulse',
      idle: 'bg-slate-300',
    },
    bold: {
      running: 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
      paused: 'bg-indigo-300',
      finished: 'bg-rose-500 animate-pulse',
      idle: 'bg-indigo-200',
    },
    minimal: {
      running: 'bg-slate-600',
      paused: 'bg-slate-300',
      finished: 'bg-rose-500 animate-pulse',
      idle: 'bg-slate-200',
    },
  } as const

  const currentTextClass = isFinished
    ? 'text-rose-700'
    : isRunning
      ? timerTextColors[appearance].running
      : timerTextColors[appearance].paused

  return (
    <article className={`${boardCardShell(mode)} ${className}`}>
      {/* Time's Up pulse overlay */}
      {isFinished && (
        <div className="absolute inset-0 bg-rose-500/10 animate-[pulse_2s_infinite_ease-in-out] pointer-events-none z-10" />
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col items-center justify-center text-center ${
          isDisplay ? 'gap-4' : 'gap-3'
        }`}
      >
        {appearance !== 'minimal' && (
          <p
            className={`font-bold uppercase tracking-[0.18em] text-slate-500 ${
              isDisplay ? 'text-sm md:text-base' : 'text-xs md:text-sm'
            }`}
          >
            {timer.label}
          </p>
        )}

        <div className="relative flex flex-col items-center justify-center">
          <p
            className={`font-black tabular-nums tracking-tight ${currentTextClass} ${
              large
                ? isFinished
                  ? isDisplay
                    ? 'text-5xl md:text-6xl lg:text-7xl animate-[bounce_1s_infinite]'
                    : 'text-4xl md:text-5xl lg:text-6xl animate-[bounce_1.2s_infinite]'
                  : isDisplay
                    ? 'text-7xl md:text-8xl lg:text-[6.5rem] lg:leading-none'
                    : 'text-6xl md:text-7xl lg:text-8xl'
                : isFinished
                  ? 'text-3xl md:text-4xl'
                  : 'text-5xl md:text-6xl'
            }`}
            aria-live="polite"
          >
            {displayTime}
          </p>

          {/* Optional Chime indicator badge */}
          {chimeEnabled && (
            <div className="absolute -top-1 -right-8 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-xs shadow-sm" title="Chime enabled">
              🔔
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className={`w-full max-w-[16rem] ${appearance === 'minimal' ? 'h-2' : 'h-3'} bg-slate-100 rounded-full overflow-hidden border border-slate-200/40 relative`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFinished
                ? progressBarColors[appearance].finished
                : isRunning
                  ? progressBarColors[appearance].running
                  : isPaused
                    ? progressBarColors[appearance].paused
                    : progressBarColors[appearance].idle
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {appearance !== 'minimal' && (
          <p
            className={`font-semibold uppercase tracking-[0.16em] text-slate-500 ${
              isDisplay ? 'text-sm' : 'text-xs'
            }`}
          >
            {statusLabel}
          </p>
        )}

        {!isDisplay && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!isRunning && !isPaused && (
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => start(screenId)}
              >
                Start
              </button>
            )}
            {isRunning && (
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => pause(screenId)}
              >
                Pause
              </button>
            )}
            {isPaused && (
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => resume(screenId)}
              >
                Resume
              </button>
            )}
            <button
              type="button"
              className={controlBtn}
              onClick={() => reset(screenId)}
            >
              Reset
            </button>
            <button
              type="button"
              className={controlBtn}
              onClick={() => addMinute(screenId)}
            >
              +1 min
            </button>
            <button
              type="button"
              className={controlBtn}
              onClick={() => subtractMinute(screenId)}
              disabled={timer.remainingMs <= 0 && !isFinished}
            >
              −1 min
            </button>
          </div>
        )}
      </div>

      {mode === 'edit' && (
        <div className="mt-3 space-y-3 border-t border-slate-200/80 pt-3 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Label
            <input
              type="text"
              value={timer.label}
              onChange={(event) => setLabel(screenId, event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            />
          </label>

          <div className="space-y-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TIMER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    timer.presetId === preset.id
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-300 bg-white text-slate-700'
                  }`}
                  onClick={() => setPreset(screenId, preset.id as TimerPresetId)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {timer.presetId === 'custom' && (
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Custom minutes
              <input
                type="number"
                min={0}
                max={99}
                value={msToWholeMinutes(timer.durationMs)}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (Number.isFinite(value)) {
                    setCustomMinutes(screenId, value)
                  }
                }}
                className="mt-1 w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
              />
            </label>
          )}

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
                  onClick={() => setAppearance(screenId, preset)}
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
              id={`chime-toggle-${screenId}`}
              checked={chimeEnabled}
              onChange={(e) => setChimeEnabled(screenId, e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor={`chime-toggle-${screenId}`} className="cursor-pointer text-[11px] font-medium leading-normal text-slate-600 select-none">
              <span className="block font-bold text-slate-800">Chime Alert 🔔</span>
              Enable safe visual bell badge when timer finishes. Audio effects reserved for future local releases.
            </label>
          </div>

          <p className="text-[11px] text-slate-500">
            Duration presets only — not bell schedule times.
          </p>
        </div>
      )}

      <TeacherHint mode={mode} text={teacherHint ?? ''} />
    </article>
  )
}
