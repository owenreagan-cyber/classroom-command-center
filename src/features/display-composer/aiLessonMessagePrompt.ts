import { lessonSubjectLabel, LESSON_ACTIVITY_LABELS, type LessonMessageInput } from './aiLessonMessageTypes'

/**
 * Pure prompt builder for a future AI provider (Phase 14C). Not called by the
 * deterministic mode — only consumed by LessonMessageProvider implementations.
 * Deliberately excludes teacherNotes verbatim: teacher-only context never
 * leaves the app as free text handed to a model.
 */
export interface LessonMessagePrompt {
  system: string
  user: string
}

const SYSTEM_INSTRUCTIONS = [
  'You are drafting a classroom display screen for 4th grade (upper elementary) students.',
  'Audience: students viewing a projector display from across the room.',
  'Output must be brief and projector-readable — short lines, no long paragraphs.',
  'Use simple, direct classroom language a 4th grader can read at a glance.',
  'Checklist items must be short and action-oriented (start with a verb).',
  'Do not invent curriculum facts, lesson content, or details not given in the context below.',
  'If the objective or materials are missing, write a generic, positive routine message instead of guessing content.',
  'Never include private teacher notes verbatim in student-facing output.',
  'Never include student names unless they appear explicitly in the provided context.',
  'This draft will only ever be shown to a teacher for review — do not publish or send anything automatically.',
  'Respond using only the fields defined by the draft schema (title, studentMessage, materialsCard, checklistCard, suggestedTimer, suggestedBackground, teacherRationale, warnings).',
].join(' ')

function formatList(label: string, items: string[] | undefined): string | null {
  if (!items || items.length === 0) return null
  return `${label}: ${items.join('; ')}`
}

/** Pure — builds the context/user portion of the prompt from lesson input only. */
export function buildLessonMessagePrompt(input: LessonMessageInput): LessonMessagePrompt {
  const lines: string[] = [
    `Subject: ${lessonSubjectLabel(input)}`,
    `Activity type: ${LESSON_ACTIVITY_LABELS[input.activityType]}`,
    `Grade band: ${input.gradeBand}`,
    `Tone: ${input.tone}`,
    `Lesson title: ${input.lessonTitle || '(not provided)'}`,
  ]

  if (input.lessonNumber) lines.push(`Lesson number: ${input.lessonNumber}`)
  if (input.objective) lines.push(`Objective: ${input.objective}`)
  if (input.timeAvailableMinutes) lines.push(`Time available: ${input.timeAvailableMinutes} minutes`)

  const materialsLine = formatList('Materials', input.materials)
  if (materialsLine) lines.push(materialsLine)

  const mustIncludeLine = formatList('Must include', input.mustInclude)
  if (mustIncludeLine) lines.push(mustIncludeLine)

  const avoidLine = formatList('Avoid', input.avoid)
  if (avoidLine) lines.push(avoidLine)

  if (input.teacherNotes?.trim()) {
    lines.push('Teacher provided additional private notes for context only — do not quote or paraphrase them in student-facing output.')
  }

  return {
    system: SYSTEM_INSTRUCTIONS,
    user: lines.join('\n'),
  }
}
