import type { AppMode, VibePageId } from '../data/types'
import { formatTimerMs, msToWholeMinutes } from '../lib/timerFormat'
import { boardCardShell } from '../lib/displayLayout'
import { useTransitionTimerTick } from '../hooks/useTimerTick'
import { useTimerStore, ensureTransitionTimer } from '../store/timerStore'
import { TeacherHint } from './TeacherHint'

interface TransitionTimerWidgetProps {
  pageId: VibePageId
  mode: AppMode
  className?: string
  teacherHint?: string
}

const controlBtn =
  'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

const primaryBtn =
  'rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40'

export function TransitionTimerWidget({
  pageId,
  mode,
  className = '',
  teacherHint,
}: TransitionTimerWidgetProps) {
  useTransitionTimerTick(pageId)

  const timer = useTimerStore((state) =>
    ensureTransitionTimer(state.transitionTimers, pageId),
  )
  const start = useTimerStore((state) => state.startTransition)
  const pause = useTimerStore((state) => state.pauseTransition)
  const resume = useTimerStore((state) => state.resumeTransition)
  const reset = useTimerStore((state) => state.resetTransition)
  const setLabel = useTimerStore((state) => state.setTransitionLabel)
  const setDuration = useTimerStore((state) => state.setTransitionDuration)

  const isDisplay = mode === 'display'
  const isFinished = timer.status === 'finished'
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const displayTime = isFinished ? "Time's Up" : formatTimerMs(timer.remainingMs)

  const progressPercent = timer.durationMs > 0
    ? Math.max(0, Math.min(100, (timer.remainingMs / timer.durationMs) * 100))
    : 0

  return (
    <article className={`${boardCardShell(mode)} ${className}`}>
      {isFinished && (
        <div className="absolute inset-0 bg-violet-500/10 animate-[pulse_2s_infinite_ease-in-out] pointer-events-none z-10" />
      )}

      <div className={`flex min-h-0 flex-1 flex-col items-center justify-center text-center ${isDisplay ? 'gap-4' : 'gap-3'}`}>
        <p className={`font-bold uppercase tracking-[0.18em] text-violet-600 ${isDisplay ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>
          Transition
        </p>
        <p className={`font-bold text-slate-800 ${isDisplay ? 'text-xl md:text-2xl' : 'text-lg'}`}>
          {timer.label}
        </p>

        <p
          className={`font-black tabular-nums tracking-tight ${
            isFinished ? 'text-rose-700' : isRunning ? 'text-violet-800' : 'text-slate-700'
          } ${isDisplay ? 'text-6xl md:text-7xl lg:text-8xl' : 'text-5xl md:text-6xl'}`}
          aria-live="polite"
        >
          {displayTime}
        </p>

        <div className="h-3 w-full max-w-[16rem] rounded-full overflow-hidden border border-slate-200/40 bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFinished ? 'bg-rose-500 animate-pulse' : isRunning ? 'bg-violet-500' : 'bg-slate-300'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {!isDisplay && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!isRunning && !isPaused && (
              <button type="button" className={primaryBtn} onClick={() => start(pageId)}>
                Start
              </button>
            )}
            {isRunning && (
              <button type="button" className={primaryBtn} onClick={() => pause(pageId)}>
                Pause
              </button>
            )}
            {isPaused && (
              <button type="button" className={primaryBtn} onClick={() => resume(pageId)}>
                Resume
              </button>
            )}
            <button type="button" className={controlBtn} onClick={() => reset(pageId)}>
              Reset
            </button>
          </div>
        )}
      </div>

      {mode === 'edit' && (
        <div className="mt-3 space-y-3 border-t border-slate-200/80 pt-3 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Transition label
            <input
              type="text"
              value={timer.label}
              onChange={(e) => setLabel(pageId, e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Duration (minutes)
            <input
              type="number"
              min={0}
              max={99}
              value={msToWholeMinutes(timer.durationMs)}
              onChange={(e) => {
                const value = Number(e.target.value)
                if (Number.isFinite(value)) setDuration(pageId, value)
              }}
              className="mt-1 w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            />
          </label>
          <p className="text-[11px] text-slate-500">
            Saved per display screen. Example: Math → Snack and Shurley, 4 minutes.
          </p>
        </div>
      )}

      <TeacherHint mode={mode} text={teacherHint ?? ''} />
    </article>
  )
}
