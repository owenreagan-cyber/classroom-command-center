import { memo, useCallback, useId, useMemo, useState } from 'react'
import {
  getAvailableValues,
  parseBoundInput,
  validateRange,
} from '../randomNumberLogic'
import {
  selectIsExhausted,
  useRandomNumberStore,
} from '../randomNumberStore'
import { DEFAULT_MAX, DEFAULT_MIN } from '../types'

export const RandomNumberPanel = memo(function RandomNumberPanel() {
  const min = useRandomNumberStore((s) => s.min)
  const max = useRandomNumberStore((s) => s.max)
  const preventRepeat = useRandomNumberStore((s) => s.preventRepeat)
  const history = useRandomNumberStore((s) => s.history)
  const lastResult = useRandomNumberStore((s) => s.lastResult)
  const showOnDisplay = useRandomNumberStore((s) => s.showOnDisplay)
  const setBounds = useRandomNumberStore((s) => s.setBounds)
  const setPreventRepeat = useRandomNumberStore((s) => s.setPreventRepeat)
  const drawNumber = useRandomNumberStore((s) => s.drawNumber)
  const undoDraw = useRandomNumberStore((s) => s.undoDraw)
  const resetHistory = useRandomNumberStore((s) => s.resetHistory)
  const sendToDisplay = useRandomNumberStore((s) => s.sendToDisplay)
  const clearDisplay = useRandomNumberStore((s) => s.clearDisplay)

  const [minInput, setMinInput] = useState(String(min))
  const [maxInput, setMaxInput] = useState(String(max))
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const minFieldId = useId()
  const maxFieldId = useId()
  const preventRepeatId = useId()

  const parsedMin = parseBoundInput(minInput)
  const parsedMax = parseBoundInput(maxInput)
  const rangeValidation = useMemo(
    () => validateRange(parsedMin, parsedMax),
    [parsedMin, parsedMax],
  )

  const exhausted = useRandomNumberStore(selectIsExhausted)
  const remainingCount = useMemo(() => {
    if (!preventRepeat || !rangeValidation.valid) return null
    return getAvailableValues(rangeValidation.min, rangeValidation.max, history, true).length
  }, [preventRepeat, rangeValidation, history])

  const applyBounds = useCallback(() => {
    const result = setBounds(parsedMin ?? DEFAULT_MIN, parsedMax ?? DEFAULT_MAX)
    if (!result.ok) {
      setStatusMessage(result.message)
      return
    }
    setStatusMessage(null)
  }, [parsedMin, parsedMax, setBounds])

  const handleDraw = useCallback(() => {
    applyBounds()
    const result = drawNumber()
    if (!result.ok) {
      setStatusMessage(result.message ?? 'Could not draw a number.')
      return
    }
    setStatusMessage(
      exhausted
        ? 'Last number in range drawn. Reset history to draw again with no-repeat on.'
        : null,
    )
  }, [applyBounds, drawNumber, exhausted])

  const handleReset = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    resetHistory()
    setConfirmReset(false)
    setStatusMessage(null)
  }, [confirmReset, resetHistory])

  const recentHistory = [...history].reverse().slice(0, 12)

  return (
    <div className="space-y-5" aria-label="Random Number Selector">
      <header>
        <h2 className="text-lg font-bold text-white">Random Number Selector</h2>
        <p className="mt-1 text-sm text-slate-400">
          Draw a random number for the class. Results can appear on the student display.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1" htmlFor={minFieldId}>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Minimum</span>
          <input
            id={minFieldId}
            type="number"
            inputMode="numeric"
            value={minInput}
            onChange={(event) => setMinInput(event.target.value)}
            onBlur={applyBounds}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
        </label>
        <label className="block space-y-1" htmlFor={maxFieldId}>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Maximum</span>
          <input
            id={maxFieldId}
            type="number"
            inputMode="numeric"
            value={maxInput}
            onChange={(event) => setMaxInput(event.target.value)}
            onBlur={applyBounds}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
        </label>
      </section>

      {!rangeValidation.valid && rangeValidation.message && (
        <p role="alert" className="text-sm text-amber-300">{rangeValidation.message}</p>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-200" htmlFor={preventRepeatId}>
        <input
          id={preventRepeatId}
          type="checkbox"
          checked={preventRepeat}
          onChange={(event) => setPreventRepeat(event.target.checked)}
          className="size-4 rounded border-slate-600"
        />
        No-repeat mode (each number used once before repeating)
      </label>

      {preventRepeat && remainingCount !== null && (
        <p className="text-xs text-slate-400">
          {exhausted
            ? 'All numbers in this range have been used.'
            : `${remainingCount} number${remainingCount === 1 ? '' : 's'} remaining in range.`}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDraw}
          disabled={!rangeValidation.valid || exhausted}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        >
          Draw Number
        </button>
        <button
          type="button"
          onClick={undoDraw}
          disabled={history.length === 0}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Undo Last Draw
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-rose-700/60 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-950/40"
        >
          {confirmReset ? 'Confirm Reset History' : 'Reset History'}
        </button>
        {confirmReset && (
          <button
            type="button"
            onClick={() => setConfirmReset(false)}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>
        )}
      </div>

      {lastResult !== null && (
        <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Latest draw</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-white">{lastResult}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={sendToDisplay}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              Send to Display
            </button>
            {showOnDisplay && (
              <button
                type="button"
                onClick={clearDisplay}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Hide from Display
              </button>
            )}
          </div>
        </section>
      )}

      {statusMessage && (
        <p role="status" className="text-sm text-amber-200">{statusMessage}</p>
      )}

      {recentHistory.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Draw history</h3>
          <ol className="mt-2 flex flex-wrap gap-2">
            {recentHistory.map((entry, index) => (
              <li
                key={`${entry.drawnAt}-${entry.value}-${index}`}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm tabular-nums text-slate-200"
              >
                {entry.value}
              </li>
            ))}
          </ol>
          {history.length > recentHistory.length && (
            <p className="mt-1 text-xs text-slate-500">
              Showing latest {recentHistory.length} of {history.length} draws.
            </p>
          )}
        </section>
      )}
    </div>
  )
})
