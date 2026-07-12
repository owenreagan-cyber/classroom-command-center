interface CompactRealClockProps {
  now: number
  className?: string
  label?: string
}

export function CompactRealClock({
  now,
  className = '',
  label = 'Real clock',
}: CompactRealClockProps) {
  const time = new Date(now).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div
      className={`rounded-2xl border border-white/14 bg-slate-950/35 px-3 py-2 text-white shadow-lg backdrop-blur-sm ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/70">
        {label}
      </p>
      <p className="mt-1 text-xl font-black tabular-nums tracking-tight">
        {time}
      </p>
    </div>
  )
}

