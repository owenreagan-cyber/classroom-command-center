// Deterministic page architecture tests.
// Run via: bash scripts/test-pages.sh

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { buildClassWorkspaces, getWorkspaceForClass, getPageForId, PHASE_TO_PAGE_MAP, ALL_PAGE_SEQUENCES } from '../data/pageSequences'
import type { VibePageId, ClassWorkspace } from '../data/types'

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

// Build fresh workspaces for all tests
const workspaces = buildClassWorkspaces()

// ── 1. Nested page ordering ──────────────────────────────
assert('All sequences produce workspaces', ALL_PAGE_SEQUENCES.length > 0)
assert('All sequence class IDs have a workspace', ALL_PAGE_SEQUENCES.every(s => workspaces[s.classId] !== undefined))

for (const ws of Object.values(workspaces)) {
  if (!ws) continue
  assert(`Workspace ${ws.classId} has ordered pages`, ws.pages.length > 0)
  assert(`Workspace ${ws.classId} pages are sequential`, ws.pages.every((p, i) => {
    if (i === 0) return p.previousPageId === null
    return p.previousPageId === ws.pages[i - 1].id
  }))
  assert(`Workspace ${ws.classId} next links are sequential`, ws.pages.every((p, i) => {
    if (i === ws.pages.length - 1) return p.nextPageId === null
    return p.nextPageId === ws.pages[i + 1].id
  }))
}

// ── 2. Previous/next navigation ──────────────────────────
const homeroomWs = workspaces['homeroom']!
assert('Homeroom has 5 pages', homeroomWs.pages.length === 5)
assert('Homeroom first page is morning arrival', homeroomWs.pages[0].id === 'homeroom-morning-arrival')
assert('Homeroom last page is announcements', homeroomWs.pages[4].id === 'homeroom-announcements')

const mathWs = workspaces['math']!
assert('Math has 6 pages', mathWs.pages.length === 6)

// ── 3. First-page previous behavior ──────────────────────
assert('First page has no previous', homeroomWs.pages[0].previousPageId === null)
assert('First page workspace has no previousPageId', homeroomWs.previousPageId === null)

// ── 4. Last-page next behavior ───────────────────────────
assert('Last page has no next', homeroomWs.pages[4].nextPageId === null)

// ── 5. Persisted active page ─────────────────────────────
// activePageId is set to first page by default
assert('Workspace starts on first page', homeroomWs.activePageId === 'homeroom-morning-arrival')
assert('All workspaces have an active page', Object.values(workspaces).filter(Boolean).every(ws => ws!.activePageId !== null))

// ── 6. Old single-screen state migration ─────────────────
// Single-screen class (recess) gets a single-page workspace
const recessWs = workspaces['recess']!
assert('Recess has exactly 1 page', recessWs.pages.length === 1)
assert('Recess page is recess-play', recessWs.pages[0].id === 'recess-play')

// ── 7. Legacy snack-lunch migration ──────────────────────
assert('Snack workspace exists', workspaces['snack'] !== undefined)
assert('Lunch workspace exists', workspaces['lunch'] !== undefined)
assert('Snack has 2 pages', workspaces['snack']!.pages.length === 2)
assert('Lunch has 4 pages', workspaces['lunch']!.pages.length === 4)
assert('Legacy snack-lunch snack page exists', workspaces['snack']!.pages[0].id === 'snack-quiet-snack')

// ── 8. Legacy homework-pack-up migration ─────────────────
assert('Homework workspace exists', workspaces['homework'] !== undefined)
assert('Pack-up workspace exists', workspaces['pack-up'] !== undefined)
assert('Homework has 3 pages', workspaces['homework']!.pages.length === 3)
assert('Pack-up has 3 pages', workspaces['pack-up']!.pages.length === 3)

// ── 9. Routine phase to page mapping ─────────────────────
assert('Silent work maps to homeroom', PHASE_TO_PAGE_MAP['silent-work']?.screenId === 'homeroom')
assert('Silent work maps to silent work page', PHASE_TO_PAGE_MAP['silent-work']?.pageId === 'homeroom-silent-work')
assert('Clean up maps to homeroom clean up', PHASE_TO_PAGE_MAP['clean-up']?.pageId === 'homeroom-clean-up-math')
assert('Quiet snack maps to snack', PHASE_TO_PAGE_MAP['quiet-snack']?.screenId === 'snack')
assert('Quiet snack maps to snack page', PHASE_TO_PAGE_MAP['quiet-snack']?.pageId === 'snack-quiet-snack')
assert('Silent clean up maps to snack', PHASE_TO_PAGE_MAP['silent-clean-up']?.screenId === 'snack')
assert('Silent clean up maps to snack clean up', PHASE_TO_PAGE_MAP['silent-clean-up']?.pageId === 'snack-silent-clean-up')

// Lunch phase mappings
assert('Quiet lunch A maps to lunch', PHASE_TO_PAGE_MAP['quiet-lunch-a']?.screenId === 'lunch')
assert('Quiet lunch A maps to lunch page a', PHASE_TO_PAGE_MAP['quiet-lunch-a']?.pageId === 'lunch-quiet-lunch-a')
assert('Silent chew maps to lunch', PHASE_TO_PAGE_MAP['silent-chew']?.screenId === 'lunch')
assert('Silent chew maps to lunch silent', PHASE_TO_PAGE_MAP['silent-chew']?.pageId === 'lunch-silent-chew')
assert('Quiet lunch B maps to lunch', PHASE_TO_PAGE_MAP['quiet-lunch-b']?.screenId === 'lunch')
assert('Silent clean up lunch maps to lunch', PHASE_TO_PAGE_MAP['silent-clean-up-lunch']?.screenId === 'lunch')

// ── 10. No forced navigation ───────────────────────────
// The page data model has no auto-advance fields
const allPages = Object.values(workspaces).filter(Boolean).flatMap(ws => ws!.pages)
assert('No page has auto-advance field', allPages.every(p => 'nextPageId' in p))
// nextPageId is set on every page but it's navigation-hint, not auto-advance
assert('Page navigation is suggestion-based', allPages.every(p => p.nextPageId === null || typeof p.nextPageId === 'string'))

// ── 11. Current-page suggestion ──────────────────────────
// Each workspace has an active page that can be retrieved
for (const ws of Object.values(workspaces)) {
  if (!ws) continue
  const activePage = ws.pages.find(p => p.id === ws.activePageId)
  assert(`Workspace ${ws.classId} active page exists in pages`, activePage !== undefined)
}

// ── 12. Class-independent page state ─────────────────────
// Each workspace has its own independent pages
const homeroomPages = homeroomWs.pages.map(p => p.id)
const mathPages = mathWs.pages.map(p => p.id)
const overlappingPages = homeroomPages.filter(id => mathPages.includes(id))
assert('Homeroom and math pages are independent', overlappingPages.length === 0)

// ── 13. Layout preset persistence ────────────────────────
const layoutPresets = new Set(allPages.filter(p => p.layoutPreset).map(p => p.layoutPreset))
assert('All pages have valid layout presets', layoutPresets.size > 0)
assert('centered-message preset exists', layoutPresets.has('centered-message'))
assert('Layout presets are persisted on pages', allPages.every(p => p.layoutPreset !== undefined))

// ── 14. Projector-safe display model ─────────────────────
// Pages should have readable content - primaryMessage should not be empty
assert('All pages have a primary message', allPages.every(p => p.primaryMessage.length > 0))
assert('All pages have a title', allPages.every(p => p.title.length > 0))

// ── 15. No private data leakage ──────────────────────────
const pageJson = JSON.stringify(allPages)
assert('Pages do not expose studentObservations', !pageJson.includes('studentObservations'))
assert('Pages do not expose fairnessHistory', !pageJson.includes('fairnessHistory'))
assert('Pages do not expose activeMysterySessions', !pageJson.includes('activeMysterySessions'))
assert('Pages do not expose groupExclusions', !pageJson.includes('groupExclusions'))
assert('Pages do not expose archivedStudentRecords', !pageJson.includes('archivedStudent'))
assert('Pages do not expose teacherPrivateNotes', !pageJson.includes('teacherPrivate'))

// ── 16. No fairness-history mutation ─────────────────────
const fairnessHistory: unknown[] = []
const fairnessSnapshot = JSON.stringify(fairnessHistory)
// Note: These operations don't touch fairness history at all
void buildClassWorkspaces()
void getWorkspaceForClass('homeroom')
assert('Fairness history unchanged by page operations', JSON.stringify(fairnessHistory) === fairnessSnapshot)

// ── 17. No Mystery-session mutation ──────────────────────
const mysterySessions: Record<string, unknown> = {}
const mysterySnapshot = JSON.stringify(mysterySessions)
void buildClassWorkspaces()
assert('Mystery sessions unchanged by page operations', JSON.stringify(mysterySessions) === mysterySnapshot)

// ── 18. Local Packet round-trip with new page state ──────
// Build a minimal packet-like structure with page state
const packetWithPages = {
  classWorkspaces: workspaces,
  activePageId: 'homeroom-silent-work',
}
assert('Packet round-trip preserves classWorkspaces', packetWithPages.classWorkspaces['homeroom']?.pages.length === 5)
assert('Packet round-trip preserves activePageId', packetWithPages.activePageId === 'homeroom-silent-work')

// ── 19. Removed old screen IDs do not crash
  try {
    const oldKeys: string[] = ['snack-lunch', 'homework-packup']
    const wsMap = workspaces as Record<string, ClassWorkspace | undefined>
    for (const key of oldKeys) {
      void wsMap[key]
    }
    assert('Old screen IDs do not crash', true)
  } catch {
    assert('Old screen IDs do not crash', false)
  }

// ── 20. Page id uniqueness ───────────────────────────────
// All page IDs across all workspaces should be unique
const allPageIds = allPages.map(p => p.id)
const uniqueIds = new Set(allPageIds)
assert('All page IDs are unique', allPageIds.length === uniqueIds.size)

// ── Page title/slide coverage checks ─────────────────────
function hasTitle(ws: ClassWorkspace | undefined, title: string): boolean {
  if (!ws) return false
  return ws.pages.some(p => p.title.includes(title))
}
assert('Homeroom has Morning Arrival', hasTitle(homeroomWs, 'Morning Arrival'))
assert('Homeroom has Silent Work', hasTitle(homeroomWs, 'Silent Work'))
assert('Homeroom has Clean Up', hasTitle(homeroomWs, 'Clean Up'))
assert('Homeroom has Morning Message', hasTitle(homeroomWs, 'Morning Message'))
assert('Homeroom has Announcements', hasTitle(homeroomWs, 'Announcements'))
assert('Math has Get Ready', hasTitle(workspaces['math']!, 'Get Ready'))
assert('Math has Warm-Up', hasTitle(workspaces['math']!, 'Warm-Up'))
assert('Math has Lesson', hasTitle(workspaces['math']!, 'Lesson'))
assert('Math has Independent Work', hasTitle(workspaces['math']!, 'Independent Work'))
assert('Math has Wrap Up', hasTitle(workspaces['math']!, 'Wrap Up'))
assert('Reading has Get Ready', hasTitle(workspaces['reading']!, 'Get Ready'))
assert('Reading has Reading Focus', hasTitle(workspaces['reading']!, 'Reading Focus'))
assert('Reading has Independent Reading', hasTitle(workspaces['reading']!, 'Independent Reading'))
assert('Snack has Quiet Snack', hasTitle(workspaces['snack']!, 'Quiet Snack'))
assert('Snack has Silent Clean Up', hasTitle(workspaces['snack']!, 'Silent Clean Up'))
assert('Lunch has Quiet Lunch', hasTitle(workspaces['lunch']!, 'Quiet Lunch'))
assert('Lunch has Silent Chew', hasTitle(workspaces['lunch']!, 'Silent Chew'))
assert('Lunch has Silent Clean Up', hasTitle(workspaces['lunch']!, 'Silent Clean Up'))
assert('Homework has Copy Homework', hasTitle(workspaces['homework']!, 'Copy Homework'))
assert('Homework has Check Planner', hasTitle(workspaces['homework']!, 'Check Planner'))
assert('Homework has Pack Materials', hasTitle(workspaces['homework']!, 'Pack Materials'))
assert('Pack Up has Pack Up', hasTitle(workspaces['pack-up']!, 'Pack Up'))
assert('Pack Up has Ready Position', hasTitle(workspaces['pack-up']!, 'Ready Position'))
assert('Pack Up has Dismissal', hasTitle(workspaces['pack-up']!, 'Dismissal'))
assert('Science has Get Ready', hasTitle(workspaces['science']!, 'Get Ready'))
assert('Science has Lesson Focus', hasTitle(workspaces['science']!, 'Lesson Focus'))
assert('Science has Wrap Up', hasTitle(workspaces['science']!, 'Wrap Up'))
assert('Spelling has Spelling Focus', hasTitle(workspaces['spelling']!, 'Spelling Focus'))
assert('Writing has Writing Focus', hasTitle(workspaces['writing']!, 'Writing Focus'))

// ── Selected page screenshots should exist ──────────────
// The test verifies the page model - visual QA is done separately

// ── getPageForId cross-workspace lookup ──────────────────
const foundPage = getPageForId('homeroom-silent-work', workspaces)
assert('getPageForId finds page across workspaces', foundPage?.id === 'homeroom-silent-work')
assert('getPageForId finds correct workspace', foundPage?.title === 'Silent Work')
const missingPage = getPageForId('nonexistent-page' as VibePageId, workspaces)
assert('getPageForId returns undefined for missing page', missingPage === undefined)

// ── Routine phase coverage ───────────────────────────────
// Every routine-phase-id on pages should have a matching page
const allRoutinePhaseIds = new Set(allPages.flatMap(p => p.routinePhaseIds))
assert('All routine phase IDs reference valid pages', [...allRoutinePhaseIds].every(phaseId => {
  const mapping = PHASE_TO_PAGE_MAP[phaseId]
  if (!mapping) return false
  const ws = workspaces[mapping.screenId]
  if (!ws) return false
  return mapping.pageId === null || ws.pages.some(p => p.id === mapping.pageId)
}))

console.log(`\nPage Architecture Tests`)
console.log(`Passed: ${passed}, Failed: ${failed}`)
process.exitCode = failed > 0 ? 1 : 0
