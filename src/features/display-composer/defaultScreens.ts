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
