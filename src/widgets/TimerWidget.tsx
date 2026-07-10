import type { AppMode } from '../data/types'
import { TIMER_PRESETS } from '../data/timerDefaults'
import type { SimpleTimerScreenId, TimerPresetId } from '../data/timerTypes'
import { formatTimerMs, msToWholeMinutes } from '../lib/timerFormat'
import { useSimpleTimerTick } from '../hooks/useTimerTick'
import { useTimerStore } from '../store/timerStore'

interface TimerWidgetProps {
  screenId: SimpleTimerScreenId
  mode: AppMode
  className?: string
  /** Larger type for display-mode classroom projection. */
  large?: boolean
}

const controlBtn =
  'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

const primaryBtn =
  'rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

export function TimerWidget({
  screenId,
  mode,
  className = '',
  large = true,
}: TimerWidgetProps) {
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

  const isFinished = timer.status === 'finished'
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const displayTime = isFinished ? "Time's Up" : formatTimerMs(timer.remainingMs)

  const statusLabel =
    timer.status === 'running'
      ? 'Running'
      : timer.status === 'paused'
        ? 'Paused'
        : timer.status === 'finished'
          ? 'Finished'
          : 'Ready'

  return (
    <article
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/92 p-4 shadow-lg backdrop-blur-sm md:p-5 ${className}`}
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 md:text-base">
          {timer.label}
        </p>

        <p
          className={`font-bold tabular-nums tracking-tight ${
            isFinished
              ? 'text-rose-700'
              : isRunning
                ? 'text-slate-900'
                : 'text-slate-800'
          } ${
            large
              ? isFinished
                ? 'text-4xl md:text-5xl lg:text-6xl'
                : 'text-6xl md:text-7xl lg:text-8xl'
              : isFinished
                ? 'text-3xl md:text-4xl'
                : 'text-5xl md:text-6xl'
          }`}
          aria-live="polite"
        >
          {displayTime}
        </p>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {statusLabel}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {!isRunning && !isPaused && (
            <button
              type="button"
              className={primaryBtn}
              onClick={() => start(screenId)}
            >
              Start
            </button>
          )}
          {isRunning && (
            <button
              type="button"
              className={primaryBtn}
              onClick={() => pause(screenId)}
            >
              Pause
            </button>
          )}
          {isPaused && (
            <button
              type="button"
              className={primaryBtn}
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
      </div>

      {mode === 'edit' && (
        <div className="mt-3 space-y-2 border-t border-slate-200/80 pt-3">
          <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            Label
            <input
              type="text"
              value={timer.label}
              onChange={(event) => setLabel(screenId, event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            />
          </label>

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

          {timer.presetId === 'custom' && (
            <label className="block text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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

          <p className="text-left text-[11px] text-slate-500">
            Duration presets only — not bell schedule times.
          </p>
        </div>
      )}
    </article>
  )
}
