import type { LessonMessageInput } from './aiLessonMessageTypes'

/**
 * Phase 14E — Pure privacy/safety scrubber, run on a LessonMessageInput before
 * it is ever handed to a provider prompt. Conservative heuristics only — this
 * does NOT claim perfect PII detection. It trims overly long fields and
 * redacts/flags URLs, email addresses, token-like strings, Canvas-URL-like
 * strings, and parent/contact-like phrases in the fields that would actually
 * reach a prompt (never teacherNotes, which is stripped entirely below).
 */
export interface PrivacyScrubResult {
  safeInput: LessonMessageInput
  /** Teacher-only. Never rendered on /display. */
  warnings: string[]
  /** True when the input looked too private or too incomplete to hand to a provider at all. */
  preferDeterministic: boolean
}

const URL_PATTERN = /\bhttps?:\/\/[^\s]+/gi
const CANVAS_PATTERN = /\S*instructure\.com\S*/gi
const EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/gi
const TOKEN_PATTERN = /\b(?:sk-[A-Za-z0-9]{10,}|Bearer\s+[A-Za-z0-9._-]+|[A-Za-z0-9_-]{24,})\b/g
const PHONE_PATTERN = /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g
const PARENT_CONTACT_PATTERN = /\b(parent|guardian|mom|dad|mother|father)('s)?\s+(email|phone|number|cell|contact)\b/gi

interface RedactOutcome {
  text: string
  hadCanvas: boolean
  hadPhoneOrParent: boolean
}

function redact(text: string, warnings: Set<string>): RedactOutcome {
  let result = text
  let hadCanvas = false
  let hadPhoneOrParent = false

  if (CANVAS_PATTERN.test(result)) {
    hadCanvas = true
    warnings.add('Removed a Canvas-URL-like string before considering a provider draft.')
  }
  CANVAS_PATTERN.lastIndex = 0
  result = result.replace(CANVAS_PATTERN, '[removed]')

  if (URL_PATTERN.test(result)) {
    warnings.add('Removed a URL before considering a provider draft.')
  }
  URL_PATTERN.lastIndex = 0
  result = result.replace(URL_PATTERN, '[removed]')

  if (EMAIL_PATTERN.test(result)) {
    warnings.add('Removed an email-like string before considering a provider draft.')
  }
  EMAIL_PATTERN.lastIndex = 0
  result = result.replace(EMAIL_PATTERN, '[removed]')

  if (PHONE_PATTERN.test(result)) {
    hadPhoneOrParent = true
    warnings.add('Removed a phone-number-like string before considering a provider draft.')
  }
  PHONE_PATTERN.lastIndex = 0
  result = result.replace(PHONE_PATTERN, '[removed]')

  if (PARENT_CONTACT_PATTERN.test(result)) {
    hadPhoneOrParent = true
    warnings.add('Removed parent/guardian-contact-like text before considering a provider draft.')
  }
  PARENT_CONTACT_PATTERN.lastIndex = 0
  result = result.replace(PARENT_CONTACT_PATTERN, '[removed]')

  if (TOKEN_PATTERN.test(result)) {
    warnings.add('Removed a token/secret-like string before considering a provider draft.')
  }
  TOKEN_PATTERN.lastIndex = 0
  result = result.replace(TOKEN_PATTERN, '[removed]')

  return { text: result, hadCanvas, hadPhoneOrParent }
}

function truncate(text: string, maxChars: number, fieldLabel: string, warnings: Set<string>): string {
  if (text.length <= maxChars) return text
  warnings.add(`Trimmed "${fieldLabel}" — it was longer than the configured limit.`)
  return text.slice(0, maxChars)
}

function scrubField(
  text: string | undefined,
  fieldLabel: string,
  maxChars: number,
  warnings: Set<string>,
): { value: string | undefined; risky: boolean } {
  if (!text) return { value: text, risky: false }
  const { text: redacted, hadCanvas, hadPhoneOrParent } = redact(text, warnings)
  const trimmed = truncate(redacted, maxChars, fieldLabel, warnings)
  return { value: trimmed, risky: hadCanvas || hadPhoneOrParent }
}

function scrubList(
  items: string[] | undefined,
  fieldLabel: string,
  maxChars: number,
  warnings: Set<string>,
): { value: string[] | undefined; risky: boolean } {
  if (!items) return { value: items, risky: false }
  let anyRisky = false
  const value = items.map((item) => {
    const { value: scrubbed, risky } = scrubField(item, fieldLabel, maxChars, warnings)
    if (risky) anyRisky = true
    return scrubbed ?? ''
  })
  return { value, risky: anyRisky }
}

/**
 * Pure — never sends teacherNotes verbatim (it is stripped entirely from
 * safeInput; only a boolean presence is implied by the caller already having
 * the original input for its own teacher-only rationale text).
 */
export function scrubLessonMessageInputForProvider(
  input: LessonMessageInput,
  maxInputChars: number,
): PrivacyScrubResult {
  const warningSet = new Set<string>()

  const lessonTitle = scrubField(input.lessonTitle, 'Lesson title', maxInputChars, warningSet)
  const objective = scrubField(input.objective, 'Objective', maxInputChars, warningSet)
  const customSubjectLabel = scrubField(input.customSubjectLabel, 'Custom subject label', maxInputChars, warningSet)
  const materials = scrubList(input.materials, 'Materials', maxInputChars, warningSet)
  const mustInclude = scrubList(input.mustInclude, 'Must include', maxInputChars, warningSet)
  const avoid = scrubList(input.avoid, 'Avoid', maxInputChars, warningSet)

  const anyRisky = [lessonTitle, objective, customSubjectLabel, materials, mustInclude, avoid].some((r) => r.risky)

  const safeInput: LessonMessageInput = {
    ...input,
    lessonTitle: lessonTitle.value ?? '',
    objective: objective.value,
    customSubjectLabel: customSubjectLabel.value,
    materials: materials.value,
    mustInclude: mustInclude.value,
    avoid: avoid.value,
    // Never forwarded to a provider prompt under any circumstance.
    teacherNotes: undefined,
  }

  const tooIncomplete = !safeInput.lessonTitle?.trim() && !safeInput.objective?.trim()
  const preferDeterministic = anyRisky || tooIncomplete

  if (tooIncomplete) {
    warningSet.add('Too little lesson context was provided — used deterministic mode instead of a provider.')
  }

  return {
    safeInput,
    warnings: [...warningSet],
    preferDeterministic,
  }
}
