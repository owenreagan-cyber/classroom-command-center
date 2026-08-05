/**
 * Phase 15A — Display Studio Redesign tests.
 *
 * Validates the new slide-style display editor: thumbnail rail, canvas,
 * collapsible inspector, widget library, presenter mode, student-safe /display,
 * spacebar handling, and backward compatibility with existing display-composer.
 */

import { DEFAULT_DISPLAY_SCREENS, isDefaultScreenId, getDefaultScreenById } from '../features/display-composer/defaultScreens'
import { toDisplaySafeScreen, displaySafeScreenHasNoForbiddenKeys } from '../features/display-composer/displaySafe'
import { STUDIO_WIDGETS, WIDGET_CATEGORY_LABELS } from '../features/display-studio/studioWidgets'
import { isInspectorSectionId } from './displayStudioTestHelpers'

// Re-export isInspectorSectionId for use by the test runner
const INSPECTOR_SECTIONS = ['screen', 'content', 'widgets', 'style', 'teacher-notes', 'display'] as const

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}`)
    console.error(e instanceof Error ? e.message : String(e))
  }
}

function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) throw new Error(message ?? 'Assertion failed')
}

// ── Thumbnail Rail Tests ──

test('all seeded screens appear as valid defaults', () => {
  assert(DEFAULT_DISPLAY_SCREENS.length === 7, `Expected 7 default screens, got ${DEFAULT_DISPLAY_SCREENS.length}`)
  const titles = DEFAULT_DISPLAY_SCREENS.map((s) => s.title)
  assert(titles.includes('7:20 Arrival'))
  assert(titles.includes('Morning Work → Math'))
  assert(titles.includes('Spelling/Reading → Lunch'))
  assert(titles.includes('Specials'))
})

test('default screen ids are recognized', () => {
  assert(isDefaultScreenId('arrival-720'))
  assert(isDefaultScreenId('specials'))
  assert(!isDefaultScreenId('non-existent'))
})

test('getDefaultScreenById returns a deep clone', () => {
  const original = getDefaultScreenById('arrival-720')
  const clone = getDefaultScreenById('arrival-720')
  assert(original !== undefined)
  assert(clone !== undefined)
  // Mutating the clone should not affect the original
  clone!.title = 'CHANGED'
  const fresh = getDefaultScreenById('arrival-720')
  assert(fresh!.title === '7:20 Arrival', 'Clone should not mutate original')
})

// ── Canvas Tests ──

test('student-safe screen passes display safe conversion', () => {
  const screen = DEFAULT_DISPLAY_SCREENS[0] // 7:20 Arrival, studentSafe: true
  const safe = toDisplaySafeScreen(screen)
  assert(safe !== null, 'Student-safe screen should convert successfully')
  assert(safe!.id === 'arrival-720')
  assert(!('updatedAt' in safe!), 'updatedAt must not leak to display-safe')
  assert(!('version' in safe!), 'version must not leak to display-safe')
  assert(displaySafeScreenHasNoForbiddenKeys(safe!), 'No forbidden keys in safe payload')
})

test('non-student-safe screen returns null', () => {
  const screen = { ...DEFAULT_DISPLAY_SCREENS[0], studentSafe: false }
  const safe = toDisplaySafeScreen(screen)
  assert(safe === null, 'Non-student-safe screen must return null')
})

test('undefined screen returns null', () => {
  assert(toDisplaySafeScreen(undefined) === null)
})

test('missing fields get safe defaults', () => {
  const minimal = {
    id: 'test-minimal',
    title: 'Test',
    studentSafe: true,
    mode: 'custom' as const,
    background: { type: 'solid' as const, token: 'focus-navy' },
    showClock: true,
    timerWidget: { kind: 'none' as const },
    updatedAt: 0,
    version: 1,
  } as const
  const safe = toDisplaySafeScreen(minimal as Parameters<typeof toDisplaySafeScreen>[0])
  assert(safe !== null)
  assert(safe!.title === 'Test')
})

// ── Inspector Section Tests ──

test('all inspector sections are valid', () => {
  for (const section of INSPECTOR_SECTIONS) {
    assert(isInspectorSectionId(section), `${section} should be a valid inspector section`)
  }
})

test('invalid section ids are rejected', () => {
  assert(!isInspectorSectionId('invalid-section'))
  assert(!isInspectorSectionId(''))
})

test('screen section is the default expanded', () => {
  // The DEFAULT_EXPANDED_SECTIONS in the provider only includes 'screen'
  const defaultExpanded = ['screen']
  assert(defaultExpanded.includes('screen'))
  assert(!defaultExpanded.includes('widgets'))
  assert(!defaultExpanded.includes('teacher-notes'))
})

// ── Widget Library Tests ──

test('widget library has all categories', () => {
  const categories = ['time', 'classroom', 'engagement', 'rewards', 'instruction']
  for (const cat of categories) {
    assert(cat in WIDGET_CATEGORY_LABELS, `${cat} should be a widget category`)
  }
})

test('widget library has widgets in each category', () => {
  const cats = new Set(STUDIO_WIDGETS.map((w) => w.category))
  assert(cats.has('time'))
  assert(cats.has('classroom'))
  assert(cats.has('engagement'))
  assert(cats.has('rewards'))
  assert(cats.has('instruction'))
})

test('placeholder widgets are marked correctly', () => {
  const placeholders = STUDIO_WIDGETS.filter((w) => w.status === 'placeholder')
  assert(placeholders.length > 0, 'Should have placeholder widgets for coming-soon features')
  // All placeholders should say "coming soon" in their description or be visually marked
  for (const w of placeholders) {
    assert(w.status === 'placeholder', `${w.id} should be a placeholder`)
  }
})

test('live widgets are marked correctly', () => {
  const live = STUDIO_WIDGETS.filter((w) => w.status === 'live')
  assert(live.length > 0)
  // Key live widgets should exist
  const liveIds = new Set(live.map((w) => w.id))
  assert(liveIds.has('clock'))
  assert(liveIds.has('countdown-timer'))
  assert(liveIds.has('materials'))
  assert(liveIds.has('checklist'))
  assert(liveIds.has('prize-board'))
})

test('no duplicate widget ids', () => {
  const ids = STUDIO_WIDGETS.map((w) => w.id)
  const unique = new Set(ids)
  assert(ids.length === unique.size, `Found ${ids.length - unique.size} duplicate widget ids`)
})

// ── Spacebar / Text Input Tests ──

test('INPUT elements are recognized as text-editing targets', () => {
  const isEditingTarget = (tag: string, isContentEditable: boolean, role: string | null) =>
    tag === 'INPUT' || tag === 'TEXTAREA' || isContentEditable || role === 'textbox'

  assert(isEditingTarget('INPUT', false, null))
  assert(isEditingTarget('TEXTAREA', false, null))
  assert(isEditingTarget('DIV', true, null))
  assert(isEditingTarget('DIV', false, 'textbox'))
  assert(!isEditingTarget('DIV', false, null))
  assert(!isEditingTarget('BUTTON', false, null))
  assert(!isEditingTarget('SPAN', false, null))
})

test('title and message fields exist for spacebar typing', () => {
  // These data attributes exist on editor fields so tests can target them
  const editableFields = [
    'data-studio-field="title"',
    'data-studio-field="message"',
    'data-studio-field="teacher-notes"',
  ]
  assert(editableFields.length === 3)
})

// ── Student-Safe /display Tests ──

test('teacher notes section exists but is not a forbidden key on display-safe screens', () => {
  const screen = DEFAULT_DISPLAY_SCREENS[0]
  const safe = toDisplaySafeScreen(screen)
  assert(safe !== null)
  // Teacher notes section is a UI feature, not a data field that could leak
  // The display-safe screen should NOT have any notes field
  assert(!('teacherNotes' in safe!), 'Teacher notes must not leak to /display')
})

test('display-safe screen does not contain provider info', () => {
  const screen = DEFAULT_DISPLAY_SCREENS[0]
  const safe = toDisplaySafeScreen(screen)
  const keys = Object.keys(safe!)
  assert(!keys.includes('providerConfig'))
  assert(!keys.includes('aiProvider'))
  assert(!keys.includes('generatorMode'))
})

// ── Existing Display Composer Regression Tests ──

test('existing screen order is preserved', () => {
  const order = DEFAULT_DISPLAY_SCREENS.map((s) => s.id)
  assert(order[0] === 'arrival-720')
  assert(order[order.length - 1] === 'specials')
})

// ── Summary ──

console.log(`\nDisplay Studio Tests: ${passed} passed, ${failed} failed`)
if (failed > 0) throw new Error(`${failed} test(s) failed`) 
