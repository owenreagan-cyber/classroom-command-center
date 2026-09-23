import { useState, useEffect, useCallback, useRef } from 'react'
import { HTMLContainer } from 'tldraw'

const DEFAULT_MINUTES = 15

export function TimerComponent({ label }: { label: string }) {
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(DEFAULT_MINUTES * 60 * 1000)
  const [inputMinutes, setInputMinutes] = useState(DEFAULT_MINUTES)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTick = useRef<number>(0)

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    lastTick.current = Date.now()
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastTick.current
      lastTick.current = now
      setRemaining((prev) => {
        const next = prev - elapsed
        if (next <= 0) {
          setRunning(false)
          return 0
        }
        return next
      })
    }, 200)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const start = useCallback(() => {
    setRemaining(inputMinutes * 60 * 1000)
    setRunning(true)
  }, [inputMinutes])

  const stop = useCallback(() => setRunning(false), [])
  const reset = useCallback(() => { setRunning(false); setRemaining(DEFAULT_MINUTES * 60 * 1000); setInputMinutes(DEFAULT_MINUTES) }, [])

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)

  return (
    <HTMLContainer>
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-slate-950/80 px-4 py-3 text-center text-white shadow-xl backdrop-blur-sm">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="my-1 text-4xl font-black tabular-nums text-amber-200">
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
        <div className="flex gap-1.5 mt-2">
          {!running && (
            <input
              type="number"
              min={1}
              max={120}
              value={inputMinutes}
              onChange={(e) => setInputMinutes(Math.max(1, Math.min(120, Number(e.target.value))))}
              className="w-12 rounded-md bg-slate-800 px-1.5 py-0.5 text-center text-xs text-white outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          {running ? (
            <button onClick={stop} className="rounded-lg bg-rose-700 px-2 py-0.5 text-xs font-semibold text-white">Stop</button>
          ) : (
            <button onClick={start} className="rounded-lg bg-emerald-700 px-2 py-0.5 text-xs font-semibold text-white">Start</button>
          )}
          <button onClick={reset} className="rounded-lg bg-slate-700 px-2 py-0.5 text-xs font-semibold text-slate-200">Reset</button>
        </div>
      </div>
    </HTMLContainer>
  )
}
