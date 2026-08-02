import type { DisplayScreen, DisplayScreenMode } from './types'

/**
 * Phase 14D — Quick-Start Templates.
 *
 * Fast, minimal-input way to create a new blank display screen (as opposed to
 * the fuller Lesson Message Generator, which needs real lesson context). Pure
 * function — the panel is responsible for actually creating the screen via
 * the existing createCustomScreen/updateScreen store actions with this patch.
 */
export interface QuickStartTemplate {
  id: string
  label: string
  description: string
  mode: DisplayScreenMode
  build: () => Partial<Omit<DisplayScreen, 'id'>>
}

export const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    id: 'blank-transition',
    label: 'Blank Transition',
    description: 'Title, clock, transition timer, and a short get-ready checklist.',
    mode: 'transition',
    build: () => ({
      title: 'New Transition',
      mode: 'transition',
      showClock: true,
      timerWidget: { kind: 'transition' },
      checklistCard: {
        heading: 'Get Ready',
        items: [
          { id: 'step-1', icon: '🧹', text: 'Clean up your area', checked: false },
          { id: 'step-2', icon: '📚', text: 'Get your next materials', checked: false },
          { id: 'step-3', icon: '🪑', text: 'Sit ready to learn', checked: false },
        ],
      },
    }),
  },
  {
    id: 'blank-lesson-launch',
    label: 'Blank Lesson Launch',
    description: 'Title, clock, general timer, and a simple lesson checklist.',
    mode: 'lessonLaunch',
    build: () => ({
      title: 'New Lesson',
      mode: 'lessonLaunch',
      showClock: true,
      timerWidget: { kind: 'general' },
      checklistCard: {
        heading: 'Lesson Checklist',
        items: [
          { id: 'step-1', icon: '✔', text: 'Get materials ready', checked: false },
          { id: 'step-2', icon: '✔', text: 'Listen for directions', checked: false },
          { id: 'step-3', icon: '✔', text: 'Try your best', checked: false },
        ],
      },
    }),
  },
  {
    id: 'checklist-only',
    label: 'Checklist Only',
    description: 'Just a title and an empty checklist card — add your own items.',
    mode: 'custom',
    build: () => ({
      title: 'New Checklist',
      mode: 'custom',
      showClock: true,
      timerWidget: { kind: 'none' },
      checklistCard: { heading: 'Checklist', items: [] },
    }),
  },
  {
    id: 'materials-only',
    label: 'Materials Only',
    description: 'Just a title and an empty materials card — add your own items.',
    mode: 'custom',
    build: () => ({
      title: 'New Materials Screen',
      mode: 'custom',
      showClock: true,
      timerWidget: { kind: 'none' },
      materialsCard: { heading: 'Materials', sections: [{ id: 'section-1', items: [] }] },
    }),
  },
  {
    id: 'message-only',
    label: 'Message Only',
    description: 'Just a title and a student message — no cards or timer.',
    mode: 'custom',
    build: () => ({
      title: 'New Message',
      mode: 'custom',
      showClock: true,
      timerWidget: { kind: 'none' },
      studentMessage: 'Add your message here.',
    }),
  },
]

const TEMPLATES_BY_ID = new Map(QUICK_START_TEMPLATES.map((t) => [t.id, t]))

/** Returns undefined for an unknown template id — never throws. */
export function buildQuickStartScreenPatch(templateId: string): Partial<Omit<DisplayScreen, 'id'>> | undefined {
  const template = TEMPLATES_BY_ID.get(templateId)
  if (!template) return undefined
  return { studentSafe: true, ...template.build() }
}

/**
 * Fixed (Phase 14F field test): a template can request a timer kind without
 * knowing the eventual screen's id yet (build() runs before createCustomScreen
 * assigns one) — this fills in a real per-instance timerId once the id is
 * known, so a promised timer actually renders instead of leaving a blank slot
 * (DisplayScreenRenderer only allocates a timer slot when a timerId is set).
 */
export function finalizeQuickStartPatch(
  patch: Partial<Omit<DisplayScreen, 'id'>>,
  screenId: string,
): Partial<Omit<DisplayScreen, 'id'>> {
  const timerWidget = patch.timerWidget
  if (timerWidget && timerWidget.kind !== 'none' && !timerWidget.timerId) {
    return { ...patch, timerWidget: { ...timerWidget, timerId: `dc-${screenId}-quickstart` } }
  }
  return patch
}
