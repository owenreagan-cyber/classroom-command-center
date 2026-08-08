import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  JobsManagerState, ClassroomJob, JobAssignment, JobCycle,
  SmartAssignReport, DisplaySafeJobsState, DisplaySafeJob,
} from './types'
import { DEFAULT_JOBS, DEFAULT_CYCLE_LENGTH_DAYS } from './defaultJobs'
import { smartAssignJobs } from './smartAssign'
import type { Student } from '../student-picker/types'

const STORAGE_KEY = 'classroom-jobs-manager-v1'

function generateId(): string { return `jm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

function createCycle(label: string, cycleLengthDays: number, classId: string | null): JobCycle {
  const now = Date.now()
  return {
    id: generateId(), label, classId, status: 'active', startsAt: now, endsAt: null,
    cycleLengthDays, assignments: [], createdAt: now, updatedAt: now,
  }
}

function freshState(): JobsManagerState {
  return {
    jobs: DEFAULT_JOBS.map((j) => ({ ...j })),
    activeCycle: null,
    archivedCycles: [],
    studentHistory: [],
    selectedClassId: null,
    cycleLengthDays: DEFAULT_CYCLE_LENGTH_DAYS,
    updatedAt: Date.now(),
  }
}

interface JobsManagerStore extends JobsManagerState {
  initializeJobsManager: () => void
  createJob: (partial: Pick<ClassroomJob, 'title' | 'description' | 'capacity' | 'points' | 'category' | 'displayEmoji'>) => ClassroomJob
  updateJob: (id: string, patch: Partial<ClassroomJob>) => void
  setJobActive: (id: string, active: boolean) => void
  resetDefaultJobs: () => void
  assignStudentToJob: (jobId: string, studentId: string) => { ok: boolean; message?: string }
  unassignStudentFromJob: (jobId: string, studentId: string) => void
  moveStudentToJob: (studentId: string, targetJobId: string) => { ok: boolean; message?: string }
  smartAssign: (students: Student[]) => SmartAssignReport
  clearAllAssignments: () => void
  startNewCycle: (label?: string) => void
  endCycle: () => void
  undoEndCycle: () => void
  setCycleLengthDays: (days: number) => void
  setSelectedClassId: (id: string | null) => void
  getStudentsForJob: (jobId: string, students: Student[]) => Student[]
  getDisplaySafeJobsState: (students: Student[]) => DisplaySafeJobsState
}

export const useJobsManagerStore = create<JobsManagerStore>()(
  persist(
    (set, get) => ({
      ...freshState(),

      initializeJobsManager: () => {
        const { jobs } = get()
        if (jobs.length === 0) set({ jobs: DEFAULT_JOBS.map((j) => ({ ...j })), updatedAt: Date.now() })
      },

      createJob: (partial) => {
        const job: ClassroomJob = {
          ...partial,
          id: generateId(),
          active: true,
          displayOrder: get().jobs.length + 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ jobs: [...s.jobs, job], updatedAt: Date.now() }))
        return job
      },

      updateJob: (id, patch) => {
        set((s) => ({
          jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch, updatedAt: Date.now() } : j)),
          updatedAt: Date.now(),
        }))
      },

      setJobActive: (id, active) => {
        get().updateJob(id, { active })
        // If deactivated, remove any assignments for this job
        if (!active) {
          const { activeCycle } = get()
          if (activeCycle) {
            set({
              activeCycle: {
                ...activeCycle,
                assignments: activeCycle.assignments.filter((a) => a.jobId !== id),
                updatedAt: Date.now(),
              },
            })
          }
        }
      },

      resetDefaultJobs: () => {
        set({
          jobs: DEFAULT_JOBS.map((j) => ({ ...j })),
          activeCycle: null,
          archivedCycles: [],
          studentHistory: [],
          updatedAt: Date.now(),
        })
      },

      assignStudentToJob: (jobId, studentId) => {
        const { jobs, activeCycle } = get()
        if (!activeCycle) return { ok: false, message: 'Start a cycle before assigning jobs.' }

        const job = jobs.find((j) => j.id === jobId)
        if (!job || !job.active) return { ok: false, message: 'Job is not active.' }

        const current = activeCycle.assignments.filter((a) => a.jobId === jobId)
        if (current.length >= job.capacity) return { ok: false, message: `${job.title} is full (${job.capacity} max).` }

        // If student already has a job, remove old assignment
        const cleaned = activeCycle.assignments.filter((a) => a.studentId !== studentId)

        const newAssign: JobAssignment = {
          jobId, studentId, assignedAt: Date.now(), cycleId: activeCycle.id, status: 'active',
        }

        set({
          activeCycle: { ...activeCycle, assignments: [...cleaned, newAssign], updatedAt: Date.now() },
          updatedAt: Date.now(),
        })
        return { ok: true }
      },

      unassignStudentFromJob: (jobId, studentId) => {
        const { activeCycle } = get()
        if (!activeCycle) return
        set({
          activeCycle: {
            ...activeCycle,
            assignments: activeCycle.assignments.filter(
              (a) => !(a.jobId === jobId && a.studentId === studentId),
            ),
            updatedAt: Date.now(),
          },
          updatedAt: Date.now(),
        })
      },

      moveStudentToJob: (studentId, targetJobId) => {
        const { jobs, activeCycle } = get()
        if (!activeCycle) return { ok: false, message: 'Start a cycle first.' }

        const targetJob = jobs.find((j) => j.id === targetJobId)
        if (!targetJob || !targetJob.active) return { ok: false, message: 'Target job is not active.' }

        const existing = activeCycle.assignments.filter((a) => a.studentId === studentId)
        const hasExistingOnTarget = existing.some((a) => a.jobId === targetJobId)

        // Remove old assignments, add new if not already on target
        const updated = activeCycle.assignments.filter((a) => a.studentId !== studentId)

        if (!hasExistingOnTarget) {
          const targetCount = updated.filter((a) => a.jobId === targetJobId).length
          if (targetCount >= targetJob.capacity) return { ok: false, message: `${targetJob.title} is full.` }
          updated.push({ jobId: targetJobId, studentId, assignedAt: Date.now(), cycleId: activeCycle.id, status: 'active' })
        }

        set({
          activeCycle: { ...activeCycle, assignments: updated, updatedAt: Date.now() },
          updatedAt: Date.now(),
        })
        return { ok: true }
      },

      smartAssign: (students) => {
        const { jobs, activeCycle, studentHistory } = get()
        if (!activeCycle) throw new Error('Start a cycle first.')

        const { assignments } = smartAssignJobs(jobs, students, activeCycle.assignments, studentHistory)
        const final = assignments.map((a) => ({ ...a, cycleId: activeCycle.id }))

        set({
          activeCycle: { ...activeCycle, assignments: final, updatedAt: Date.now() },
          updatedAt: Date.now(),
        })

        // Build report
        const unfilledJobs: SmartAssignReport['unfilledJobs'] = []
        for (const job of jobs.filter((j) => j.active)) {
          const assigned = final.filter((a) => a.jobId === job.id).length
          if (assigned < job.capacity) {
            unfilledJobs.push({ jobId: job.id, title: job.title, capacity: job.capacity, filled: assigned })
          }
        }

        return {
          assignmentsMade: final.length,
          unfilledJobs,
          skippedStudents: students.filter((s) => s.isActive && !s.isAbsent).length - new Set(final.map((a) => a.studentId)).size,
        }
      },

      clearAllAssignments: () => {
        const { activeCycle } = get()
        if (!activeCycle) return
        set({
          activeCycle: { ...activeCycle, assignments: [], updatedAt: Date.now() },
          updatedAt: Date.now(),
        })
      },

      startNewCycle: (label) => {
        const { activeCycle, archivedCycles, cycleLengthDays, selectedClassId } = get()
        if (activeCycle) {
          // Auto-archive current cycle
          const archived: JobCycle = { ...activeCycle, status: 'archived', endsAt: Date.now(), updatedAt: Date.now() }
          set({ archivedCycles: [...archivedCycles, archived] })
        }

        const newCycle = createCycle(label ?? `Cycle ${archivedCycles.length + (activeCycle ? 2 : 1)}`, cycleLengthDays, selectedClassId)
        set({ activeCycle: newCycle, updatedAt: Date.now() })
      },

      endCycle: () => {
        const { activeCycle, archivedCycles, studentHistory } = get()
        if (!activeCycle) return

        // Build student history from this cycle
        const newHistory = [...studentHistory]
        const studentJobMap = new Map<string, string[]>()
        for (const a of activeCycle.assignments) {
          const prev = studentJobMap.get(a.studentId) ?? []
          prev.push(a.jobId)
          studentJobMap.set(a.studentId, prev)
        }

        for (const [studentId, jobIds] of studentJobMap) {
          const existing = newHistory.findIndex((h) => h.studentId === studentId)
          if (existing >= 0) {
            const h = newHistory[existing]!
            newHistory[existing] = {
              ...h,
              completedJobIds: [...h.completedJobIds, ...jobIds],
              recentJobIds: [...jobIds, ...h.recentJobIds].slice(0, 10),
              assignmentCount: h.assignmentCount + 1,
              lastAssignedAt: Date.now(),
            }
          } else {
            newHistory.push({
              studentId,
              completedJobIds: [...jobIds],
              recentJobIds: [...jobIds],
              assignmentCount: 1,
              lastAssignedAt: Date.now(),
            })
          }
        }

        const archived: JobCycle = { ...activeCycle, status: 'archived', endsAt: Date.now(), updatedAt: Date.now() }
        set({
          activeCycle: null,
          archivedCycles: [...archivedCycles, archived],
          studentHistory: newHistory,
          updatedAt: Date.now(),
        })
      },

      undoEndCycle: () => {
        const { archivedCycles } = get()
        if (archivedCycles.length === 0) return

        const last = archivedCycles[archivedCycles.length - 1]!
        const restored: JobCycle = { ...last, status: 'active', endsAt: null, updatedAt: Date.now() }
        set({
          activeCycle: restored,
          archivedCycles: archivedCycles.slice(0, -1),
          updatedAt: Date.now(),
        })
      },

      setCycleLengthDays: (days) => {
        const clamped = Math.max(1, Math.min(45, days))
        set({ cycleLengthDays: clamped, updatedAt: Date.now() })
      },

      setSelectedClassId: (id) => {
        set({ selectedClassId: id, updatedAt: Date.now() })
      },

      getStudentsForJob: (jobId, students) => {
        const { activeCycle } = get()
        if (!activeCycle) return []
        const assignedIds = new Set(
          activeCycle.assignments.filter((a) => a.jobId === jobId).map((a) => a.studentId),
        )
        return students.filter((s) => assignedIds.has(s.id))
      },

      getDisplaySafeJobsState: (students): DisplaySafeJobsState => {
        const { jobs, activeCycle } = get()
        const jobStudentMap = new Map<string, number[]>()
        for (const a of activeCycle?.assignments ?? []) {
          if (!jobStudentMap.has(a.jobId)) jobStudentMap.set(a.jobId, [])
          jobStudentMap.get(a.jobId)!.push(a.studentId as unknown as number)
        }

        const displayJobs: DisplaySafeJob[] = jobs
          .filter((j) => j.active)
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((j) => {
            const sIds = jobStudentMap.get(j.id) ?? []
            const names = sIds
              .map((sid: unknown) => students.find((s) => s.id === String(sid))?.firstName ?? '')
              .filter(Boolean)
            return { title: j.title, description: j.description, capacity: j.capacity, assignedNames: names, displayEmoji: j.displayEmoji }
          })

        const totalSlots = jobs.filter((j) => j.active).reduce((sum, j) => sum + j.capacity, 0)
        const totalAssigned = (activeCycle?.assignments ?? []).length

        return {
          cycleLabel: activeCycle?.label ?? 'Not Started',
          jobs: displayJobs,
          totalAssigned,
          totalSlots,
        }
      },
    }),
    { name: STORAGE_KEY },
  ),
)
