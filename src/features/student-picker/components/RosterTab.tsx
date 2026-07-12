import { useState } from 'react'
import { usePickerStore } from '../pickerStore'
import type { PickerClassId } from '../types'

export function RosterTab({ classId }: { classId: PickerClassId }) {
  const students = usePickerStore((s) => s.students)
  const addStudentsBulk = usePickerStore((s) => s.addStudentsBulk)
  const markAbsent = usePickerStore((s) => s.markAbsent)
  const markAllPresent = usePickerStore((s) => s.markAllPresent)
  const updateStudent = usePickerStore((s) => s.updateStudent)

  const classStudents = students.filter((s) => s.classes.includes(classId))
  const activeStudents = classStudents.filter((s) => s.isActive)
  const archivedStudents = classStudents.filter((s) => !s.isActive)

  const [bulkText, setBulkText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const handleAddBulk = () => {
    if (!bulkText.trim()) return
    addStudentsBulk(bulkText, classId)
    setBulkText('')
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300">Add Students (One per line)</label>
        <textarea
          rows={3}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Alice&#10;Bob&#10;Charlie"
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-y"
        />
        <button
          onClick={handleAddBulk}
          className="w-full rounded-xl bg-slate-700 py-2 text-sm font-semibold text-white hover:bg-slate-600 transition"
        >
          Add to {classId} Roster
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300">
            Active Roster ({activeStudents.length})
          </h3>
          <button
            onClick={markAllPresent}
            className="text-[10px] uppercase tracking-wider text-cyan-400 hover:text-cyan-300"
          >
            Mark All Present
          </button>
        </div>

        {activeStudents.length === 0 && (
          <p className="text-xs text-slate-500 italic">No students in this class yet.</p>
        )}

        <ul className="max-h-60 overflow-y-auto space-y-1 rounded-xl bg-slate-900/50 p-2">
          {activeStudents.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm"
            >
              <span className={s.isAbsent ? 'line-through text-slate-500' : 'text-slate-200'}>
                {s.displayName}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => markAbsent(s.id, !s.isAbsent)}
                  className={`text-[10px] px-2 py-1 rounded font-semibold ${
                    s.isAbsent ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {s.isAbsent ? 'Absent' : 'Present'}
                </button>
                <button
                  onClick={() => updateStudent(s.id, { isActive: false })}
                  className="text-[10px] px-2 py-1 rounded font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20"
                >
                  Archive
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {archivedStudents.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-700">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-300"
          >
            {showArchived ? 'Hide Archived' : `Show Archived (${archivedStudents.length})`}
          </button>
          {showArchived && (
            <ul className="max-h-40 overflow-y-auto space-y-1 rounded-xl bg-slate-900/30 p-2">
              {archivedStudents.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-1.5 text-xs text-slate-500"
                >
                  <span>{s.displayName}</span>
                  <button
                    onClick={() => updateStudent(s.id, { isActive: true })}
                    className="text-[10px] px-2 py-1 rounded font-semibold bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
