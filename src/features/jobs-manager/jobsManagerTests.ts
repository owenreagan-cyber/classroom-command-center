// Mock localStorage for Node environment
const storage: Record<string, string> = {}
const globalObj = globalThis as Record<string, unknown>
globalObj.window = globalObj
globalObj.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { for (const key in storage) delete storage[key] },
  length: 0,
  key: (index: number) => Object.keys(storage)[index] || null,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { DEFAULT_JOBS, DEFAULT_CYCLE_LENGTH_DAYS } from './defaultJobs'
import { smartAssignJobs } from './smartAssign'
import type { ClassroomJob, JobAssignment, StudentJobHistory } from './types'
import type { Student } from '../student-picker/types'

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) passed++
  else { failed++; console.error(`FAIL: ${label}`) }
}

function assertEq(label: string, a: unknown, b: unknown) {
  if (a === b) passed++
  else { failed++; console.error(`FAIL: ${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`) }
}

function assertGt(label: string, a: number, b: number) {
  if (a > b) passed++
  else { failed++; console.error(`FAIL: ${label} — expected > ${b}, got ${a}`) }
}

function assertLte(label: string, a: number, b: number) {
  if (a <= b) passed++
  else { failed++; console.error(`FAIL: ${label} — expected <= ${b}, got ${a}`) }
}

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: `s-${Math.random().toString(36).slice(2, 8)}`,
    displayName: 'Test Student',
    firstName: 'Test',
    lastName: 'Student',
    isActive: true,
    isAbsent: false,
    classes: ['homeroom'],
    section: undefined,
    note: '',
    updatedAt: Date.now(),
    ...overrides,
  } as Student
}

function makeStudents(count: number): Student[] {
  return Array.from({ length: count }, (_, i) => makeStudent({
    id: `s-${i}`,
    displayName: `Student ${i + 1}`,
    firstName: `Student`,
    lastName: `${i + 1}`,
  }))
}

function runTests() {
  // ═══ Default Jobs ═══

  assertEq('JM-01: 9 default jobs', DEFAULT_JOBS.length, 9)

  for (const job of DEFAULT_JOBS) {
    assert(`JM-02a: ${job.id} title`, job.title.length > 0)
    assert(`JM-02b: ${job.id} capacity > 0`, job.capacity > 0)
    assert(`JM-02c: ${job.id} active`, job.active === true)
    assert(`JM-02d: ${job.id} displayOrder`, job.displayOrder > 0)
    assert(`JM-02e: ${job.id} emoji`, job.displayEmoji.length > 0)
  }

  const expectedCaps: Record<string, number> = {
    'job-filer': 2, 'job-cleaner': 2, 'job-lunch-crew': 2,
    'job-monitor': 1, 'job-distributor': 2, 'job-line-leader': 1,
    'job-substitute': 1, 'job-hall-monitor': 1, 'job-door-holder': 2,
  }
  for (const job of DEFAULT_JOBS) {
    assertEq(`JM-03: capacity ${job.id}`, job.capacity, expectedCaps[job.id] ?? 0)
  }

  assertEq('JM-04: cycle length default', DEFAULT_CYCLE_LENGTH_DAYS, 10)

  // ═══ Smart Assign ═══

  const students = makeStudents(20)
  const jobs = DEFAULT_JOBS.map((j) => ({ ...j }))
  const totalCap = jobs.reduce((s, j) => s + j.capacity, 0)

  const { assignments, report } = smartAssignJobs(jobs, students, [], [])
  assertEq('JM-10: fills all jobs with enough students', assignments.length, totalCap)
  assertEq('JM-10b: no unfilled', report.unfilledJobs.length, 0)

  // Capacity check
  for (const job of jobs) {
    const count = assignments.filter((a) => a.jobId === job.id).length
    assertLte(`JM-11: capacity ${job.id}`, count, job.capacity)
  }

  // Unique students
  const ids = assignments.map((a) => a.studentId)
  assertEq('JM-12: no duplicate students', ids.length, new Set(ids).size)

  // Avoid repeat jobs from previous cycle
  const history: StudentJobHistory[] = [
    { studentId: 's-0', completedJobIds: ['job-filer'], recentJobIds: ['job-filer'], assignmentCount: 1, lastAssignedAt: Date.now() },
  ]
  const r2 = smartAssignJobs(jobs, students, [], history)
  const s0assigns = r2.assignments.filter((a) => a.studentId === 's-0')
  const hasFiler = s0assigns.some((a) => a.jobId === 'job-filer')
  assert('JM-13: avoids repeat job', !hasFiler)

  // Prefers fewer recent assignments
  const prefStudents = [
    makeStudent({ id: 's-low', displayName: 'Low', firstName: 'Low' }),
    makeStudent({ id: 's-high', displayName: 'High', firstName: 'High' }),
  ]
  const prefHistory: StudentJobHistory[] = [
    { studentId: 's-high', completedJobIds: ['a', 'b', 'c', 'd', 'e'], recentJobIds: ['a', 'b', 'c'], assignmentCount: 5, lastAssignedAt: Date.now() },
  ]
  const prefJobs: ClassroomJob[] = [{
    id: 'job-test', title: 'Test', description: '', capacity: 1, points: 0, active: true,
    displayOrder: 1, category: '', createdAt: 0, updatedAt: 0, displayEmoji: '🧪',
  }]
  const r3 = smartAssignJobs(prefJobs, prefStudents, [], prefHistory)
  assertEq('JM-14: lower count assigned', r3.assignments[0]!.studentId, 's-low')

  // Handles not enough students
  const fewStudents = makeStudents(3)
  const r4 = smartAssignJobs(jobs, fewStudents, [], [])
  assertEq('JM-15: only 3 assigned with 3 students', r4.assignments.length, 3)
  assertGt('JM-15b: unfilled jobs exist', r4.report.unfilledJobs.length, 0)

  // Skips inactive/absent
  const statusStudents = [
    makeStudent({ id: 's-active', displayName: 'Active', isActive: true, isAbsent: false }),
    makeStudent({ id: 's-inactive', displayName: 'Inactive', isActive: false, isAbsent: false }),
    makeStudent({ id: 's-absent', displayName: 'Absent', isActive: true, isAbsent: true }),
  ]
  const soloJob: ClassroomJob[] = [{
    id: 'job-solo', title: 'Solo', description: '', capacity: 1, points: 0, active: true,
    displayOrder: 1, category: '', createdAt: 0, updatedAt: 0, displayEmoji: '🎯',
  }]
  const r5 = smartAssignJobs(soloJob, statusStudents, [], [])
  assertEq('JM-16: only active non-absent', r5.assignments.length, 1)
  assertEq('JM-16b: assigned to active', r5.assignments[0]!.studentId, 's-active')

  // Preserves existing manual assignments
  const existing: JobAssignment[] = [
    { jobId: 'job-monitor', studentId: 's-0', assignedAt: Date.now(), cycleId: 'c1', status: 'active' },
  ]
  const r6 = smartAssignJobs(jobs, students, existing, [])
  // s-0 is not in new smart assignments (already assigned)
  const newForS0 = r6.assignments.filter((a) => a.studentId === 's-0')
  assertEq('JM-17: no new assignment for s-0', newForS0.length, 0)

  // Report checks
  const r7 = smartAssignJobs(jobs, makeStudents(5), [], [])
  assertGt('JM-18a: assignmentsMade > 0', r7.report.assignmentsMade, 0)
  assertGt('JM-18b: unfilledJobs > 0', r7.report.unfilledJobs.length, 0)

  // Deterministic with fixed rng
  const fixedStudents = makeStudents(15)
  let seq = 0
  const fakeRng = () => { seq++; return seq % 2 === 0 ? 0.3 : 0.7 }
  const d1 = smartAssignJobs(jobs, fixedStudents, [], [], fakeRng)
  seq = 0
  const d2 = smartAssignJobs(jobs, fixedStudents, [], [], fakeRng)
  const ids1 = d1.assignments.map((a) => a.studentId).sort().join(',')
  const ids2 = d2.assignments.map((a) => a.studentId).sort().join(',')
  assertEq('JM-20: deterministic', ids1, ids2)

  // Inactive jobs filtered
  const mixJobs: ClassroomJob[] = [
    ...jobs.slice(0, 3),
    { ...jobs[3]!, active: false },
  ]
  const r8 = smartAssignJobs(mixJobs, students, [], [])
  const inactiveAssigned = r8.assignments.filter((a) => a.jobId === jobs[3]!.id)
  assertEq('JM-21: inactive job ignored', inactiveAssigned.length, 0)

  // Empty students returns empty
  const r9 = smartAssignJobs(jobs, [], [], [])
  assertEq('JM-22: empty students', r9.assignments.length, 0)

  // No active jobs returns empty
  const allInactive = DEFAULT_JOBS.map((j) => ({ ...j, active: false }))
  const r10 = smartAssignJobs(allInactive, students, [], [])
  assertEq('JM-23: all inactive jobs', r10.assignments.length, 0)

  // Respects existing capacity (capacity minus existing = remaining)
  const existingFilling: JobAssignment[] = [
    { jobId: 'job-monitor', studentId: 's-0', assignedAt: Date.now(), cycleId: 'c1', status: 'active' },
  ]
  const r11 = smartAssignJobs(jobs, students, existingFilling, [])
  // job-monitor has capacity 1, already filled → no more assigned to it
  const monitorAssigns = r11.assignments.filter((a) => a.jobId === 'job-monitor')
  assertEq('JM-24: capacity minus existing', monitorAssigns.length, 0)

  // Summary
  console.log(`\nJobs Manager: ${passed}P ${failed}F\n`)
  if (failed > 0) {
    console.error('SOME TESTS FAILED')
    process.exit(1)
  }
}

try {
  runTests()
} catch (e) {
  console.error('Test suite crashed:', e)
  process.exit(1)
}
