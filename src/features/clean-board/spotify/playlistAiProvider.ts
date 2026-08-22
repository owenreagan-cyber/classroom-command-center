import { CLASSROOM_PLAYLIST_RECIPES, getRecipeById } from './playlistRecipes'
import type { PlaylistRecipe } from './spotifyTypes'

/**
 * DB-2F — AI classroom playlist plan generator (provider-agnostic).
 *
 * This module produces a *search strategy*, never final tracks and never a
 * playlist. The deterministic fallback satisfies the generator contract
 * without any live AI API key, so tests and the classroom flow work offline.
 * A live vendor can implement `PlaylistPromptGenerator` later and be injected
 * without touching the review/safety path.
 *
 * The plan never carries tokens, secrets, student data, or private account
 * identifiers — it is a teacher-facing planning document only.
 */

export type PlaylistEnergy = 'low' | 'medium' | 'high'

/** What the teacher asks for before a plan is generated. */
export interface PlaylistPromptInput {
  goal: string
  durationMinutes: number
  energy: PlaylistEnergy
  restrictions: string[]
}

/** A teacher-reviewed search strategy (NOT a playlist, NOT final tracks). */
export interface PlaylistPlan {
  title: string
  classroomPurpose: string
  durationMinutes: number
  energy: PlaylistEnergy
  requirements: string[]
  searchQueries: string[]
  teacherNotes: string
}

export interface PlaylistPromptGenerator {
  generatePlan(input: PlaylistPromptInput): Promise<PlaylistPlan>
}

const FORBIDDEN_PLAN_KEYS = [
  'accessToken',
  'refreshToken',
  'clientSecret',
  'token',
  'secret',
  'authorization',
  'email',
  'studentName',
  'studentData',
  'userId',
  'deviceId',
] as const

const ENERGIES: readonly PlaylistEnergy[] = ['low', 'medium', 'high']

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string')
}

/** A plan is valid only if the required fields are present and correctly typed. */
export function isValidPlaylistPlan(plan: unknown): plan is PlaylistPlan {
  if (!plan || typeof plan !== 'object') return false
  const p = plan as Record<string, unknown>
  if (!isNonEmptyString(p.title)) return false
  if (!isStringArray(p.searchQueries)) return false
  if (p.searchQueries.length === 0 || !p.searchQueries.every((q) => q.trim().length > 0)) return false
  if (!isStringArray(p.requirements)) return false
  if (!ENERGIES.includes(p.energy as PlaylistEnergy)) return false
  if (typeof p.durationMinutes !== 'number' || !(p.durationMinutes > 0)) return false
  return true
}

/** Assert a plan carries no token/secret/student-data keys. */
export function planHasNoForbiddenKeys(plan: PlaylistPlan): boolean {
  return FORBIDDEN_PLAN_KEYS.every((k) => !(k in (plan as unknown as object)))
}

/**
 * Whitelist-validate an arbitrary value into a safe plan. Drops any extra or
 * forbidden keys and returns null if required fields are missing. This is the
 * only way an AI/generator result should enter the app.
 */
export function sanitizePlaylistPlan(raw: unknown): PlaylistPlan | null {
  if (!isValidPlaylistPlan(raw)) return null
  const p = raw as unknown as Record<string, unknown>
  return {
    title: String(p.title),
    classroomPurpose: typeof p.classroomPurpose === 'string' ? p.classroomPurpose : '',
    durationMinutes: Number(p.durationMinutes),
    energy: p.energy as PlaylistEnergy,
    requirements: (p.requirements as string[]).slice(),
    searchQueries: (p.searchQueries as string[]).slice(),
    teacherNotes: typeof p.teacherNotes === 'string' ? p.teacherNotes : 'Review all tracks before adding.',
  }
}

/**
 * Match a teacher's free-text goal to the closest recipe, falling back to the
 * requested energy band, then to a generic focus recipe. Deterministic: same
 * input always yields the same plan.
 */
function pickRecipe(goal: string, energy: PlaylistEnergy): PlaylistRecipe {
  const g = goal.toLowerCase()
  const keywordMap: Array<[RegExp, string]> = [
    [/piano|acoustic|writing|journal|reflect/, 'writing-time-piano'],
    [/math|arithmetic|number|sum/, 'math-work-instrumental'],
    [/read|literacy|book|story|library/, 'reading-time-calm'],
    [/test|quiz|assessment|exam|quiet/, 'test-mode-quiet'],
    [/clean|tidy|transition|pack up|cleanup/, 'clean-up-cue'],
    [/morning|arrival|settle|welcome|arrive/, 'morning-arrival-calm'],
    [/fall|autumn|october|november|pumpkin/, 'seasonal-fall'],
    [/winter|snow|holiday|december|january/, 'seasonal-winter'],
    [/spring|bloom|april|may|garden/, 'seasonal-spring'],
  ]
  for (const [re, id] of keywordMap) {
    if (re.test(g)) {
      const recipe = getRecipeById(id)
      if (recipe) return recipe
    }
  }
  const byEnergy = CLASSROOM_PLAYLIST_RECIPES.find((r) => r.energy === energy)
  return byEnergy ?? getRecipeById('independent-work-focus')!
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const k = item.trim().toLowerCase()
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item.trim())
  }
  return out
}

/**
 * Deterministic fallback generator. Requires no network or API key. Builds a
 * structured search strategy from the matched recipe plus the teacher's stated
 * restrictions. It never creates or modifies a playlist.
 */
export const deterministicPlaylistGenerator: PlaylistPromptGenerator = {
  async generatePlan(input: PlaylistPromptInput): Promise<PlaylistPlan> {
    const recipe = pickRecipe(input.goal, input.energy)
    const requirements = dedupe([...input.restrictions, ...recipe.avoid])
    const plan: PlaylistPlan = {
      title: recipe.title,
      classroomPurpose: recipe.classroomUse,
      durationMinutes: Math.max(1, Math.round(input.durationMinutes)),
      energy: input.energy,
      requirements,
      searchQueries: recipe.searchQueries.slice(),
      teacherNotes: 'Review all tracks before adding. Generated from a template — needs teacher review.',
    }
    return plan
  },
}

/** Default generator — swap with a live provider later without changing callers. */
export const playlistPromptGenerator: PlaylistPromptGenerator = deterministicPlaylistGenerator
