import { useState, useEffect } from 'react'
import { HTMLContainer } from 'tldraw'

export function ClockComponent({ label }: { label: string; w: number; h: number }) {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <HTMLContainer>
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-slate-950/80 px-4 py-2 text-white shadow-xl backdrop-blur-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-3xl font-black tabular-nums text-cyan-200">{time}</span>
      </div>
    </HTMLContainer>
  )
}
