import type { DisplayScreenBackground, DisplayTimerWidgetKind, MaterialsCard } from './types'

/**
 * Phase 14C — AI-ready lesson message generator data model.
 *
 * This is a separate, richer input/output shape from src/features/display-composer/
 * messageDraft.ts (Phase 14B's deterministic draft helper), which stays untouched
 * and still tested as-is. Nothing here is persisted onto a DisplayScreen directly —
 * see aiLessonMessageMapping.ts for the one-way, explicit "apply" step.
 */

export type LessonSubject =
  | 'math'
  | 'reading'
  | 'spelling'
  | 'shurley'
  | 'history'
  | 'science'
  | 'homeroom'
  | 'custom'

export type LessonActivityKind =
  | 'arrival'
  | 'lessonLaunch'
  | 'transition'
  | 'workTime'
  | 'partnerWork'
  | 'independentWork'
  | 'reviewGame'
  | 'exitTicket'
  | 'packUp'
  | 'lunch'
  | 'custom'

export type LessonGradeBand = 'upperElementary'

export type LessonTone = 'calm' | 'energetic' | 'focused' | 'playful' | 'testPrep' | 'routine'

export interface LessonMessageInput {
  subject: LessonSubject
  /** Free-text label used when subject === 'custom'. */
  customSubjectLabel?: string
  lessonTitle: string
  lessonNumber?: string
  objective?: string
  materials?: string[]
  activityType: LessonActivityKind
  gradeBand: LessonGradeBand
  tone: LessonTone
  timeAvailableMinutes?: number
  mustInclude?: string[]
  avoid?: string[]
  /** Teacher-only context. Never copied verbatim into student-facing output or sent to /display. */
  teacherNotes?: string
}

export function defaultLessonMessageInput(): LessonMessageInput {
  return {
    subject: 'math',
    lessonTitle: '',
    activityType: 'lessonLaunch',
    gradeBand: 'upperElementary',
    tone: 'calm',
  }
}

export interface LessonMessageSuggestedTimer {
  kind: DisplayTimerWidgetKind
  minutes?: number
  label?: string
}

/** materialsCard reuses the exact Display Composer MaterialsCard shape — no re-mapping needed. */
export interface LessonMessageDraft {
  title: string
  studentMessage: string
  materialsCard?: MaterialsCard
  checklistCard: {
    heading: string
    /** Always 3–5 student-facing items. */
    items: string[]
  }
  suggestedTimer: LessonMessageSuggestedTimer
  suggestedBackground?: DisplayScreenBackground
  /** Teacher-only. Must never render on /display. */
  teacherRationale: string
  /** Teacher-only. Must never render on /display. */
  warnings: string[]
}

/** Options passed to a provider's own generateLessonMessageDraft call (distinct from the orchestrator's options in aiLessonMessageGenerator.ts). */
export interface ProviderCallOptions {
  /** Allows the caller (orchestrator timeout, or a teacher-triggered cancel) to abort in-flight work. */
  signal?: AbortSignal
}

export interface LessonMessageProvider {
  generateLessonMessageDraft(
    input: LessonMessageInput,
    options?: ProviderCallOptions,
  ): Promise<LessonMessageDraft>
}

/** Shared subject/activity display labels — used by both the prompt builder and the deterministic fallback. */
export const LESSON_SUBJECT_LABELS: Record<LessonSubject, string> = {
  math: 'Math',
  reading: 'Reading',
  spelling: 'Spelling',
  shurley: 'Shurley',
  history: 'History',
  science: 'Science',
  homeroom: 'Homeroom',
  custom: 'Class',
}

export function lessonSubjectLabel(input: Pick<LessonMessageInput, 'subject' | 'customSubjectLabel'>): string {
  if (input.subject === 'custom' && input.customSubjectLabel?.trim()) {
    return input.customSubjectLabel.trim()
  }
  return LESSON_SUBJECT_LABELS[input.subject]
}

export const LESSON_ACTIVITY_LABELS: Record<LessonActivityKind, string> = {
  arrival: 'Arrival',
  lessonLaunch: 'Lesson Launch',
  transition: 'Transition',
  workTime: 'Work Time',
  partnerWork: 'Partner Work',
  independentWork: 'Independent Work',
  reviewGame: 'Review Game',
  exitTicket: 'Exit Ticket',
  packUp: 'Pack Up',
  lunch: 'Lunch',
  custom: 'Activity',
}
