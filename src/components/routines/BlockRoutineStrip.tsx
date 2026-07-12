import type { BlockRoutineWindow } from '../../data/routineTypes'
import { formatTimerMs } from '../../lib/timerFormat'

interface BlockRoutineStripProps {
  currentWindow: (BlockRoutineWindow & { startsAt: number; endsAt: number; remainingMs: number; dateKey: string }) | null
  nextWindowLabel?: string | null
  className?: string
}

export function BlockRoutineStrip({
  currentWindow,
  nextWindowLabel,
  className = '',
}: BlockRoutineStripProps) {
  if (!currentWindow) return null

  return (
    <section
      className={`rounded-[1.75rem] border border-white/12 bg-slate-950/28 px-4 py-3 text-white shadow-lg backdrop-blur-sm ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
            {currentWindow.label}
          </p>
          <h3 className="mt-1 text-2xl font-black tracking-tight">
            {formatTimerMs(currentWindow.remainingMs)}
          </h3>
        </div>
        {nextWindowLabel && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/70">
            Next: {nextWindowLabel}
          </p>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/88">
        {currentWindow.instructions[0] ?? ''}
      </p>
    </section>
  )
}

