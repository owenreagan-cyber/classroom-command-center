import type { PickerPoolKey } from '../../roster/types'
import { usePickerStore } from '../pickerStore'

interface HistoryTabProps {
  poolKey: PickerPoolKey
}

export function HistoryTab({ poolKey }: HistoryTabProps) {
  const history = usePickerStore((s) => s.fairnessHistory)
  const students = usePickerStore((s) => s.students)
  const correctOutcome = usePickerStore((s) => s.correctOutcome)

  const classHistory = history
    .filter((h) => (h.poolKey ?? h.classId) === poolKey)
    .sort((a, b) => b.timestamp - a.timestamp)

  const getDisplayName = (studentId: string, snapshotName?: string) => {
    if (snapshotName) return snapshotName
    const student = students.find((s) => s.id === studentId)
    return student?.displayName || 'Unknown Student'
  }

  const formatRole = (role: string) => {
    switch (role) {
      case 'quick-pick': return 'Quick Pick'
      case 'mystery-high-flier': return 'High Flier'
      case 'mystery-star': return 'Mystery Star'
      case 'absent-replacement': return 'Absent Replacement'
      default: return role
    }
  }

  const formatOutcome = (outcome: string) => {
    switch (outcome) {
      case 'earned': return <span className="text-emerald-400">Earned</span>
      case 'did-not-earn': return <span className="text-rose-400">Did Not Earn</span>
      case 'quick-picked': return <span className="text-cyan-400">Quick Picked</span>
      case 'absent-replaced': return <span className="text-amber-400">Absent — Replaced</span>
      default: return outcome
    }
  }

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp)
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Recent History ({classHistory.length})
        </h3>
        <span className="text-[10px] uppercase text-slate-500">{poolKey}</span>
      </div>

      {classHistory.length === 0 ? (
        <div className="py-8 text-center text-xs italic text-slate-500">
          No history for this pool yet.
        </div>
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {classHistory.map((h) => (
            <li key={h.id} className="rounded-lg border border-slate-700 bg-slate-900/50 p-2.5 text-xs">
              <div className="mb-1 flex items-start justify-between">
                <span className="font-bold text-slate-200">
                  {getDisplayName(h.studentId, h.studentDisplayName)}
                </span>
                <span className="text-[10px] text-slate-500">{formatDate(h.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tight">
                <span className="text-slate-400">{formatRole(h.role)}</span>
                <div className="flex items-center gap-2">
                  <span>{formatOutcome(h.outcome)}</span>
                  {(h.outcome === 'earned' || h.outcome === 'did-not-earn') && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = h.outcome === 'earned' ? 'did-not-earn' : 'earned'
                        correctOutcome(poolKey, h.id, next)
                      }}
                      className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[8px] font-bold text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
                    >
                      Correct to {h.outcome === 'earned' ? 'Did Not Earn' : 'Earned'}
                    </button>
                  )}
                </div>
              </div>
              {h.reason && (
                <div className="mt-1.5 border-t border-slate-800 pt-1 italic leading-snug text-slate-400">
                  "{h.reason}"
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
