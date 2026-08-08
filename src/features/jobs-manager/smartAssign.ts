import type { Student } from '../student-picker/types'
import type { ClassroomJob, JobAssignment, StudentJobHistory, SmartAssignReport } from './types'

export function smartAssignJobs(
  jobs: ClassroomJob[],
  students: Student[],
  existingAssignments: JobAssignment[],
  studentHistory: StudentJobHistory[],
  rng: () => number = Math.random,
): { assignments: JobAssignment[]; report: SmartAssignReport } {
  const activeJobs = jobs.filter((j) => j.active).sort((a, b) => a.displayOrder - b.displayOrder)
  const eligibleStudents = students.filter((s) => s.isActive && !s.isAbsent)
  const assignments: JobAssignment[] = []
  const assignedStudentIds = new Set<string>()

  // Preserve existing manual assignments (not replaced by smart assign)
  for (const a of existingAssignments) {
    assignedStudentIds.add(a.studentId)
  }

  // Track remaining capacity per job
  const capacity = new Map<string, number>()
  for (const job of activeJobs) {
    const alreadyFilled = existingAssignments.filter((a) => a.jobId === job.id).length
    capacity.set(job.id, Math.max(0, job.capacity - alreadyFilled))
  }

  // Get prior-cycle job IDs for each student
  const priorJobMap = new Map<string, Set<string>>()
  for (const hist of studentHistory) {
    priorJobMap.set(hist.studentId, new Set(hist.recentJobIds.slice(0, 3)))
  }

  // Score each student: fewer recent assignments = higher priority
  const scoreMap = new Map<string, number>()
  for (const s of eligibleStudents) {
    const hist = studentHistory.find((h) => h.studentId === s.id)
    scoreMap.set(s.id, hist ? hist.assignmentCount : 0)
  }

  // Sort students by score (ascending — fewer assignments first)
  const ranked = [...eligibleStudents].sort((a, b) => (scoreMap.get(a.id) ?? 0) - (scoreMap.get(b.id) ?? 0))

  // First pass: avoid prior-cycle job conflicts
  // Shuffle students using provided rng for fairness
  const shuffled = [...ranked]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }

  for (const job of activeJobs) {
    for (const student of shuffled) {
      if (assignedStudentIds.has(student.id)) continue
      if ((capacity.get(job.id) ?? 0) <= 0) continue
      const prior = priorJobMap.get(student.id)
      if (prior?.has(job.id)) continue // skip if same job in prior cycle

      assignments.push({
        jobId: job.id,
        studentId: student.id,
        assignedAt: Date.now(),
        cycleId: '', // filled by store
        status: 'active',
      })
      assignedStudentIds.add(student.id)
      capacity.set(job.id, (capacity.get(job.id) ?? 0) - 1)
      break
    }
  }

  // Second pass: fill remaining with relaxed constraint (allow prior jobs)
  for (const job of activeJobs) {
    let cap = capacity.get(job.id) ?? 0
    if (cap <= 0) continue
    for (const student of shuffled) {
      if (cap <= 0) break
      if (assignedStudentIds.has(student.id)) continue

      assignments.push({
        jobId: job.id,
        studentId: student.id,
        assignedAt: Date.now(),
        cycleId: '',
        status: 'active',
      })
      assignedStudentIds.add(student.id)
      cap--
      capacity.set(job.id, cap)
    }
  }

  // Build report
  const unfilledJobs: SmartAssignReport['unfilledJobs'] = []
  for (const job of activeJobs) {
    const assigned = assignments.filter((a) => a.jobId === job.id).length
    if (assigned < job.capacity) {
      unfilledJobs.push({ jobId: job.id, title: job.title, capacity: job.capacity, filled: assigned })
    }
  }

  return {
    assignments,
    report: {
      assignmentsMade: assignments.length,
      unfilledJobs,
      skippedStudents: eligibleStudents.length - assignedStudentIds.size,
    },
  }
}
