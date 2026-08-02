import { buildLessonMessagePrompt } from './aiLessonMessagePrompt'
import type {
  ProviderCallOptions,
  LessonMessageDraft,
  LessonMessageInput,
  LessonMessageProvider,
} from './aiLessonMessageTypes'

/**
 * Phase 14E — optional HTTP-based provider for a teacher's own local model
 * server (Ollama) or a custom endpoint they control. NOT for hosted
 * key-bearing APIs (openaiCompatible stays interface-only — see
 * aiLessonMessageGenerator.ts — because this repo has no safe place to keep
 * a secret). This factory is never called automatically: it only runs when a
 * teacher has explicitly set provider settings to localOllama/customEndpoint,
 * enabled the provider, and either generates a draft in "provider if
 * available" mode or clicks "Try provider once." It is never invoked by any
 * test — tests use fake/mock LessonMessageProvider objects only.
 *
 * Contract: the endpoint must respond with a JSON body matching the
 * LessonMessageDraft shape directly. The response is treated as untrusted —
 * the caller (aiLessonMessageGenerator.ts) runs it through
 * aiOutputValidator.ts before it is ever used.
 */
export interface HttpProviderConfig {
  endpoint: string
  modelName?: string
  timeoutMs: number
}

function combineSignals(a: AbortSignal, b: AbortSignal | undefined): AbortSignal {
  if (!b) return a
  const controller = new AbortController()
  const abort = () => controller.abort()
  a.addEventListener('abort', abort)
  b.addEventListener('abort', abort)
  return controller.signal
}

export function createHttpLessonMessageProvider(config: HttpProviderConfig): LessonMessageProvider {
  return {
    async generateLessonMessageDraft(
      input: LessonMessageInput,
      options?: ProviderCallOptions,
    ): Promise<LessonMessageDraft> {
      const timeoutController = new AbortController()
      const timer = setTimeout(() => timeoutController.abort(), config.timeoutMs)
      const signal = combineSignals(timeoutController.signal, options?.signal)

      try {
        const prompt = buildLessonMessagePrompt(input)
        const response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.modelName,
            system: prompt.system,
            prompt: prompt.user,
          }),
          signal,
        })

        if (!response.ok) {
          throw new Error(`Provider endpoint responded with HTTP ${response.status}`)
        }

        const json: unknown = await response.json()
        // Untrusted — the orchestrator validates this before it is ever used.
        return json as LessonMessageDraft
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
