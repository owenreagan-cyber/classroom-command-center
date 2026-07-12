import type { RoutinePhaseState, RoutineSuggestion } from '../../data/routineTypes'
import { formatTimerMs } from '../../lib/timerFormat'

interface RoutineBannerProps {
  phase: RoutinePhaseState | null
  nextBlockLabel?: string | null
  currentBlockLabel?: string | null
  suggestion?: RoutineSuggestion
  onSuggestionClick?: () => void
  className?: string
  compact?: boolean
  finishedLabel?: string
}

export function RoutineBanner({
  phase,
  nextBlockLabel,
  currentBlockLabel,
  suggestion,
  onSuggestionClick,
  className = '',
  compact = false,
  finishedLabel = 'Ready for the next block',
}: RoutineBannerProps) {
  const activeLabel = phase?.label ?? finishedLabel
  const countdown = phase ? formatTimerMs(phase.remainingMs) : null
  const instruction = phase?.instructions?.[0]
  const extraInstructions = phase?.instructions?.slice(1) ?? []

  return (
    <section
      className={`rounded-[2rem] border border-white/14 bg-slate-950/28 p-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)] backdrop-blur-sm ${className}`}
    >
      <div className={`flex ${compact ? 'items-start gap-4' : 'items-start justify-between gap-6'}`}>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-cyan-100/70">
            {currentBlockLabel ?? 'Current block'}
          </p>
          <h2 className={`mt-2 font-black tracking-tight ${compact ? 'text-4xl' : 'text-5xl lg:text-6xl'}`}>
            {activeLabel}
          </h2>
          {countdown && (
            <p className="mt-2 text-2xl font-bold tabular-nums text-cyan-50/95">
              {countdown}
            </p>
          )}
          {instruction && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/90">
              {instruction}
            </p>
          )}
          {extraInstructions.length > 0 && !compact && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {extraInstructions.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-sm text-white/88"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        {suggestion && onSuggestionClick && (
          <button
            type="button"
            onClick={onSuggestionClick}
            className="shrink-0 rounded-2xl border border-cyan-200/40 bg-cyan-100/12 px-4 py-3 text-left text-sm font-semibold text-cyan-50 transition hover:bg-cyan-100/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
          >
            <span className="block text-[10px] uppercase tracking-[0.26em] text-cyan-100/70">
              Teacher action
            </span>
            <span className="mt-1 block text-lg font-black">
              {suggestion.label}
            </span>
            {nextBlockLabel && (
              <span className="mt-1 block text-xs text-cyan-100/75">
                Next block: {nextBlockLabel}
              </span>
            )}
          </button>
        )}
      </div>
    </section>
  )
}

