import type { AppMode, VoiceLevel } from '../data/types'
import { boardCardShell } from '../lib/displayLayout'

interface VoiceLevelWidgetProps {
  level: VoiceLevel
  mode: AppMode
  label?: string
  className?: string
}

const LEVEL_CONFIG: Record<
  Exclude<VoiceLevel, 'off'>,
  {
    label: string
    expectation: string
    colorClass: string
    bgClass: string
    indicatorClass: string
    glowClass: string
  }
> = {
  silent: {
    label: 'Silent',
    expectation: 'Voices off',
    colorClass: 'text-rose-500',
    bgClass: 'bg-rose-500/10',
    indicatorClass: 'bg-rose-500',
    glowClass: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]',
  },
  whisper: {
    label: 'Whisper',
    expectation: 'Whisper level only',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
    indicatorClass: 'bg-amber-500',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
  },
  normal: {
    label: 'Normal Voice',
    expectation: 'Speaking voice',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
    indicatorClass: 'bg-emerald-500',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
  },
}

export function VoiceLevelWidget({
  level,
  mode,
  label = 'Voice Level',
  className = '',
}: VoiceLevelWidgetProps) {
  if (level === 'off') {
    if (mode === 'display') return null

    return (
      <article className={`${boardCardShell(mode)} ${className} opacity-50`}>
        <div className="flex flex-col items-center justify-center py-4 text-slate-400">
          <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
          <p className="text-xs italic">Guide Inactive</p>
        </div>
      </article>
    )
  }

  const config = LEVEL_CONFIG[level]
  const isDisplay = mode === 'display'

  return (
    <article className={`${boardCardShell(mode)} ${className} overflow-hidden border-slate-200/60 bg-white/90`}>
      <div className={`flex items-center gap-4 ${isDisplay ? 'p-5 md:p-6' : 'p-4 md:p-5'}`}>
        <div
          className="flex shrink-0 flex-col gap-2 rounded-full bg-slate-900/10 p-2 shadow-inner"
          aria-hidden="true"
        >
          {(['silent', 'whisper', 'normal'] as const).map((l) => {
            const isActive = l === level
            const c = LEVEL_CONFIG[l]
            return (
              <div
                key={l}
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? `${c.indicatorClass} ${c.glowClass} scale-110`
                    : 'bg-slate-300/40'
                } ${isDisplay ? 'h-6 w-6' : 'h-5 w-5'}`}
              />
            )
          })}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`font-black uppercase tracking-[0.2em] text-slate-500 ${
              isDisplay ? 'text-xs md:text-sm' : 'text-[10px]'
            }`}
          >
            {label}
          </p>
          <h2
            className={`mt-0.5 truncate font-black uppercase tracking-tight ${config.colorClass} ${
              isDisplay ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'
            }`}
          >
            {config.label}
          </h2>
          <p
            className={`mt-0.5 font-bold uppercase tracking-wide text-slate-600 ${
              isDisplay ? 'text-sm md:text-base' : 'text-xs md:text-sm'
            }`}
          >
            {config.expectation}
          </p>
        </div>

        {isDisplay && (
          <div className="relative flex h-10 w-10 items-center justify-center" aria-hidden="true">
            <span className={`absolute h-full w-full animate-ping rounded-full opacity-20 ${config.indicatorClass}`} />
            <span className={`relative h-5 w-5 rounded-full ${config.indicatorClass} ${config.glowClass}`} />
          </div>
        )}
      </div>

      <div className={`h-1.5 w-full ${config.indicatorClass} opacity-50`} aria-hidden="true" />
    </article>
  )
}
