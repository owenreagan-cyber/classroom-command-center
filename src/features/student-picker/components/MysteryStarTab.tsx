import type { PickerClassId } from '../types'
import { usePickerStore } from '../pickerStore'
import { pickRandomEligible } from '../fairnessEngine'
import { MysteryObservationPanel } from './MysteryObservationPanel'

export function MysteryStarTab({ classId }: { classId: PickerClassId }) {
  const students = usePickerStore((s) => s.students)
  const history = usePickerStore((s) => s.fairnessHistory)
  const session = usePickerStore((s) => s.activeMysterySessions[classId])
  const startMysterySession = usePickerStore((s) => s.startMysterySession)
  const cancelMysterySession = usePickerStore((s) => s.cancelMysterySession)

  const handleStart = () => {
    const mysteryHistory = history.filter(
      (h) => h.classId === classId && (h.role === 'mystery-high-flier' || h.role === 'mystery-star')
    )
    const picked = pickRandomEligible(students, classId, mysteryHistory, 3)
    if (picked.length === 3) {
      startMysterySession(classId, new Date().toISOString().split('T')[0], picked.map((p) => p.id))
    } else {
      alert("Not enough eligible active students to start a session. You need at least 3 present active students.")
    }
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-sm text-slate-400 text-center">
          No active mystery session for {classId}.
        </p>
        <button
          onClick={handleStart}
          className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500 transition"
        >
          Prepare Hidden Trio
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
          Active Session
        </span>
        {session.status === 'active' && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to discard this session without revealing?')) {
                cancelMysterySession(classId)
              }
            }}
            className="text-[10px] text-slate-500 hover:text-rose-400 uppercase tracking-wider font-bold"
          >
            Cancel Session
          </button>
        )}
      </div>

      <MysteryObservationPanel classId={classId} />
    </div>
  )
}
