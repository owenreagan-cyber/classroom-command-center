import type { LessonMessageDraft } from './aiLessonMessageTypes'

/**
 * Phase 14E — Structured validation for provider output. A provider is
 * untrusted input (could be malformed JSON, could hallucinate teacher-only
 * language, could leak a URL/token/email) — this is the hard gate between
 * "the provider said something" and "we treat it as a LessonMessageDraft."
 * On any failure, the caller (aiLessonMessageGenerator.ts) falls back to the
 * deterministic draft; the provider's raw output is never shown anywhere,
 * including on /display.
 */
export interface OutputValidationResult {
  valid: boolean
  /** Teacher-only. Never rendered on /display. */
  reasons: string[]
}

const MIN_CHECKLIST_ITEMS = 3
const MAX_CHECKLIST_ITEMS = 5
const MAX_TITLE_CHARS = 80
const MAX_MESSAGE_CHARS = 240
const MAX_CHECKLIST_ITEM_CHARS = 60

const URL_PATTERN = /https?:\/\/\S+/i
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/i
const TOKEN_PATTERN = /\b(?:sk-[A-Za-z0-9]{10,}|Bearer\s+[A-Za-z0-9._-]+|[A-Za-z0-9_-]{24,})\b/
const TEACHER_ONLY_LEAK_PHRASES = [
  'as an ai',
  'as a language model',
  'i cannot',
  "i can't",
  'system prompt',
  'teacher note',
  'teacher-only',
  'rationale:',
  'instructions:',
  'here is the json',
  '```',
]

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function containsUnsafePattern(text: string): string | null {
  if (URL_PATTERN.test(text)) return 'contains a URL'
  if (EMAIL_PATTERN.test(text)) return 'contains an email-like string'
  if (TOKEN_PATTERN.test(text)) return 'contains a token-like string'
  const lower = text.toLowerCase()
  for (const phrase of TEACHER_ONLY_LEAK_PHRASES) {
    if (lower.includes(phrase)) return `contains a leaked/teacher-only phrase ("${phrase}")`
  }
  return null
}

/**
 * Pure structural + safety validation. Accepts `unknown` because provider
 * output must always be treated as untrusted until proven otherwise.
 */
export function validateProviderDraft(
  candidate: unknown,
  maxOutputChars: number,
): OutputValidationResult {
  const reasons: string[] = []

  if (typeof candidate !== 'object' || candidate === null) {
    return { valid: false, reasons: ['Provider output was not a valid object.'] }
  }

  let serializedLength: number
  try {
    serializedLength = JSON.stringify(candidate).length
  } catch {
    return { valid: false, reasons: ['Provider output could not be serialized.'] }
  }
  if (serializedLength > maxOutputChars) {
    reasons.push(`Provider output exceeded the configured max output length (${serializedLength} > ${maxOutputChars}).`)
  }

  const draft = candidate as Partial<LessonMessageDraft>

  if (!isNonEmptyString(draft.title)) {
    reasons.push('Missing or empty title.')
  } else {
    if (draft.title.length > MAX_TITLE_CHARS) reasons.push(`Title too long (${draft.title.length} chars).`)
    const unsafe = containsUnsafePattern(draft.title)
    if (unsafe) reasons.push(`Title ${unsafe}.`)
  }

  if (!isNonEmptyString(draft.studentMessage)) {
    reasons.push('Missing or empty studentMessage.')
  } else {
    if (draft.studentMessage.length > MAX_MESSAGE_CHARS) {
      reasons.push(`Student message too long (${draft.studentMessage.length} chars).`)
    }
    const unsafe = containsUnsafePattern(draft.studentMessage)
    if (unsafe) reasons.push(`Student message ${unsafe}.`)
  }

  const checklist = draft.checklistCard
  if (!checklist || typeof checklist !== 'object' || !isNonEmptyString(checklist.heading) || !Array.isArray(checklist.items)) {
    reasons.push('Missing or malformed checklistCard.')
  } else {
    const items = checklist.items
    if (items.length < MIN_CHECKLIST_ITEMS || items.length > MAX_CHECKLIST_ITEMS) {
      reasons.push(`Checklist must have 3–5 items, got ${items.length}.`)
    }
    for (const item of items) {
      if (typeof item !== 'string' || item.trim().length === 0) {
        reasons.push('Checklist contains a non-string or empty item.')
        break
      }
      if (item.length > MAX_CHECKLIST_ITEM_CHARS) {
        reasons.push(`Checklist item too long (${item.length} chars).`)
        break
      }
      const unsafe = containsUnsafePattern(item)
      if (unsafe) {
        reasons.push(`Checklist item ${unsafe}.`)
        break
      }
    }
  }

  if (draft.materialsCard !== undefined) {
    const materials = draft.materialsCard
    if (
      typeof materials !== 'object' ||
      materials === null ||
      !isNonEmptyString(materials.heading) ||
      !Array.isArray(materials.sections)
    ) {
      reasons.push('Malformed materialsCard.')
    } else {
      for (const section of materials.sections) {
        if (!section || typeof section !== 'object' || !Array.isArray(section.items)) {
          reasons.push('Malformed materialsCard section.')
          break
        }
        for (const item of section.items) {
          if (typeof item !== 'string') {
            reasons.push('materialsCard section contains a non-string item.')
            break
          }
          const unsafe = containsUnsafePattern(item)
          if (unsafe) {
            reasons.push(`Materials item ${unsafe}.`)
            break
          }
        }
      }
    }
  }

  if (draft.suggestedTimer !== undefined) {
    const timer = draft.suggestedTimer
    const validKinds = ['none', 'general', 'transition', 'task', 'routine']
    if (!timer || typeof timer !== 'object' || !validKinds.includes(timer.kind as string)) {
      reasons.push('Malformed suggestedTimer.')
    }
  }

  return { valid: reasons.length === 0, reasons }
}
