import type {
  BackgroundPresetId,
  BoardObject,
  BoardPage,
  BoardScene,
  BoardThemeId,
  DisplayModeId,
  MessageCardConfig,
  MessageCardKind,
  MessageCardTone,
  SavedLayout,
  SceneType,
  TimerTone,
} from './types'
import { BOARD_SCHEMA_VERSION } from './storage/boardSerialization'
import { getTheme } from './themes'
import { clampTimerMinutes, formatTimerDuration } from './timerPresets'
import { getDisplayModeConfig } from './displayModes'
import { sanitizePlainText } from './messageCards'

/**
 * DB-7C — deterministic prompt routine planner.
 *
 * A pure, offline planner that turns a teacher's natural-language prompt into a
 * structured `RoutinePlan`, then into normal Clean Board state. No network, no
 * AI provider, no API keys. The parser uses local rules (dates, routine
 * keywords, bullet checklists, timer/music/style hints) and always produces a
 * safe, complete plan.
 *
 * The plan is an *intermediate* shape only: `routinePlanToBoardPage` /
 * `routinePlanToSavedLayout` / `routinePlanToScene` produce ordinary Clean Board
 * state that flows through the exact same autosave / scene / present-projection
 * / host-display paths as anything authored by hand. There is no parallel
 * prompt-only runtime or display layer.
 */

export type RoutineKind =
  | 'morningArrival'
  | 'math'
  | 'reading'
  | 'writing'
  | 'assessment'
  | 'cleanup'
  | 'custom'

export type RoutineMood = 'calm' | 'focus' | 'bright' | 'celebration'

export interface RoutineTimerStep {
  title: string
  minutes: number
  tone: TimerTone
}

export interface RoutineVisualStyle {
  backgroundPresetId: BackgroundPresetId
  themeId: BoardThemeId
  mood: RoutineMood
  /** Stored as a suggestion only — no fake art, no generated image assets. */
  accentGraphicSuggestion?: string
}

export interface RoutineMusic {
  enabled: boolean
  mood: string
  suggestedPlaylistName: string
  searchTerms: string[]
  /** Best-effort reference into the existing classroom playlist recipes. */
  recipeId?: string
}

export interface RoutinePlan {
  kind: RoutineKind
  sceneName: string
  /** The large on-board title (e.g. the date, or a greeting). */
  title: string
  /** Message-card title (e.g. "Good Morning"). */
  greeting: string
  /** Opening line above the checklist (e.g. "Please complete your morning routines:"). */
  intro: string
  checklistItems: string[]
  /** Closing line after the checklist (e.g. "Be ready for math!"). */
  closing: string
  timers: RoutineTimerStep[]
  visualStyle: RoutineVisualStyle
  music: RoutineMusic
  /** Optional message-card tone override (defaults to the kind's tone). */
  tone?: MessageCardTone
}

export interface RoutinePromptOptions {
  /** Injectable clock for deterministic date handling ("today"/"tomorrow"). */
  now?: Date
}

// ── catalog maps ──

const ROUTINE_NAMES: Record<RoutineKind, string> = {
  morningArrival: 'Morning Arrival',
  math: 'Math Workshop',
  reading: 'Reading Block',
  writing: 'Writing Block',
  assessment: 'Assessment',
  cleanup: 'Cleanup',
  custom: 'Classroom',
}

const ROUTINE_GREETINGS: Record<RoutineKind, string> = {
  morningArrival: 'Good Morning',
  math: 'Objective',
  reading: 'Reading',
  writing: 'Writing',
  assessment: 'Assessment',
  cleanup: 'Cleanup Time',
  custom: 'Classroom',
}

const ROUTINE_DISPLAY_MODES: Record<RoutineKind, DisplayModeId> = {
  morningArrival: 'morningArrival',
  math: 'focus',
  reading: 'reading',
  writing: 'focus',
  assessment: 'assessment',
  cleanup: 'cleanup',
  custom: 'custom',
}

const ROUTINE_MESSAGE_KINDS: Record<RoutineKind, MessageCardKind> = {
  morningArrival: 'welcome',
  math: 'objective',
  reading: 'objective',
  writing: 'directions',
  assessment: 'directions',
  cleanup: 'transition',
  custom: 'reminder',
}

const ROUTINE_MESSAGE_TONES: Record<RoutineKind, MessageCardTone> = {
  morningArrival: 'calm',
  math: 'focus',
  reading: 'calm',
  writing: 'calm',
  assessment: 'focus',
  cleanup: 'warning',
  custom: 'neutral',
}

const DEFAULT_TIMER: Record<RoutineKind, RoutineTimerStep> = {
  morningArrival: { title: 'Quiet Morning Work', minutes: 25, tone: 'calm' },
  math: { title: 'Math Work', minutes: 20, tone: 'focus' },
  reading: { title: 'Reading Stamina', minutes: 15, tone: 'calm' },
  writing: { title: 'Quiet Writing', minutes: 12, tone: 'calm' },
  assessment: { title: 'Work Time', minutes: 45, tone: 'focus' },
  cleanup: { title: 'Cleanup', minutes: 3, tone: 'urgent' },
  custom: { title: 'Work Time', minutes: 20, tone: 'neutral' },
}

const DEFAULT_INTRO: Record<RoutineKind, string> = {
  morningArrival: 'Please complete your morning routines:',
  math: 'Please complete the following:',
  reading: 'Please complete the following:',
  writing: 'Please complete the following:',
  assessment: 'Please work quietly and independently:',
  cleanup: 'Please complete the following:',
  custom: 'Please complete the following:',
}

const DEFAULT_CHECKLIST: Record<RoutineKind, string[]> = {
  morningArrival: ['Turn in your homework', 'Begin your morning work quietly', 'Stay seated and work quietly'],
  math: ['Take out your materials', 'Begin the math work quietly', 'Raise your hand if you need help'],
  reading: ['Choose a book', 'Read quietly at your seat', 'Build your reading stamina'],
  writing: ['Choose your topic', 'Draft your ideas', 'Write quietly'],
  assessment: ['Work silently', 'Eyes on your own work', 'Raise your hand for help'],
  cleanup: ['Put materials away', 'Tidy your area', 'Wait quietly at your seat'],
  custom: ['Begin your work quietly', 'Raise your hand if you need help'],
}

const DEFAULT_BG_BY_KIND: Record<RoutineKind, BackgroundPresetId> = {
  morningArrival: 'morning-glow',
  math: 'slate-focus',
  reading: 'reading-cream',
  writing: 'slate-focus',
  assessment: 'clean-white',
  cleanup: 'warm-neutral',
  custom: 'calm-blue',
}

const DEFAULT_THEME_BY_KIND: Record<RoutineKind, BoardThemeId> = {
  morningArrival: 'minimal-light',
  math: 'minimal-dark',
  reading: 'minimal-light',
  writing: 'minimal-dark',
  assessment: 'minimal-light',
  cleanup: 'minimal-light',
  custom: 'minimal-dark',
}

const PLAYLIST_NAME_BY_KIND: Record<RoutineKind, string> = {
  morningArrival: 'Morning Arrival Calm',
  math: 'Math Work Instrumental',
  reading: 'Reading Time Calm',
  writing: 'Writing Time Piano',
  assessment: 'Test Mode Quiet',
  cleanup: 'Clean Up Cue',
  custom: 'Independent Work Focus',
}

const RECIPE_BY_KIND: Record<RoutineKind, string> = {
  morningArrival: 'morning-arrival-calm',
  math: 'math-work-instrumental',
  reading: 'reading-time-calm',
  writing: 'writing-time-piano',
  assessment: 'test-mode-quiet',
  cleanup: 'clean-up-cue',
  custom: 'independent-work-focus',
}

// ── detection helpers ──

const MONTH_WORDS =
  '(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)'
const FULL_DATE_RE = new RegExp(
  `\\b(${MONTH_WORDS})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,)?\\s+(\\d{4})\\b`,
  'i',
)
const MONTH_DAY_RE = new RegExp(`\\b(${MONTH_WORDS})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i')

const MONTH_ABBREV: Record<string, string> = {
  january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr', may: 'May', june: 'Jun',
  july: 'Jul', august: 'Aug', september: 'Sep', october: 'Oct', november: 'Nov', december: 'Dec',
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', jun: 'Jun', jul: 'Jul', aug: 'Aug',
  sep: 'Sep', sept: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
}

const BULLET_RE = /^\s*(?:[-*•·]|✓|✔|\d+[.)])\s+(.+)$/

const MUSIC_KEYWORDS = [
  'spotify', 'playlist', 'music', 'piano', 'instrumental', 'acoustic',
  'lofi', 'lo-fi', 'ambient', 'classical', 'song', 'soundtrack',
]

const MUSIC_TERMS = [
  'calm', 'instrumental', 'acoustic', 'piano', 'focus', 'ambient',
  'classical', 'lo-fi', 'lofi', 'soft', 'relaxing',
]

function detectRoutineKind(lower: string): RoutineKind {
  if (/(morning|arrival|good morning|homeroom)/.test(lower)) return 'morningArrival'
  if (/(assessment|test|quiz|exam)/.test(lower)) return 'assessment'
  if (/(cleanup|clean up|pack up|tidy|dismissal|dismiss|end of (?:the )?day)/.test(lower)) return 'cleanup'
  if (/(reading|read aloud|stamina)/.test(lower)) return 'reading'
  if (/(writing|journal)/.test(lower)) return 'writing'
  if (/(math|numeracy)/.test(lower)) return 'math'
  return 'morningArrival'
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function cleanDateToken(s: string): string {
  let out = s.replace(/\s+/g, ' ').trim()
  out = out.replace(/[.,]+$/, '')
  return out
}

function shortFromMatch(m: RegExpExecArray): string {
  const month = MONTH_ABBREV[m[1].toLowerCase()] ?? m[1]
  const day = parseInt(m[2], 10)
  return `${month} ${day}`
}

function detectDateTitle(input: string, now: Date): string | null {
  const full = FULL_DATE_RE.exec(input)
  if (full) return cleanDateToken(full[0])
  const md = MONTH_DAY_RE.exec(input)
  if (md) return cleanDateToken(md[0])
  if (/\btoday\b/i.test(input)) return formatLongDate(now)
  if (/\btomorrow\b/i.test(input)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return formatLongDate(d)
  }
  return null
}

function detectShortDate(input: string, now: Date): string | null {
  const full = FULL_DATE_RE.exec(input)
  if (full) return shortFromMatch(full)
  const md = MONTH_DAY_RE.exec(input)
  if (md) return shortFromMatch(md)
  if (/\btoday\b/i.test(input)) return formatShortDate(now)
  if (/\btomorrow\b/i.test(input)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return formatShortDate(d)
  }
  return null
}

function cleanItem(s: string): string {
  let out = s.replace(/\s+/g, ' ').trim()
  out = out.replace(/^[-\s]+/, '').replace(/[;\s]+$/, '')
  return out
}

function splitList(s: string): string[] {
  return s
    .split(/,|;|\band\b|\bthen\b/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

function detectChecklistItems(input: string): string[] {
  const items: string[] = []
  const lines = input.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const m = BULLET_RE.exec(trimmed)
    if (m) {
      const item = cleanItem(m[1])
      if (item) items.push(item)
      continue
    }
    // "Students should ..." phrased as a directive line → split into items.
    const should = /^(?:please\s+)?(?:students|they)\s+should\s*:?\s*(.+)$/i.exec(trimmed)
    if (should) {
      for (const part of splitList(should[1])) {
        const item = cleanItem(part)
        if (item) items.push(item)
      }
    }
  }
  // De-dupe while preserving order.
  return Array.from(new Set(items))
}

function cleanSentence(s: string): string {
  let out = s.replace(/\s+/g, ' ').trim()
  out = out.replace(/[.!;]+$/, '')
  if (!/:$/.test(out)) out += ':'
  return out
}

function detectIntro(input: string, kind: RoutineKind): string {
  const lines = input.split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (/^(?:please\s+)?(?:students|they)\s+should/i.test(t)) continue
    if (
      /complete (?:your )?(?:morning )?routines?/i.test(t) ||
      /complete the following/i.test(t) ||
      /^(?:please\s+)?(?:complete|do) the following/i.test(t)
    ) {
      return cleanSentence(t)
    }
  }
  return DEFAULT_INTRO[kind]
}

function cleanClosing(s: string): string {
  let out = s.replace(/\s+/g, ' ').trim()
  out = out.replace(/[.;]+$/, '')
  if (out) out = out.charAt(0).toUpperCase() + out.slice(1)
  if (out && !/[!?]$/.test(out)) out += '!'
  return out
}

function detectClosing(input: string): string {
  const lines = input.split('\n')
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (BULLET_RE.test(t)) continue
    if (/(timer|minute|background|theme|music|playlist|spotify|sticker|graphic|image)/i.test(t)) continue
    if (/^(?:be|get)\s+ready\b|be prepared|prepare for|ready for/i.test(t)) {
      return cleanClosing(t)
    }
  }
  return ''
}

function cleanTitle(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

function detectTimers(input: string, kind: RoutineKind): RoutineTimerStep[] {
  const defaultStep = DEFAULT_TIMER[kind]
  const steps: RoutineTimerStep[] = []
  const seen = new Set<string>()

  // Titled timers: "25-minute Quiet Morning Work timer" / "for 25 minutes of X".
  const titledRe = /(\d{1,3})\s*[- ]?\s*minute(?:s)?\s+(.+?)\s+timer/gi
  let m: RegExpExecArray | null
  while ((m = titledRe.exec(input)) !== null) {
    const minutes = clampTimerMinutes(parseInt(m[1], 10))
    const title = cleanTitle(m[2]) || defaultStep.title
    const key = `${title}:${minutes}`
    if (!seen.has(key)) {
      seen.add(key)
      steps.push({ title, minutes, tone: defaultStep.tone })
    }
  }
  if (steps.length > 0) return steps

  // Bare minutes: "for 25 minutes" / "25 minutes" — use the routine's default title.
  const bareRe = /(\d{1,3})\s*[- ]?\s*minute/gi
  while ((m = bareRe.exec(input)) !== null) {
    const minutes = clampTimerMinutes(parseInt(m[1], 10))
    steps.push({ title: defaultStep.title, minutes, tone: defaultStep.tone })
  }
  if (steps.length > 0) return steps

  return [defaultStep]
}

function detectVisualStyle(input: string, kind: RoutineKind): RoutineVisualStyle {
  const lower = input.toLowerCase()
  let backgroundPresetId: BackgroundPresetId = DEFAULT_BG_BY_KIND[kind]
  let themeId: BoardThemeId = DEFAULT_THEME_BY_KIND[kind]
  let mood: RoutineMood = 'calm'

  if (/(calm|soft|morning|premium|readable|warm)/.test(lower)) {
    backgroundPresetId = 'morning-glow'
    themeId = 'minimal-light'
    mood = 'calm'
  } else if (/(focus|minimal|distraction|quiet)/.test(lower)) {
    backgroundPresetId = 'slate-focus'
    themeId = 'minimal-dark'
    mood = 'focus'
  } else if (/(reading|cream|cozy)/.test(lower)) {
    backgroundPresetId = 'reading-cream'
    themeId = 'minimal-light'
    mood = 'calm'
  } else if (/(bright|colorful|celebration|fun|festive)/.test(lower)) {
    backgroundPresetId = 'warm-neutral'
    themeId = 'minimal-light'
    mood = 'bright'
  }

  const accentGraphicSuggestion = detectGraphicSuggestion(input)
  return {
    backgroundPresetId,
    themeId,
    mood,
    ...(accentGraphicSuggestion ? { accentGraphicSuggestion } : {}),
  }
}

function detectGraphicSuggestion(input: string): string | undefined {
  const lower = input.toLowerCase()
  const hasGraphic = /(sticker|graphic|accent|icon|clip ?art|illustration)/.test(lower)
  if (!hasGraphic) return undefined
  const items: string[] = []
  if (lower.includes('pencil')) items.push('pencil')
  if (lower.includes('notebook')) items.push('notebook')
  if (lower.includes('sun')) items.push('sun')
  if (lower.includes('apple')) items.push('apple')
  if (lower.includes('book')) items.push('book')
  if (lower.includes('star')) items.push('star')
  const list = items.length > 0 ? items.join(', ') : 'school'
  return `A small, sensible school-themed accent (e.g. ${list}).`
}

function detectMusic(input: string, kind: RoutineKind): RoutineMusic {
  const lower = input.toLowerCase()
  const disabled = /(\bno\b|without|don'?t|do not|stop)\s+(?:the\s+)?(music|audio|sound|spotify)/.test(lower)
  const enabled = !disabled && MUSIC_KEYWORDS.some((k) => lower.includes(k))
  const searchTerms = MUSIC_TERMS.filter((t) => lower.includes(t))
  const mood = /(calm|soft|relax)/.test(lower)
    ? 'calm'
    : /(focus|concentrat)/.test(lower)
      ? 'focus'
      : /(upbeat|energetic|fun)/.test(lower)
        ? 'upbeat'
        : 'calm'
  const recipeId = RECIPE_BY_KIND[kind]
  return {
    enabled,
    mood,
    suggestedPlaylistName: PLAYLIST_NAME_BY_KIND[kind],
    searchTerms: searchTerms.length > 0 ? searchTerms : ['calm', 'instrumental'],
    recipeId,
  }
}

// ── public API ──

export function displayModeIdForRoutine(kind: RoutineKind): DisplayModeId {
  return ROUTINE_DISPLAY_MODES[kind]
}

/** Assemble the message-card body from a plan's intro, checklist, and closing. */
export function buildRoutineMessage(plan: RoutinePlan): string {
  const parts: string[] = []
  if (plan.intro.trim()) parts.push(plan.intro.trim())
  for (const item of plan.checklistItems) {
    const clean = item.trim()
    if (clean) parts.push(`✓ ${clean}`)
  }
  if (plan.closing.trim()) parts.push(plan.closing.trim())
  return parts.join('\n')
}

export function parseRoutinePrompt(input: string, options: RoutinePromptOptions = {}): RoutinePlan {
  const raw = sanitizePlainText(input)
  const lower = raw.toLowerCase()
  const now = options.now ?? new Date()

  const kind = detectRoutineKind(lower)
  const dateTitle = detectDateTitle(raw, now)
  const title = dateTitle ?? ROUTINE_NAMES[kind]
  const shortDate = detectShortDate(raw, now)
  const sceneName = `${ROUTINE_NAMES[kind]}${shortDate ? ` — ${shortDate}` : ''}`

  const checklistItems = detectChecklistItems(raw)
  const finalChecklist = checklistItems.length > 0 ? checklistItems : DEFAULT_CHECKLIST[kind]

  return {
    kind,
    sceneName,
    title,
    greeting: ROUTINE_GREETINGS[kind],
    intro: detectIntro(raw, kind),
    checklistItems: finalChecklist,
    closing: detectClosing(raw),
    timers: detectTimers(raw, kind),
    visualStyle: detectVisualStyle(raw, kind),
    music: detectMusic(raw, kind),
  }
}

function routinePlanToMessageConfig(plan: RoutinePlan): MessageCardConfig {
  return {
    kind: 'messageCard',
    title: plan.greeting,
    message: buildRoutineMessage(plan),
    cardKind: ROUTINE_MESSAGE_KINDS[plan.kind],
    tone: plan.tone ?? ROUTINE_MESSAGE_TONES[plan.kind],
    textSize: 'large',
    checklistStyle: false,
  }
}

/** Build the object list for a plan (heading + message card + timers + optional Spotify). */
export function routinePlanToObjects(plan: RoutinePlan): BoardObject[] {
  const objects: BoardObject[] = [
    {
      id: 'routine-heading',
      kind: 'text',
      x: 340,
      y: 80,
      w: 1240,
      h: 170,
      rotation: 0,
      locked: false,
      visible: true,
      layer: 1,
      config: {
        kind: 'text',
        text: plan.title,
        fontSize: 92,
        color: getTheme(plan.visualStyle.themeId).textTone === 'dark' ? '#1e293b' : '#f8fafc',
        align: 'center',
      },
    },
    {
      id: 'routine-message',
      kind: 'messageCard',
      x: 320,
      y: 300,
      w: 1280,
      h: 600,
      rotation: 0,
      locked: false,
      visible: true,
      layer: 2,
      config: routinePlanToMessageConfig(plan),
    },
  ]

  plan.timers.forEach((t, i) => {
    objects.push({
      id: `routine-timer-${i}`,
      kind: 'timer',
      x: 1600,
      y: 80 + i * 170,
      w: 280,
      h: 150,
      rotation: 0,
      locked: false,
      visible: true,
      layer: 2,
      config: {
        kind: 'timer',
        presetId: 'custom',
        title: t.title,
        durationMinutes: t.minutes,
        tone: t.tone,
        label: formatTimerDuration(t.minutes),
      },
    })
  })

  if (plan.music.enabled) {
    objects.push({
      id: 'routine-spotify',
      kind: 'spotifyNowPlayingPlaceholder',
      x: 320,
      y: 920,
      w: 520,
      h: 130,
      rotation: 0,
      locked: false,
      visible: true,
      layer: 2,
      config: { kind: 'spotifyNowPlayingPlaceholder', label: 'Now Playing' },
    })
  }

  return objects
}

/** Produce a normal `BoardPage` from a plan (preserves `existingPage` id when given). */
export function routinePlanToBoardPage(plan: RoutinePlan, existingPage?: BoardPage): BoardPage {
  return {
    id: existingPage?.id ?? `page-${plan.kind}`,
    title: plan.sceneName,
    background: { type: 'preset', presetId: plan.visualStyle.backgroundPresetId },
    theme: getTheme(plan.visualStyle.themeId),
    objects: routinePlanToObjects(plan),
  }
}

/** Produce a persisted `SavedLayout` from a plan. */
export function routinePlanToSavedLayout(plan: RoutinePlan): SavedLayout {
  const now = Date.now()
  const page = routinePlanToBoardPage(plan)
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: `layout-${now}`,
    name: plan.sceneName,
    kind: 'layout',
    background: page.background,
    theme: page.theme,
    objects: page.objects,
    displayModeId: ROUTINE_DISPLAY_MODES[plan.kind],
    createdAt: now,
    updatedAt: now,
  }
}

/** Produce a `BoardScene` referencing the given (or a freshly built) layout. */
export function routinePlanToScene(
  plan: RoutinePlan,
  layout: SavedLayout = routinePlanToSavedLayout(plan),
): BoardScene {
  const now = Date.now()
  const sceneType: SceneType =
    getDisplayModeConfig(ROUTINE_DISPLAY_MODES[plan.kind]).recommendedSceneType ?? 'custom'
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: `scene-${now}`,
    name: plan.sceneName,
    kind: 'scene',
    type: sceneType,
    layoutId: layout.id,
    displayModeId: ROUTINE_DISPLAY_MODES[plan.kind],
    ...(plan.timers[0] ? { timerPresetRef: 'custom' } : {}),
    ...(plan.music.enabled && plan.music.recipeId ? { spotifyPresetRef: plan.music.recipeId } : {}),
    backgroundPresetId: plan.visualStyle.backgroundPresetId,
    keepAwake: getDisplayModeConfig(ROUTINE_DISPLAY_MODES[plan.kind]).keepAwakeDefault,
    studentSafe: true,
    createdAt: now,
    updatedAt: now,
  }
}

// ── DB-7F — local assistant revision + examples ──

export const ASSISTANT_NOT_UNDERSTOOD_NOTE =
  'I could not confidently apply that revision. Try "add…", "remove…", or "change timer to…"'

export interface RevisionResult {
  plan: RoutinePlan
  applied: boolean
  note?: string
}

export interface AssistantExamplePrompt {
  id: string
  label: string
  prompt: string
}

/**
 * Example prompt chips. Clicking a chip seeds the prompt box (never applies to
 * the board directly). "Morning Arrival" uses the "today" form.
 */
export const ASSISTANT_EXAMPLE_PROMPTS: AssistantExamplePrompt[] = [
  {
    id: 'morning-arrival',
    label: 'Morning Arrival',
    prompt:
      'Set up morning arrival for today. Students should complete morning work, turn in folders, stay seated, sharpen pencils, and be ready for math. Use a 25-minute quiet work timer and calm instrumental music.',
  },
  {
    id: 'math-workshop',
    label: 'Math Workshop',
    prompt:
      'Set up math workshop. Students should take out their materials, begin the warm-up, and work quietly. Use a 20-minute timer and focus instrumental music.',
  },
  {
    id: 'reading-block',
    label: 'Reading Block',
    prompt:
      'Set up reading block. Students should choose a book, read quietly, and build stamina. Use a 15-minute timer and calm acoustic music.',
  },
  {
    id: 'assessment-mode',
    label: 'Assessment Mode',
    prompt:
      'Set up assessment mode. Students should work silently, keep eyes on their own work, and raise their hand for help. Use a 45-minute timer. No music.',
  },
  {
    id: 'cleanup',
    label: 'Cleanup',
    prompt:
      'Set up cleanup. Students should put materials away, tidy their area, and wait quietly. Use a 3-minute timer and upbeat transition music.',
  },
  {
    id: 'dismissal',
    label: 'Dismissal',
    prompt:
      'Set up dismissal. Students should pack up, gather their belongings, and wait quietly for the bell. Use a 5-minute timer.',
  },
]

function titleCaseFirst(s: string): string {
  const t = s.trim()
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/**
 * Revise an existing plan with a follow-up instruction. Pure and deterministic:
 * returns a new plan (or the same reference when nothing matched) plus whether a
 * rule applied and an optional teacher-facing note.
 */
export function reviseRoutinePlan(plan: RoutinePlan, instruction: string): RevisionResult {
  const lower = instruction.toLowerCase().trim()
  const unchanged = (note?: string): RevisionResult => ({ plan, applied: false, note })
  let m: RegExpExecArray | null

  // "change title to X"
  m = /(?:change|set)\s+(?:the\s+)?title\s+to\s+(.+)$/i.exec(instruction)
  if (m) {
    const title = m[1].trim().replace(/["']/g, '')
    if (!title) return unchanged()
    return { plan: { ...plan, title }, applied: true, note: `Title changed to "${title}".` }
  }

  // "change timer to X (minutes)"
  m = /(?:change|set)\s+(?:the\s+)?timer\s+to\s+(\d{1,3})\s*(?:minutes?)?/i.exec(instruction)
  if (m) {
    const minutes = clampTimerMinutes(parseInt(m[1], 10))
    const timers = plan.timers.map((t, i) => (i === 0 ? { ...t, minutes } : t))
    return { plan: { ...plan, timers }, applied: true, note: `Timer changed to ${minutes} minutes.` }
  }

  // "make it shorter"
  if (/(make|keep)\s+(it\s+)?(more\s+)?(short|shorter|concise|brief)/.test(lower)) {
    return {
      plan: { ...plan, checklistItems: plan.checklistItems.slice(0, 3), closing: '' },
      applied: true,
      note: 'Trimmed the message to the most important steps.',
    }
  }

  // "make it more serious"
  if (/(more\s+)?(serious|formal|strict|firm)/.test(lower)) {
    return {
      plan: { ...plan, tone: 'focus', closing: plan.closing.replace(/!+$/, '.') },
      applied: true,
      note: 'Made the tone more serious.',
    }
  }

  // "make it friendlier"
  if (/(more\s+)?(friendl|warm|welcom|encourag)/.test(lower)) {
    return { plan: { ...plan, tone: 'calm' }, applied: true, note: 'Made the tone friendlier.' }
  }

  // "make the background calmer"
  if (/calmer|more calm/.test(lower)) {
    return {
      plan: {
        ...plan,
        visualStyle: {
          ...plan.visualStyle,
          backgroundPresetId: 'morning-glow',
          themeId: 'minimal-light',
          mood: 'calm',
        },
      },
      applied: true,
      note: 'Background is now calmer.',
    }
  }

  // "make it brighter"
  if (/brighter|more bright/.test(lower)) {
    return {
      plan: {
        ...plan,
        visualStyle: {
          ...plan.visualStyle,
          backgroundPresetId: 'warm-neutral',
          themeId: 'minimal-light',
          mood: 'bright',
        },
      },
      applied: true,
      note: 'Background is now brighter.',
    }
  }

  // "no music"
  if (/(\bno\b|without|remove|turn off|stop)\s+(?:the\s+)?(music|audio|sound|spotify)/.test(lower)) {
    return {
      plan: { ...plan, music: { ...plan.music, enabled: false } },
      applied: true,
      note: 'Music suggestion removed.',
    }
  }

  // "use piano music"
  if (/(use|play|add)\s+(?:soft\s+)?piano(?:\s+music)?/.test(lower)) {
    return {
      plan: {
        ...plan,
        music: { ...plan.music, enabled: true, mood: 'calm', searchTerms: ['piano', 'calm', 'instrumental'] },
      },
      applied: true,
      note: 'Using calm piano music.',
    }
  }

  // "use acoustic music"
  if (/(use|play|add)\s+(?:soft\s+)?acoustic(?:\s+music)?/.test(lower)) {
    return {
      plan: {
        ...plan,
        music: { ...plan.music, enabled: true, mood: 'calm', searchTerms: ['acoustic', 'calm', 'instrumental'] },
      },
      applied: true,
      note: 'Using calm acoustic music.',
    }
  }

  // "remove X"
  m = /^remove\s+(.+)$/i.exec(instruction)
  if (m) {
    const target = m[1].trim().toLowerCase()
    const before = plan.checklistItems.length
    const checklistItems = plan.checklistItems.filter((it) => !it.toLowerCase().includes(target))
    if (checklistItems.length === before) return unchanged()
    return { plan: { ...plan, checklistItems }, applied: true, note: `Removed "${m[1].trim()}".` }
  }

  // "add X" (closing line if it looks like a sign-off, otherwise a checklist item)
  m = /^add\s+(.+)$/i.exec(instruction)
  if (m) {
    const raw = m[1].trim().replace(/[.;]+$/, '')
    if (/^(be|get)\s+ready\b|be prepared|prepare for/i.test(raw)) {
      const closing = cleanClosing(raw)
      return { plan: { ...plan, closing }, applied: true, note: `Added closing "${closing}".` }
    }
    const item = titleCaseFirst(raw)
    return {
      plan: { ...plan, checklistItems: [...plan.checklistItems, item] },
      applied: true,
      note: `Added "${item}".`,
    }
  }

  return unchanged(ASSISTANT_NOT_UNDERSTOOD_NOTE)
}
