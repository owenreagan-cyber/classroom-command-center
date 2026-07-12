interface LauncherDockProps {
  mode: 'edit' | 'display'
  className?: string
}

const LAUNCHERS = [
  { label: 'Timer', hint: 'Countdown tools', icon: '⏱' },
  { label: 'Random Student', hint: 'Picker and stars', icon: '🎲' },
  { label: 'Group Maker', hint: 'Placeholder only', icon: '◫' },
  { label: 'Random Reader', hint: 'Placeholder only', icon: 'A' },
  { label: 'Voice Level', hint: 'Noise / traffic light', icon: '◉' },
  { label: 'Traffic Light', hint: 'Classroom signal', icon: '⚑' },
  { label: 'Music', hint: 'Future launcher', icon: '♫' },
  { label: 'More', hint: 'Expanded tools', icon: '⋯' },
] as const

export function LauncherDock({ mode, className = '' }: LauncherDockProps) {
  const compact = mode === 'display'

  return (
    <nav
      aria-label="Launcher dock"
      className={`rounded-2xl border border-white/12 bg-slate-950/30 px-2 py-2 shadow-xl backdrop-blur-sm ${className}`}
    >
      <div className={`grid ${compact ? 'grid-cols-4 gap-1.5' : 'grid-cols-4 gap-2'}`}>
        {LAUNCHERS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`group relative flex flex-col items-center justify-center rounded-xl border border-white/8 bg-white/5 text-white transition hover:border-cyan-300/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 ${
              compact ? 'h-12 px-1 py-1' : 'h-16 px-2 py-2'
            }`}
            title={`${item.label}${item.hint ? ` - ${item.hint}` : ''}`}
            aria-label={item.label}
          >
            <span className={`${compact ? 'text-lg' : 'text-xl'} leading-none`}>
              {item.icon}
            </span>
            {!compact && (
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-50/90">
                {item.label}
              </span>
            )}
            <span className="sr-only">{item.hint}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

