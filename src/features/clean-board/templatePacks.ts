import type {
  BackgroundPresetId,
  BoardObject,
  BoardPage,
  BoardScene,
  BoardThemeId,
  DisplayModeId,
  MessageCardConfig,
  MessageCardKind,
  SavedLayout,
  SceneType,
  TimerPresetId,
} from './types'
import { BOARD_SCHEMA_VERSION } from './storage/boardSerialization'
import { getBackgroundPreset } from './backgrounds'
import { getTheme } from './themes'
import { getMessageCardPreset } from './messageCards'
import { timerConfigFromPreset, getTimerPreset } from './timerPresets'
import { getDisplayModeConfig } from './displayModes'

/**
 * DB-5A — classroom template packs.
 *
 * A template pack is pure data describing a ready-to-use classroom routine. It
 * is a *starting point*, not hidden live state: applying a template produces a
 * normal `BoardPage` (background + theme + typed objects) that flows through the
 * exact same autosave / saved-layout / scene / present-projection paths as
 * anything the teacher authors by hand. There is no parallel runtime.
 *
 * Templates never carry Spotify tokens/auth, device ids, remote URLs, file
 * paths, uploaded image data, private notes, roster data, or scripts — only
 * classroom-safe, generic text and references to existing preset catalogs.
 */

export type ClassroomTemplateId =
  | 'morningArrival'
  | 'mathWorkshop'
  | 'readingBlock'
  | 'writingBlock'
  | 'independentWork'
  | 'assessmentMode'
  | 'cleanup'
  | 'dismissal'

export type ClassroomTemplateCategory = 'daily' | 'instruction' | 'transition' | 'assessment'

/** Visual mood of a template, used to style preview accents (no new assets). */
export type TemplateVisualTone =
  | 'calm'
  | 'focus'
  | 'reading'
  | 'writing'
  | 'assessment'
  | 'transition'

export interface ClassroomTemplatePack {
  id: ClassroomTemplateId
  name: string
  /** Large board title rendered as a heading object. */
  heading: string
  category: ClassroomTemplateCategory
  description: string
  /** Short, scannable preview label shown on the card (e.g. "Welcome + Do Now"). */
  shortLabel: string
  /** Teacher-facing guidance for when to reach for this template. */
  teacherUseCase: string
  /** Compact bullet list of what the board includes (plain, classroom-safe). */
  previewBullets: string[]
  visualTone: TemplateVisualTone
  displayModeId: DisplayModeId
  backgroundPresetId: BackgroundPresetId
  themeId: BoardThemeId
  messageCardKind: MessageCardKind
  messageTitle: string
  messageBody: string
  timerPresetId: TimerPresetId
  /** Include a Spotify now-playing placeholder (projected per the display mode). */
  includeSpotify: boolean
  keepAwakeRecommended: boolean
}

export const TEMPLATE_CATEGORIES: readonly ClassroomTemplateCategory[] = [
  'daily',
  'instruction',
  'assessment',
  'transition',
]

export const TEMPLATE_CATEGORY_LABELS: Record<ClassroomTemplateCategory, string> = {
  daily: 'Daily Routines',
  instruction: 'Instruction Blocks',
  transition: 'Transitions',
  assessment: 'Assessment',
}

export const TEMPLATE_PACK_IDS: readonly ClassroomTemplateId[] = [
  'morningArrival',
  'mathWorkshop',
  'readingBlock',
  'writingBlock',
  'independentWork',
  'assessmentMode',
  'cleanup',
  'dismissal',
]

export const TEMPLATE_PACKS: Record<ClassroomTemplateId, ClassroomTemplatePack> = {
  morningArrival: {
    id: 'morningArrival',
    name: 'Morning Arrival',
    heading: 'Good Morning',
    category: 'daily',
    description: 'Calm welcome, morning timer, and optional music to start the day.',
    shortLabel: 'Welcome + Do Now',
    teacherUseCase: 'Start the day with a calm welcome and a predictable routine.',
    previewBullets: ['Welcome message card', 'Morning Work timer (10 min)', 'Morning music (optional)'],
    visualTone: 'calm',
    displayModeId: 'morningArrival',
    backgroundPresetId: 'morning-glow',
    themeId: 'minimal-light',
    messageCardKind: 'doNow',
    messageTitle: 'Welcome',
    messageBody: '1. Unpack your bag.\n2. Turn in homework.\n3. Begin the Do Now quietly.',
    timerPresetId: 'morningWork',
    includeSpotify: true,
    keepAwakeRecommended: true,
  },
  mathWorkshop: {
    id: 'mathWorkshop',
    name: 'Math Workshop',
    heading: 'Math Workshop',
    category: 'instruction',
    description: 'Focused board with an objective and a math sprint timer.',
    shortLabel: 'Objective + sprint',
    teacherUseCase: 'Set a focused objective and pace a short math sprint.',
    previewBullets: ['Objective card', 'Math Sprint timer (5 min)', 'Minimal distractions'],
    visualTone: 'focus',
    displayModeId: 'focus',
    backgroundPresetId: 'slate-focus',
    themeId: 'minimal-dark',
    messageCardKind: 'objective',
    messageTitle: 'Objective',
    messageBody: 'I can solve problems and explain my strategy clearly.',
    timerPresetId: 'mathSprint',
    includeSpotify: false,
    keepAwakeRecommended: false,
  },
  readingBlock: {
    id: 'readingBlock',
    name: 'Reading Block',
    heading: 'Reading Block',
    category: 'instruction',
    description: 'Soft, calm board for sustained independent reading.',
    shortLabel: 'Reading goal + stamina',
    teacherUseCase: 'Sustain independent reading with a clear goal.',
    previewBullets: ['Reading goal card', 'Reading Stamina timer (15 min)', 'Calm reading background'],
    visualTone: 'reading',
    displayModeId: 'reading',
    backgroundPresetId: 'reading-cream',
    themeId: 'minimal-light',
    messageCardKind: 'objective',
    messageTitle: 'Reading Goal',
    messageBody: 'Read for understanding and build your reading stamina.',
    timerPresetId: 'readingStamina',
    includeSpotify: false,
    keepAwakeRecommended: false,
  },
  writingBlock: {
    id: 'writingBlock',
    name: 'Writing Block',
    heading: 'Writing Block',
    category: 'instruction',
    description: 'Focused board with writing directions and a quiet writing timer.',
    shortLabel: 'Directions + quiet writing',
    teacherUseCase: 'Guide quiet writing with clear directions.',
    previewBullets: ['Writing directions', 'Quiet Writing timer (12 min)', 'Calm music (optional)'],
    visualTone: 'writing',
    displayModeId: 'focus',
    backgroundPresetId: 'slate-focus',
    themeId: 'minimal-dark',
    messageCardKind: 'directions',
    messageTitle: 'Writing Directions',
    messageBody: '1. Choose your topic.\n2. Draft your ideas.\n3. Write quietly.',
    timerPresetId: 'quietWriting',
    includeSpotify: true,
    keepAwakeRecommended: false,
  },
  independentWork: {
    id: 'independentWork',
    name: 'Independent Work',
    heading: 'Independent Work',
    category: 'instruction',
    description: 'Minimal board with a reminder and an independent work timer.',
    shortLabel: 'Reminder + independent work',
    teacherUseCase: 'Keep students on task during independent work.',
    previewBullets: ['Reminder card', 'Independent Work timer (20 min)', 'Music (optional)'],
    visualTone: 'focus',
    displayModeId: 'focus',
    backgroundPresetId: 'slate-focus',
    themeId: 'minimal-dark',
    messageCardKind: 'reminder',
    messageTitle: 'Reminder',
    messageBody: 'Work quietly on your own. Raise your hand if you need help.',
    timerPresetId: 'independentWork',
    includeSpotify: true,
    keepAwakeRecommended: false,
  },
  assessmentMode: {
    id: 'assessmentMode',
    name: 'Assessment Mode',
    heading: 'Assessment',
    category: 'assessment',
    description: 'Quiet, distraction-free board for assessments.',
    shortLabel: 'Quiet expectations',
    teacherUseCase: 'Run a distraction-free assessment.',
    previewBullets: ['Expectations card', 'Exit Ticket timer (5 min)', 'No music or images'],
    visualTone: 'assessment',
    displayModeId: 'assessment',
    backgroundPresetId: 'clean-white',
    themeId: 'minimal-light',
    messageCardKind: 'directions',
    messageTitle: 'Assessment Expectations',
    messageBody: 'Work silently. Eyes on your own work. Raise your hand for help.',
    timerPresetId: 'exitTicket',
    includeSpotify: false,
    keepAwakeRecommended: false,
  },
  cleanup: {
    id: 'cleanup',
    name: 'Cleanup',
    heading: 'Cleanup Time',
    category: 'transition',
    description: 'Cleanup steps and a short timer to wrap up work time.',
    shortLabel: 'Cleanup steps',
    teacherUseCase: 'Wrap up work time with cleanup steps and a short timer.',
    previewBullets: ['Cleanup steps card', 'Cleanup timer (3 min)', 'Upbeat music (optional)'],
    visualTone: 'transition',
    displayModeId: 'cleanup',
    backgroundPresetId: 'warm-neutral',
    themeId: 'minimal-light',
    messageCardKind: 'transition',
    messageTitle: 'Cleanup Steps',
    messageBody: '1. Put materials away.\n2. Tidy your area.\n3. Wait quietly at your seat.',
    timerPresetId: 'cleanup',
    includeSpotify: true,
    keepAwakeRecommended: false,
  },
  dismissal: {
    id: 'dismissal',
    name: 'Dismissal',
    heading: 'Dismissal',
    category: 'transition',
    description: 'Dismissal directions and a short transition timer.',
    shortLabel: 'Dismissal directions',
    teacherUseCase: 'End the day with clear dismissal directions.',
    previewBullets: ['Dismissal directions', 'Transition timer (2 min)', 'Music (optional)'],
    visualTone: 'transition',
    displayModeId: 'transition',
    backgroundPresetId: 'transition-dark',
    themeId: 'minimal-dark',
    messageCardKind: 'transition',
    messageTitle: 'Dismissal',
    messageBody: 'Pack up your things. Push in your chair. Have a great day.',
    timerPresetId: 'transition',
    includeSpotify: true,
    keepAwakeRecommended: false,
  },
}

export const DEFAULT_TEMPLATE_ID: ClassroomTemplateId = 'morningArrival'

export function isTemplateId(v: unknown): v is ClassroomTemplateId {
  return typeof v === 'string' && (TEMPLATE_PACK_IDS as readonly string[]).includes(v)
}

/** Unknown template ids recover to the morning-arrival default (safe + useful). */
export function sanitizeTemplateId(v: unknown): ClassroomTemplateId {
  return isTemplateId(v) ? v : DEFAULT_TEMPLATE_ID
}

export function getTemplatePack(id: ClassroomTemplateId): ClassroomTemplatePack {
  return TEMPLATE_PACKS[id] ?? TEMPLATE_PACKS[DEFAULT_TEMPLATE_ID]
}

/**
 * Pure, deterministic preview data derived from existing background / theme /
 * timer / display-mode catalogs. Used to render the CSS-only thumbnail and the
 * preview card without any new assets, remote URLs, or uploaded data.
 */
export interface TemplatePreviewSummary {
  id: ClassroomTemplateId
  name: string
  shortLabel: string
  category: ClassroomTemplateCategory
  categoryLabel: string
  visualTone: TemplateVisualTone
  description: string
  teacherUseCase: string
  previewBullets: string[]
  displayModeName: string
  backgroundName: string
  /** A single self-contained CSS `background` value (no URLs). */
  backgroundCss: string
  backgroundTextTone: 'dark' | 'light'
  timerLabel: string
  timerDurationMinutes: number
  messageTitle: string
  includeSpotify: boolean
  keepAwakeRecommended: boolean
}

export function getTemplatePreviewSummary(template: ClassroomTemplatePack): TemplatePreviewSummary {
  const background = getBackgroundPreset(template.backgroundPresetId)
  const timer = getTimerPreset(template.timerPresetId)
  const displayMode = getDisplayModeConfig(template.displayModeId)
  return {
    id: template.id,
    name: template.name,
    shortLabel: template.shortLabel,
    category: template.category,
    categoryLabel: TEMPLATE_CATEGORY_LABELS[template.category],
    visualTone: template.visualTone,
    description: template.description,
    teacherUseCase: template.teacherUseCase,
    previewBullets: template.previewBullets,
    displayModeName: displayMode.name,
    backgroundName: background.name,
    backgroundCss: background.css,
    backgroundTextTone: background.textTone,
    timerLabel: timer.label,
    timerDurationMinutes: timer.durationMinutes,
    messageTitle: template.messageTitle,
    includeSpotify: template.includeSpotify,
    keepAwakeRecommended: template.keepAwakeRecommended,
  }
}

export interface TemplateCategoryGroup {
  category: ClassroomTemplateCategory
  label: string
  templates: ClassroomTemplatePack[]
}

/** Templates grouped by category, in display order (daily → instruction → assessment → transition). */
export function getTemplatesByCategory(): TemplateCategoryGroup[] {
  return TEMPLATE_CATEGORIES.map((category) => ({
    category,
    label: TEMPLATE_CATEGORY_LABELS[category],
    templates: TEMPLATE_PACK_IDS.filter((id) => TEMPLATE_PACKS[id].category === category).map(
      (id) => TEMPLATE_PACKS[id],
    ),
  }))
}

/** Heading text color, chosen for readability on the template's background. */
function headingColor(backgroundPresetId: BackgroundPresetId): string {
  return getBackgroundPreset(backgroundPresetId).textTone === 'dark' ? '#1e293b' : '#f8fafc'
}

function messageCardConfig(template: ClassroomTemplatePack): MessageCardConfig {
  const preset = getMessageCardPreset(template.messageCardKind)
  return {
    kind: 'messageCard',
    title: template.messageTitle,
    message: template.messageBody,
    cardKind: template.messageCardKind,
    tone: preset.tone,
    textSize: 'large',
    checklistStyle: preset.checklistStyle,
  }
}

/**
 * Build the object list for a template. Produces a heading, a message card, a
 * timer, and (when requested) a Spotify placeholder — all normal typed objects
 * on the fixed 1920×1080 canvas with non-overlapping default placement.
 */
export function createTemplateObjects(template: ClassroomTemplatePack): BoardObject[] {
  const objects: BoardObject[] = [
    {
      id: `${template.id}-heading`,
      kind: 'text',
      x: 360,
      y: 90,
      w: 1200,
      h: 180,
      rotation: 0,
      locked: false,
      visible: true,
      layer: 1,
      config: {
        kind: 'text',
        text: template.heading,
        fontSize: 120,
        color: headingColor(template.backgroundPresetId),
        align: 'center',
      },
    },
    {
      id: `${template.id}-message`,
      kind: 'messageCard',
      x: 560,
      y: 360,
      w: 800,
      h: 340,
      rotation: 0,
      locked: false,
      visible: true,
      layer: 2,
      config: messageCardConfig(template),
    },
    {
      id: `${template.id}-timer`,
      kind: 'timer',
      x: 1600,
      y: 90,
      w: 280,
      h: 150,
      rotation: 0,
      locked: false,
      visible: true,
      layer: 2,
      config: timerConfigFromPreset(template.timerPresetId),
    },
  ]
  if (template.includeSpotify) {
    objects.push({
      id: `${template.id}-spotify`,
      kind: 'spotifyNowPlayingPlaceholder',
      x: 80,
      y: 880,
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

/**
 * Produce a normal `BoardPage` from a template. When `existingPage` is given its
 * id is preserved so applying a template keeps the active page identity. Never
 * sets `teacherNotes`.
 */
export function templateToBoardPage(
  template: ClassroomTemplatePack,
  existingPage?: BoardPage,
): BoardPage {
  return {
    id: existingPage?.id ?? `page-${template.id}`,
    title: template.name,
    background: { type: 'preset', presetId: template.backgroundPresetId },
    theme: getTheme(template.themeId),
    objects: createTemplateObjects(template),
  }
}

/** Produce a persisted `SavedLayout` from a template (deterministic id). */
export function templateToSavedLayout(template: ClassroomTemplatePack): SavedLayout {
  const now = Date.now()
  const page = templateToBoardPage(template)
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: `layout-${template.id}`,
    name: template.name,
    kind: 'layout',
    background: page.background,
    theme: page.theme,
    objects: page.objects,
    displayModeId: template.displayModeId,
    createdAt: now,
    updatedAt: now,
  }
}

/** Produce a `BoardScene` referencing the template's saved layout. */
export function templateToScene(template: ClassroomTemplatePack): BoardScene {
  const now = Date.now()
  const sceneType: SceneType =
    getDisplayModeConfig(template.displayModeId).recommendedSceneType ?? 'custom'
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: `scene-${template.id}`,
    name: template.name,
    kind: 'scene',
    type: sceneType,
    layoutId: templateToSavedLayout(template).id,
    displayModeId: template.displayModeId,
    timerPresetRef: template.timerPresetId,
    backgroundPresetId: template.backgroundPresetId,
    keepAwake: template.keepAwakeRecommended,
    studentSafe: true,
    createdAt: now,
    updatedAt: now,
  }
}
