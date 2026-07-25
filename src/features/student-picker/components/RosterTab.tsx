import { useRef, useState } from 'react'
import type { PickerPoolKey, ReadingSection } from '../../roster/types'
import { importRosterFromFile, parseLocalRosterFile, rosterStudentsToPickerStudents } from '../../roster/importRoster'
import { SAMPLE_ROSTER_FIXTURE } from '../../roster/sampleRoster.fixture'
import type { LocalRosterFile } from '../../roster/types'
import { studentMatchesPool } from '../fairnessEngine'
import { usePickerStore } from '../pickerStore'
import type { PickerClassId } from '../types'

interface RosterTabProps {
  classId: PickerClassId
  poolKey: PickerPoolKey
  readingSection?: ReadingSection
}

export function RosterTab({ classId, poolKey, readingSection }: RosterTabProps) {
  const students = usePickerStore((s) => s.students)
  const addStudentsBulk = usePickerStore((s) => s.addStudentsBulk)
  const importRosterStudents = usePickerStore((s) => s.importRosterStudents)
  const markAbsent = usePickerStore((s) => s.markAbsent)
  const markAllPresent = usePickerStore((s) => s.markAllPresent)
  const updateStudent = usePickerStore((s) => s.updateStudent)

  const classStudents = students.filter((s) => studentMatchesPool(s, poolKey))
  const activeStudents = classStudents.filter((s) => s.isActive)
  const archivedStudents = classStudents.filter((s) => !s.isActive)

  const [bulkText, setBulkText] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddBulk = () => {
    if (!bulkText.trim()) return
    addStudentsBulk(bulkText, classId)
    setBulkText('')
  }

  const handleImportFile = async (file: File) => {
    const raw = await file.text()
    const parsed = parseLocalRosterFile(raw)
    if (parsed.errors.length > 0) {
      setImportMessage(parsed.errors.join(' '))
      return
    }
    const result = importRosterFromFile(parsed.file!)
    if (result.errors.length > 0) {
      setImportMessage(result.errors.join(' '))
      return
    }
    importRosterStudents(rosterStudentsToPickerStudents(result.students), {
      schoolYear: parsed.file?.schoolYear,
      sectionsFound: result.sectionsFound,
    })
    setImportMessage(`Imported ${result.students.length} students from roster file.`)
  }

  const handleLoadSampleRoster = () => {
    const result = importRosterFromFile(SAMPLE_ROSTER_FIXTURE as unknown as LocalRosterFile)
    importRosterStudents(rosterStudentsToPickerStudents(result.students), {
      schoolYear: SAMPLE_ROSTER_FIXTURE.schoolYear,
      sectionsFound: result.sectionsFound,
    })
    setImportMessage(`Loaded sample roster (${result.students.length} students).`)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/40 p-3">
        <p className="text-xs font-semibold text-slate-300">Import Local Roster</p>
        <p className="text-[10px] leading-relaxed text-slate-500">
          Paste or import a JSON roster file locally. Real rosters stay in `.local/rosters/` and are never committed.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
          >
            Import JSON File
          </button>
          <button
            type="button"
            onClick={handleLoadSampleRoster}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Load Sample Roster
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImportFile(file)
            e.target.value = ''
          }}
        />
        {importMessage && (
          <p className="text-xs text-emerald-300">{importMessage}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-300">Add Students (one per line)</label>
        <textarea
          rows={3}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Preferred name or first name only"
          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="button"
          onClick={handleAddBulk}
          className="w-full rounded-xl bg-slate-700 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
        >
          Add to {readingSection ? `${classId} ${readingSection}` : classId} Roster
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300">
            Active Roster ({activeStudents.length})
          </h3>
          <button
            type="button"
            onClick={markAllPresent}
            className="text-[10px] uppercase tracking-wider text-cyan-400 hover:text-cyan-300"
          >
            Mark All Present
          </button>
        </div>

        {activeStudents.length === 0 && (
          <p className="text-xs italic text-slate-500">No students in this pool yet.</p>
        )}

        <ul className="max-h-60 space-y-1 overflow-y-auto rounded-xl bg-slate-900/50 p-2">
          {activeStudents.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm"
            >
              <div>
                <span className={s.isAbsent ? 'text-slate-500 line-through' : 'text-slate-200'}>
                  {s.displayName}
                </span>
                {s.preferredName && s.firstName !== s.displayName && (
                  <span className="ml-2 text-[10px] text-slate-500">
                    ({s.firstName} {s.lastName})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => markAbsent(s.id, !s.isAbsent)}
                  className={`rounded px-2 py-1 text-[10px] font-semibold ${
                    s.isAbsent
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {s.isAbsent ? 'Absent' : 'Present'}
                </button>
                <button
                  type="button"
                  onClick={() => updateStudent(s.id, { isActive: false })}
                  className="rounded bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-400 hover:bg-red-500/20"
                >
                  Archive
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {archivedStudents.length > 0 && (
        <div className="space-y-2 border-t border-slate-700 pt-2">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-300"
          >
            {showArchived ? 'Hide Archived' : `Show Archived (${archivedStudents.length})`}
          </button>
          {showArchived && (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl bg-slate-900/30 p-2">
              {archivedStudents.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-1.5 text-xs text-slate-500"
                >
                  <span>{s.displayName}</span>
                  <button
                    type="button"
                    onClick={() => updateStudent(s.id, { isActive: true })}
                    className="rounded bg-cyan-500/10 px-2 py-1 text-[10px] font-semibold text-cyan-400 hover:bg-cyan-500/20"
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
