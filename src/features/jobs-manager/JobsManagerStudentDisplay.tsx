import { useMemo } from 'react'
import { useJobsManagerStore } from './jobsManagerStore'
import { usePickerStore } from '../student-picker/pickerStore'

export function JobsManagerStudentDisplay() {
  const activeCycle = useJobsManagerStore((s) => s.activeCycle)
  const jobs = useJobsManagerStore((s) => s.jobs)
  const students = usePickerStore((s) => s.students)

  const displayState = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.active).sort((a, b) => a.displayOrder - b.displayOrder)
    const assignments = activeCycle?.assignments ?? []

    const jobCards = activeJobs.map((j) => {
      const assignedIds = assignments.filter((a) => a.jobId === j.id).map((a) => a.studentId)
      const names = assignedIds.map((id) => students.find((s) => s.id === id)?.firstName ?? '').filter(Boolean)
      return {
        title: j.title,
        emoji: j.displayEmoji,
        capacity: j.capacity,
        names,
        filled: names.length,
      }
    })

    const totalSlots = activeJobs.reduce((s, j) => s + j.capacity, 0)
    const totalAssigned = assignments.length

    return {
      cycleLabel: activeCycle?.label ?? 'Not Started',
      jobCards,
      totalSlots,
      totalAssigned,
      isEmpty: assignments.length === 0,
    }
  }, [activeCycle, jobs, students])

  return (
    <div className="rounded-2xl bg-slate-950/50 p-5 backdrop-blur-sm shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xl font-bold text-white">🧰 Classroom Jobs</p>
        <span className="text-xs text-slate-400">{displayState.cycleLabel}</span>
      </div>

      {displayState.isEmpty ? (
        <div className="py-6 text-center">
          <p className="text-3xl text-slate-600">🧰</p>
          <p className="mt-2 text-sm text-slate-400">Jobs are ready to assign</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {displayState.jobCards.filter((j) => j.names.length > 0).map((job, i) => (
            <div
              key={i}
              className="rounded-lg bg-slate-900/60 border border-slate-700/50 p-2.5"
            >
              <p className="text-xs font-bold text-white">
                {job.emoji} {job.title}
              </p>
              <p className="mt-1 text-[11px] text-slate-300 leading-snug">
                {job.names.join(', ')}
              </p>
              {job.filled < job.capacity && (
                <p className="text-[9px] text-slate-600 mt-0.5">+{job.capacity - job.filled} open</p>
              )}
            </div>
          ))}
        </div>
      )}

      {!displayState.isEmpty && (
        <p className="mt-3 text-[10px] text-slate-500 text-center">
          {displayState.totalAssigned} / {displayState.totalSlots} slots filled
        </p>
      )}
    </div>
  )
}
