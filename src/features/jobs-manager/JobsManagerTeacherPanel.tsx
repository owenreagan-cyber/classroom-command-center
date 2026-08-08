import { useState, useMemo } from 'react'
import { useJobsManagerStore } from './jobsManagerStore'
import { usePickerStore } from '../student-picker/pickerStore'
import type { ClassroomJob } from './types'

export function JobsManagerTeacherPanel() {
  const {
    jobs, activeCycle, archivedCycles, cycleLengthDays,
    assignStudentToJob, unassignStudentFromJob,
    smartAssign, clearAllAssignments, startNewCycle, endCycle, undoEndCycle,
    setCycleLengthDays, setSelectedClassId, resetDefaultJobs,
  } = useJobsManagerStore()

  const students = usePickerStore((s) => s.students)
  const [selectedClass, setSelectedClass] = useState('all')
  const [assignModalJobId, setAssignModalJobId] = useState<string | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [endCycleConfirm, setEndCycleConfirm] = useState(false)
  const [smartAssignResult, setSmartAssignResult] = useState<null | { made: number; unfilled: number }>(null)

  // Filter students by class
  const eligibleStudents = useMemo(() => {
    if (selectedClass === 'all') return students.filter((s) => s.isActive)
    return students.filter((s) => s.isActive && s.classes.includes(selectedClass))
  }, [students, selectedClass])

  const activeJobs = useMemo(() => jobs.filter((j) => j.active).sort((a, b) => a.displayOrder - b.displayOrder), [jobs])

  const totalSlots = activeJobs.reduce((s, j) => s + j.capacity, 0)
  const totalAssigned = activeCycle?.assignments.length ?? 0
  const allAssignedIds = new Set((activeCycle?.assignments ?? []).map((a) => a.studentId))

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.displayName ?? 'Unknown'

  const handleSmartAssign = () => {
    if (eligibleStudents.length === 0) return
    try {
      const report = smartAssign(eligibleStudents)
      setSmartAssignResult({ made: report.assignmentsMade, unfilled: report.unfilledJobs.length })
      setTimeout(() => setSmartAssignResult(null), 4000)
    } catch { /* no cycle */ }
  }

  const handleEndCycle = () => {
    if (endCycleConfirm) { endCycle(); setEndCycleConfirm(false) }
    else setEndCycleConfirm(true)
  }

  const handleReset = () => {
    if (resetConfirm) { resetDefaultJobs(); setResetConfirm(false) }
    else setResetConfirm(true)
  }

  const hasActiveCycle = activeCycle !== null
  const canUndo = archivedCycles.length > 0

  return (
    <div className="flex flex-col gap-3 p-4 text-slate-200 max-h-[calc(100vh-12rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">🧰 Jobs Manager</h2>
        <button onClick={handleReset} className={`rounded px-2 py-1 text-[10px] font-bold transition ${resetConfirm ? 'bg-rose-800 text-rose-200' : 'border border-slate-600 text-slate-400 hover:bg-slate-800'}`}>
          {resetConfirm ? '⚠ Confirm' : 'Reset'}
        </button>
      </div>

      {/* Class selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">Class:</span>
        {['all', 'homeroom', 'math', 'reading'].map((cls) => (
          <button
            key={cls}
            onClick={() => { setSelectedClass(cls); setSelectedClassId(cls === 'all' ? null : cls) }}
            className={`rounded px-2 py-1 text-[10px] font-semibold transition capitalize ${
              selectedClass === cls ? 'bg-cyan-700 text-cyan-100' : 'border border-slate-600 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {cls === 'all' ? 'All' : cls}
          </button>
        ))}
      </div>

      {/* Cycle status */}
      <div className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2">
        <span className="text-xs text-slate-400">Cycle:</span>
        <span className="text-sm font-bold text-white">{activeCycle?.label ?? 'Not Started'}</span>
        <span className="text-[10px] text-slate-500">({totalAssigned}/{totalSlots} assigned)</span>
        <div className="ml-auto flex gap-1">
          <button onClick={() => startNewCycle()} className="rounded bg-cyan-700 px-2 py-0.5 text-[10px] font-bold text-cyan-100 hover:bg-cyan-600">
            {hasActiveCycle ? 'New Cycle' : 'Start Cycle'}
          </button>
          <button
            onClick={handleEndCycle}
            disabled={!hasActiveCycle}
            className={`rounded px-2 py-0.5 text-[10px] font-bold transition disabled:opacity-30 ${
              endCycleConfirm ? 'bg-rose-700 text-rose-100' : 'border border-slate-500 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {endCycleConfirm ? 'Confirm End?' : 'End Cycle'}
          </button>
          <button
            onClick={undoEndCycle}
            disabled={!canUndo}
            className="rounded border border-amber-600 px-2 py-0.5 text-[10px] text-amber-400 hover:bg-amber-900/30 disabled:opacity-30"
          >
            Undo
          </button>
        </div>
      </div>

      {/* Cycle length setting */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-400">Cycle length (days):</span>
        <input
          type="number" min={1} max={45}
          value={cycleLengthDays}
          onChange={(e) => setCycleLengthDays(parseInt(e.target.value, 10) || 10)}
          className="w-14 rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 text-center text-xs text-white"
        />
      </div>

      {/* Smart Assign + Clear */}
      <div className="flex gap-2">
        <button onClick={handleSmartAssign} disabled={!hasActiveCycle} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-600 disabled:opacity-30 transition">
          🎯 Smart Assign
        </button>
        <button onClick={clearAllAssignments} disabled={!hasActiveCycle || totalAssigned === 0} className="rounded-lg border border-slate-600 px-3 py-2 text-[10px] text-slate-400 hover:bg-slate-800 disabled:opacity-30">
          Clear All
        </button>
      </div>

      {/* Smart assign result toast */}
      {smartAssignResult && (
        <div className="rounded-lg bg-emerald-950/60 border border-emerald-500/40 px-3 py-2 text-xs text-emerald-200">
          {smartAssignResult.made} assigned, {smartAssignResult.unfilled} jobs unfilled
        </div>
      )}

      {/* No roster warning */}
      {students.length === 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
          No roster loaded. Open Student Picker to import students.
        </div>
      )}

      {/* Job cards */}
      <div className="space-y-2">
        {activeJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            assignedIds={activeCycle?.assignments.filter((a) => a.jobId === job.id).map((a) => a.studentId) ?? []}
            allAssignedIds={allAssignedIds}
            students={eligibleStudents}
            getStudentName={getStudentName}
            assignModalJobId={assignModalJobId}
            onOpenAssign={(id) => setAssignModalJobId(id === assignModalJobId ? null : id)}
            onAssign={(studentId) => {
              assignStudentToJob(job.id, studentId)
              setAssignModalJobId(null)
            }}
            onUnassign={(studentId) => unassignStudentFromJob(job.id, studentId)}
          />
        ))}
      </div>

      {/* Cycle history summary */}
      {archivedCycles.length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <p className="text-[10px] text-slate-500 mb-1">{archivedCycles.length} completed cycle{archivedCycles.length !== 1 ? 's' : ''}</p>
          <div className="max-h-20 overflow-y-auto space-y-0.5">
            {[...archivedCycles].reverse().slice(0, 5).map((c) => (
              <div key={c.id} className="rounded bg-slate-800/40 px-2 py-0.5 text-[10px] text-slate-500">
                {c.label} — {c.assignments.length} assigned — ended {c.endsAt ? new Date(c.endsAt).toLocaleDateString() : 'unknown'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function JobCard({
  job, assignedIds, allAssignedIds, students, getStudentName,
  assignModalJobId, onOpenAssign, onAssign, onUnassign,
}: {
  job: ClassroomJob
  assignedIds: string[]
  allAssignedIds: Set<string>
  students: Array<{ id: string; displayName?: string; firstName?: string; isAbsent?: boolean }>
  getStudentName: (id: string) => string
  assignModalJobId: string | null
  onOpenAssign: (id: string) => void
  onAssign: (studentId: string) => void
  onUnassign: (studentId: string) => void
}) {
  const filled = assignedIds.length
  const open = job.capacity - filled
  const isModalOpen = assignModalJobId === job.id

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/50 p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-white">
            {job.displayEmoji} {job.title}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{job.description}</p>
        </div>
        <span className="text-[10px] text-slate-400 whitespace-nowrap">
          {filled}/{job.capacity}
        </span>
      </div>

      {/* Assigned students */}
      {assignedIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {assignedIds.map((sid) => (
            <span key={sid} className="inline-flex items-center gap-0.5 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
              {getStudentName(sid)}
              <button onClick={() => onUnassign(sid)} className="ml-0.5 text-slate-500 hover:text-rose-400">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Open slots */}
      {open > 0 && (
        <button
          onClick={() => onOpenAssign(job.id)}
          className="mt-2 rounded border border-dashed border-slate-600 px-2 py-1 text-[10px] text-slate-500 hover:border-slate-400 hover:text-slate-300 transition"
        >
          + Add ({open} slot{open !== 1 ? 's' : ''})
        </button>
      )}

      {/* Assign modal */}
      {isModalOpen && (
        <div className="mt-2 max-h-32 overflow-y-auto rounded border border-cyan-700 bg-slate-950 p-2">
          {students.filter((s) => !allAssignedIds.has(s.id) && !s.isAbsent).length === 0 ? (
            <p className="text-[10px] text-slate-500">All students assigned</p>
          ) : (
            students.filter((s) => !allAssignedIds.has(s.id) && !s.isAbsent).slice(0, 20).map((s) => (
              <button
                key={s.id}
                onClick={() => onAssign(s.id)}
                className="block w-full rounded px-2 py-1 text-left text-[11px] text-slate-300 hover:bg-slate-800 transition"
              >
                {s.displayName ?? s.firstName ?? s.id}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
