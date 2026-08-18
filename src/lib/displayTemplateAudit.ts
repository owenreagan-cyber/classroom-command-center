import type { DisplayScreen } from '../features/display-composer/types'
import { DEFAULT_DISPLAY_SCREENS } from '../features/display-composer/defaultScreens'
import {
  QUICK_START_TEMPLATES,
  buildQuickStartScreenPatch,
} from '../features/display-composer/quickStartTemplates'
import {
  detectScreenOverlapsWithZones,
  DISPLAY_STUDIO_RESERVED_ZONES,
} from './canvasWidgetOverlapDetector'

/**
 * Phase 15L.1 — Template audit utility.
 *
 * Classifies every shipped display template (default screens + quick-start
 * library) so the safety/layout hardening phase can honestly report which are
 * finished, which are partial, and which carry known risks. Pure — no React,
 * no store, no DOM. The audit report feeds the phase status doc.
 */

export type TemplateAuditStatus = 'complete' | 'partial' | 'hollow' | 'unsafe'

export interface TemplateAuditEntry {
  id: string
  title: string
  source: 'default' | 'quick-start'
  status: TemplateAuditStatus
  hasOverlapWarning: boolean
  hasBackgroundTextRisk: boolean
  hasPlaceholderMessage: boolean
  hasNoCardsPlaceholder: boolean
  widgetCount: number
  hasStudentMessage: boolean
  hasChecklist: boolean
  hasMaterials: boolean
  hasTimer: boolean
}

export interface TemplateAuditReport {
  entries: TemplateAuditEntry[]
  counts: Record<TemplateAuditStatus, number>
  overlapWarningCount: number
  backgroundTextRiskCount: number
  placeholderMessageCount: number
  noCardsPlaceholderCount: number
}

/**
 * Background image tokens that resolve to snack-lunch-flow-control.png, which
 * Phase 15L.4 confirmed contains baked-in "Snack Lunch Flow" title text that
 * cannot be fixed in code.
 */
const BACKGROUND_TEXT_RISK_TOKENS = new Set(['snack-flow-control', 'lunch-flow-control', 'centers-rotations'])

function isPlaceholderMessage(message: string | undefined): boolean {
  if (!message) return false
  const m = message.trim().toLowerCase()
  return (
    m === 'add your message here.' ||
    m === 'add your message here' ||
    m.startsWith('add your message') ||
    m === 'today we are learning about...' ||
    m.startsWith('today we are learning about')
  )
}

/**
 * Classify a single screen.
 *
 * Rubric (documented in the status doc):
 * - unsafe:   studentSafe is false
 * - hollow:   no widgets, message, checklist, materials, or timer
 * - complete: has a student message AND a structural element (checklist,
 *             materials, or timer)
 * - partial:  has some content but is not complete
 */
export function auditScreen(screen: DisplayScreen, source: 'default' | 'quick-start' = 'default'): TemplateAuditEntry {
  const widgets = screen.widgets ?? []
  const hasWidgets = widgets.length > 0
  const hasStudentMessage = Boolean(screen.studentMessage && screen.studentMessage.trim().length > 0)
  const hasChecklist = Boolean(screen.checklistCard)
  const hasMaterials = Boolean(screen.materialsCard)
  const hasTimer = screen.timerWidget.kind !== 'none'
  const hasAnyContent = hasWidgets || hasStudentMessage || hasChecklist || hasMaterials || hasTimer

  let status: TemplateAuditStatus
  if (!screen.studentSafe) {
    status = 'unsafe'
  } else if (!hasAnyContent) {
    status = 'hollow'
  } else if (hasStudentMessage && (hasChecklist || hasMaterials || hasTimer)) {
    status = 'complete'
  } else {
    status = 'partial'
  }

  const overlapReport = detectScreenOverlapsWithZones(widgets, DISPLAY_STUDIO_RESERVED_ZONES)

  return {
    id: screen.id,
    title: screen.title,
    source,
    status,
    hasOverlapWarning: overlapReport.hasWarnings,
    hasBackgroundTextRisk:
      screen.background.type === 'image' &&
      BACKGROUND_TEXT_RISK_TOKENS.has(screen.background.token as string),
    hasPlaceholderMessage: isPlaceholderMessage(screen.studentMessage),
    hasNoCardsPlaceholder: !hasChecklist && !hasMaterials && !hasTimer,
    widgetCount: widgets.length,
    hasStudentMessage,
    hasChecklist,
    hasMaterials,
    hasTimer,
  }
}

/** Materialize a quick-start template patch into a screen-like record for audit. */
function auditQuickStartTemplate(t: (typeof QUICK_START_TEMPLATES)[number]): TemplateAuditEntry {
  const patch = buildQuickStartScreenPatch(t.id) ?? {}
  const screen: DisplayScreen = {
    id: t.id,
    title: t.label,
    mode: t.mode,
    background: { type: 'gradient', token: 'calm-focus' },
    showClock: true,
    timerWidget: { kind: 'none' },
    studentSafe: true,
    updatedAt: 0,
    version: 1,
    ...patch,
  }
  return auditScreen(screen, 'quick-start')
}

/** Audit every default screen and quick-start template. */
export function auditAllTemplates(): TemplateAuditReport {
  const entries: TemplateAuditEntry[] = DEFAULT_DISPLAY_SCREENS.map((s) => auditScreen(s, 'default'))
  for (const t of QUICK_START_TEMPLATES) {
    entries.push(auditQuickStartTemplate(t))
  }

  const counts: Record<TemplateAuditStatus, number> = { complete: 0, partial: 0, hollow: 0, unsafe: 0 }
  let overlapWarningCount = 0
  let backgroundTextRiskCount = 0
  let placeholderMessageCount = 0
  let noCardsPlaceholderCount = 0

  for (const e of entries) {
    counts[e.status] += 1
    if (e.hasOverlapWarning) overlapWarningCount += 1
    if (e.hasBackgroundTextRisk) backgroundTextRiskCount += 1
    if (e.hasPlaceholderMessage) placeholderMessageCount += 1
    if (e.hasNoCardsPlaceholder) noCardsPlaceholderCount += 1
  }

  return {
    entries,
    counts,
    overlapWarningCount,
    backgroundTextRiskCount,
    placeholderMessageCount,
    noCardsPlaceholderCount,
  }
}
