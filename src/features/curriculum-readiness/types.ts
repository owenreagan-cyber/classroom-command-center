import type { CurriculumSubjectId } from '../curriculum/types'

export type ReadinessStatus = 'ready' | 'warning' | 'incomplete'

/** Canonical resource slots checked by readiness rules. */
export type ReadinessResourceSlot =
  | 'presentation'
  | 'student-resource'
  | 'teacher-notes'
  | 'teacher-script'
  | 'teacher-key'
  | 'practice'
  | 'pdf'
  | 'lesson-resource'

export interface ReadinessRequirementGroup {
  /** At least one slot in the group must be present. */
  oneOf: readonly ReadinessResourceSlot[]
  /** Teacher-facing label for UI and missing-resource lists. */
  label: string
}

export interface SubjectReadinessRule {
  subject: CurriculumSubjectId
  required: readonly ReadinessRequirementGroup[]
  recommended: readonly ReadinessResourceSlot[]
}

export interface LessonReadiness {
  lessonId: string
  score: number
  status: ReadinessStatus
  requiredResources: readonly string[]
  availableResources: readonly ReadinessResourceSlot[]
  missingResources: readonly string[]
  missingRecommended: readonly string[]
  omninoteReady: boolean
  displayReady: boolean
  teacherReady: boolean
  /** Teacher chose to proceed despite warnings — does not block actions. */
  teacherOverride?: boolean
}

/** Compact readiness attached to lesson packages. */
export interface LessonReadinessSummary {
  status: ReadinessStatus
  score: number
  omninoteReady: boolean
  displayReady: boolean
  teacherReady: boolean
  teacherOverride?: boolean
}

export interface ReadinessPersistedState {
  version: 1
  /** Lesson ids marked ready by teacher override. */
  teacherOverrides: Record<string, boolean>
}

export const READINESS_STORAGE_KEY = 'classroom-curriculum-readiness-v1'
export const READINESS_STORAGE_VERSION = 1 as const

/** Keys that must never appear on /display payloads. */
export const READINESS_DISPLAY_FORBIDDEN_KEYS = [
  'readiness',
  'lessonReadiness',
  'missingResources',
  'missingRecommended',
  'curriculumReadiness',
  'teacherOverride',
] as const
