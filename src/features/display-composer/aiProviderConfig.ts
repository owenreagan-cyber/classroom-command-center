/**
 * Phase 14E — Provider configuration model.
 *
 * Local-only, no secrets. There is no safe pattern anywhere in this repo for
 * handling API keys (no .env, no server, no existing secret-storage — checked
 * before writing this file), so this model deliberately has NO key/token
 * field. `endpoint`/`modelName` are non-secret config for a teacher's own
 * local model server (e.g. Ollama) — never a hosted provider requiring a key.
 * `provider: 'openaiCompatible'` exists in the type for future-readiness only
 * and is always treated as unavailable (see aiLessonMessageGenerator.ts) until
 * a genuinely safe key-handling pattern exists in this codebase.
 */

export type LessonMessageProviderMode = 'deterministicOnly' | 'providerIfAvailable'

export type LessonMessageProviderKind = 'none' | 'openaiCompatible' | 'localOllama' | 'customEndpoint'

export type LessonMessageProviderStatus =
  | 'disabled'
  | 'unavailable'
  | 'ready'
  | 'error'
  | 'timedOut'
  | 'fellBackToDeterministic'

export interface LessonMessageProviderSettings {
  mode: LessonMessageProviderMode
  provider: LessonMessageProviderKind
  providerEnabled: boolean
  modelName?: string
  /** Only meaningful for localOllama/customEndpoint — never a hosted key-bearing endpoint. */
  endpoint?: string
  timeoutMs: number
  maxInputChars: number
  maxOutputChars: number
  dailyDraftLimit?: number
  showProviderStatus: boolean
  lastProviderStatus: LessonMessageProviderStatus
}

export const DEFAULT_TIMEOUT_MS = 6000
export const DEFAULT_MAX_INPUT_CHARS = 2000
export const DEFAULT_MAX_OUTPUT_CHARS = 4000

/** Deterministic-only, provider off — the safe, cost-free default. */
export function defaultProviderSettings(): LessonMessageProviderSettings {
  return {
    mode: 'deterministicOnly',
    provider: 'none',
    providerEnabled: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxInputChars: DEFAULT_MAX_INPUT_CHARS,
    maxOutputChars: DEFAULT_MAX_OUTPUT_CHARS,
    showProviderStatus: true,
    lastProviderStatus: 'disabled',
  }
}

/** True only when the teacher has both switched modes AND picked+enabled a real provider kind. */
export function shouldAttemptProvider(settings: LessonMessageProviderSettings): boolean {
  return (
    settings.mode === 'providerIfAvailable' &&
    settings.providerEnabled &&
    settings.provider !== 'none' &&
    settings.provider !== 'openaiCompatible'
  )
}

export function providerStatusLabel(status: LessonMessageProviderStatus): string {
  switch (status) {
    case 'disabled':
      return 'Disabled (deterministic local mode)'
    case 'unavailable':
      return 'Unavailable — using deterministic mode'
    case 'ready':
      return 'Ready'
    case 'error':
      return 'Provider error — used deterministic mode'
    case 'timedOut':
      return 'Provider timed out — used deterministic mode'
    case 'fellBackToDeterministic':
      return 'Fell back to deterministic mode'
    default:
      return 'Unknown'
  }
}
