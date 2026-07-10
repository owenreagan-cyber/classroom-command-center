import type {
  BoardPreset,
  HomeroomContent,
  MathContent,
  ReadingContent,
  ReadyPositionContent,
  ScreenContents,
  ScreenId,
  SnackLunchContent,
  SubjectContent,
} from './types'

export const BOARD_PRESETS: BoardPreset[] = [
  {
    id: 'morning-arrival',
    label: 'Morning Arrival',
    helperText: 'Homeroom Do Now, reminders, and arrival materials.',
    screenId: 'homeroom',
  },
  {
    id: 'math-warm-up',
    label: 'Math Warm-Up',
    helperText: 'Math starter lesson and simple materials.',
    screenId: 'math',
  },
  {
    id: 'reading-rotation',
    label: 'Reading Rotation',
    helperText: 'Reading focus, materials, and ready expectations.',
    screenId: 'reading',
  },
  {
    id: 'pack-up',
    label: 'Pack-Up',
    helperText: 'Homework / Pack-Up checklist and materials.',
    screenId: 'homework-packup',
  },
  {
    id: 'assessment-mode',
    label: 'Assessment Mode',
    helperText: 'Assessment expectations and approved materials.',
    screenId: 'assessment',
  },
  {
    id: 'snack-lunch-routine',
    label: 'Snack / Lunch Routine',
    helperText: 'Cleanup reminders and snack/lunch steps.',
    screenId: 'snack-lunch',
  },
  {
    id: 'ready-position-reset',
    label: 'Ready Position Reset',
    helperText: 'Full ready checklist and compact cue.',
    screenId: 'ready-position',
  },
]

const homeroomMorningArrival: HomeroomContent = {
  remindersTitle: 'Morning Reminders',
  reminders: [
    'Unpack quietly',
    'Turn in homework',
    'Check the board',
    'Begin the Do Now',
  ],
  doNowTitle: 'Do Now',
  doNow: 'Write today’s date, sharpen your pencil, and answer the morning question.',
  materialsTitle: 'Arrival Materials',
  materials: {
    haveOut: ['Morning folder', 'Pencil', 'Homework'],
    putAway: ['Backpack', 'Jacket', 'Extra materials'],
  },
  readyPosition: {
    title: 'Ready Position',
    steps: ['Seated', 'Silent', 'Hands ready', 'Eyes on the board'],
    compactLine: 'Seated, silent, and ready to begin.',
    useCompact: true,
  },
}

const mathWarmUp: MathContent = {
  lessonTitle: 'Power Up and warm-up problem',
  materialsTitle: 'Math Materials',
  materials: {
    haveOut: ['Power Up Packet', 'Pencil', 'Math notebook'],
    putAway: ['Reading book', 'Extra folders'],
  },
  timerNote: 'Use the timer presets or custom minutes in edit mode.',
}

const readingRotation: ReadingContent = {
  lessonTitle: 'Reading rotation and independent practice',
  materialsTitle: 'Reading Materials',
  materials: {
    haveOut: ['Reading book', 'Reading notebook', 'Pencil'],
    putAway: ['Math materials', 'Loose papers'],
  },
  readyPosition: {
    title: 'Reading Ready',
    steps: [
      'Book open',
      'Voice level ready',
      'Track the speaker',
      'Be ready to respond',
    ],
    compactLine: 'Book open, voice ready, eyes tracking.',
    useCompact: false,
  },
  timerNote: 'Use the timer presets or custom minutes in edit mode.',
}

const packUp: SubjectContent = {
  title: 'Homework / Pack-Up',
  focusTitle: 'Pack-Up Focus',
  focusTask: 'Copy homework, pack your materials, clean your area, and wait quietly.',
  agendaTitle: 'Pack-Up Flow',
  agenda: ['Copy homework', 'Pack backpack', 'Clean area', 'Wait quietly'],
  materialsTitle: 'Pack-Up Materials',
  materials: {
    haveOut: ['Planner', 'Homework folder', 'Pencil'],
    putAway: ['Class materials', 'Trash', 'Unneeded supplies'],
  },
  teacherHint: 'Dismissal notes and family reminders stay teacher-only.',
}

const assessmentMode: SubjectContent = {
  title: 'Assessment',
  focusTitle: 'Assessment Mode',
  focusTask: 'Clear your desk, keep only approved materials out, and wait silently.',
  agendaTitle: 'Assessment Expectations',
  agenda: [
    'Clear desk',
    'Listen for directions',
    'Work independently',
    'Check your work',
  ],
  materialsTitle: 'Assessment Materials',
  materials: {
    haveOut: ['Pencil', 'Approved materials only'],
    putAway: ['Books', 'Notes', 'Devices unless approved'],
  },
  teacherHint: 'Do not project answers, scoring notes, or accommodation details.',
}

const snackLunchRoutine: SnackLunchContent = {
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
    'Get snack / lunch',
    'Use quiet voices',
    'Clean up when called',
    'Line up calmly',
  ],
  phaseNote: 'Phase durations are editable presets — not snack/lunch bell times.',
}

const readyPositionReset: ReadyPositionContent = {
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

export function getPresetsForScreen(screenId: ScreenId): BoardPreset[] {
  return BOARD_PRESETS.filter((preset) => preset.screenId === screenId)
}

export function applyBoardPresetToContents(
  contents: ScreenContents,
  presetId: BoardPreset['id'],
): ScreenContents {
  const next = structuredClone(contents)

  switch (presetId) {
    case 'morning-arrival':
      next.homeroom = structuredClone(homeroomMorningArrival)
      break
    case 'math-warm-up':
      next.math = structuredClone(mathWarmUp)
      break
    case 'reading-rotation':
      next.reading = structuredClone(readingRotation)
      break
    case 'pack-up':
      next['homework-packup'] = structuredClone(packUp)
      break
    case 'assessment-mode':
      next.assessment = structuredClone(assessmentMode)
      break
    case 'snack-lunch-routine':
      next['snack-lunch'] = structuredClone(snackLunchRoutine)
      break
    case 'ready-position-reset':
      next['ready-position'] = structuredClone(readyPositionReset)
      break
  }

  return next
}
