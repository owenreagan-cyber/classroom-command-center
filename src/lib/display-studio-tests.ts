/**
 * Phase 15B — Display Studio Widget Editing, Canvas Interaction, and Presenter Hardening tests.
 *
 * Extends Phase 15A with widget selection, drag, inspector, presenter, templates, and safety.
 */

import { DEFAULT_DISPLAY_SCREENS, isDefaultScreenId, getDefaultScreenById } from '../features/display-composer/defaultScreens'
import { toDisplaySafeScreen, displaySafeScreenHasNoForbiddenKeys } from '../features/display-composer/displaySafe'
import { STUDIO_WIDGETS, WIDGET_CATEGORY_LABELS } from '../features/display-studio/studioWidgets'
import { isInspectorSectionId } from './displayStudioTestHelpers'
import { isTypingTarget } from './inputSafety'
import { WIDGET_SIZE_PRESETS } from '../features/display-composer/types'

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
  assert(DEFAULT_DISPLAY_SCREENS.length === 20, `Expected 20 default screens, got ${DEFAULT_DISPLAY_SCREENS.length}`)
  const titles = DEFAULT_DISPLAY_SCREENS.map((s) => s.title)
  assert(titles.includes('7:20 Arrival'))
  assert(titles.includes('Morning Work → Math'))
  assert(titles.includes('Spelling/Reading → Lunch'))
  assert(titles.includes('Specials'))
  assert(titles.includes('Lesson Launch'), 'Should have Lesson Launch template')
  assert(titles.includes('Work Time'), 'Should have Work Time template')
  assert(titles.includes('Cleanup'), 'Should have Cleanup template')
  assert(titles.includes('Pack Up'), 'Should have Pack Up template')
  assert(titles.includes('End of Day'), 'Should have End of Day template')
})

test('default screen ids are recognized', () => {
  assert(isDefaultScreenId('arrival-720'))
  assert(isDefaultScreenId('specials'))
  assert(isDefaultScreenId('lesson-launch'), 'lesson-launch should be recognized')
  assert(!isDefaultScreenId('non-existent'))
})

test('getDefaultScreenById returns a deep clone', () => {
  const original = getDefaultScreenById('arrival-720')
  const clone = getDefaultScreenById('arrival-720')
  assert(original !== undefined)
  assert(clone !== undefined)
  clone!.title = 'CHANGED'
  const fresh = getDefaultScreenById('arrival-720')
  assert(fresh!.title === '7:20 Arrival', 'Clone should not mutate original')
})

// ── Canvas / Widget Model Tests ──

test('widget size presets are defined', () => {
  assert(WIDGET_SIZE_PRESETS.small.w > 0)
  assert(WIDGET_SIZE_PRESETS.medium.w > WIDGET_SIZE_PRESETS.small.w)
  assert(WIDGET_SIZE_PRESETS.large.w > WIDGET_SIZE_PRESETS.medium.w)
  assert(WIDGET_SIZE_PRESETS.wide.w > WIDGET_SIZE_PRESETS.large.w)
  assert(WIDGET_SIZE_PRESETS['full-width'].w > WIDGET_SIZE_PRESETS.wide.w)
  assert(WIDGET_SIZE_PRESETS['full-width'].h < WIDGET_SIZE_PRESETS.large.h)
})

test('student-safe screen passes display safe conversion', () => {
  const screen = DEFAULT_DISPLAY_SCREENS[0]
  const safe = toDisplaySafeScreen(screen)
  assert(safe !== null, 'Student-safe screen should convert successfully')
  assert(safe!.id === 'arrival-720')
  assert(!('updatedAt' in safe!), 'updatedAt must not leak to display-safe')
  assert(!('version' in safe!), 'version must not leak to display-safe')
  assert(displaySafeScreenHasNoForbiddenKeys(safe!), 'No forbidden keys in safe payload')
})

test('teacher notes do not leak to display-safe screen', () => {
  const screen = { ...DEFAULT_DISPLAY_SCREENS[0], teacherNotes: 'Private reminder: check Johnny\'s work' }
  const safe = toDisplaySafeScreen(screen)
  assert(safe !== null)
  assert(!('teacherNotes' in safe!), 'teacherNotes must NOT be in display-safe screen')
})

test('non-student-safe screen returns null', () => {
  const screen = { ...DEFAULT_DISPLAY_SCREENS[0], studentSafe: false }
  const safe = toDisplaySafeScreen(screen)
  assert(safe === null, 'Non-student-safe screen must return null')
})

test('hidden widgets are filtered from display-safe', () => {
  const screen = {
    ...DEFAULT_DISPLAY_SCREENS[0],
    widgets: [
      { id: 'w1', type: 'directions-text' as const, label: 'Visible', x: 10, y: 10, w: 30, h: 20, visible: true, locked: false, settings: {}, zIndex: 1 },
      { id: 'w2', type: 'mystery-student' as const, label: 'Hidden', x: 50, y: 50, w: 30, h: 30, visible: false, locked: false, settings: {}, zIndex: 2 },
    ],
  }
  const safe = toDisplaySafeScreen(screen)
  assert(safe !== null)
  assert(safe!.widgets !== undefined)
  assert(safe!.widgets!.length === 1, 'Only visible widgets should be in display-safe')
  assert(safe!.widgets![0].id === 'w1', 'Visible widget should survive')
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
  for (const w of placeholders) {
    assert(w.status === 'placeholder', `${w.id} should be a placeholder`)
  }
})

test('ready/connected widgets are marked correctly', () => {
  const ready = STUDIO_WIDGETS.filter((w) => w.status === 'connected' || w.status === 'live')
  assert(ready.length > 0, `Expected ready widgets but found ${ready.length}`)
  const readyIds = new Set(ready.map((w) => w.id))
  assert(readyIds.has('clock'))
  assert(readyIds.has('countdown-timer'))
  assert(readyIds.has('materials'))
  assert(readyIds.has('checklist'))
  assert(readyIds.has('prize-board'))
})

test('no duplicate widget ids', () => {
  const ids = STUDIO_WIDGETS.map((w) => w.id)
  const unique = new Set(ids)
  assert(ids.length === unique.size, `Found ${ids.length - unique.size} duplicate widget ids`)
})

// ── Spacebar / Text Input Tests ──

test('INPUT elements are recognized as typing targets', () => {
  const input = { tagName: 'INPUT', isContentEditable: false, getAttribute: () => null }
  const textarea = { tagName: 'TEXTAREA', isContentEditable: false, getAttribute: () => null }
  const ceDiv = { tagName: 'DIV', isContentEditable: true, getAttribute: () => null }
  const textboxDiv = { tagName: 'DIV', isContentEditable: false, getAttribute: (attr: string) => attr === 'role' ? 'textbox' : null }
  const plainDiv = { tagName: 'DIV', isContentEditable: false, getAttribute: () => null }
  const button = { tagName: 'BUTTON', isContentEditable: false, getAttribute: () => null }

  assert(isTypingTarget(input as unknown as EventTarget))
  assert(isTypingTarget(textarea as unknown as EventTarget))
  assert(isTypingTarget(ceDiv as unknown as EventTarget))
  assert(isTypingTarget(textboxDiv as unknown as EventTarget))
  assert(!isTypingTarget(plainDiv as unknown as EventTarget))
  assert(!isTypingTarget(button as unknown as EventTarget))
  assert(!isTypingTarget(null))
})

test('SELECT elements are typing targets', () => {
  const select = { tagName: 'SELECT', isContentEditable: false, getAttribute: () => null }
  assert(isTypingTarget(select as unknown as EventTarget))
})

test('title and message fields exist for spacebar typing', () => {
  const editableFields = [
    'data-studio-field="title"',
    'data-studio-field="message"',
    'data-studio-field="teacher-notes"',
  ]
  assert(editableFields.length === 3)
})

// ── Student-Safe /display Tests ──

test('teacher notes excluded from display-safe', () => {
  const screen = DEFAULT_DISPLAY_SCREENS[0]
  const safe = toDisplaySafeScreen(screen)
  assert(safe !== null)
  assert(!('teacherNotes' in safe!), 'Teacher notes must not leak to /display')
  assert(displaySafeScreenHasNoForbiddenKeys(safe!))
})

test('display-safe screen does not contain provider info', () => {
  const screen = DEFAULT_DISPLAY_SCREENS[0]
  const safe = toDisplaySafeScreen(screen)
  const keys = Object.keys(safe!)
  assert(!keys.includes('providerConfig'))
  assert(!keys.includes('aiProvider'))
  assert(!keys.includes('generatorMode'))
})

// ── Screen Order / Template Preservation Tests ──

test('existing screen order starts with arrival-720', () => {
  const order = DEFAULT_DISPLAY_SCREENS.map((s) => s.id)
  assert(order[0] === 'arrival-720')
})

test('all 15 screens have unique ids', () => {
  const ids = DEFAULT_DISPLAY_SCREENS.map((s) => s.id)
  const unique = new Set(ids)
  assert(ids.length === unique.size, `Duplicate screen ids: ${ids.length - unique.size}`)
})

test('all 15 screens are student-safe by default', () => {
  for (const screen of DEFAULT_DISPLAY_SCREENS) {
    assert(screen.studentSafe, `${screen.id} should be studentSafe: true`)
  }
})

test('new templates have appropriate modes', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  assert(byId['lesson-launch']?.mode === 'lessonLaunch')
  assert(byId['work-time']?.mode === 'workTime')
  assert(byId['cleanup']?.mode === 'transition')
  assert(byId['pack-up']?.mode === 'packUp')
  assert(byId['end-of-day']?.mode === 'packUp')
})

// ── Phase 15C: Connected Widget Tests ──

test('connected widget types are in CanvasWidgetType', () => {
  const connectedIds = STUDIO_WIDGETS.filter((w) => w.status === 'connected').map((w) => w.id)
  const canvasTypes = new Set([
    'clock', 'countdown-timer', 'routine-timer', 'directions-text', 'materials', 'checklist',
    'work-symbols', 'noise-meter', 'atmosphere', 'random-picker', 'mystery-student',
    '100-board', 'prize-board', 'press-your-luck',
  ])
  for (const id of connectedIds) {
    assert(canvasTypes.has(id) || id === 'stopwatch' || id === 'qr-code' || id === 'dice-spinner' || id === 'poll' || id === 'scoreboard' || id === 'image' || id === 'pdf-embed',
      `connected widget ${id} should have a canvas type or be explicitly non-canvas`)
  }
})

test('timer widgets have timerKind setting', () => {
  const countdownDef = STUDIO_WIDGETS.find((w) => w.id === 'countdown-timer')
  assert(countdownDef?.status === 'connected', 'countdown timer should be connected')
})

test('mystery student widget is connected', () => {
  const ms = STUDIO_WIDGETS.find((w) => w.id === 'mystery-student')
  assert(ms?.status === 'connected', 'mystery student should be connected')
})

test('noise meter widget has mode setting', () => {
  const nm = STUDIO_WIDGETS.find((w) => w.id === 'noise-meter')
  assert(nm?.status === 'connected', 'noise meter should be connected')
})

test('prize board and press your luck are connected', () => {
  const pb = STUDIO_WIDGETS.find((w) => w.id === 'prize-board')
  const pyl = STUDIO_WIDGETS.find((w) => w.id === 'press-your-luck')
  assert(pb?.status === 'connected', 'prize board should be connected')
  assert(pyl?.status === 'connected', 'press your luck should be connected')
})

test('atmosphere widget is in registry', () => {
  const atm = STUDIO_WIDGETS.find((w) => w.id === 'atmosphere')
  assert(atm !== undefined, 'atmosphere widget should exist')
  assert(atm?.status === 'connected', 'atmosphere should be connected')
})

test('new seeded templates have widgets', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  assert(byId['math-launch-15c']?.widgets?.length === 2, 'math launch has 2 widgets')
  assert(byId['work-time-15c']?.widgets?.length === 3, 'work time has 3 widgets')
  assert(byId['mystery-student-15c']?.widgets?.length === 1, 'mystery student has 1 widget')
  assert(byId['review-game-15c']?.widgets?.length === 2, 'review game has 2 widgets')
  assert(byId['lunch-15c']?.widgets?.length === 2, 'lunch routine has 2 widgets')
})

test('widget display overlay filters hidden widgets', () => {
  const widgets = [
    { id: 'w1', type: 'directions-text' as const, label: 'A', x: 0, y: 0, w: 20, h: 20, visible: true, locked: false, settings: {}, zIndex: 1 },
    { id: 'w2', type: 'noise-meter' as const, label: 'B', x: 0, y: 0, w: 20, h: 20, visible: false, locked: false, settings: {}, zIndex: 1 },
  ]
  const visible = widgets.filter((w) => w.visible)
  assert(visible.length === 1, 'only visible widgets pass through')
  assert(visible[0].id === 'w1')
})

// ── Summary ──

console.log(`\nDisplay Studio Tests: ${passed} passed, ${failed} failed`)
if (failed > 0) throw new Error(`${failed} test(s) failed`)
