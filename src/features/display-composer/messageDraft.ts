/**
 * Deterministic lesson-message draft foundation (Phase 14B).
 *
 * Pure, offline, template-based generation from lesson metadata already
 * available in Command Center — no live AI calls. Mirrors the existing
 * pattern in src/data/morningMessage.ts (schedulePreviewFromHomeroomPages),
 * which pulls known structured data into a template rather than calling out
 * to a model. Same input always produces the same output.
 *
 * This is a foundation for Phase 14C's AI Lesson Message Generator — the
 * teacher must review and explicitly save/send the draft; nothing here
 * auto-publishes a screen.
 */

export type LessonActivityType =
  | 'lessonLaunch'
  | 'workTime'
  | 'wrapUp'
  | 'transition'
  | 'assessment'
  | 'general'

export interface LessonDraftInput {
  subject: string
  lessonTitle: string
  objective?: string
  materials?: string[]
  activityType: LessonActivityType
}

export interface LessonDraftOutput {
  title: string
  studentMessage: string
  materialsChecklist: string[]
  /** Always exactly 3 steps, per spec. */
  studentChecklist: [string, string, string]
  suggestedTimerMinutes: number
}

const ACTIVITY_TITLE_TEMPLATES: Record<LessonActivityType, string> = {
  lessonLaunch: '{subject} Time!',
  workTime: '{subject} Work Time',
  wrapUp: '{subject} Wrap-Up',
  transition: 'Get Ready For {subject}',
  assessment: '{subject} Assessment',
  general: '{subject}',
}

const ACTIVITY_MESSAGE_TEMPLATES: Record<LessonActivityType, string> = {
  lessonLaunch: 'Today in {subject}, we are learning about {lessonTitle}.',
  workTime: 'Keep working on {lessonTitle}. You’ve got this!',
  wrapUp: 'Let’s wrap up {lessonTitle} and get ready for what’s next.',
  transition: 'Grab what you need for {subject} — {lessonTitle} is next.',
  assessment: 'Show what you know about {lessonTitle}. Do your best work.',
  general: 'Let’s work on {lessonTitle}.',
}

const ACTIVITY_DEFAULT_MINUTES: Record<LessonActivityType, number> = {
  lessonLaunch: 10,
  workTime: 20,
  wrapUp: 5,
  transition: 4,
  assessment: 30,
  general: 15,
}

function fillTemplate(template: string, input: LessonDraftInput): string {
  return template
    .replace(/\{subject\}/g, input.subject)
    .replace(/\{lessonTitle\}/g, input.lessonTitle)
}

function buildStudentChecklist(input: LessonDraftInput): [string, string, string] {
  const base: Record<LessonActivityType, [string, string, string]> = {
    lessonLaunch: ['Get materials ready', `Focus on ${input.lessonTitle}`, 'Ask questions if you’re stuck'],
    workTime: ['Get materials ready', 'Work quietly', 'Check your work'],
    wrapUp: ['Finish your last step', 'Clean up materials', 'Get ready for what’s next'],
    transition: ['Clean up current materials', `Get ${input.subject} materials`, 'Sit ready to learn'],
    assessment: ['Clear your desk', 'Do your own best work', 'Check your answers'],
    general: ['Get materials ready', `Work on ${input.lessonTitle}`, 'Clean up when done'],
  }
  return base[input.activityType]
}

/** Pure, deterministic draft generator — same input always produces the same output. */
export function draftLessonDisplayScreen(input: LessonDraftInput): LessonDraftOutput {
  const title = fillTemplate(ACTIVITY_TITLE_TEMPLATES[input.activityType], input)
  const studentMessage = input.objective
    ? `${fillTemplate(ACTIVITY_MESSAGE_TEMPLATES[input.activityType], input)} ${input.objective}`
    : fillTemplate(ACTIVITY_MESSAGE_TEMPLATES[input.activityType], input)

  return {
    title,
    studentMessage,
    materialsChecklist: input.materials ? [...input.materials] : [],
    studentChecklist: buildStudentChecklist(input),
    suggestedTimerMinutes: ACTIVITY_DEFAULT_MINUTES[input.activityType],
  }
}
