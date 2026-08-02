// AI provider safety tests (Phase 14E) — settings, scrubber, validator, fallback matrix.
// Run via: npm run test:display-composer

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { generateLessonMessageDraft } from '../features/display-composer/aiLessonMessageGenerator'
import { generateDeterministicLessonMessageDraft } from '../features/display-composer/aiLessonMessageFallbacks'
import { mapLessonMessageDraftToScreenPatch } from '../features/display-composer/aiLessonMessageMapping'
import { defaultLessonMessageInput, type LessonMessageInput, type LessonMessageProvider } from '../features/display-composer/aiLessonMessageTypes'
import {
  defaultProviderSettings,
  shouldAttemptProvider,
  type LessonMessageProviderStatus,
} from '../features/display-composer/aiProviderConfig'
import { draftsUsedToday, emptyDraftUsageCounter, isOverDailyLimit, recordDraft } from '../features/display-composer/aiProviderUsage'
import { scrubLessonMessageInputForProvider } from '../features/display-composer/aiPrivacyScrubber'
import { validateProviderDraft } from '../features/display-composer/aiOutputValidator'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

const baseInput: LessonMessageInput = {
  ...defaultLessonMessageInput(),
  subject: 'math',
  lessonTitle: 'Fractions',
  objective: 'add fractions with like denominators',
  materials: ['Math notebook', 'Pencil'],
}

async function main() {
  // --- Provider settings defaults ---

  const settings = defaultProviderSettings()
  assert(settings.mode === 'deterministicOnly', 'default mode is deterministicOnly')
  assert(settings.providerEnabled === false, 'provider is disabled by default')
  assert(settings.provider === 'none', 'default provider kind is none')
  assert(settings.lastProviderStatus === 'disabled', 'default status is disabled')
  assert(!('apiKey' in settings) && !('secret' in settings) && !('token' in settings), 'settings model has no secret/key field')
  assert(!shouldAttemptProvider(settings), 'shouldAttemptProvider is false for default settings')

  const enabledButNoneKind = { ...settings, mode: 'providerIfAvailable' as const, providerEnabled: true }
  assert(!shouldAttemptProvider(enabledButNoneKind), 'shouldAttemptProvider stays false when provider kind is "none"')

  const openaiEnabled = { ...settings, mode: 'providerIfAvailable' as const, providerEnabled: true, provider: 'openaiCompatible' as const }
  assert(!shouldAttemptProvider(openaiEnabled), 'openaiCompatible is never attempted (no safe key-handling pattern exists in this repo)')

  const ollamaEnabled = { ...settings, mode: 'providerIfAvailable' as const, providerEnabled: true, provider: 'localOllama' as const }
  assert(shouldAttemptProvider(ollamaEnabled), 'localOllama can be attempted once explicitly enabled')

  // --- Orchestrator: provider disabled by settings defaults to deterministic, even if a provider is passed ---

  const workingProvider: LessonMessageProvider = {
    generateLessonMessageDraft: async (input) => generateDeterministicLessonMessageDraft(input),
  }

  let observedStatus: LessonMessageProviderStatus | undefined
  const disabledResult = await generateLessonMessageDraft(baseInput, {
    provider: workingProvider,
    settings, // deterministicOnly, providerEnabled false
    onStatusChange: (s) => { observedStatus = s },
  })
  assert(disabledResult.title === generateDeterministicLessonMessageDraft(baseInput).title, 'disabled settings produce the deterministic draft even with a provider passed')
  assert(observedStatus === 'disabled', `status reported as disabled, got ${observedStatus}`)

  // --- Orchestrator: unavailable/erroring provider falls back to deterministic ---

  const failingProvider: LessonMessageProvider = {
    generateLessonMessageDraft: async () => { throw new Error('simulated outage') },
  }
  observedStatus = undefined
  const errorResult = await generateLessonMessageDraft(baseInput, {
    provider: failingProvider,
    settings: ollamaEnabled,
    onStatusChange: (s) => { observedStatus = s },
  })
  assert(errorResult.title === generateDeterministicLessonMessageDraft(baseInput).title, 'erroring provider falls back to deterministic content')
  assert(observedStatus === 'error', `status reported as error, got ${observedStatus}`)
  assert(errorResult.warnings.some((w) => w.toLowerCase().includes('provider unavailable')), 'error fallback includes a teacher-only warning')

  // --- Orchestrator: provider timeout falls back to deterministic ---

  const slowProvider: LessonMessageProvider = {
    generateLessonMessageDraft: () => new Promise((resolve) => {
      setTimeout(() => resolve(generateDeterministicLessonMessageDraft(baseInput)), 500)
    }),
  }
  observedStatus = undefined
  const timeoutResult = await generateLessonMessageDraft(baseInput, {
    provider: slowProvider,
    settings: { ...ollamaEnabled, timeoutMs: 10 },
    onStatusChange: (s) => { observedStatus = s },
  })
  assert(timeoutResult.title === generateDeterministicLessonMessageDraft(baseInput).title, 'timed-out provider falls back to deterministic content')
  assert(observedStatus === 'timedOut', `status reported as timedOut, got ${observedStatus}`)

  // --- Orchestrator: malformed provider output falls back to deterministic ---

  const malformedProvider: LessonMessageProvider = {
    // @ts-expect-error intentionally malformed for the test
    generateLessonMessageDraft: async () => ({ title: '', checklistCard: { heading: 'x', items: [] } }),
  }
  observedStatus = undefined
  const malformedResult = await generateLessonMessageDraft(baseInput, {
    provider: malformedProvider,
    settings: ollamaEnabled,
    onStatusChange: (s) => { observedStatus = s },
  })
  assert(malformedResult.title === generateDeterministicLessonMessageDraft(baseInput).title, 'malformed provider output falls back to deterministic content')
  assert(observedStatus === 'error', `status reported as error for malformed output, got ${observedStatus}`)

  // --- Orchestrator: valid provider output is passed through and mapped to a screen patch ---

  observedStatus = undefined
  const validResult = await generateLessonMessageDraft(baseInput, {
    provider: workingProvider,
    settings: ollamaEnabled,
    onStatusChange: (s) => { observedStatus = s },
  })
  assert(observedStatus === 'ready', `status reported as ready for a valid provider draft, got ${observedStatus}`)
  const patch = mapLessonMessageDraftToScreenPatch(validResult, 'demo')
  assert(patch.title === validResult.title, 'valid provider draft maps cleanly to a screen patch')
  assert(!('lastProviderStatus' in patch), 'mapped screen patch never carries provider status')
  assert(!('teacherRationale' in patch) && !('warnings' in patch), 'mapped screen patch never carries teacher-only draft fields')

  // --- Orchestrator: daily draft limit is enforced ---

  const overLimitCounter = { date: new Date().toISOString().slice(0, 10), count: 5 }
  observedStatus = undefined
  const overLimitResult = await generateLessonMessageDraft(baseInput, {
    provider: workingProvider,
    settings: { ...ollamaEnabled, dailyDraftLimit: 5 },
    draftCounter: overLimitCounter,
    onStatusChange: (s) => { observedStatus = s },
  })
  assert(observedStatus === 'unavailable', `over-limit status reported as unavailable, got ${observedStatus}`)
  assert(overLimitResult.warnings.some((w) => w.toLowerCase().includes('daily provider draft limit')), 'over-limit fallback explains why')

  // --- Draft usage counter (pure, local-only, resettable) ---

  const counter0 = emptyDraftUsageCounter()
  assert(draftsUsedToday(counter0) === 0, 'a fresh counter reports 0 drafts used today')
  const counter1 = recordDraft(counter0)
  assert(draftsUsedToday(counter1) === 1, 'recordDraft increments to 1')
  const counter2 = recordDraft(counter1)
  assert(draftsUsedToday(counter2) === 2, 'recordDraft increments again to 2')
  assert(!isOverDailyLimit(counter2, 5), 'counter of 2 is not over a limit of 5')
  assert(isOverDailyLimit(counter2, 2), 'counter of 2 is over/at a limit of 2')
  assert(!isOverDailyLimit(counter2, undefined), 'no configured limit is never "over"')
  const staleCounter = { date: '2000-01-01', count: 99 }
  assert(draftsUsedToday(staleCounter) === 0, 'a counter from a previous day reads as 0 for today')

  // --- Privacy scrubber: URLs, emails, tokens, Canvas-like, phone/parent-contact ---

  const riskyInput: LessonMessageInput = {
    ...defaultLessonMessageInput(),
    lessonTitle: 'Check https://example.com/secret for details',
    objective: 'Email me at teacher@example.com or call 555-123-4567',
    materials: ['See https://canvas.instructure.com/courses/123', 'Bearer sk-abcdefghijklmnopqrstuvwxyz'],
    mustInclude: ["Parent's email is on file"],
  }
  const scrubbed = scrubLessonMessageInputForProvider(riskyInput, 2000)
  assert(!scrubbed.safeInput.lessonTitle.includes('example.com'), 'scrubber removes a plain URL from lessonTitle')
  assert(!(scrubbed.safeInput.objective ?? '').includes('teacher@example.com'), 'scrubber removes an email-like string')
  assert(!(scrubbed.safeInput.objective ?? '').includes('555-123-4567'), 'scrubber removes a phone-like string')
  assert(!(scrubbed.safeInput.materials ?? []).some((m) => m.includes('instructure.com')), 'scrubber removes a Canvas-URL-like string')
  assert(!(scrubbed.safeInput.materials ?? []).some((m) => m.includes('sk-abcdefghijklmnopqrstuvwxyz')), 'scrubber removes a token-like string')
  assert(scrubbed.warnings.length > 0, 'scrubber produces teacher-only warnings when it redacts something')
  assert(scrubbed.preferDeterministic, 'risky input (Canvas/phone/parent-contact) prefers deterministic mode')

  const teacherNotesInput: LessonMessageInput = { ...baseInput, teacherNotes: 'Table 3 was chatty yesterday' }
  const scrubbedNotes = scrubLessonMessageInputForProvider(teacherNotesInput, 2000)
  assert(scrubbedNotes.safeInput.teacherNotes === undefined, 'scrubber strips teacherNotes entirely — never sent to a provider')

  const safeInput = scrubLessonMessageInputForProvider(baseInput, 2000)
  assert(!safeInput.preferDeterministic, 'clean, complete input does not prefer deterministic mode')
  assert(safeInput.warnings.length === 0, 'clean input produces no scrubber warnings')

  const incompleteInput: LessonMessageInput = { ...defaultLessonMessageInput(), lessonTitle: '' }
  const scrubbedIncomplete = scrubLessonMessageInputForProvider(incompleteInput, 2000)
  assert(scrubbedIncomplete.preferDeterministic, 'too-incomplete input (no title, no objective) prefers deterministic mode')

  const longInput: LessonMessageInput = { ...baseInput, objective: 'x'.repeat(50) }
  const scrubbedLong = scrubLessonMessageInputForProvider(longInput, 20)
  assert((scrubbedLong.safeInput.objective ?? '').length <= 20, 'scrubber truncates fields longer than maxInputChars')

  // --- Output validator ---

  const validDraft = generateDeterministicLessonMessageDraft(baseInput)
  assert(validateProviderDraft(validDraft, 4000).valid, 'a well-formed deterministic-shaped draft passes validation')

  assert(!validateProviderDraft(null, 4000).valid, 'null candidate fails validation')
  assert(!validateProviderDraft('not an object', 4000).valid, 'non-object candidate fails validation')

  const longTitleDraft = { ...validDraft, title: 'A'.repeat(200) }
  assert(!validateProviderDraft(longTitleDraft, 4000).valid, 'overly long title fails validation')

  const longMessageDraft = { ...validDraft, studentMessage: 'A'.repeat(500) }
  assert(!validateProviderDraft(longMessageDraft, 4000).valid, 'overly long student message fails validation')

  const tooFewChecklist = { ...validDraft, checklistCard: { heading: 'x', items: ['one', 'two'] } }
  assert(!validateProviderDraft(tooFewChecklist, 4000).valid, 'checklist with fewer than 3 items fails validation')

  const tooManyChecklist = { ...validDraft, checklistCard: { heading: 'x', items: ['a', 'b', 'c', 'd', 'e', 'f'] } }
  assert(!validateProviderDraft(tooManyChecklist, 4000).valid, 'checklist with more than 5 items fails validation')

  const leakedInstructions = { ...validDraft, studentMessage: 'As an AI language model, here is the JSON: {...}' }
  assert(!validateProviderDraft(leakedInstructions, 4000).valid, 'prompt/instruction leakage fails validation')

  const urlInOutput = { ...validDraft, studentMessage: 'Visit https://example.com for more' }
  assert(!validateProviderDraft(urlInOutput, 4000).valid, 'a URL in provider output fails validation')

  const emailInOutput = { ...validDraft, title: 'Contact teacher@example.com' }
  assert(!validateProviderDraft(emailInOutput, 4000).valid, 'an email in provider output fails validation')

  const tokenInOutput = { ...validDraft, studentMessage: `Token: ${'a'.repeat(30)}` }
  assert(!validateProviderDraft(tokenInOutput, 4000).valid, 'a token-like string in provider output fails validation')

  const oversizedOutput = { ...validDraft, studentMessage: 'y'.repeat(300) }
  assert(!validateProviderDraft(oversizedOutput, 50).valid, 'output larger than the configured max output length fails validation')

  console.log('All AI provider safety tests passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
