/**
 * Jobs Manager — local-first classroom jobs, assignment cycles, and teacher dock integration.
 *
 * No cloud, no AI, no voice. Zustand + localStorage persistence.
 */export interface ClassroomJob {
  id: string
  title: string
  description: string
  capacity: number
  points: number
  active: boolean
  displayOrder: number
  category: string
  createdAt: number
  updatedAt: number
  displayEmoji: string
}

export type AssignmentStatus = 'active' | 'completed' | 'removed'

export interface JobAssignment {
  jobId: string
  studentId: string
  assignedAt: number
  cycleId: string
  status: AssignmentStatus
}

export interface JobCycle {
  id: string
  label: string
  classId: string | null
  status: 'active' | 'archived'
  startsAt: number
  endsAt: number | null
  cycleLengthDays: number
  assignments: JobAssignment[]
  createdAt: number
  updatedAt: number
}

export interface StudentJobHistory {
  studentId: string
  completedJobIds: string[]
  recentJobIds: string[]
  assignmentCount: number
  lastAssignedAt: number | null
}

export interface JobsManagerState {
  jobs: ClassroomJob[]
  activeCycle: JobCycle | null
  archivedCycles: JobCycle[]
  studentHistory: StudentJobHistory[]
  selectedClassId: string | null
  cycleLengthDays: number
  updatedAt: number
}

export interface SmartAssignReport {
  assignmentsMade: number
  unfilledJobs: Array<{ jobId: string; title: string; capacity: number; filled: number }>
  skippedStudents: number
}

export interface DisplaySafeJob {
  title: string
  description: string
  capacity: number
  assignedNames: string[]
  displayEmoji: string
}

export interface DisplaySafeJobsState {
  cycleLabel: string
  jobs: DisplaySafeJob[]
  totalAssigned: number
  totalSlots: number
}
