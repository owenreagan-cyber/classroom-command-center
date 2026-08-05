import type { ChecklistItem, DisplayScreen, MaterialsCardSection } from './types'

/**
 * Seed classroom display screens (Phase 14B), matching the teacher's saved
 * Classroomscreen-style routine boards. Deterministic, local-first — no AI.
 *
 * These are seeded once into displayComposerStore on first run and never
 * silently overwritten; "Reset to defaults" restores a single screen back to
 * the definition below by id.
 */

const SEED_TIMESTAMP = 0

function checklistItem(icon: string, text: string, checked = false): ChecklistItem {
  return { id: text.toLowerCase().replace(/[^a-z0-9]+/g, '-'), icon, text, checked }
}

function materialsSection(items: string[], label?: string, colorToken?: string): MaterialsCardSection {
  return { id: (label ?? items[0] ?? 'section').toLowerCase().replace(/[^a-z0-9]+/g, '-'), label, colorToken, items }
}

export const DEFAULT_DISPLAY_SCREENS: DisplayScreen[] = [
  {
    id: 'arrival-720',
    title: '7:20 Arrival',
    mode: 'arrival',
    background: { type: 'image', token: 'homeroom-morning-briefing' },
    showClock: true,
    timerWidget: { kind: 'general', timerId: 'dc-arrival-general' },
    materialsCard: {
      heading: 'Get Ready For The Day',
      sections: [
        materialsSection(
          ['Take out your folder', 'Sharpen two pencils', 'Unpack your backpack'],
          'Every Day Items',
          'sky',
        ),
        materialsSection(
          ['Math notebook', 'Math folder', 'Whiteboard + marker'],
          'Math Items',
          'amber',
        ),
      ],
    },
    checklistCard: {
      heading: 'Arrival Checklist',
      items: [
        checklistItem('🎒', 'Unpack backpack'),
        checklistItem('📋', 'Turn in homework'),
        checklistItem('✏️', 'Sharpen pencils'),
        checklistItem('🪑', 'Sit in your seat'),
      ],
    },
    studentMessage: 'Good morning, 4th grade! Let’s get ready for a great day.',
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'morning-work-to-math',
    title: 'Morning Work → Math',
    mode: 'transition',
    background: { type: 'image', token: 'math-training-lab' },
    showClock: true,
    // Reuses the existing seeded transition timer (label "Homeroom → Math", 3 min).
    timerWidget: { kind: 'transition', timerId: 'homeroom-clean-up-math' },
    materialsCard: {
      heading: 'Math Materials',
      sections: [materialsSection(['Math notebook', 'Pencil', 'Whiteboard + marker'])],
    },
    checklistCard: {
      heading: 'Get Ready',
      items: [
        checklistItem('🧹', 'Clean up morning work'),
        checklistItem('📕', 'Get out math notebook'),
        checklistItem('🪑', 'Sit ready to learn'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'math-to-snack-shurley',
    title: 'Math → Snack and Shurley',
    mode: 'transition',
    background: { type: 'image', token: 'snack-flow-control' },
    showClock: true,
    // Reuses the existing seeded transition timer (label "Math → Snack and Shurley", 4 min).
    timerWidget: { kind: 'transition', timerId: 'math-wrap-up' },
    materialsCard: {
      heading: 'Snack + Shurley Items',
      sections: [
        materialsSection(['Snack from backpack', 'Water bottle'], 'Snack', 'emerald'),
        materialsSection(['Shurley book', 'Pencil'], 'Shurley', 'violet'),
      ],
    },
    checklistCard: {
      heading: 'Get Ready',
      items: [
        checklistItem('🧹', 'Clean up math materials'),
        checklistItem('🍎', 'Get out your snack'),
        checklistItem('📗', 'Get out Shurley book'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'shurley-to-movement-spelling-reading',
    title: 'Shurley → Movement and Spelling/Reading',
    mode: 'transition',
    background: { type: 'image', token: 'ready-position-expectations' },
    showClock: true,
    timerWidget: { kind: 'transition', timerId: 'dc-shurley-to-movement' },
    materialsCard: {
      heading: 'Reading + Spelling Items',
      sections: [
        materialsSection(['Reading book', 'Reading journal'], 'Reading', 'sky'),
        materialsSection(['Spelling list', 'Pencil'], 'Spelling', 'amber'),
      ],
    },
    checklistCard: {
      heading: 'Movement Cue',
      items: [
        checklistItem('🧘', 'Stand and stretch'),
        checklistItem('🚶', 'Quiet movement break'),
        checklistItem('📚', 'Get reading + spelling materials'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'movement-to-spelling-reading',
    title: 'Movement → Spelling/Reading',
    mode: 'transition',
    background: { type: 'solid', token: 'focus-navy' },
    showClock: true,
    timerWidget: { kind: 'transition', timerId: 'dc-movement-to-spelling-reading' },
    checklistCard: {
      heading: 'Get Ready Checklist',
      items: [
        checklistItem('🪑', 'Return to your seat'),
        checklistItem('📖', 'Open reading book'),
        checklistItem('🤫', 'Voices off'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'spelling-reading-to-lunch',
    title: 'Spelling/Reading → Lunch',
    mode: 'lunch',
    background: { type: 'image', token: 'lunch-flow-control' },
    showClock: true,
    // Reuses the existing seeded lunch routine timer (5 auto-advancing steps).
    timerWidget: { kind: 'routine', timerId: 'lunch-routine' },
    checklistCard: {
      heading: 'Lunch Checklist',
      items: [
        checklistItem('🧹', 'Clear your desk'),
        checklistItem('🧼', 'Wash hands'),
        checklistItem('🍱', 'Get your lunch'),
        checklistItem('🚶', 'Line up quietly'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'specials',
    title: 'Specials',
    mode: 'specials',
    background: { type: 'gradient', token: 'sunny-specials' },
    showClock: true,
    timerWidget: { kind: 'general', timerId: 'dc-specials-general' },
    checklistCard: {
      heading: 'Specials Checklist',
      items: [
        checklistItem('👟', 'Wear sneakers if needed'),
        checklistItem('🎒', 'Bring what your specials teacher asked for'),
        checklistItem('🚶', 'Walk quietly in line'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'lesson-launch',
    title: 'Lesson Launch',
    mode: 'lessonLaunch',
    background: { type: 'gradient', token: 'calm-focus' },
    showClock: true,
    timerWidget: { kind: 'general', timerId: 'dc-lesson-launch-general' },
    studentMessage: 'Today we are learning about...',
    checklistCard: {
      heading: 'Lesson Checklist',
      items: [
        checklistItem('📝', 'Get your materials ready'),
        checklistItem('👂', 'Listen for directions'),
        checklistItem('💪', 'Try your best'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'work-time',
    title: 'Work Time',
    mode: 'workTime',
    background: { type: 'solid', token: 'focus-navy' },
    showClock: true,
    timerWidget: { kind: 'general', timerId: 'dc-work-time-general' },
    studentMessage: 'Work quietly at your seat. Raise your hand if you need help.',
    checklistCard: {
      heading: 'Work Time Checklist',
      items: [
        checklistItem('🤫', 'Voices off or whisper'),
        checklistItem('✏️', 'Stay on task'),
        checklistItem('🙋', 'Raise hand for help'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'partner-talk',
    title: 'Partner Talk',
    mode: 'workTime',
    background: { type: 'gradient', token: 'sunny-specials' },
    showClock: true,
    timerWidget: { kind: 'general', timerId: 'dc-partner-talk-general' },
    studentMessage: 'Turn and talk with your partner. Remember to take turns!',
    materialsCard: {
      heading: 'Partner Talk',
      sections: [materialsSection(['Share your thinking', 'Listen to your partner', 'Be ready to share with the class'], 'Expectations', 'sky')],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'cleanup',
    title: 'Cleanup',
    mode: 'transition',
    background: { type: 'solid', token: 'warm-sunset' },
    showClock: true,
    timerWidget: { kind: 'transition', timerId: 'dc-cleanup-transition' },
    studentMessage: 'Time to clean up! Please put everything back where it belongs.',
    checklistCard: {
      heading: 'Cleanup Checklist',
      items: [
        checklistItem('🧹', 'Put away materials'),
        checklistItem('📚', 'Stack books neatly'),
        checklistItem('🪑', 'Push in your chair'),
        checklistItem('🗑', 'Throw away trash'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'pack-up',
    title: 'Pack Up',
    mode: 'packUp',
    background: { type: 'gradient', token: 'warm-sunset' },
    showClock: true,
    timerWidget: { kind: 'general', timerId: 'dc-pack-up-general' },
    studentMessage: 'Pack up your belongings and get ready to go home.',
    checklistCard: {
      heading: 'Pack Up Checklist',
      items: [
        checklistItem('🎒', 'Pack your backpack'),
        checklistItem('📋', 'Check your folder for notes'),
        checklistItem('🧥', 'Get your jacket'),
        checklistItem('🪑', 'Stack your chair'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'end-of-day',
    title: 'End of Day',
    mode: 'packUp',
    background: { type: 'image', token: 'homeroom-morning-briefing' },
    showClock: true,
    timerWidget: { kind: 'none' },
    studentMessage: 'Great job today, everyone! See you tomorrow!',
    checklistCard: {
      heading: 'Before You Go',
      items: [
        checklistItem('🌟', 'Share one thing you learned'),
        checklistItem('📅', 'Check tomorrow\'s schedule'),
        checklistItem('👋', 'Say goodbye to a friend'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'game-review',
    title: 'Game / Review',
    mode: 'lessonLaunch',
    background: { type: 'gradient', token: 'sunny-specials' },
    showClock: true,
    timerWidget: { kind: 'general', timerId: 'dc-game-review-general' },
    studentMessage: 'Let\'s review what we learned! Be ready to participate.',
    checklistCard: {
      heading: 'Review Rules',
      items: [
        checklistItem('🙋', 'Raise your hand'),
        checklistItem('👂', 'Listen to others'),
        checklistItem('🎉', 'Celebrate everyone\'s answers'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'prize-board-screen',
    title: 'Prize Board',
    mode: 'custom',
    background: { type: 'gradient', token: 'sunny-specials' },
    showClock: false,
    timerWidget: { kind: 'none' },
    studentMessage: 'Great work! Let\'s see what prizes are available!',
    materialsCard: {
      heading: 'How to Play',
      sections: [materialsSection(['Spin the wheel', 'Answer correctly to earn a spin', 'Collect prizes for great work'], 'Instructions', 'amber')],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  // ── Phase 15C: Templates with connected tool widgets ──
  {
    id: 'math-launch-15c',
    title: 'Math Launch',
    mode: 'lessonLaunch',
    background: { type: 'gradient', token: 'calm-focus' },
    showClock: true,
    timerWidget: { kind: 'none' },
    studentMessage: 'Get ready for math! Have your notebook and pencil out.',
    checklistCard: {
      heading: 'Lesson Ready',
      items: [
        checklistItem('📕', 'Math notebook open'),
        checklistItem('✏️', 'Pencil ready'),
        checklistItem('🤫', 'Voices off'),
      ],
    },
    widgets: [
      { id: 'ml-timer', type: 'countdown-timer', label: 'Math Timer', x: 2, y: 5, w: 30, h: 30, visible: true, locked: false, settings: { timerKind: 'general' }, zIndex: 1 },
      { id: 'ml-materials', type: 'materials', label: 'Materials', x: 68, y: 5, w: 30, h: 30, visible: true, locked: false, settings: {}, zIndex: 2 },
    ],
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'work-time-15c',
    title: 'Work Time',
    mode: 'workTime',
    background: { type: 'solid', token: 'focus-navy' },
    showClock: true,
    timerWidget: { kind: 'none' },
    studentMessage: 'Work quietly at your seat. Raise your hand if you need help.',
    widgets: [
      { id: 'wt-timer', type: 'countdown-timer', label: 'Work Timer', x: 2, y: 5, w: 30, h: 30, visible: true, locked: false, settings: { timerKind: 'general' }, zIndex: 1 },
      { id: 'wt-symbols', type: 'work-symbols', label: 'Work Mode', x: 2, y: 60, w: 20, h: 20, visible: true, locked: false, settings: { symbol: 'independent' }, zIndex: 2 },
      { id: 'wt-noise', type: 'noise-meter', label: 'Voice Level', x: 68, y: 5, w: 20, h: 20, visible: true, locked: false, settings: { mode: 'manual', level: 'whisper' }, zIndex: 3 },
    ],
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'mystery-student-15c',
    title: 'Mystery Student',
    mode: 'custom',
    background: { type: 'gradient', token: 'calm-focus' },
    showClock: true,
    timerWidget: { kind: 'none' },
    studentMessage: 'The Mystery Star is watching! Show your best effort.',
    widgets: [
      { id: 'ms-widget', type: 'mystery-student', label: 'Mystery Star', x: 35, y: 20, w: 30, h: 30, visible: true, locked: true, settings: {}, zIndex: 1 },
    ],
    checklistCard: {
      heading: 'Expectations',
      items: [
        checklistItem('💪', 'Try your best'),
        checklistItem('🤝', 'Be kind to others'),
        checklistItem('✏️', 'Stay on task'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'review-game-15c',
    title: 'Review Game',
    mode: 'lessonLaunch',
    background: { type: 'gradient', token: 'sunny-specials' },
    showClock: false,
    timerWidget: { kind: 'none' },
    studentMessage: 'Let\'s review what we learned!',
    widgets: [
      { id: 'rg-picker', type: 'random-picker', label: 'Random Pick', x: 2, y: 5, w: 30, h: 30, visible: true, locked: false, settings: {}, zIndex: 1 },
      { id: 'rg-board', type: '100-board', label: 'Number Board', x: 50, y: 5, w: 30, h: 30, visible: true, locked: false, settings: {}, zIndex: 2 },
    ],
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
  {
    id: 'lunch-15c',
    title: 'Lunch Routine',
    mode: 'lunch',
    background: { type: 'image', token: 'lunch-flow-control' },
    showClock: true,
    timerWidget: { kind: 'none' },
    studentMessage: 'Time for lunch! Follow the routine.',
    widgets: [
      { id: 'lr-timer', type: 'routine-timer', label: 'Lunch Routine', x: 2, y: 5, w: 45, h: 45, visible: true, locked: false, settings: { routineId: 'lunch-routine' }, zIndex: 1 },
      { id: 'lr-noise', type: 'noise-meter', label: 'Voice Level', x: 68, y: 5, w: 20, h: 20, visible: true, locked: false, settings: { mode: 'manual', level: 'normal' }, zIndex: 2 },
    ],
    checklistCard: {
      heading: 'Lunch Checklist',
      items: [
        checklistItem('🧼', 'Wash your hands'),
        checklistItem('🍱', 'Get your lunch'),
        checklistItem('🚶', 'Line up quietly'),
      ],
    },
    studentSafe: true,
    updatedAt: SEED_TIMESTAMP,
    version: 1,
  },
]

export const DEFAULT_DISPLAY_SCREEN_ORDER: string[] = DEFAULT_DISPLAY_SCREENS.map((s) => s.id)

const DEFAULT_SCREENS_BY_ID = new Map(DEFAULT_DISPLAY_SCREENS.map((s) => [s.id, s]))

export function getDefaultScreenById(id: string): DisplayScreen | undefined {
  const found = DEFAULT_SCREENS_BY_ID.get(id)
  return found ? structuredClone(found) : undefined
}

export function isDefaultScreenId(id: string): boolean {
  return DEFAULT_SCREENS_BY_ID.has(id)
}
