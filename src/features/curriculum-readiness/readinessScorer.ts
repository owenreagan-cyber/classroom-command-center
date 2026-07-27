import type { CurriculumSubjectId } from '../curriculum/types'
import type { FetcherResourceType } from '../curriculum-library-fetcher/types'
import { getPrimaryResource, getStudentSafeResources, getTeacherResource } from '../curriculum-library-fetcher/resourceClassifier'
import { getSubjectReadinessRule, recommendedDisplayLabel } from './readinessRules'
import type {
  LessonReadiness,
  LessonReadinessSummary,
  ReadinessResourceSlot,
  ReadinessStatus,
} from './types'

export interface ScorableLessonResource {
  type: FetcherResourceType
  path: string
  filename: string
}

function isTeacherOnlyPath(path: string): boolean {
  return (
    path.includes('02_Teacher_Scripts') ||
    path.includes('04_Teacher_Keys') ||
    /teacher|script|key/i.test(path)
  )
}

/** Map fetcher resources to readiness slots present in the lesson. */
export function detectAvailableSlots(
  resources: readonly ScorableLessonResource[],
): Set<ReadinessResourceSlot> {
  const slots = new Set<ReadinessResourceSlot>()

  for (const resource of resources) {
    if (resource.type === 'presentation') {
      slots.add('presentation')
      slots.add('lesson-resource')
    }
    if (resource.type === 'worksheet') {
      slots.add('student-resource')
      if (/practice/i.test(resource.filename)) slots.add('practice')
    }
    if (resource.type === 'pdf') {
      slots.add('pdf')
      slots.add('lesson-resource')
      if (!isTeacherOnlyPath(resource.path)) slots.add('student-resource')
      if (/practice/i.test(resource.filename)) slots.add('practice')
    }
    if (resource.type === 'teacher-notes') {
      slots.add('teacher-notes')
      slots.add('teacher-script')
    }
    if (resource.path.includes('04_Teacher_Keys')) slots.add('teacher-key')
    if (resource.path.includes('03_Student_Resources')) slots.add('student-resource')
    if (resource.path.includes('02_Teacher_Scripts')) slots.add('teacher-script')
  }

  return slots
}

function groupMet(
  oneOf: readonly ReadinessResourceSlot[],
  available: Set<ReadinessResourceSlot>,
): boolean {
  return oneOf.some((slot) => available.has(slot))
}

export function isOmniNoteReadyFromResources(
  resources: readonly ScorableLessonResource[],
): boolean {
  const primary = getPrimaryResource(resources)
  return Boolean(
    primary &&
      (primary.type === 'presentation' || primary.type === 'pdf' || primary.type === 'worksheet'),
  )
}

export function isDisplayReadyFromResources(
  resources: readonly ScorableLessonResource[],
): boolean {
  const safe = getStudentSafeResources(resources)
  return safe.some(
    (r) => r.type === 'presentation' || r.type === 'pdf' || r.type === 'worksheet',
  )
}

export function isTeacherReadyFromResources(
  resources: readonly ScorableLessonResource[],
): boolean {
  return Boolean(getTeacherResource(resources) || resources.some((r) => r.path.includes('04_Teacher_Keys')))
}

function resolveStatus(
  missingRequired: readonly string[],
  missingRecommended: readonly string[],
  teacherOverride: boolean,
): ReadinessStatus {
  if (teacherOverride) return 'ready'
  if (missingRequired.length > 0) return 'incomplete'
  if (missingRecommended.length > 0) return 'warning'
  return 'ready'
}

function resolveScore(
  missingRequired: readonly string[],
  missingRecommended: readonly string[],
  teacherOverride: boolean,
): number {
  if (teacherOverride) return 100
  if (missingRequired.length > 0) {
    return Math.max(0, 50 - missingRequired.length * 25)
  }
  if (missingRecommended.length > 0) {
    return Math.max(70, 100 - missingRecommended.length * 15)
  }
  return 100
}

/** Score a lesson package for classroom readiness. */
export function scoreLessonReadiness(input: {
  lessonId: string
  subject: CurriculumSubjectId
  resources: readonly ScorableLessonResource[]
  teacherOverride?: boolean
}): LessonReadiness {
  const rule = getSubjectReadinessRule(input.subject)
  const available = detectAvailableSlots(input.resources)

  const missingRequired: string[] = []
  for (const group of rule.required) {
    if (!groupMet(group.oneOf, available)) {
      missingRequired.push(group.label)
    }
  }

  const missingRecommended: string[] = []
  for (const slot of rule.recommended) {
    if (!available.has(slot)) {
      missingRecommended.push(recommendedDisplayLabel(slot))
    }
  }

  const teacherOverride = input.teacherOverride === true
  const status = resolveStatus(missingRequired, missingRecommended, teacherOverride)
  const score = resolveScore(missingRequired, missingRecommended, teacherOverride)

  const requiredLabels = rule.required.map((g) => g.label)

  return {
    lessonId: input.lessonId,
    score,
    status,
    requiredResources: requiredLabels,
    availableResources: [...available],
    missingResources: missingRequired,
    missingRecommended,
    omninoteReady: isOmniNoteReadyFromResources(input.resources),
    displayReady: isDisplayReadyFromResources(input.resources),
    teacherReady: isTeacherReadyFromResources(input.resources),
    teacherOverride: teacherOverride || undefined,
  }
}

export function toReadinessSummary(readiness: LessonReadiness): LessonReadinessSummary {
  return {
    status: readiness.status,
    score: readiness.score,
    omninoteReady: readiness.omninoteReady,
    displayReady: readiness.displayReady,
    teacherReady: readiness.teacherReady,
    teacherOverride: readiness.teacherOverride,
  }
}

export function getReadinessStatusLabel(status: ReadinessStatus, override?: boolean): string {
  if (override) return 'READY ✓ (Override)'
  switch (status) {
    case 'ready':
      return 'READY ✓'
    case 'warning':
      return 'WARNING ⚠'
    case 'incomplete':
      return 'INCOMPLETE'
  }
}

export function getReadinessStatusTone(
  status: ReadinessStatus,
): 'ready' | 'warning' | 'incomplete' {
  return status
}

/** Resource checklist rows for Today Prep — required + recommended with present state. */
export function getReadinessResourceChecklist(
  subject: CurriculumSubjectId,
  resources: readonly ScorableLessonResource[],
): Array<{ label: string; present: boolean; recommended?: boolean }> {
  const rule = getSubjectReadinessRule(subject)
  const available = detectAvailableSlots(resources)
  const rows: Array<{ label: string; present: boolean; recommended?: boolean }> = []

  for (const group of rule.required) {
    rows.push({
      label: group.label,
      present: groupMet(group.oneOf, available),
      recommended: false,
    })
  }
  for (const slot of rule.recommended) {
    rows.push({
      label: recommendedDisplayLabel(slot),
      present: available.has(slot),
      recommended: true,
    })
  }

  return rows
}

/** Whether readiness metadata is safe to expose on teacher control routes only. */
export function isReadinessTeacherOnly(): true {
  return true
}
