import type { BackgroundAssetId } from '../../data/types'

/** Phase 14B — Display Composer / Classroom Screen Builder data model. */

export type DisplayScreenMode =
  | 'arrival'
  | 'transition'
  | 'lessonLaunch'
  | 'workTime'
  | 'lunch'
  | 'specials'
  | 'packUp'
  | 'custom'

export type DisplayBackgroundType = 'gradient' | 'image' | 'solid'

export interface DisplayScreenBackground {
  type: DisplayBackgroundType
  /**
   * Gradient/solid: token id into DISPLAY_BACKGROUND_GRADIENTS / DISPLAY_BACKGROUND_SOLIDS.
   * Image: a BackgroundAssetId from the existing shared background asset library.
   */
  token: string | BackgroundAssetId
}

export type DisplayTimerWidgetKind = 'none' | 'general' | 'transition' | 'task' | 'routine'

/**
 * Maps onto the existing (Phase 14A) timerStore collections:
 * - 'general' | 'transition' -> transitionTimers (arbitrary keyed simple countdown)
 * - 'task'                   -> taskTimers (arbitrary keyed group rotation)
 * - 'routine'                -> routineTimers (arbitrary keyed auto-advancing steps)
 * 'general' and 'transition' render through the same widget mechanics; the distinction
 * is presentational intent (a standing timer vs. a between-activity countdown).
 */
export interface DisplayTimerWidgetConfig {
  kind: DisplayTimerWidgetKind
  /** Id into the relevant timerStore collection. Ignored when kind is 'none'. */
  timerId?: string
}

export interface MaterialsCardSection {
  id: string
  label?: string
  /** Optional color/category label token (teacher-facing hint, e.g. 'sky' | 'amber'). */
  colorToken?: string
  items: string[]
}

export interface MaterialsCard {
  heading: string
  sections: MaterialsCardSection[]
}

export interface ChecklistItem {
  id: string
  icon: string
  text: string
  checked: boolean
}

export interface ChecklistCard {
  heading: string
  items: ChecklistItem[]
}

/** Widget types that can be placed on the display canvas. */
export type CanvasWidgetType =
  | 'clock'
  | 'countdown-timer'
  | 'routine-timer'
  | 'directions-text'
  | 'materials'
  | 'checklist'
  | 'work-symbols'
  | 'noise-meter'
  | 'atmosphere'
  | 'random-picker'
  | 'mystery-student'
  | '100-board'
  | 'prize-board'
  | 'press-your-luck'
  | 'lotto-board'

/** Size preset for canvas widgets (applied as percentage of 16:9 canvas). */
export type WidgetSizePreset = 'small' | 'medium' | 'large' | 'wide' | 'full-width'

/** Percentage-based size presets resolved to width/height on a 100×100 grid. */
export const WIDGET_SIZE_PRESETS: Record<WidgetSizePreset, { w: number; h: number }> = {
  small: { w: 20, h: 20 },
  medium: { w: 30, h: 30 },
  large: { w: 45, h: 45 },
  wide: { w: 60, h: 30 },
  'full-width': { w: 90, h: 20 },
}

/** Individual canvas widget — positioned relative to the 16:9 canvas. */
export interface CanvasWidget {
  id: string
  type: CanvasWidgetType
  label: string
  /** Percentage-based position (0–100). Origin: top-left of canvas. */
  x: number
  y: number
  /** Percentage-based size relative to canvas. */
  w: number
  h: number
  visible: boolean
  locked: boolean
  /** Widget-specific configuration payload. */
  settings: Record<string, unknown>
  /** Z-index for layering. Higher = on top. */
  zIndex: number
}

export interface DisplayScreen {
  id: string
  title: string
  mode: DisplayScreenMode
  background: DisplayScreenBackground
  showClock: boolean
  timerWidget: DisplayTimerWidgetConfig
  materialsCard?: MaterialsCard
  checklistCard?: ChecklistCard
  studentMessage?: string
  /** Free-form canvas widgets (Phase 15B). If present, renders above/supplementing dedicated cards. */
  widgets?: CanvasWidget[]
  /** Teacher-only notes. Never sent to /display. */
  teacherNotes?: string
  /** Kill-switch: false means this screen must never render on /display. */
  studentSafe: boolean
  updatedAt: number
  version: number
}

export interface DisplayComposerPersistedState {
  version: number
  screens: Record<string, DisplayScreen>
  order: string[]
  activeScreenId: string | null
}

export const DISPLAY_COMPOSER_STORAGE_KEY = 'classroom-command-center-display-composer'
export const DISPLAY_COMPOSER_STORAGE_VERSION = 1 as const
