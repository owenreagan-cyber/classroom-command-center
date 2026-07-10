import type {
  ReadyPositionContent,
  ScreenContents,
  ScreenMeta,
} from './types'
import { DEFAULT_BACKGROUND_ID } from './backgroundAssets'

export const SCREEN_META: ScreenMeta[] = [
  { id: 'homeroom', label: 'Homeroom' },
  { id: 'math', label: 'Math' },
  { id: 'reading', label: 'Reading' },
  { id: 'snack-lunch', label: 'Snack / Lunch' },
  { id: 'ready-position', label: 'Ready Position' },
]

export const DEFAULT_READY_POSITION: ReadyPositionContent = {
  title: 'Ready Position',
  steps: [
    'Seated',
    'Silent',
    'Sitting up',
    'Hands on desk',
    'Alert',
    'Eyes on me',
    'Ready to learn',
  ],
  compactLine: 'Seated, silent, ready to learn.',
  useCompact: false,
}

export const DEFAULT_CONTENTS: ScreenContents = {
  homeroom: {
    remindersTitle: 'Homeroom Reminders',
    reminders: [
      'Hang up backpack',
      'Put away jacket',
      'Turn in homework',
    ],
    doNowTitle: 'Do Now',
    doNow: 'Write today’s date and one goal for the morning.',
    materialsTitle: 'Arrival Materials',
    materials: {
      haveOut: ['Morning folder', 'Pencil', 'Homework'],
      putAway: ['Backpack', 'Everything else'],
    },
    readyPosition: {
      ...DEFAULT_READY_POSITION,
      useCompact: true,
      compactLine: 'Seated, silent, ready to learn.',
    },
  },
  math: {
    lessonTitle: 'Math Lesson',
    materialsTitle: 'Materials',
    materials: {
      haveOut: ['Power Up Packet', 'Pen', 'Pencil', 'Homework'],
      putAway: ['Everything else'],
    },
    timerNote: 'Use the timer presets or custom minutes in edit mode.',
  },
  reading: {
    lessonTitle: 'Reading Class',
    materialsTitle: 'Materials',
    materials: {
      haveOut: ['Homework', 'Pen', 'Pencil', 'Reading book'],
      putAway: ['Everything else'],
    },
    readyPosition: { ...DEFAULT_READY_POSITION },
    timerNote: 'Use the timer presets or custom minutes in edit mode.',
  },
  'snack-lunch': {
    title: 'Snack / Lunch',
    cleanupTitle: 'Cleanup Reminders',
    cleanupReminders: [
      'Clear your table space',
      'Throw away trash',
      'Wipe crumbs if needed',
      'Push in chairs',
    ],
    routineTitle: 'Routine',
    routine: [
      'Wash hands',
      'Get snack / lunch and sit at your table',
      'Quiet voices while eating',
      'Clean up and line up when called',
    ],
    phaseNote:
      'Phase durations are editable presets — not snack/lunch bell times.',
  },
  'ready-position': { ...DEFAULT_READY_POSITION },
}

export const DEFAULT_SCREEN_ID = SCREEN_META[0].id
export const DEFAULT_MODE = 'edit' as const
export { DEFAULT_BACKGROUND_ID }
