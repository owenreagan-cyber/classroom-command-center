import type { CurriculumTrack } from '../../data/routineTypes'
import { TRACK_HISTORY_SCIENCE_MAP } from '../../data/scheduleModel'
import type {
  CurriculumProgram,
  CurriculumSubjectId,
  SchoolYear,
  SubjectPlan,
  Track,
  WeekPlan,
} from './types'

/** First instructional Monday — Q1W1 lesson numbering anchor. */
export const SCHOOL_YEAR_2026_START = new Date(2026, 6, 20, 0, 0, 0, 0)

export const CURRICULUM_TRACKS: readonly Track[] = [
  { id: 1, label: 'Track 1', historyScienceSubject: 'history' },
  { id: 2, label: 'Track 2', historyScienceSubject: 'science' },
  { id: 3, label: 'Track 3', historyScienceSubject: 'history' },
  { id: 4, label: 'Track 4', historyScienceSubject: 'science' },
] as const

const HISTORY_UNIT_PLAN: readonly { unitTitle: string; chapterTitle: string }[] = [
  { unitTitle: 'Our Community', chapterTitle: 'Chapter 1' },
  { unitTitle: 'Exploring Maps', chapterTitle: 'Chapter 1' },
  { unitTitle: 'Native Peoples', chapterTitle: 'Chapter 2' },
  { unitTitle: 'Colonial Life', chapterTitle: 'Chapter 1' },
]

const SCIENCE_UNIT_PLAN: readonly { unitTitle: string; lessonTitle: string }[] = [
  { unitTitle: 'Scientific Inquiry', lessonTitle: 'Lesson 1' },
  { unitTitle: 'Plant Structures', lessonTitle: 'Lesson 2' },
  { unitTitle: 'Earth Materials', lessonTitle: 'Lesson 1' },
  { unitTitle: 'Weather Patterns', lessonTitle: 'Lesson 2' },
]

const SHURLEY_UNIT_PLAN: readonly string[] = [
  'Sentence Patterns Unit 1',
  'Sentence Patterns Unit 2',
  'Paragraph Writing Unit 1',
  'Grammar Review Unit 1',
]

function subjectProgram(subjectId: CurriculumSubjectId): CurriculumProgram {
  switch (subjectId) {
    case 'math':
      return 'saxon-math'
    case 'reading':
      return 'reading-mastery'
    case 'spelling':
      return 'spelling-curriculum'
    case 'shurley':
      return 'shurley-english'
    case 'history':
      return 'history-units'
    case 'science':
      return 'science-units'
  }
}

function buildSubjectPlan(
  subjectId: CurriculumSubjectId,
  weekNumber: number,
  lessonNumber: number,
): SubjectPlan {
  const program = subjectProgram(subjectId)
  const lessonId = `${subjectId}-week-${weekNumber}`

  switch (subjectId) {
    case 'math':
      return {
        subjectId,
        program,
        lessonId,
        lessonNumber,
        title: `Saxon Lesson ${lessonNumber}`,
      }
    case 'reading':
      return {
        subjectId,
        program,
        lessonId,
        lessonNumber,
        title: `Lesson ${lessonNumber}`,
      }
    case 'spelling':
      return {
        subjectId,
        program,
        lessonId,
        lessonNumber,
        title: `Lesson ${lessonNumber}`,
      }
    case 'shurley': {
      const unit = SHURLEY_UNIT_PLAN[(lessonNumber - 1) % SHURLEY_UNIT_PLAN.length]!
      return {
        subjectId,
        program,
        lessonId,
        lessonNumber,
        title: unit,
        unitTitle: unit,
      }
    }
    case 'history': {
      const unit = HISTORY_UNIT_PLAN[(lessonNumber - 1) % HISTORY_UNIT_PLAN.length]!
      return {
        subjectId,
        program,
        lessonId,
        lessonNumber,
        title: `${unit.unitTitle} ${unit.chapterTitle}`,
        unitTitle: unit.unitTitle,
        chapterTitle: unit.chapterTitle,
      }
    }
    case 'science': {
      const unit = SCIENCE_UNIT_PLAN[(lessonNumber - 1) % SCIENCE_UNIT_PLAN.length]!
      return {
        subjectId,
        program,
        lessonId,
        lessonNumber,
        title: `${unit.unitTitle} ${unit.lessonTitle}`,
        unitTitle: unit.unitTitle,
        chapterTitle: unit.lessonTitle,
      }
    }
  }
}

function buildWeekPlan(weekNumber: number): WeekPlan {
  const normalized = (((weekNumber - 1) % 4) + 4) % 4
  const trackId = (normalized + 1) as CurriculumTrack
  const lessonNumber = weekNumber
  const historyScienceSubject = TRACK_HISTORY_SCIENCE_MAP[trackId]
  const coreSubjects: CurriculumSubjectId[] = ['math', 'reading', 'spelling', 'shurley']
  const subjectPlans: SubjectPlan[] = coreSubjects.map((subjectId) =>
    buildSubjectPlan(subjectId, weekNumber, lessonNumber),
  )

  subjectPlans.push(
    buildSubjectPlan(
      historyScienceSubject,
      weekNumber,
      lessonNumber,
    ),
  )

  return {
    weekNumber,
    trackId,
    lessonNumber,
    subjectPlans,
  }
}

/** Generate week plans for the full instructional year (36 weeks). */
export function buildSchoolYearWeekPlans(weekCount = 36): WeekPlan[] {
  return Array.from({ length: weekCount }, (_, index) => buildWeekPlan(index + 1))
}

export const DEFAULT_SCHOOL_YEAR: SchoolYear = {
  id: '2026-2027',
  label: '2026–2027 School Year',
  startDate: '2026-07-20',
  endDate: '2027-06-05',
  weekPlans: buildSchoolYearWeekPlans(),
}

const WEEK_PLAN_BY_NUMBER = new Map<number, WeekPlan>(
  DEFAULT_SCHOOL_YEAR.weekPlans.map((plan) => [plan.weekNumber, plan]),
)

export function getSchoolYearById(id: string): SchoolYear | undefined {
  if (id === DEFAULT_SCHOOL_YEAR.id) return DEFAULT_SCHOOL_YEAR
  return undefined
}

export function getWeekPlan(weekNumber: number): WeekPlan | undefined {
  return WEEK_PLAN_BY_NUMBER.get(weekNumber)
}

export function getTrackById(trackId: CurriculumTrack): Track | undefined {
  return CURRICULUM_TRACKS.find((track) => track.id === trackId)
}

export function getSubjectPlan(
  weekNumber: number,
  subjectId: CurriculumSubjectId,
): SubjectPlan | undefined {
  const week = getWeekPlan(weekNumber)
  return week?.subjectPlans.find((plan) => plan.subjectId === subjectId)
}
