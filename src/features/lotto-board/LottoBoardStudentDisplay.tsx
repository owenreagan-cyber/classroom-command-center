import { useLottoBoardStore } from './lottoBoardStore'

export function LottoBoardStudentDisplay() {
  const pendingNumbers = useLottoBoardStore((s) => s.pendingNumbers)
  const remainingCount = useLottoBoardStore((s) => s.availableNumbers.length)
  const usedCount = useLottoBoardStore((s) => s.usedNumbers.length)
  const weeklyDrawCount = useLottoBoardStore((s) => s.weeklyDrawCount)

  const drawing = pendingNumbers.length > 0
  const complete = remainingCount === 0
  const ready = !drawing && !complete

  return (
    <div className="rounded-2xl bg-slate-950/50 p-5 backdrop-blur-sm shadow-lg text-center">
      <p className="text-xl font-bold text-white mb-2">🎱 Lotto Board</p>

      {ready && (
        <div className="py-6">
          <p className="text-4xl text-slate-500">🎱</p>
          <p className="mt-2 text-lg text-slate-400">{remainingCount} numbers left</p>
          <p className="text-xs text-slate-500 mt-1">Waiting for draw...</p>
        </div>
      )}

      {drawing && (
        <div>
          <div className="flex flex-wrap justify-center gap-2.5 py-2">
            {pendingNumbers.map((n) => (
              <span
                key={n}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-cyan-600 to-cyan-900 text-2xl font-black text-white shadow-lg ring-2 ring-cyan-400/60"
              >
                {n}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-cyan-300">
            {pendingNumbers.length} ball{pendingNumbers.length !== 1 ? 's' : ''} drawn
          </p>
        </div>
      )}

      {complete && (
        <div className="py-6">
          <p className="text-4xl">🎉</p>
          <p className="mt-2 text-lg font-bold text-amber-200">All 100 drawn!</p>
          <p className="text-sm text-amber-400 mt-1">Waiting for reset...</p>
        </div>
      )}

      <div className="mt-3 flex justify-center gap-4 text-xs text-slate-500">
        <span>{remainingCount} left</span>
        <span>{usedCount} used</span>
        <span>Draw {weeklyDrawCount}</span>
      </div>
    </div>
  )
}
