import { usePickerStore } from '../pickerStore'
import type { PickerClassId } from '../types'

export function HistoryTab({ classId }: { classId: PickerClassId }) {
  const history = usePickerStore((s) => s.fairnessHistory)
  const students = usePickerStore((s) => s.students)
  const correctOutcome = usePickerStore((s) => s.correctOutcome)

  const classHistory = history
    .filter((h) => h.classId === classId)
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
      case 'mystery-star': return 'Star Student'
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
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
           d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Recent History ({classHistory.length})
        </h3>
      </div>

      {classHistory.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 italic">
          No history for this class yet.
        </div>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {classHistory.map((h) => (
            <li key={h.id} className="rounded-lg border border-slate-700 bg-slate-900/50 p-2.5 text-xs">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-slate-200">
                  {getDisplayName(h.studentId, h.studentDisplayName)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {formatDate(h.timestamp)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-tight">
                <span className="text-slate-400">{formatRole(h.role)}</span>
                <div className="flex items-center gap-2">
                  <span>{formatOutcome(h.outcome)}</span>
                  {(h.outcome === 'earned' || h.outcome === 'did-not-earn') && (
                    <button
                      onClick={() => {
                        const next = h.outcome === 'earned' ? 'did-not-earn' : 'earned'
                        correctOutcome(classId, h.id, next)
                      }}
                      className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[8px] font-bold text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
                    >
                      Correct to {h.outcome === 'earned' ? 'Did Not Earn' : 'Earned'}
                    </button>
                  )}
                </div>
              </div>
              {h.reason && (
                <div className="mt-1.5 text-slate-400 italic leading-snug border-t border-slate-800 pt-1">
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
