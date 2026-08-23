import type {
  BackgroundPresetId,
  BoardObject,
  BoardPage,
  DisplayModeId,
  SceneType,
} from './types'

/**
 * DB-4F — classroom display modes.
 *
 * A display mode is a presentation-preference layer applied on top of the
 * teacher's existing scene/layout. It never owns widgets, timers, Spotify
 * state, images, or messages — it only filters/emphasizes what is already on
 * the board and suggests a background + keep-awake default. Selecting a mode
 * projects the current page through `projectPageForDisplayMode`; it never
 * mutates or duplicates board objects.
 */

export interface DisplayModeConfig {
  id: DisplayModeId
  name: string
  description: string
  /** Recommended background preset applied at projection time (optional). */
  backgroundPresetId?: BackgroundPresetId
  showSpotify: boolean
  showTimer: boolean
  showMessageCards: boolean
  showImages: boolean
  /** Suggested default for the keep-awake toggle when saving a scene. */
  keepAwakeDefault: boolean
  recommendedSceneType?: SceneType
}

export const DISPLAY_MODE_IDS: readonly DisplayModeId[] = [
  'morningArrival',
  'focus',
  'reading',
  'transition',
  'cleanup',
  'assessment',
  'custom',
]

export const DISPLAY_MODES: Record<DisplayModeId, DisplayModeConfig> = {
  morningArrival: {
    id: 'morningArrival',
    name: 'Morning Arrival',
    description: 'Calm welcome with timer and morning music.',
    backgroundPresetId: 'morning-glow',
    showSpotify: true,
    showTimer: true,
    showMessageCards: true,
    showImages: true,
    keepAwakeDefault: true,
    recommendedSceneType: 'arrival',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    description: 'Minimal board with a focused timer.',
    backgroundPresetId: 'slate-focus',
    showSpotify: false,
    showTimer: true,
    showMessageCards: true,
    showImages: false,
    keepAwakeDefault: false,
    recommendedSceneType: 'math',
  },
  reading: {
    id: 'reading',
    name: 'Reading',
    description: 'Soft, calm board for sustained reading.',
    backgroundPresetId: 'reading-cream',
    showSpotify: false,
    showTimer: true,
    showMessageCards: true,
    showImages: true,
    keepAwakeDefault: false,
    recommendedSceneType: 'reading',
  },
  transition: {
    id: 'transition',
    name: 'Transition',
    description: 'Directions and a short transition timer.',
    backgroundPresetId: 'transition-dark',
    showSpotify: false,
    showTimer: true,
    showMessageCards: true,
    showImages: false,
    keepAwakeDefault: false,
    recommendedSceneType: 'transition',
  },
  cleanup: {
    id: 'cleanup',
    name: 'Cleanup',
    description: 'Cleanup timer with optional upbeat music.',
    backgroundPresetId: 'warm-neutral',
    showSpotify: true,
    showTimer: true,
    showMessageCards: true,
    showImages: false,
    keepAwakeDefault: false,
    recommendedSceneType: 'packUp',
  },
  assessment: {
    id: 'assessment',
    name: 'Assessment',
    description: 'Minimal, quiet board with reduced distractions.',
    backgroundPresetId: 'clean-white',
    showSpotify: false,
    showTimer: true,
    showMessageCards: true,
    showImages: false,
    keepAwakeDefault: false,
    recommendedSceneType: 'custom',
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Teacher-controlled; show everything.',
    showSpotify: true,
    showTimer: true,
    showMessageCards: true,
    showImages: true,
    keepAwakeDefault: false,
  },
}

export const DEFAULT_DISPLAY_MODE_ID: DisplayModeId = 'custom'

export function isDisplayModeId(v: unknown): v is DisplayModeId {
  return typeof v === 'string' && (DISPLAY_MODE_IDS as readonly string[]).includes(v)
}

/** Unknown ids recover to `custom` (teacher-controlled, data-preserving). */
export function sanitizeDisplayModeId(v: unknown): DisplayModeId {
  return isDisplayModeId(v) ? v : DEFAULT_DISPLAY_MODE_ID
}

export function getDisplayModeConfig(id: DisplayModeId): DisplayModeConfig {
  return DISPLAY_MODES[id] ?? DISPLAY_MODES[DEFAULT_DISPLAY_MODE_ID]
}

/**
 * Filter board objects for the selected mode. Pure projection — input objects
 * are never mutated, and non-filterable kinds (text, clock, link, videoEmbed)
 * always pass through.
 */
export function projectObjectsForDisplayMode(
  objects: BoardObject[],
  modeId: DisplayModeId,
): BoardObject[] {
  const cfg = getDisplayModeConfig(modeId)
  return objects.filter((o) => {
    switch (o.kind) {
      case 'spotifyNowPlayingPlaceholder':
        return cfg.showSpotify
      case 'timer':
        return cfg.showTimer
      case 'messageCard':
        return cfg.showMessageCards
      case 'image':
        return cfg.showImages
      default:
        return true
    }
  })
}

/**
 * Project a (safe) page through a display mode: optionally apply the mode's
 * background preset and filter objects by the mode's visibility flags. Never
 * mutates the input; the authored scene/layout is untouched.
 */
export function projectPageForDisplayMode(page: BoardPage, modeId: DisplayModeId): BoardPage {
  const cfg = getDisplayModeConfig(modeId)
  const background: BoardPage['background'] = cfg.backgroundPresetId
    ? { type: 'preset', presetId: cfg.backgroundPresetId }
    : page.background
  return {
    ...page,
    background,
    objects: projectObjectsForDisplayMode(page.objects, modeId),
  }
}
