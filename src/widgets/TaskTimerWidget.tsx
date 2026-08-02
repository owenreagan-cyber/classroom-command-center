import type { AppMode } from '../data/types'
import { formatTimerMs, msToWholeMinutes } from '../lib/timerFormat'
import { boardCardShell } from '../lib/displayLayout'
import { useTaskTimerTick } from '../hooks/useTimerTick'
import { useTimerStore, ensureTaskTimer } from '../store/timerStore'
import { TeacherHint } from './TeacherHint'

const DEFAULT_TASK_ID = 'bathroom-water'

interface TaskTimerWidgetProps {
  taskId?: string
  mode: AppMode
  className?: string
  teacherHint?: string
}

const controlBtn =
  'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50'

const primaryBtn =
  'rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800'

export function TaskTimerWidget({
  taskId = DEFAULT_TASK_ID,
  mode,
  className = '',
  teacherHint,
}: TaskTimerWidgetProps) {
  useTaskTimerTick(taskId)

  const timer = useTimerStore((state) => ensureTaskTimer(state.taskTimers, taskId))
  const start = useTimerStore((state) => state.startTask)
  const pause = useTimerStore((state) => state.pauseTask)
  const resume = useTimerStore((state) => state.resumeTask)
  const reset = useTimerStore((state) => state.resetTask)
  const nextGroup = useTimerStore((state) => state.nextGroupTask)
  const setTitle = useTimerStore((state) => state.setTaskTitle)
  const setGroups = useTimerStore((state) => state.setTaskGroups)
  const setAutoAdvance = useTimerStore((state) => state.setTaskAutoAdvance)

  const isDisplay = mode === 'display'
  const isFinished = timer.status === 'finished'
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const currentGroup = timer.groups[timer.currentGroupIndex]
  const nextGroupName = timer.groups[timer.currentGroupIndex + 1]
  const displayTime = isFinished ? 'All Done' : formatTimerMs(timer.remainingMs)

  const progressPercent = timer.durationPerGroupMs > 0
    ? Math.max(0, Math.min(100, (timer.remainingMs / timer.durationPerGroupMs) * 100))
    : 0

  return (
    <article className={`${boardCardShell(mode)} ${className}`}>
      <div className={`flex min-h-0 flex-1 flex-col ${isDisplay ? 'gap-4' : 'gap-3'}`}>
        <div className="text-center">
          <p className={`font-semibold uppercase tracking-[0.18em] text-slate-500 ${isDisplay ? 'text-base' : 'text-sm'}`}>
            {timer.title}
          </p>
          <p
            className={`mt-2 font-black tabular-nums tracking-tight ${
              isFinished ? 'text-emerald-700' : 'text-sky-800'
            } ${isDisplay ? 'text-6xl md:text-7xl' : 'text-5xl md:text-6xl'}`}
            aria-live="polite"
          >
            {displayTime}
          </p>
        </div>

        <div className="mx-auto h-3 w-full max-w-[16rem] rounded-full overflow-hidden border border-slate-200/40 bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFinished ? 'bg-emerald-500' : isRunning ? 'bg-sky-500' : 'bg-slate-300'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {currentGroup && !isFinished && (
          <div className="rounded-2xl border border-sky-300/70 bg-sky-50/80 p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Current group
            </p>
            <p className={`mt-1 font-bold text-slate-900 ${isDisplay ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
              {currentGroup}
            </p>
          </div>
        )}

        {nextGroupName && !isFinished && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Up next
            </p>
            <p className={`mt-1 font-semibold text-slate-800 ${isDisplay ? 'text-lg' : 'text-base'}`}>
              {nextGroupName}
            </p>
          </div>
        )}

        {!isDisplay && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {!isRunning && !isPaused && (
              <button type="button" className={primaryBtn} onClick={() => start(taskId)}>
                Start
              </button>
            )}
            {isRunning && (
              <button type="button" className={primaryBtn} onClick={() => pause(taskId)}>
                Pause
              </button>
            )}
            {isPaused && (
              <button type="button" className={primaryBtn} onClick={() => resume(taskId)}>
                Resume
              </button>
            )}
            <button type="button" className={controlBtn} onClick={() => nextGroup(taskId)}>
              Next group
            </button>
            <button type="button" className={controlBtn} onClick={() => reset(taskId)}>
              Reset
            </button>
          </div>
        )}
      </div>

      {mode === 'edit' && (
        <div className="mt-3 max-h-[42%] space-y-3 overflow-y-auto border-t border-slate-200/80 pt-3 text-left">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Task name
            <input
              type="text"
              value={timer.title}
              onChange={(e) => setTitle(taskId, e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Groups (one per line)
            <textarea
              rows={4}
              value={timer.groups.join('\n')}
              onChange={(e) =>
                setGroups(
                  taskId,
                  e.target.value.split('\n').map((g) => g.trim()).filter(Boolean),
                )
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <input
              type="checkbox"
              checked={timer.autoAdvance}
              onChange={(e) => setAutoAdvance(taskId, e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Auto-advance to next group
          </label>
          <p className="text-[11px] text-slate-500">
            {msToWholeMinutes(timer.durationPerGroupMs)} min per group. Example: Bathroom &amp; Water rotation.
          </p>
        </div>
      )}

      <TeacherHint mode={mode} text={teacherHint ?? ''} />
    </article>
  )
}
