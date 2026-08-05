import type { CanvasWidgetType, WidgetSizePreset } from '../display-composer/types'
import type { WidgetCategory } from './studioWidgets'

export type WidgetConnectionStatus = 'connected' | 'live' | 'placeholder' | 'teacherOnly'

export interface WidgetTypeConfig {
  type: CanvasWidgetType | string
  label: string
  category: WidgetCategory
  description: string
  status: WidgetConnectionStatus
  icon: string
  defaultSize: WidgetSizePreset
  defaultSettings: Record<string, unknown>
  studentSafe: boolean
}

export const WIDGET_REGISTRY: WidgetTypeConfig[] = [
  // ── Time ──
  {
    type: 'clock',
    label: 'Clock',
    category: 'time',
    description: 'Show a live classroom clock',
    status: 'connected',
    icon: '🕐',
    defaultSize: 'small',
    defaultSettings: {},
    studentSafe: true,
  },
  {
    type: 'countdown-timer',
    label: 'Countdown Timer',
    category: 'time',
    description: 'Simple countdown timer for pacing',
    status: 'connected',
    icon: '⏱',
    defaultSize: 'medium',
    defaultSettings: { timerKind: 'general' },
    studentSafe: true,
  },
  {
    type: 'routine-timer',
    label: 'Routine Timer',
    category: 'time',
    description: 'Auto-advancing multi-step timer',
    status: 'connected',
    icon: '🔄',
    defaultSize: 'large',
    defaultSettings: { routineId: 'lunch-routine' },
    studentSafe: true,
  },
  // ── Classroom ──
  {
    type: 'directions-text',
    label: 'Directions / Text',
    category: 'classroom',
    description: 'Show text directions on screen',
    status: 'connected',
    icon: '📝',
    defaultSize: 'wide',
    defaultSettings: { text: '' },
    studentSafe: true,
  },
  {
    type: 'materials',
    label: 'Materials',
    category: 'classroom',
    description: 'List required materials',
    status: 'connected',
    icon: '📋',
    defaultSize: 'medium',
    defaultSettings: {},
    studentSafe: true,
  },
  {
    type: 'checklist',
    label: 'Checklist',
    category: 'classroom',
    description: 'Student-facing task checklist',
    status: 'connected',
    icon: '✅',
    defaultSize: 'medium',
    defaultSettings: {},
    studentSafe: true,
  },
  {
    type: 'work-symbols',
    label: 'Work Symbols',
    category: 'classroom',
    description: 'Visual work-mode indicators',
    status: 'connected',
    icon: '🔤',
    defaultSize: 'small',
    defaultSettings: { symbol: 'silent' },
    studentSafe: true,
  },
  {
    type: 'noise-meter',
    label: 'Noise Level',
    category: 'classroom',
    description: 'Classroom voice level display',
    status: 'connected',
    icon: '🔊',
    defaultSize: 'small',
    defaultSettings: { mode: 'manual', level: 'whisper' },
    studentSafe: true,
  },
  // ── Engagement ──
  {
    type: 'random-picker',
    label: 'Random Picker',
    category: 'engagement',
    description: 'Random student picker display',
    status: 'connected',
    icon: '🎯',
    defaultSize: 'medium',
    defaultSettings: {},
    studentSafe: true,
  },
  {
    type: 'mystery-student',
    label: 'Mystery Student',
    category: 'engagement',
    description: 'Mystery Star status display',
    status: 'connected',
    icon: '🌟',
    defaultSize: 'medium',
    defaultSettings: {},
    studentSafe: true,
  },
  {
    type: '100-board',
    label: '100 Board',
    category: 'engagement',
    description: 'Random number or number board',
    status: 'connected',
    icon: '🔢',
    defaultSize: 'medium',
    defaultSettings: {},
    studentSafe: true,
  },
  // ── Rewards ──
  {
    type: 'prize-board',
    label: 'Prize Board',
    category: 'rewards',
    description: 'Prize Board game status',
    status: 'connected',
    icon: '🎁',
    defaultSize: 'large',
    defaultSettings: {},
    studentSafe: true,
  },
  {
    type: 'press-your-luck',
    label: 'Press Your Luck',
    category: 'rewards',
    description: 'Spin-to-win game status',
    status: 'connected',
    icon: '🎰',
    defaultSize: 'large',
    defaultSettings: {},
    studentSafe: true,
  },
  // ── Atmosphere ──
  {
    type: 'atmosphere',
    label: 'Atmosphere / Music',
    category: 'classroom',
    description: 'Classroom music status display',
    status: 'connected',
    icon: '🎵',
    defaultSize: 'small',
    defaultSettings: {},
    studentSafe: true,
  },
  // ── Instruction (placeholders) ──
  {
    type: 'image',
    label: 'Image',
    category: 'instruction',
    description: 'Show an image on the display',
    status: 'placeholder',
    icon: '🖼',
    defaultSize: 'large',
    defaultSettings: {},
    studentSafe: true,
  },
  {
    type: 'pdf-embed',
    label: 'PDF / Embed',
    category: 'instruction',
    description: 'Embed a document or webpage',
    status: 'placeholder',
    icon: '📄',
    defaultSize: 'large',
    defaultSettings: {},
    studentSafe: true,
  },
]

const REGISTRY_BY_TYPE = new Map(WIDGET_REGISTRY.map((w) => [w.type, w]))

export function getWidgetConfig(type: string): WidgetTypeConfig | undefined {
  return REGISTRY_BY_TYPE.get(type)
}
