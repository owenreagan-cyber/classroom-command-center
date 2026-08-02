import { generateDeterministicLessonMessageDraft } from './aiLessonMessageFallbacks'
import type { LessonMessageDraft, LessonMessageInput, LessonMessageProvider } from './aiLessonMessageTypes'

/**
 * Orchestrator (Phase 14C). Deterministic local mode is the default and the
 * only mode wired up today — no AI provider is configured anywhere in this
 * repo (no API keys, no network calls). The `provider` parameter exists so a
 * future safe provider can be passed in without changing call sites; until
 * one exists, omit it and this always returns the deterministic draft.
 *
 * If a provider is supplied and it throws, rejects, or times out, this falls
 * back to the deterministic draft rather than surfacing an error to the
 * teacher — generation must never hard-fail the panel.
 */
export interface GenerateLessonMessageDraftOptions {
  provider?: LessonMessageProvider
  timeoutMs?: number
}

const DEFAULT_PROVIDER_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('AI provider timed out')), timeoutMs)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export async function generateLessonMessageDraft(
  input: LessonMessageInput,
  options: GenerateLessonMessageDraftOptions = {},
): Promise<LessonMessageDraft> {
  const deterministic = generateDeterministicLessonMessageDraft(input)

  if (!options.provider) {
    return deterministic
  }

  try {
    const draft = await withTimeout(
      options.provider.generateLessonMessageDraft(input),
      options.timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS,
    )
    return draft
  } catch {
    // Never surface provider/network errors to the teacher — fall back silently
    // to the deterministic draft, with a visible (teacher-only) warning.
    return {
      ...deterministic,
      warnings: [...deterministic.warnings, 'AI provider unavailable — used the deterministic draft instead.'],
    }
  }
}
