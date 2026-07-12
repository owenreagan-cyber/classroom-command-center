import { useState } from 'react'
import type { PickerClassId, Student } from '../types'
import { usePickerStore } from '../pickerStore'
import { pickRandomEligible } from '../fairnessEngine'

export function QuickPickerTab({ classId }: { classId: PickerClassId }) {
  const students = usePickerStore((s) => s.students)
  const history = usePickerStore((s) => s.fairnessHistory)
  const recordQuickPick = usePickerStore((s) => s.recordQuickPick)
  const clearQuickPickHistory = usePickerStore((s) => s.clearQuickPickHistory)

  const [drawCount, setDrawCount] = useState(1)
  const [selected, setSelected] = useState<Student[]>([])

  const handleDraw = () => {
    // Quick Picker can just use the fairness engine with "quick-pick" role history
    const classQuickHistory = history.filter((h) => h.classId === classId && h.role === 'quick-pick')
    const picked = pickRandomEligible(students, classId, classQuickHistory, drawCount)
    setSelected(picked)
  }

  const handleKeep = () => {
    // Record selected as completed quick picks
    for (const s of selected) {
      recordQuickPick(classId, s.id)
    }
    setSelected([])
  }

  const handleRedraw = (index: number) => {
    const classQuickHistory = history.filter((h) => h.classId === classId && h.role === 'quick-pick')
    const currentExcluded = selected.map(s => s.id)
    const newPick = pickRandomEligible(students, classId, classQuickHistory, 1, currentExcluded)
    if (newPick.length > 0) {
      const nextSelected = [...selected]
      nextSelected[index] = newPick[0]
      setSelected(nextSelected)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-300">Count:</label>
        <select
          value={drawCount}
          onChange={(e) => setDrawCount(Number(e.target.value))}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button
          onClick={handleDraw}
          className="ml-auto rounded-xl bg-cyan-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-cyan-500 transition shadow-lg shadow-cyan-900/20"
        >
          Draw Random
        </button>
      </div>

      {selected.length > 0 && (
        <div className="space-y-2 rounded-xl bg-slate-900 p-3 border border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center">Selected</h3>
          <ul className="flex flex-col gap-2">
            {selected.map((s, idx) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-800 p-3 shadow">
                <span className="font-bold text-slate-100 text-lg">{s.displayName}</span>
                <button
                  onClick={() => handleRedraw(idx)}
                  className="text-[10px] uppercase font-bold text-slate-400 hover:text-white"
                >
                  Redraw
                </button>
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setSelected([])}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              Cancel (Return to Ready)
            </button>
            <button
              onClick={handleKeep}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Keep & Record
            </button>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
        <span className="text-xs text-slate-500">Fairness history is active.</span>
        <button
          onClick={() => clearQuickPickHistory(classId)}
          className="text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300"
        >
          Reset Cycle
        </button>
      </div>
    </div>
  )
}
