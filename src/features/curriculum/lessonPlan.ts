import type { CurriculumTrack } from '../../data/routineTypes'
import { getSubjectPlan } from './curriculumRegistry'
import type { CurriculumSubjectId, LessonPlan, SubjectPlan } from './types'

const SUBJECT_LABELS: Record<CurriculumSubjectId, string> = {
  math: 'Math',
  reading: 'Reading',
  spelling: 'Spelling',
  shurley: 'Shurley',
  history: 'History',
  science: 'Science',
}

export function getSubjectDisplayLabel(subjectId: CurriculumSubjectId): string {
  return SUBJECT_LABELS[subjectId]
}

export function subjectPlanToLessonPlan(
  plan: SubjectPlan,
  weekNumber: number,
  trackId: CurriculumTrack,
): LessonPlan {
  return {
    id: plan.lessonId,
    subjectId: plan.subjectId,
    program: plan.program,
    lessonNumber: plan.lessonNumber,
    title: plan.title,
    displayTitle: plan.title,
    weekNumber,
    trackId,
    unitTitle: plan.unitTitle,
    chapterTitle: plan.chapterTitle,
  }
}

export function buildLessonPlanForSubject(
  subjectId: CurriculumSubjectId,
  weekNumber: number,
  trackId: CurriculumTrack,
): LessonPlan | null {
  const plan = getSubjectPlan(weekNumber, subjectId)
  if (!plan) return null
  return subjectPlanToLessonPlan(plan, weekNumber, trackId)
}

/** Teacher-facing Today Prep label: "Math — Saxon Lesson 2". */
export function formatLessonPlanLabel(plan: LessonPlan): string {
  const subject = getSubjectDisplayLabel(plan.subjectId)
  return `${subject} — ${plan.displayTitle}`
}

/** History/Science block label: "History — Exploring Maps Chapter 1". */
export function formatHistoryScienceLessonLabel(plan: LessonPlan): string {
  const subject = getSubjectDisplayLabel(plan.subjectId)
  if (plan.unitTitle && plan.chapterTitle) {
    return `${subject} — ${plan.unitTitle} ${plan.chapterTitle}`
  }
  return formatLessonPlanLabel(plan)
}
