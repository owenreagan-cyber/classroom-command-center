import type { CurriculumTrack, HistoryScienceSubject } from '../../data/routineTypes'
import type { ScreenId } from '../../data/types'

/** Instructional subjects supported by the pacing engine. */
export type CurriculumSubjectId =
  | 'math'
  | 'reading'
  | 'spelling'
  | 'shurley'
  | 'history'
  | 'science'

export type CurriculumProgram =
  | 'saxon-math'
  | 'reading-mastery'
  | 'spelling-curriculum'
  | 'shurley-english'
  | 'history-units'
  | 'science-units'

export type LessonResourceKind =
  | 'slides'
  | 'pdf'
  | 'worksheet'
  | 'teacher-notes'
  | 'answer-key'
  | 'image'

export type LessonAnnotationMode = 'annotate' | 'present' | 'read-only'

export type LessonDisplayMode = 'student-safe' | 'teacher-only' | 'none'

export interface LessonResource {
  id: string
  title: string
  kind: LessonResourceKind
  /** URL or local path to the resource file. */
  source?: string
}

export interface SchoolYear {
  id: string
  label: string
  /** ISO date string (YYYY-MM-DD) for first instructional Monday. */
  startDate: string
  endDate: string
  weekPlans: readonly WeekPlan[]
}

export interface Track {
  id: CurriculumTrack
  label: string
  historyScienceSubject: HistoryScienceSubject
}

export interface WeekPlan {
  weekNumber: number
  trackId: CurriculumTrack
  lessonNumber: number
  subjectPlans: readonly SubjectPlan[]
}

export interface SubjectPlan {
  subjectId: CurriculumSubjectId
  program: CurriculumProgram
  lessonId: string
  lessonNumber: number
  title: string
  unitTitle?: string
  chapterTitle?: string
}

export interface LessonPlan {
  id: string
  subjectId: CurriculumSubjectId
  program: CurriculumProgram
  lessonNumber: number
  title: string
  /** Teacher-facing label, e.g. "Saxon Lesson 2". */
  displayTitle: string
  weekNumber: number
  trackId: CurriculumTrack
  unitTitle?: string
  chapterTitle?: string
}

export interface LessonPackage {
  id: string
  title: string
  subject: CurriculumSubjectId
  curriculum: CurriculumProgram
  lessonNumber: number
  resources: readonly LessonResource[]
  annotationMode: LessonAnnotationMode
  displayMode: LessonDisplayMode
  /** Classroom readiness quality gate — teacher control only. */
  readiness?: import('../curriculum-readiness/types').LessonReadinessSummary
}

export interface PacingSnapshot {
  date: string
  track: CurriculumTrack
  schoolWeek: number
  lessonNumber: number
  historyScienceSubject: HistoryScienceSubject
  lessons: Partial<Record<CurriculumSubjectId, LessonPlan>>
}

export interface PacingPersistedState {
  version: 1
  /** Optional teacher override for lesson number on a given ISO date. */
  lessonOverrides: Record<string, Partial<Record<CurriculumSubjectId, number>>>
}

export const PACING_STORAGE_KEY = 'classroom-curriculum-pacing-v1'
export const PACING_STORAGE_VERSION = 1 as const

/** Map control-route screens to curriculum subjects when a lesson applies. */
export const SCREEN_TO_SUBJECT: Partial<Record<ScreenId, CurriculumSubjectId>> = {
  math: 'math',
  reading: 'reading',
  writing: 'shurley',
  'social-studies': 'history',
  science: 'science',
}
