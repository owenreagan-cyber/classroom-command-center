import type { DisplayScreen } from './types'

/**
 * Phase 14D — Readability warnings.
 *
 * Teacher-only, computed on the fly from a screen's existing fields — never
 * stored, never passed through displaySafe.ts, never rendered on /display.
 * Each warning carries an icon so severity isn't communicated by color alone.
 */
export interface ReadabilityWarning {
  id: string
  icon: string
  message: string
}

const MAX_TITLE_LENGTH = 40
const MAX_MESSAGE_LENGTH = 140
const MAX_CHECKLIST_ITEMS = 5
const MAX_MATERIALS_TOTAL_ITEMS = 8
const MAX_MATERIALS_SECTION_ITEMS = 5

export function computeReadabilityWarnings(screen: DisplayScreen): ReadabilityWarning[] {
  const warnings: ReadabilityWarning[] = []

  if (screen.title.length > MAX_TITLE_LENGTH) {
    warnings.push({
      id: 'title-too-long',
      icon: '⚠',
      message: `Title is long (${screen.title.length} characters) — may wrap or shrink on the projector.`,
    })
  }

  if (screen.studentMessage && screen.studentMessage.length > MAX_MESSAGE_LENGTH) {
    warnings.push({
      id: 'message-too-long',
      icon: '⚠',
      message: `Student message is long (${screen.studentMessage.length} characters) — keep it to 1–2 short sentences.`,
    })
  }

  if (screen.checklistCard && screen.checklistCard.items.length > MAX_CHECKLIST_ITEMS) {
    warnings.push({
      id: 'checklist-too-long',
      icon: '⚠',
      message: `Checklist has ${screen.checklistCard.items.length} items — trim to 5 or fewer for readability.`,
    })
  }

  if (screen.materialsCard) {
    const totalItems = screen.materialsCard.sections.reduce((sum, s) => sum + s.items.length, 0)
    const denseSection = screen.materialsCard.sections.find((s) => s.items.length > MAX_MATERIALS_SECTION_ITEMS)
    if (totalItems > MAX_MATERIALS_TOTAL_ITEMS || denseSection) {
      warnings.push({
        id: 'materials-too-dense',
        icon: '⚠',
        message: 'Materials card is dense — consider trimming items or splitting into another screen.',
      })
    }
  }

  return warnings
}
