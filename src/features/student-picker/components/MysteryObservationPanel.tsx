import { useState } from 'react'
import type { PickerPoolKey } from '../../roster/types'
import type { PickerClassId, MysterySlotId } from '../types'
import { usePickerStore } from '../pickerStore'
import { ALL_DEFAULT_LOOK_FORS, RECOGNITION_REASONS } from '../defaults'
import { pickRandomEligible } from '../fairnessEngine'

interface MysteryObservationPanelProps {
  classId: PickerClassId
  poolKey: PickerPoolKey
}

export function MysteryObservationPanel({ classId, poolKey }: MysteryObservationPanelProps) {
  const session = usePickerStore((s) => s.activeMysterySessions[poolKey])
  const updateSlot = usePickerStore((s) => s.updateMysterySlot)
  const clearSlotOutcome = usePickerStore((s) => s.clearMysterySlotOutcome)
  const updateObservation = usePickerStore((s) => s.updateSlotObservation)
  const replaceAbsent = usePickerStore((s) => s.replaceAbsentMysteryStudent)
  const coachingConfig = usePickerStore((s) => s.coachingConfig)
  const students = usePickerStore((s) => s.students)
  const history = usePickerStore((s) => s.fairnessHistory)
  const commitSession = usePickerStore((s) => s.commitMysterySession)

  const [emergencyReveal, setEmergencyReveal] = useState<Record<string, boolean>>({})

  if (!session) return null

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.displayName || 'Unknown'

  const handleReplace = (slotId: MysterySlotId) => {
    const mysteryHistory = history.filter(
      (h) =>
        (h.poolKey ?? h.classId) === poolKey
        && (h.role === 'mystery-high-flier' || h.role === 'mystery-star'),
    )
    const currentExcluded = [
      session.slots['high-flier-1']?.studentId,
      session.slots['high-flier-2']?.studentId,
      session.slots.star?.studentId,
    ].filter(Boolean) as string[]

    const newPick = pickRandomEligible(students, poolKey, mysteryHistory, 1, currentExcluded)
    if (newPick.length > 0) {
      replaceAbsent(poolKey, classId, slotId, newPick[0].id)
    } else {
      alert('No eligible students left to replace.')
    }
  }

  const renderSlot = (
    title: string,
    slotId: MysterySlotId,
    colorClass: string,
    studentLabel: string,
  ) => {
    const slot = session.slots[slotId]
    if (!slot) return null

    const visibleBehaviors = coachingConfig.visibleBehaviors
      .map((id) =>
        ALL_DEFAULT_LOOK_FORS.find((b) => b.id === id)
        || coachingConfig.customBehaviors.find((b) => b.id === id),
      )
      .filter(Boolean)

    return (
      <div className={`rounded-xl border ${colorClass} space-y-3 bg-slate-900 p-4`}>
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-200">
              {emergencyReveal[slotId] ? getStudentName(slot.studentId) : studentLabel}
            </span>
            <button
              type="button"
              onMouseDown={() => setEmergencyReveal((p) => ({ ...p, [slotId]: true }))}
              onMouseUp={() => setEmergencyReveal((p) => ({ ...p, [slotId]: false }))}
              onMouseLeave={() => setEmergencyReveal((p) => ({ ...p, [slotId]: false }))}
              className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300"
            >
              Hold to Reveal
            </button>
          </div>
        </div>

        {session.status === 'active' && (
          <div className="space-y-4 pt-2">
            <div className="max-h-40 space-y-2 overflow-y-auto pr-2">
              {visibleBehaviors.map((b) => {
                if (!b) return null
                const obs = slot.observations.find((o) => o.behaviorId === b.id)
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between border-b border-slate-800 pb-1 text-xs"
                  >
                    <span className="text-slate-300">{b.label}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updateObservation(poolKey, slotId, b.id, 'positive')}
                        className={`flex h-6 w-6 items-center justify-center rounded font-bold ${
                          obs?.value === 'positive'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => updateObservation(poolKey, slotId, b.id, 'needs-attention')}
                        className={`flex h-6 w-6 items-center justify-center rounded font-bold ${
                          obs?.value === 'needs-attention'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                        }`}
                      >
                        -
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-800 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Final Outcome
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateSlot(poolKey, slotId, 'earned', slot.reason)}
                  className={`flex-1 rounded py-2 text-xs font-bold transition ${
                    slot.status === 'earned'
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Earned
                </button>
                <button
                  type="button"
                  onClick={() => updateSlot(poolKey, slotId, 'did-not-earn')}
                  className={`flex-1 rounded py-2 text-xs font-bold transition ${
                    slot.status === 'did-not-earn'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-900/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Did Not Earn
                </button>
              </div>

              {(slot.status === 'earned' || slot.status === 'did-not-earn') && (
                <button
                  type="button"
                  onClick={() => clearSlotOutcome(poolKey, slotId)}
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                >
                  Clear Outcome
                </button>
              )}

              {slot.status === 'earned' && slot.assignedTitle && (
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Title: {slot.assignedTitle}
                </p>
              )}

              {slot.status === 'earned' && (
                <select
                  value={slot.reason || ''}
                  onChange={(e) => updateSlot(poolKey, slotId, 'earned', e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">-- Optional Recognition Reason --</option>
                  {RECOGNITION_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => handleReplace(slotId)}
                className="mt-2 py-1 text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300"
              >
                Absent — Replace Student
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {renderSlot('High Flier #1', 'high-flier-1', 'border-slate-700', 'Mystery Student A')}
        {renderSlot('High Flier #2', 'high-flier-2', 'border-slate-700', 'Mystery Student B')}
        {renderSlot('Mystery Star', 'star', 'border-amber-500/30', 'Mystery Student C')}
      </div>

      {session.status === 'completed' && (
        <button
          type="button"
          onClick={() => commitSession(poolKey)}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500"
        >
          Commit to History & Close Session
        </button>
      )}
    </div>
  )
}
