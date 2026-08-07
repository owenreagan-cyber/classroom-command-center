import { useState } from 'react'
import { useLottoBoardStore } from './lottoBoardStore'

export function LottoBoardTeacherPanel() {
  const {
    pendingNumbers, availableNumbers, usedNumbers, drawHistory,
    weeklyDrawCount, setWeeklyDrawCount, drawNumbers,
    confirmPendingDraw, clearPendingDraw, undoLastConfirm, resetBoard,
  } = useLottoBoardStore()

  const [resetConfirm, setResetConfirm] = useState(false)
  const [drawCountInput, setDrawCountInput] = useState(String(weeklyDrawCount))

  const handleSetCount = () => {
    const n = parseInt(drawCountInput, 10)
    if (isNaN(n)) return
    setWeeklyDrawCount(n)
  }

  const handleDraw = () => { drawNumbers() }
  const handleDone = () => { confirmPendingDraw() }
  const handleClearPending = () => { clearPendingDraw() }
  const handleUndo = () => { undoLastConfirm() }
  const handleReset = () => {
    if (resetConfirm) { resetBoard(); setResetConfirm(false) }
    else setResetConfirm(true)
  }

  const remaining = availableNumbers.length
  const used = usedNumbers.length
  const complete = remaining === 0

  return (
    <div className="flex flex-col gap-4 p-4 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">🎱 Lotto Board</h2>
        <span className="text-xs text-slate-400">1–100</span>
      </div>

      {/* Counts */}
      <div className="flex gap-3 text-sm">
        <div className="rounded-lg bg-slate-800/60 px-3 py-1.5">
          <span className="text-slate-400">Remaining: </span>
          <span className="font-bold text-cyan-300">{remaining}</span>
        </div>
        <div className="rounded-lg bg-slate-800/60 px-3 py-1.5">
          <span className="text-slate-400">Used: </span>
          <span className="font-bold text-slate-300">{used}</span>
        </div>
      </div>

      {/* Draw count */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-400">Draw count:</label>
        <input
          type="number"
          min={1}
          max={100}
          value={drawCountInput}
          onChange={(e) => setDrawCountInput(e.target.value)}
          onBlur={handleSetCount}
          className="w-16 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-center text-sm text-white"
        />
        <button onClick={handleSetCount} className="rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600">
          Set
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleDraw}
          disabled={complete || remaining === 0}
          className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-600 disabled:opacity-40"
        >
          🎱 Draw {weeklyDrawCount} Balls
        </button>
        <button
          onClick={handleDone}
          disabled={pendingNumbers.length === 0}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-600 disabled:opacity-40"
        >
          ✅ Done — Remove
        </button>
        <button
          onClick={handleClearPending}
          disabled={pendingNumbers.length === 0}
          className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40"
        >
          ↩ Clear
        </button>
        <button
          onClick={handleUndo}
          disabled={drawHistory.length === 0}
          className="rounded-lg bg-amber-800 px-3 py-2 text-xs text-amber-200 hover:bg-amber-700 disabled:opacity-40"
        >
          ↶ Undo Last
        </button>
        <button
          onClick={handleReset}
          className="rounded-lg border border-rose-700 px-3 py-2 text-xs text-rose-300 hover:bg-rose-900/40"
        >
          {resetConfirm ? '⚠️ Confirm Reset?' : '🔄 Reset Board'}
        </button>
      </div>

      {/* Pending balls display */}
      {pendingNumbers.length > 0 && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-4">
          <p className="mb-2 text-xs font-semibold text-cyan-300">Pending Draw ({pendingNumbers.length})</p>
          <div className="flex flex-wrap gap-2">
            {pendingNumbers.map((n) => (
              <span key={n} className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-slate-700 to-slate-900 text-lg font-bold text-white shadow-lg ring-1 ring-slate-500">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Used numbers compact grid */}
      {used > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-400">Used ({used})</p>
          <div className="flex flex-wrap gap-1">
            {usedNumbers.slice(-30).map((n) => (
              <span key={n} className="rounded bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-500">{n}</span>
            ))}
            {used > 30 && <span className="text-[10px] text-slate-600">+{used - 30} more</span>}
          </div>
        </div>
      )}

      {/* History panel */}
      {drawHistory.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-400">History</p>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {[...drawHistory].reverse().map((record) => (
              <div key={record.id} className="rounded bg-slate-800/40 px-2 py-1 text-[10px] text-slate-500">
                {record.numbers.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete state */}
      {complete && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-center">
          <p className="text-sm font-bold text-amber-200">🎉 All 100 numbers drawn!</p>
          <p className="mt-1 text-xs text-amber-400">Reset the board to start a fresh round.</p>
        </div>
      )}

      {/* Empty state — no draws yet */}
      {used === 0 && pendingNumbers.length === 0 && !complete && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-center">
          <p className="text-sm text-slate-400">Set your weekly draw count and tap Draw to start.</p>
        </div>
      )}
    </div>
  )
}
