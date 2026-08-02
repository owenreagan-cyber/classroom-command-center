import type { DisplayScreenBackground, DisplayTimerWidgetKind } from './types'
import {
  lessonSubjectLabel,
  LESSON_ACTIVITY_LABELS,
  type LessonActivityKind,
  type LessonMessageDraft,
  type LessonMessageInput,
  type LessonTone,
} from './aiLessonMessageTypes'

/**
 * Deterministic local mode (Phase 14C) — always available, no network calls.
 * This is the default and only tested generation path; see
 * aiLessonMessageGenerator.ts for how an optional AI provider layers on top of it.
 *
 * Quality rules enforced here (short/positive/routine-friendly, no fluff,
 * no teacher-only language, no invented curriculum facts): see module tests.
 */

const MIN_CHECKLIST_ITEMS = 3
const MAX_CHECKLIST_ITEMS = 5

const MATERIALS_RELEVANT_ACTIVITIES: ReadonlySet<LessonActivityKind> = new Set([
  'lessonLaunch',
  'workTime',
  'partnerWork',
  'independentWork',
  'reviewGame',
])

const ACTIVITY_TIMER_KIND: Record<LessonActivityKind, DisplayTimerWidgetKind> = {
  arrival: 'general',
  lessonLaunch: 'general',
  workTime: 'general',
  partnerWork: 'general',
  independentWork: 'general',
  reviewGame: 'general',
  exitTicket: 'general',
  transition: 'transition',
  packUp: 'transition',
  lunch: 'routine',
  custom: 'none',
}

const ACTIVITY_DEFAULT_MINUTES: Partial<Record<LessonActivityKind, number>> = {
  arrival: 10,
  lessonLaunch: 10,
  workTime: 20,
  partnerWork: 15,
  independentWork: 20,
  reviewGame: 15,
  exitTicket: 5,
  transition: 4,
  packUp: 5,
  custom: 10,
  // lunch intentionally omitted: it maps to the fixed multi-step routine timer, not a single duration.
}

const BASE_CHECKLISTS: Record<LessonActivityKind, string[]> = {
  arrival: ['Unpack your backpack', 'Turn in homework', 'Sit in your seat'],
  lessonLaunch: ['Get your materials ready', 'Listen for directions', 'Try your best'],
  workTime: ['Get materials ready', 'Work quietly', 'Check your work'],
  partnerWork: ['Sit with your partner', 'Take turns talking', 'Stay on task'],
  independentWork: ['Work on your own', 'Stay quiet', 'Raise your hand if stuck'],
  reviewGame: ['Listen for the rules', 'Wait for your turn', 'Use kind words'],
  exitTicket: ['Get a pencil', 'Answer carefully', 'Turn it in'],
  transition: ['Clean up your area', 'Get your next materials', 'Sit ready to learn'],
  packUp: ['Pack your backpack', 'Push in your chair', 'Get ready for dismissal'],
  lunch: ['Clear your desk', 'Wash your hands', 'Line up quietly'],
  custom: ['Get materials ready', 'Stay on task', 'Clean up when done'],
}

function baseStudentMessage(input: LessonMessageInput, subject: string): string {
  const objective = input.objective?.trim()

  switch (input.activityType) {
    case 'lessonLaunch':
      return objective ? `Today we will ${lowerFirst(stripTrailingPeriod(objective))}` : `Let's get started with ${subject}`
    case 'workTime':
      return objective ? `Keep working on: ${stripTrailingPeriod(objective)}` : "Keep working. You've got this"
    case 'partnerWork':
      return objective ? stripTrailingPeriod(objective) : 'Work with your partner and stay on task'
    case 'independentWork':
      return objective ? stripTrailingPeriod(objective) : 'Work on your own and do your best'
    case 'reviewGame':
      return objective ? `Let's review: ${stripTrailingPeriod(objective)}` : "Let's review with a game"
    case 'exitTicket':
      return objective ? `Show what you learned: ${stripTrailingPeriod(objective)}` : 'Show what you learned today'
    case 'arrival':
      return objective ? stripTrailingPeriod(objective) : "Good morning! Let's get ready for a great day"
    case 'transition':
      return `Time to get ready for ${subject}`
    case 'packUp':
      return 'Time to pack up and get ready to go'
    case 'lunch':
      return 'Time for lunch! Follow the steps below'
    case 'custom':
    default:
      return objective ? stripTrailingPeriod(objective) : `Let's work on ${input.lessonTitle || "today's activity"}`
  }
}

function stripTrailingPeriod(text: string): string {
  return text.replace(/[.!]+$/, '')
}

function lowerFirst(text: string): string {
  return text.length > 0 ? text[0].toLowerCase() + text.slice(1) : text
}

function applyTone(message: string, tone: LessonTone): string {
  const trimmed = stripTrailingPeriod(message)
  switch (tone) {
    case 'energetic':
      return `${trimmed}! Let's go!`
    case 'playful':
      return `${trimmed}! You've got this.`
    case 'testPrep':
      return `${trimmed}. Work quietly and carefully.`
    case 'focused':
      return `${trimmed}. Stay focused.`
    case 'calm':
    case 'routine':
    default:
      return `${trimmed}.`
  }
}

function buildTitle(input: LessonMessageInput, subject: string): string {
  const label = LESSON_ACTIVITY_LABELS[input.activityType]
  switch (input.activityType) {
    case 'lessonLaunch':
    case 'workTime':
      if (input.lessonNumber) return `${subject} Lesson ${input.lessonNumber}`
      if (input.lessonTitle) return `${subject}: ${input.lessonTitle}`
      return `${subject} Time!`
    case 'partnerWork':
    case 'independentWork':
    case 'reviewGame':
    case 'exitTicket':
      return input.lessonTitle ? `${subject} ${label}: ${input.lessonTitle}` : `${subject} ${label}`
    case 'transition':
      return `Get Ready For ${subject}`
    case 'arrival':
      return 'Arrival'
    case 'packUp':
      return 'Pack Up'
    case 'lunch':
      return 'Lunch'
    case 'custom':
    default:
      return input.lessonTitle || `${subject} Time`
  }
}

function buildChecklist(input: LessonMessageInput, warnings: string[]): string[] {
  const base = [...BASE_CHECKLISTS[input.activityType]]
  const mustInclude = (input.mustInclude ?? []).map((s) => s.trim()).filter(Boolean)

  const room = MAX_CHECKLIST_ITEMS - base.length
  const added = mustInclude.slice(0, Math.max(0, room))
  if (mustInclude.length > added.length) {
    warnings.push('Some "must include" checklist items did not fit (max 5) and were omitted.')
  }

  const combined = [...base, ...added]
  return combined.slice(0, MAX_CHECKLIST_ITEMS)
}

function buildMaterialsCard(input: LessonMessageInput, subject: string, warnings: string[]): LessonMessageDraft['materialsCard'] {
  const materials = (input.materials ?? []).map((m) => m.trim()).filter(Boolean)
  if (materials.length === 0) {
    if (MATERIALS_RELEVANT_ACTIVITIES.has(input.activityType)) {
      warnings.push('No materials provided — materials card omitted.')
    }
    return undefined
  }
  return {
    heading: `${subject} Materials`,
    sections: [{ id: 'materials', items: materials }],
  }
}

const SUBJECT_BACKGROUND: Partial<Record<LessonMessageInput['subject'], DisplayScreenBackground>> = {
  math: { type: 'image', token: 'math-training-lab' },
  reading: { type: 'image', token: 'reading-sky-book-world' },
  homeroom: { type: 'image', token: 'homeroom-morning-briefing' },
  science: { type: 'image', token: 'science-lab' },
  history: { type: 'image', token: 'social-studies-map' },
}

function suggestBackground(input: LessonMessageInput): DisplayScreenBackground {
  return SUBJECT_BACKGROUND[input.subject] ?? { type: 'gradient', token: 'calm-focus' }
}

function checkAvoidedTerms(text: string, avoid: string[] | undefined, warnings: string[]): void {
  if (!avoid || avoid.length === 0) return
  const lower = text.toLowerCase()
  for (const term of avoid) {
    const trimmed = term.trim()
    if (trimmed && lower.includes(trimmed.toLowerCase())) {
      warnings.push(`Draft may still contain an avoided term: "${trimmed}" — please review.`)
    }
  }
}

/** Pure, deterministic — same input always produces the same output. No network calls. */
export function generateDeterministicLessonMessageDraft(input: LessonMessageInput): LessonMessageDraft {
  const warnings: string[] = []
  const subject = lessonSubjectLabel(input)

  if (!input.objective?.trim()) {
    warnings.push('No objective provided — used a generic routine message.')
  }

  const title = buildTitle(input, subject)
  const studentMessage = applyTone(baseStudentMessage(input, subject), input.tone)
  const checklistItems = buildChecklist(input, warnings)
  const materialsCard = buildMaterialsCard(input, subject, warnings)

  checkAvoidedTerms(`${title} ${studentMessage}`, input.avoid, warnings)

  const timerKind = ACTIVITY_TIMER_KIND[input.activityType]
  const minutes = input.timeAvailableMinutes ?? ACTIVITY_DEFAULT_MINUTES[input.activityType]

  const rationaleParts = [
    `Drafted as a ${input.tone} ${LESSON_ACTIVITY_LABELS[input.activityType].toLowerCase()} for ${subject}${input.lessonNumber ? ` (Lesson ${input.lessonNumber})` : ''}.`,
  ]
  if (timerKind !== 'none') {
    rationaleParts.push(`Suggested a ${timerKind} timer${minutes ? ` (${minutes} min)` : ''} based on activity type.`)
  }
  if (input.teacherNotes?.trim()) {
    rationaleParts.push('Teacher notes were provided but are not shown to students.')
  }

  return {
    title,
    studentMessage,
    materialsCard,
    checklistCard: {
      heading: `${LESSON_ACTIVITY_LABELS[input.activityType]} Checklist`,
      items: checklistItems.length >= MIN_CHECKLIST_ITEMS ? checklistItems : BASE_CHECKLISTS[input.activityType],
    },
    suggestedTimer: {
      kind: timerKind,
      minutes: timerKind === 'none' ? undefined : minutes,
      label: timerKind === 'none' ? undefined : `${subject} ${LESSON_ACTIVITY_LABELS[input.activityType]}`,
    },
    suggestedBackground: suggestBackground(input),
    teacherRationale: rationaleParts.join(' '),
    warnings,
  }
}
