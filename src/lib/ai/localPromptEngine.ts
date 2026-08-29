import { generateObject } from 'ai'
import { createOllama } from 'ollama-ai-provider-v2'
import { z } from 'zod'
import { BACKGROUND_PRESET_IDS } from '../../features/clean-board/backgrounds'
import { BOARD_THEME_IDS } from '../../features/clean-board/themes'
import { MESSAGE_CARD_TONES } from '../../features/clean-board/messageCards'
import { TIMER_MAX_MINUTES, TIMER_TONES } from '../../features/clean-board/timerPresets'
import { ROUTINE_NAMES } from '../../features/clean-board/routinePromptPlanner'
import type { RoutineKind, RoutineMood, RoutinePlan } from '../../features/clean-board/routinePromptPlanner'

/**
 * DB-AI — local-only LLM prompt engine.
 *
 * Talks ONLY to a local Ollama instance — never a remote/cloud provider — to
 * turn a teacher's natural-language prompt into a `RoutinePlan`, the exact
 * same intermediate shape `routinePromptPlanner.ts`'s deterministic parser
 * produces. That shared shape is what keeps this safe: a validated response
 * flows through the same `routinePlanToBoardPage`/`routinePlanToSavedLayout`/
 * `routinePlanToScene` conversion the deterministic path already uses, so
 * there is no parallel/looser board-state path for AI output to bypass.
 *
 * Every exported function here is designed to never throw — callers
 * (`RoutinePromptPanel.tsx`) check `result.ok` and fall back to
 * `parseRoutinePrompt` from the deterministic planner whenever Ollama is
 * offline, slow, or returns something that fails schema validation.
 */

/** Ollama's native REST root — NOT an OpenAI-compatible endpoint. */
export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434/api'
/** Must already be pulled locally (`ollama pull llama3.2`) — this module never pulls models. */
export const DEFAULT_OLLAMA_MODEL = 'llama3.2'

const REACHABILITY_TIMEOUT_MS = 1500
const GENERATE_TIMEOUT_MS = 20_000

// ── Zod schema — mirrors `RoutinePlan` exactly ──
//
// Every enum below is built from this codebase's own catalog arrays
// (BACKGROUND_PRESET_IDS, BOARD_THEME_IDS, MESSAGE_CARD_TONES, TIMER_TONES,
// and RoutineKind derived from ROUTINE_NAMES's keys) rather than a
// hand-copied literal list, so the schema can't silently drift from the
// catalogs it validates against.

const ROUTINE_KINDS = Object.keys(ROUTINE_NAMES) as [RoutineKind, ...RoutineKind[]]

// RoutineMood has no backing catalog Record to derive keys from (it's a
// small, stable style hint, not a real catalog) — must be kept in sync with
// `RoutineMood` in routinePromptPlanner.ts by hand.
const ROUTINE_MOODS = ['calm', 'focus', 'bright', 'celebration'] as const satisfies readonly RoutineMood[]

const routineTimerStepSchema = z.object({
  title: z.string().min(1).max(80),
  minutes: z.number().int().min(1).max(TIMER_MAX_MINUTES),
  tone: z.enum(TIMER_TONES),
})

const routineVisualStyleSchema = z.object({
  backgroundPresetId: z.enum(BACKGROUND_PRESET_IDS),
  themeId: z.enum(BOARD_THEME_IDS),
  mood: z.enum(ROUTINE_MOODS),
  accentGraphicSuggestion: z.string().max(200).optional(),
})

const routineMusicSchema = z.object({
  enabled: z.boolean(),
  mood: z.string().min(1).max(40),
  suggestedPlaylistName: z.string().min(1).max(80),
  searchTerms: z.array(z.string().min(1).max(30)).max(8),
  recipeId: z.string().max(60).optional(),
})

export const routinePlanSchema = z.object({
  kind: z.enum(ROUTINE_KINDS),
  sceneName: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  greeting: z.string().min(1).max(60),
  intro: z.string().max(200),
  checklistItems: z.array(z.string().min(1).max(120)).min(1).max(12),
  closing: z.string().max(120),
  timers: z.array(routineTimerStepSchema).min(1).max(6),
  visualStyle: routineVisualStyleSchema,
  music: routineMusicSchema,
  tone: z.enum(MESSAGE_CARD_TONES).optional(),
})

// Compile-time guarantee that this schema's inferred shape matches
// `RoutinePlan` in both directions — a build error here means the schema
// has drifted from the real type (missing field, extra field, or a wrong
// literal union member), not something to work around at runtime.
type SchemaOutput = z.infer<typeof routinePlanSchema>
const _forwardTypeCheck: RoutinePlan = null as unknown as SchemaOutput
const _backwardTypeCheck: SchemaOutput = null as unknown as RoutinePlan
void _forwardTypeCheck
void _backwardTypeCheck

const SYSTEM_PROMPT = `You are a classroom assistant that turns a teacher's short request into a structured routine for a classroom display board. Output must satisfy the provided JSON schema exactly.

Guidance for filling fields well (not just validly):
- "kind" — pick the routine that best matches the request (morningArrival, math, reading, writing, assessment, cleanup, or custom for anything else).
- "sceneName" — short internal label, e.g. "Math Workshop — Aug 29".
- "title" — the large on-board heading (often the date, or a short greeting).
- "greeting" — a short message-card title, e.g. "Good Morning" or "Objective".
- "intro" — one short sentence introducing the checklist, ending with a colon.
- "checklistItems" — 2-5 concrete, student-facing action items in the order students should do them.
- "closing" — an optional short encouraging sign-off (or an empty string if none fits).
- "timers" — one or more named work timers implied by the request; default to a single reasonable duration (typically 10-30 minutes) if the teacher didn't specify one.
- "visualStyle" — pick a background/theme/mood that matches the requested feel (calm, focus, bright, or celebration); leave "accentGraphicSuggestion" out unless the teacher asked for a specific sticker/graphic accent.
- "music" — only set "enabled: true" if the teacher mentioned music/audio; "searchTerms" should be a short list of mood words (e.g. ["calm", "instrumental"]).
- "tone" — only include it if a specific message tone is clearly implied.

Never include any text outside the JSON object — no markdown fences, no commentary.`

function buildUserPrompt(teacherPrompt: string, now: Date): string {
  return `Today's date: ${now.toDateString()}\n\nTeacher's request:\n${teacherPrompt}`
}

export interface OllamaConnectionConfig {
  baseURL?: string
  model?: string
}

/**
 * Best-effort, fast reachability check against Ollama's own `/api/tags`
 * endpoint. Never throws — any failure (connection refused, timeout, DNS,
 * non-2xx) simply resolves `false` so callers can fall back immediately.
 */
export async function isOllamaReachable(
  config: OllamaConnectionConfig = {},
  timeoutMs = REACHABILITY_TIMEOUT_MS,
): Promise<boolean> {
  if (typeof fetch === 'undefined') return false
  const baseURL = config.baseURL ?? DEFAULT_OLLAMA_BASE_URL
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${baseURL}/tags`, { signal: controller.signal })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

export interface LocalPromptEngineOptions extends OllamaConnectionConfig {
  now?: Date
  signal?: AbortSignal
  /** Skip the reachability pre-check (the caller already confirmed it). */
  skipReachabilityCheck?: boolean
}

export type LocalPromptEngineResult =
  | { ok: true; plan: RoutinePlan; source: 'ollama' }
  | { ok: false; error: string }

/**
 * Ask the local Ollama instance to turn `prompt` into a `RoutinePlan`.
 * Never throws — callers should fall back to the deterministic
 * `parseRoutinePrompt` on `{ ok: false }` (offline instance, timeout,
 * schema-validation failure, malformed model output, anything else).
 */
export async function generateRoutinePlanWithOllama(
  prompt: string,
  options: LocalPromptEngineOptions = {},
): Promise<LocalPromptEngineResult> {
  const trimmed = prompt.trim()
  if (!trimmed) return { ok: false, error: 'Empty prompt.' }

  const baseURL = options.baseURL ?? DEFAULT_OLLAMA_BASE_URL
  const model = options.model ?? DEFAULT_OLLAMA_MODEL

  if (!options.skipReachabilityCheck) {
    const reachable = await isOllamaReachable({ baseURL })
    if (!reachable) {
      return { ok: false, error: `Local Ollama instance is not reachable at ${baseURL}.` }
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GENERATE_TIMEOUT_MS)
  const onExternalAbort = () => controller.abort()
  options.signal?.addEventListener('abort', onExternalAbort)

  try {
    const ollama = createOllama({ baseURL })
    const result = await generateObject({
      model: ollama(model),
      schema: routinePlanSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(trimmed, options.now ?? new Date()),
      abortSignal: controller.signal,
    })
    return { ok: true, plan: result.object, source: 'ollama' }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Local model request failed.',
    }
  } finally {
    clearTimeout(timer)
    options.signal?.removeEventListener('abort', onExternalAbort)
  }
}
