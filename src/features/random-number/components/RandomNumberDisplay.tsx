import { memo } from 'react'
import { shouldShowRandomNumberDisplay } from '../displaySafe'
import { useRandomNumberStore } from '../randomNumberStore'

/** Fullscreen projector overlay for the latest random number draw. */
export const RandomNumberDisplay = memo(function RandomNumberDisplay() {
  const lastResult = useRandomNumberStore((s) => s.lastResult)
  const showOnDisplay = useRandomNumberStore((s) => s.showOnDisplay)

  if (!shouldShowRandomNumberDisplay(lastResult, showOnDisplay)) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col items-center justify-center bg-slate-950 p-4 md:p-8"
      data-projector-mode="random-number"
      aria-live="polite"
      aria-label={`Random number ${lastResult}`}
    >
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-400/90 md:text-base">
        Random Number
      </p>
      <p
        className="mt-4 font-black tabular-nums text-white"
        style={{ fontSize: 'clamp(4rem, 18vw, 12rem)', lineHeight: 1 }}
      >
        {lastResult}
      </p>
    </div>
  )
})
