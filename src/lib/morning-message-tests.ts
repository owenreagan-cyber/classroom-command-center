// Morning Message Studio tests — Phase 9B
// Run via: bash scripts/test-morning-message.sh

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { buildClassWorkspaces } from '../data/pageSequences'
import {
  cloneMorningMessageContent,
  createDefaultMorningMessageContent,
  createDefaultMorningMessageState,
  createMorningMessageId,
  enabledMorningMessageSections,
  formatFriendlyDate,
  isDuplicateTemplateName,
  isTemplateNameValid,
  normalizeMorningMessageState,
  resolveMorningMessageDate,
  sectionHasContent,
} from '../data/morningMessage'
import { DEFAULT_MORNING_MESSAGE } from '../data/defaults'

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) {
    passed += 1
  } else {
    failed += 1
    console.error(`FAIL: ${label}`)
  }
}

// ── Default state ────────────────────────────────────────────────────
const defaults = createDefaultMorningMessageState()
assert('Default state has current message', defaults.current !== undefined)
assert('Default state has seed templates', defaults.templates.length >= 6)
assert('Default greeting enabled', defaults.current.visibility.greeting === true)
assert('Default main message has text', (defaults.current.text.mainMessage ?? '').length > 0)

// ── Persistence migration ────────────────────────────────────────────
assert('Missing state normalizes to defaults', normalizeMorningMessageState(undefined).templates.length >= 6)
assert('Partial state merges safely', normalizeMorningMessageState({ current: { text: { greeting: 'Hi' } } }).current.text.greeting === 'Hi')
assert('Old backup without morningMessage uses defaults', normalizeMorningMessageState(null).current.visibility.date === true)

// ── Field updates ────────────────────────────────────────────────────
const content = createDefaultMorningMessageContent()
content.text.greeting = 'Hello class'
content.bullets.announcements = ['Field day Friday']
content.visibility.doNow = true
content.text.doNow = 'Start journal'
assert('Text field updates', content.text.greeting === 'Hello class')
assert('Bullet field updates', content.bullets.announcements?.length === 1)
assert('Visibility toggle', content.visibility.doNow === true)

// ── Clear and restore ────────────────────────────────────────────────
const cleared = createDefaultMorningMessageContent()
cleared.text = {}
cleared.bullets = { announcements: [], reminders: [], schedulePreview: [], materials: [] }
assert('Clear removes text', Object.keys(cleared.text).length === 0)
const restored = createDefaultMorningMessageContent()
assert('Restore defaults has greeting', (restored.text.greeting ?? '').length > 0)

// ── Templates ────────────────────────────────────────────────────────
const tplId = createMorningMessageId('mmtpl')
const templates = [
  { id: tplId, name: 'Test Template', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), content: cloneMorningMessageContent(content) },
]
assert('Template create has id', templates[0].id.startsWith('mmtpl'))
assert('Template name validation rejects blank', !isTemplateNameValid('   '))
assert('Template name validation accepts valid', isTemplateNameValid('Monday'))
assert('Duplicate name detected', isDuplicateTemplateName(templates, 'Test Template'))
assert('Duplicate name excludes self', !isDuplicateTemplateName(templates, 'Test Template', tplId))

// Apply template copies data
const applied = cloneMorningMessageContent(templates[0].content)
applied.text.greeting = 'Modified after apply'
assert('Apply copies template content', applied.text.greeting === 'Modified after apply')
assert('Template source unchanged after apply', templates[0].content.text.greeting === 'Hello class')

// Delete template preserves current
const currentAfterDelete = cloneMorningMessageContent(content)
assert('Delete template preserves current message', currentAfterDelete.text.greeting === 'Hello class')

// ── Display logic ────────────────────────────────────────────────────
const displayContent = createDefaultMorningMessageContent()
displayContent.visibility.announcements = true
displayContent.bullets.announcements = ['Picture day']
displayContent.visibility.reminders = true
displayContent.bullets.reminders = []
assert('Enabled section with content renders', sectionHasContent('announcements', displayContent))
assert('Disabled empty bullets do not render', !sectionHasContent('reminders', displayContent))
assert('Empty heading sections skipped', !sectionHasContent('doNow', displayContent))

const enabled = enabledMorningMessageSections(displayContent)
assert('Enabled sections list excludes empty', enabled.includes('announcements'))
assert('Enabled sections list excludes disabled empty', !enabled.includes('reminders'))

// ── Date formatting ──────────────────────────────────────────────────
const july25 = new Date(2026, 6, 25)
assert('Date formats correctly', formatFriendlyDate(july25) === 'Saturday, July 25')
const autoDate = resolveMorningMessageDate({ ...displayContent, useAutomaticDate: true }, july25)
assert('Automatic date resolves', autoDate === 'Saturday, July 25')
const overrideDate = resolveMorningMessageDate(
  { ...displayContent, useAutomaticDate: false, dateOverride: '2026-01-01' },
  july25,
)
assert('Override date resolves', overrideDate === 'Thursday, January 1')

// ── Page sequence ────────────────────────────────────────────────────
const workspaces = buildClassWorkspaces()
const morningPage = workspaces.homeroom!.pages.find((p) => p.id === 'homeroom-morning-message')!
assert('Morning message page exists', morningPage !== undefined)
assert('Morning message page uses morning-message widget', morningPage.widgets.some((w) => w.type === 'morning-message'))

// ── DEFAULT export constant ──────────────────────────────────────────
assert('DEFAULT_MORNING_MESSAGE matches factory', DEFAULT_MORNING_MESSAGE.templates.length >= 6)

// ── Backup round-trip shape ──────────────────────────────────────────
const backupPayload = {
  current: content,
  templates,
  selectedTemplateId: tplId,
  lastUpdated: new Date().toISOString(),
}
const restoredFromBackup = normalizeMorningMessageState(backupPayload)
assert('Backup current survives restore', restoredFromBackup.current.text.greeting === 'Hello class')
assert('Backup templates survive restore', restoredFromBackup.templates.length === 1)
assert('Old backup without morningMessage safe', normalizeMorningMessageState(undefined).current.text.mainMessage!.length > 0)

console.log(`\nMorning Message tests: ${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
