import { useState } from 'react'
import type { PickerClassId, MysterySlotId } from '../types'
import { usePickerStore } from '../pickerStore'
import { ALL_DEFAULT_LOOK_FORS, RECOGNITION_REASONS } from '../defaults'
import { pickRandomEligible } from '../fairnessEngine'

export function MysteryObservationPanel({ classId }: { classId: PickerClassId }) {
  const session = usePickerStore((s) => s.activeMysterySessions[classId])
  const updateSlot = usePickerStore((s) => s.updateMysterySlot)
  const updateObservation = usePickerStore((s) => s.updateSlotObservation)
  const replaceAbsent = usePickerStore((s) => s.replaceAbsentMysteryStudent)
  const coachingConfig = usePickerStore((s) => s.coachingConfig)
  const students = usePickerStore((s) => s.students)
  const history = usePickerStore((s) => s.fairnessHistory)
  const advanceReveal = usePickerStore((s) => s.advanceMysteryReveal)
  const canStartReveal = usePickerStore((s) => s.canStartReveal)
  const commitSession = usePickerStore((s) => s.commitMysterySession)

  const [emergencyReveal, setEmergencyReveal] = useState<Record<string, boolean>>({})

  if (!session) return null

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.displayName || 'Unknown'

  const handleReplace = (slotId: MysterySlotId) => {
    const mysteryHistory = history.filter(
      (h) => h.classId === classId && (h.role === 'mystery-high-flier' || h.role === 'mystery-star')
    )
    const currentExcluded = [
      session.slots['high-flier-1']?.studentId,
      session.slots['high-flier-2']?.studentId,
      session.slots['star']?.studentId,
    ].filter(Boolean) as string[]

    const newPick = pickRandomEligible(students, classId, mysteryHistory, 1, currentExcluded)
    if (newPick.length > 0) {
      replaceAbsent(classId, slotId, newPick[0].id)
    } else {
      alert("No eligible students left to replace.")
    }
  }

  const renderSlot = (title: string, slotId: MysterySlotId, colorClass: string, studentLabel: string) => {
    const slot = session.slots[slotId]
    if (!slot) return null

    // Determine the visible behaviors
    const visibleBehaviors = coachingConfig.visibleBehaviors
      .map(id => ALL_DEFAULT_LOOK_FORS.find(b => b.id === id) || coachingConfig.customBehaviors.find(b => b.id === id))
      .filter(Boolean)

    return (
      <div className={`rounded-xl border ${colorClass} p-4 space-y-3 bg-slate-900`}>
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-200">
              {emergencyReveal[slotId] ? getStudentName(slot.studentId) : studentLabel}
            </span>
            <button
              onMouseDown={() => setEmergencyReveal(p => ({ ...p, [slotId]: true }))}
              onMouseUp={() => setEmergencyReveal(p => ({ ...p, [slotId]: false }))}
              onMouseLeave={() => setEmergencyReveal(p => ({ ...p, [slotId]: false }))}
              className="text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300"
            >
              Hold to Reveal
            </button>
          </div>
        </div>

        {session.status === 'active' && (
          <div className="space-y-4 pt-2">
            {/* Checklist */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {visibleBehaviors.map(b => {
                if (!b) return null
                const obs = slot.observations.find(o => o.behaviorId === b.id)
                return (
                  <div key={b.id} className="flex items-center justify-between text-xs border-b border-slate-800 pb-1">
                    <span className="text-slate-300">{b.label}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateObservation(classId, slotId, b.id, 'positive')}
                        className={`w-6 h-6 rounded flex items-center justify-center font-bold ${obs?.value === 'positive' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                      >
                        +
                      </button>
                      <button
                        onClick={() => updateObservation(classId, slotId, b.id, 'needs-attention')}
                        className={`w-6 h-6 rounded flex items-center justify-center font-bold ${obs?.value === 'needs-attention' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                      >
                        -
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Resolution */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Final Outcome</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSlot(classId, slotId, 'earned', slot.reason)}
                  className={`flex-1 rounded py-2 text-xs font-bold transition ${
                    slot.status === 'earned' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Earned
                </button>
                <button
                  onClick={() => updateSlot(classId, slotId, 'did-not-earn')}
                  className={`flex-1 rounded py-2 text-xs font-bold transition ${
                    slot.status === 'did-not-earn' ? 'bg-rose-500 text-white shadow-md shadow-rose-900/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Did Not Earn
                </button>
              </div>

              {slot.status === 'earned' && (
                <select
                  value={slot.reason || ''}
                  onChange={(e) => updateSlot(classId, slotId, 'earned', e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- Optional Recognition Reason --</option>
                  {RECOGNITION_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}

              <button
                onClick={() => handleReplace(slotId)}
                className="mt-2 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-300 py-1"
              >
                Absent - Replace Student
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const isReady = canStartReveal(classId)

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {renderSlot('High Flier #1', 'high-flier-1', 'border-slate-700', 'Mystery Student A')}
        {renderSlot('High Flier #2', 'high-flier-2', 'border-slate-700', 'Mystery Student B')}
        {renderSlot('Star Student', 'star', 'border-amber-500/30', 'Mystery Student C')}
      </div>

      <div className="pt-4 border-t border-slate-700">
        {session.status === 'active' ? (
          <button
            disabled={!isReady}
            onClick={() => {
              if (confirm('Ready to begin the reveal? Ensure all students are paying attention!')) {
                advanceReveal(classId)
              }
            }}
            className={`w-full rounded-xl py-3 text-sm font-bold shadow-lg transition ${
              isReady
                ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-900/40'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isReady ? 'Lock Observations & Start Reveal' : 'Resolve all slots to reveal'}
          </button>
        ) : session.status === 'completed' ? (
          <button
            onClick={() => commitSession(classId)}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-500 transition"
          >
            Commit to History & Close Session
          </button>
        ) : (
          <p className="text-center text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse">
            Reveal in Progress...
          </p>
        )}
      </div>
    </div>
  )
}
