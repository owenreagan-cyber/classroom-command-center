import { generateDeterministicLessonMessageDraft } from './aiLessonMessageFallbacks'
import { scrubLessonMessageInputForProvider } from './aiPrivacyScrubber'
import { validateProviderDraft } from './aiOutputValidator'
import {
  DEFAULT_MAX_INPUT_CHARS,
  DEFAULT_MAX_OUTPUT_CHARS,
  DEFAULT_TIMEOUT_MS,
  shouldAttemptProvider,
  type LessonMessageProviderSettings,
  type LessonMessageProviderStatus,
} from './aiProviderConfig'
import { isOverDailyLimit, type DraftUsageCounter } from './aiProviderUsage'
import type { LessonMessageDraft, LessonMessageInput, LessonMessageProvider } from './aiLessonMessageTypes'

/**
 * Orchestrator (Phase 14C, hardened in Phase 14E). Deterministic local mode
 * is the default and the only mode wired up unless a teacher explicitly
 * configures + enables a provider (see aiProviderConfig.ts) — no provider is
 * ever attempted just because one is passed in, once `settings` is provided;
 * without `settings` this stays backward-compatible with pre-14E callers.
 *
 * Safety pipeline before any provider call: settings gate -> daily draft
 * limit -> privacy scrubber (strips teacherNotes entirely, redacts
 * URLs/emails/tokens/Canvas-like/phone-like text) -> timeout+cancellable call
 * -> structured output validation. Any failure at any stage falls back to the
 * deterministic draft with a teacher-only warning appended — never an error
 * surfaced to the teacher, and never anything provider-related reaching
 * /display (provider status/warnings do not exist on DisplayScreen).
 */
export interface GenerateLessonMessageDraftOptions {
  provider?: LessonMessageProvider
  timeoutMs?: number
  settings?: LessonMessageProviderSettings
  draftCounter?: DraftUsageCounter
  onStatusChange?: (status: LessonMessageProviderStatus) => void
}

const DEFAULT_PROVIDER_TIMEOUT_MS = DEFAULT_TIMEOUT_MS

async function callProviderWithTimeout(
  provider: LessonMessageProvider,
  input: LessonMessageInput,
  timeoutMs: number,
): Promise<LessonMessageDraft> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await Promise.race([
      provider.generateLessonMessageDraft(input, { signal: controller.signal }),
      new Promise<LessonMessageDraft>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('AI provider timed out')))
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

export async function generateLessonMessageDraft(
  input: LessonMessageInput,
  options: GenerateLessonMessageDraftOptions = {},
): Promise<LessonMessageDraft> {
  const deterministic = generateDeterministicLessonMessageDraft(input)
  const { provider, settings, draftCounter, onStatusChange } = options

  // Backward compatible: with no `settings`, any passed-in provider is always attempted
  // (pre-14E behavior). With `settings`, the teacher's mode/enabled/kind choices govern.
  const wantsProvider = Boolean(provider) && (!settings || shouldAttemptProvider(settings))
  if (!wantsProvider) {
    onStatusChange?.('disabled')
    return deterministic
  }

  if (settings?.dailyDraftLimit && draftCounter && isOverDailyLimit(draftCounter, settings.dailyDraftLimit)) {
    onStatusChange?.('unavailable')
    return {
      ...deterministic,
      warnings: [...deterministic.warnings, 'Daily provider draft limit reached — used deterministic mode instead.'],
    }
  }

  const maxInputChars = settings?.maxInputChars ?? DEFAULT_MAX_INPUT_CHARS
  const scrub = scrubLessonMessageInputForProvider(input, maxInputChars)
  if (scrub.preferDeterministic) {
    onStatusChange?.('unavailable')
    return {
      ...deterministic,
      warnings: [...deterministic.warnings, ...scrub.warnings, 'Provider was not used for this draft — used deterministic mode instead.'],
    }
  }

  const timeoutMs = options.timeoutMs ?? settings?.timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS
  const maxOutputChars = settings?.maxOutputChars ?? DEFAULT_MAX_OUTPUT_CHARS

  try {
    const rawResult = await callProviderWithTimeout(provider!, scrub.safeInput, timeoutMs)
    const validation = validateProviderDraft(rawResult, maxOutputChars)
    if (!validation.valid) {
      onStatusChange?.('error')
      return {
        ...deterministic,
        warnings: [
          ...deterministic.warnings,
          ...scrub.warnings,
          'Provider output failed validation — used deterministic mode instead.',
        ],
      }
    }
    onStatusChange?.('ready')
    return rawResult
  } catch (err) {
    // Never surface provider/network errors to the teacher — fall back silently
    // to the deterministic draft, with a visible (teacher-only) warning.
    const timedOut = err instanceof Error && err.message.toLowerCase().includes('timed out')
    onStatusChange?.(timedOut ? 'timedOut' : 'error')
    return {
      ...deterministic,
      warnings: [...deterministic.warnings, ...scrub.warnings, 'AI provider unavailable — used the deterministic draft instead.'],
    }
  }
}
