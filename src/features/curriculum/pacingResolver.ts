import type { CurriculumTrack, HistoryScienceSubject } from '../../data/routineTypes'
import type { ScreenId } from '../../data/types'
import type { ToolId } from '../teacher-dock/types'
import {
  DEFAULT_SCHOOL_YEAR,
  getWeekPlan,
  SCHOOL_YEAR_2026_START,
} from './curriculumRegistry'
import {
  buildLessonPlanForSubject,
  formatHistoryScienceLessonLabel,
  formatLessonPlanLabel,
  getSubjectDisplayLabel,
} from './lessonPlan'
import type {
  CurriculumSubjectId,
  LessonPlan,
  PacingPersistedState,
  PacingSnapshot,
} from './types'
import { SCREEN_TO_SUBJECT } from './types'

export const DEFAULT_PACING_STATE: PacingPersistedState = {
  version: 1,
  lessonOverrides: {},
}

/** ISO date string (YYYY-MM-DD) in local time. */
export function toIsoDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** School week number (1-based) from the Q1W1 anchor. */
export function resolveSchoolWeekNumber(date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const daysSinceStart = Math.floor(
    (date.getTime() - SCHOOL_YEAR_2026_START.getTime()) / msPerDay,
  )
  if (daysSinceStart < 0) return 1
  return Math.floor(daysSinceStart / 7) + 1
}

/** Curriculum track aligned with school week rotation. */
export function resolvePacingTrack(date = new Date()): CurriculumTrack {
  const week = resolveSchoolWeekNumber(date)
  const normalized = (((week - 1) % 4) + 4) % 4
  return (normalized + 1) as CurriculumTrack
}

export function resolveHistoryScienceForDate(date = new Date()): HistoryScienceSubject {
  const track = resolvePacingTrack(date)
  return track === 1 || track === 3 ? 'history' : 'science'
}

export function resolveLessonNumber(
  date = new Date(),
  subjectId: CurriculumSubjectId,
  overrides: PacingPersistedState['lessonOverrides'] = {},
): number {
  const dateKey = toIsoDateKey(date)
  const override = overrides[dateKey]?.[subjectId]
  if (typeof override === 'number' && override > 0) return override
  return resolveSchoolWeekNumber(date)
}

export function resolveCurrentLesson(
  subjectId: CurriculumSubjectId,
  date = new Date(),
  overrides: PacingPersistedState['lessonOverrides'] = {},
): LessonPlan | null {
  const weekNumber = resolveSchoolWeekNumber(date)
  const weekPlan = getWeekPlan(weekNumber)
  if (!weekPlan) return null

  if (subjectId === 'history' || subjectId === 'science') {
    const active = resolveHistoryScienceForDate(date)
    if (subjectId !== active) return null
  }

  const lessonNumber = resolveLessonNumber(date, subjectId, overrides)
  const plan = buildLessonPlanForSubject(subjectId, weekNumber, weekPlan.trackId)
  if (!plan) return null

  if (plan.lessonNumber !== lessonNumber && !overrides[toIsoDateKey(date)]?.[subjectId]) {
    return { ...plan, lessonNumber, displayTitle: plan.displayTitle.replace(/\d+/, String(lessonNumber)) }
  }
  return plan
}

export function resolveTodaysPacing(
  date = new Date(),
  overrides: PacingPersistedState['lessonOverrides'] = {},
): PacingSnapshot {
  const weekNumber = resolveSchoolWeekNumber(date)
  const track = resolvePacingTrack(date)
  const historyScienceSubject = resolveHistoryScienceForDate(date)
  const weekPlan = getWeekPlan(weekNumber)
  const lessonNumber = weekPlan?.lessonNumber ?? weekNumber

  const subjects: CurriculumSubjectId[] = [
    'math',
    'reading',
    'spelling',
    'shurley',
    historyScienceSubject,
  ]

  const lessons: Partial<Record<CurriculumSubjectId, LessonPlan>> = {}
  for (const subjectId of subjects) {
    const lesson = resolveCurrentLesson(subjectId, date, overrides)
    if (lesson) lessons[subjectId] = lesson
  }

  return {
    date: toIsoDateKey(date),
    track,
    schoolWeek: weekNumber,
    lessonNumber,
    historyScienceSubject,
    lessons,
  }
}

export function resolveSubjectFromScreen(
  screenId: ScreenId,
  date = new Date(),
): CurriculumSubjectId | null {
  if (screenId === 'social-studies') {
    return resolveHistoryScienceForDate(date) === 'history' ? 'history' : null
  }
  if (screenId === 'science') {
    return resolveHistoryScienceForDate(date) === 'science' ? 'science' : null
  }
  return SCREEN_TO_SUBJECT[screenId] ?? null
}

export function formatTodayPrepLabelForScreen(
  screenId: ScreenId,
  date = new Date(),
  overrides: PacingPersistedState['lessonOverrides'] = {},
): string | null {
  const subjectId = resolveSubjectFromScreen(screenId, date)
  if (!subjectId) {
    if (screenId === 'social-studies' || screenId === 'science') {
      const hsSubject = resolveHistoryScienceForDate(date)
      const lesson = resolveCurrentLesson(hsSubject, date, overrides)
      if (lesson) return formatHistoryScienceLessonLabel(lesson)
      return hsSubject === 'history' ? 'History' : 'Science'
    }
    return null
  }

  const lesson = resolveCurrentLesson(subjectId, date, overrides)
  if (!lesson) return null
  return formatLessonPlanLabel(lesson)
}

export function formatHistoryScienceBlockLabel(
  date = new Date(),
  overrides: PacingPersistedState['lessonOverrides'] = {},
): string {
  const subject = resolveHistoryScienceForDate(date)
  const lesson = resolveCurrentLesson(subject, date, overrides)
  if (lesson) return formatHistoryScienceLessonLabel(lesson)
  return subject === 'history' ? 'History' : 'Science'
}

/** Promoted dock tools per subject lesson context. */
export const SUBJECT_PROMOTED_TOOLS: Record<CurriculumSubjectId, readonly ToolId[]> = {
  math: ['omninote', 'materials', 'timers', 'display'],
  reading: ['omninote', 'materials', 'classroom-atmosphere', 'mystery-star'],
  spelling: ['materials', 'timers', 'display'],
  shurley: ['omninote', 'materials', 'display', 'timers'],
  history: ['omninote', 'materials', 'display'],
  science: ['omninote', 'materials', 'display'],
}

export function getPromotedToolIdsForSubject(subjectId: CurriculumSubjectId): ToolId[] {
  return [...SUBJECT_PROMOTED_TOOLS[subjectId]]
}

export function resolveTeachingWorkspaceForSubject(
  subjectId: CurriculumSubjectId,
): 'math' | 'reading' | 'shurley' | 'morning' | 'transition' {
  switch (subjectId) {
    case 'math':
      return 'math'
    case 'reading':
      return 'reading'
    case 'shurley':
      return 'shurley'
    case 'history':
    case 'science':
    case 'spelling':
      return 'morning'
    default:
      return 'morning'
  }
}

export function getSchoolYearLabel(): string {
  return DEFAULT_SCHOOL_YEAR.label
}

export function describePacingSummary(date = new Date()): string {
  const pacing = resolveTodaysPacing(date)
  return `Track ${pacing.track} · Week ${pacing.schoolWeek} · ${getSubjectDisplayLabel(pacing.historyScienceSubject)} block`
}
