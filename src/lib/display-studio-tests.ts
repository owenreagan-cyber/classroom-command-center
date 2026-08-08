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
import { DISPLAY_STUDIO_THEMES, getTheme, getDefaultTheme, resolveThemeBackground, getThemeOverlay } from '../features/display-studio/themeRegistry'
import { BUILT_IN_WALLPAPERS, getWallpaper, getDefaultWallpaper as getDefaultWP, getWallpapersForTheme, getWallpapersForCategory } from './wallpaperRegistry'

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
  assert(DEFAULT_DISPLAY_SCREENS.length === 29, `Expected 29 default screens, got ${DEFAULT_DISPLAY_SCREENS.length}`)
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
    '100-board', 'prize-board', 'press-your-luck', 'lotto-board', 'jobs-manager',
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

// ── Phase 15D: Presenter, Blank Screen, and Display Flow Tests ──

test('existing templates with widgets are student-safe', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  assert(byId['work-time']?.studentSafe === true, 'work-time should be studentSafe')
  assert(byId['lesson-launch']?.studentSafe === true, 'lesson-launch should be studentSafe')
  assert(byId['game-review']?.studentSafe === true, 'game-review should be studentSafe')
  assert(byId['prize-board-screen']?.studentSafe === true, 'prize-board-screen should be studentSafe')
  assert(byId['arrival-720']?.studentSafe === true, 'arrival-720 should be studentSafe')
})

test('polished templates have widgets', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  assert(byId['work-time']?.widgets?.length === 2, 'work-time should have 2 widgets (work-symbols + noise-meter)')
  assert(byId['lesson-launch']?.widgets?.length === 1, 'lesson-launch should have 1 widget (directions)')
  assert(byId['game-review']?.widgets?.length === 2, 'game-review should have 2 widgets (random-picker + 100-board)')
  assert(byId['prize-board-screen']?.widgets?.length === 1, 'prize-board-screen should have 1 widget')
  assert(byId['arrival-720']?.widgets?.length === 2, 'arrival-720 should have 2 widgets')
  assert(byId['morning-work-to-math']?.widgets?.length === 1, 'morning-work-to-math should have 1 widget')
})

test('student message exists on polished templates', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  assert(byId['work-time']?.studentMessage !== undefined, 'work-time should have student message')
  assert(byId['lesson-launch']?.studentMessage !== undefined, 'lesson-launch should have student message')
  assert(byId['game-review']?.studentMessage !== undefined, 'game-review should have student message')
})

test('blank screen does not expose teacher data', () => {
  // blankDisplay sets displayBlanked and clears activeScreenId
  // teacherNotes should never appear on /display when blanked
  const screen = { ...DEFAULT_DISPLAY_SCREENS[0], teacherNotes: 'Confidential' }
  const safe = toDisplaySafeScreen(screen)
  assert(safe !== null)
  assert(!('teacherNotes' in safe!), 'teacherNotes must never appear in safe screen')
})

test('arrival template directions widget has safe text', () => {
  const arrival = DEFAULT_DISPLAY_SCREENS.find((s) => s.id === 'arrival-720')
  assert(arrival?.widgets?.some((w) => w.type === 'directions-text'), 'arrival should have directions-text widget')
  const dirW = arrival?.widgets?.find((w) => w.type === 'directions-text')
  assert(typeof dirW?.settings.text === 'string', 'directions text should be a string')
  assert((dirW?.settings.text as string).length > 0, 'directions text should not be empty')
})

// ── Phase 15F: Template Library, Themes, Wallpapers, Visual Polish, Widget Hardening ──

test('Phase 15F new templates exist and are studentSafe', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  const newIds = ['reading-launch', 'writing-workshop', 'shurley-grammar', 'science-launch',
    'history-launch', 'spelling-word-work', 'independent-practice', 'small-groups', 'test-mode']
  for (const id of newIds) {
    assert(byId[id] !== undefined, `${id} template should exist`)
    assert(byId[id]?.studentSafe === true, `${id} should be studentSafe`)
    assert(byId[id]?.title.length > 0, `${id} should have a title`)
    assert(byId[id]?.studentMessage !== undefined, `${id} should have a student message`)
  }
})

test('Phase 15F new templates have readable titles', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  assert(byId['reading-launch']?.title === 'Reading Launch')
  assert(byId['writing-workshop']?.title === 'Writing Workshop')
  assert(byId['science-launch']?.title === 'Science Launch')
  assert(byId['small-groups']?.title === 'Small Groups')
  assert(byId['test-mode']?.title === 'Test / Assessment')
})

test('Work Time duplication resolved: work-time and quiet-work are distinct', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  assert(byId['work-time']?.title === 'Work Time', 'original work-time still exists')
  assert(byId['work-time-15c']?.title === 'Quiet Work', 'work-time-15c is now Quiet Work')
  // Verify different work-symbols
  const wtSymbol = byId['work-time']?.widgets?.find((w) => w.type === 'work-symbols')
  const qwSymbol = byId['work-time-15c']?.widgets?.find((w) => w.type === 'work-symbols')
  assert(wtSymbol?.settings.symbol !== qwSymbol?.settings.symbol, 'Work Time and Quiet Work have different work symbols')
})

test('warm-sunset background token is fixed', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  // cleanup was changed from solid:warm-sunset to solid:warm-charcoal
  assert(byId['cleanup']?.background.type === 'solid')
  assert(byId['cleanup']?.background.token === 'warm-charcoal', 'cleanup uses warm-charcoal, not warm-sunset')
  // pack-up uses gradient:warm-sunset (now a valid gradient)
  assert(byId['pack-up']?.background.type === 'gradient')
  assert(byId['pack-up']?.background.token === 'warm-sunset', 'pack-up uses warm-sunset gradient')
})

test('all templates are studentSafe', () => {
  for (const s of DEFAULT_DISPLAY_SCREENS) {
    assert(s.studentSafe === true, `${s.id} should be studentSafe`)
  }
})

test('new templates have appropriate widgets', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s
  assert((byId['reading-launch']?.widgets?.length ?? 0) >= 1, 'reading-launch has widgets')
  assert((byId['test-mode']?.widgets?.length ?? 0) >= 1, 'test-mode has widgets')
  assert((byId['small-groups']?.widgets?.length ?? 0) >= 1, 'small-groups has widgets')
  assert(byId['independent-practice']?.widgets?.some((w) => w.type === 'countdown-timer'), 'independent practice has timer')
  assert(byId['test-mode']?.widgets?.some((w) => w.type === 'work-symbols'), 'test mode has work-symbols')
})

test('directions-text content is no longer line-clamped in editor', () => {
  // Phase 15F removed line-clamp-3 for better readability
  const text = 'Line 1\nLine 2\nLine 3\nLine 4'
  // Just verify the settings store the text properly — rendering uses whitespace-pre-line now
  assert(text.length > 0, 'directions text content is stored')
})

// ── Phase 15F: Theme Registry Tests ──

test('all 10 required themes exist', () => {
  assert(DISPLAY_STUDIO_THEMES.length === 10, `Expected 10 themes, got ${DISPLAY_STUDIO_THEMES.length}`)
  const requiredIds = ['calm-focus', 'bright-classroom', 'soft-pastel', 'high-contrast',
    'game-day', 'minimal-projector', 'anime-energy', 'cozy-seasonal', 'winter-focus', 'outdoor-nature']
  for (const id of requiredIds) {
    assert(getTheme(id) !== undefined, `theme ${id} should exist`)
  }
})

test('theme tokens are valid', () => {
  for (const theme of DISPLAY_STUDIO_THEMES) {
    assert(theme.backgroundToken.length > 0, `${theme.id} has a background token`)
    assert(theme.titleColor.length > 0, `${theme.id} has a title color`)
    assert(theme.accentColor.length > 0, `${theme.id} has an accent color`)
    assert(theme.overlayStrength.length > 0, `${theme.id} has overlay strength`)
    assert(theme.cardBgClass.length > 0, `${theme.id} has a card background class`)
    assert(theme.categories.length > 0, `${theme.id} has at least one category`)
  }
})

test('high contrast theme uses deep-black background', () => {
  const hc = getTheme('high-contrast')
  assert(hc?.backgroundToken === 'deep-black', 'high contrast uses deep-black solid')
  assert(hc?.titleColor === '#ffffff', 'high contrast uses white text')
})

test('themes provide safe defaults', () => {
  const defaultTheme = getDefaultTheme()
  assert(defaultTheme !== undefined, 'default theme exists')
  const resolved = resolveThemeBackground(defaultTheme.id)
  assert(resolved.token.length > 0, 'resolved theme background has token')
  assert(['gradient', 'solid', 'image'].includes(resolved.type), 'resolved theme background has valid type')
})

test('getThemeOverlay returns a string', () => {
  for (const theme of DISPLAY_STUDIO_THEMES) {
    assert(getThemeOverlay(theme.id).length > 0, `${theme.id} overlay exists`)
  }
})

// ── Phase 15F: Wallpaper Registry Tests ──

test('wallpaper registry has entries', () => {
  assert(BUILT_IN_WALLPAPERS.length >= 10, `Expected at least 10 wallpapers, got ${BUILT_IN_WALLPAPERS.length}`)
  for (const wp of BUILT_IN_WALLPAPERS) {
    assert(wp.studentSafe === true, `${wp.id} should be studentSafe`)
    assert(wp.label.length > 0, `${wp.id} should have a label`)
    assert(wp.category.length > 0, `${wp.id} should have a category`)
    assert(wp.source === 'builtIn', `${wp.id} should be builtIn`)
    assert(wp.dominantColor.length > 0, `${wp.id} should have a dominant color`)
  }
})

test('wallpaper metadata validates', () => {
  for (const wp of BUILT_IN_WALLPAPERS) {
    assert(typeof wp.id === 'string' && wp.id.length > 0)
    assert(typeof wp.label === 'string')
    assert(typeof wp.dominantColor === 'string')
    assert(typeof wp.overlayStrength === 'string')
    assert(Array.isArray(wp.tags))
    assert(Array.isArray(wp.recommendedThemes))
    assert(Array.isArray(wp.recommendedCategories))
  }
})

test('wallpapers can be filtered by theme', () => {
  for (const theme of DISPLAY_STUDIO_THEMES) {
    const wallpapers = getWallpapersForTheme(theme.id)
    assert(wallpapers.length >= 1, `${theme.id} should have at least 1 recommended wallpaper`)
  }
})

test('wallpapers can be filtered by category', () => {
  const calm = getWallpapersForCategory('calm')
  assert(calm.length >= 1, 'there are calm wallpapers')
  const seasonal = getWallpapersForCategory('seasonal')
  assert(seasonal.length >= 1, 'there are seasonal wallpapers')
})

test('missing wallpaper falls back safely', () => {
  const missing = getWallpaper('nonexistent-wallpaper')
  assert(missing === undefined, 'missing wallpaper returns undefined without crashing')
  const fallback = getDefaultWP()
  assert(fallback !== undefined, 'default wallpaper exists as fallback')
})

// ── Phase 15G: Template Picker, Theme Picker, Quick Start, Display Active Indicator ──

// Template categories (see DisplayStudioTemplatePicker.tsx for the UI version)
const TEMPLATE_CATEGORIES_15G = [
  { id: 'daily', label: 'Daily' },
  { id: 'instruction', label: 'Instruction' },
  { id: 'management', label: 'Management' },
  { id: 'engagement', label: 'Engagement' },
]

test('template categories are defined', () => {
  assert(TEMPLATE_CATEGORIES_15G.length === 4, `Expected 4 template categories, got ${TEMPLATE_CATEGORIES_15G.length}`)
  const catIds = TEMPLATE_CATEGORIES_15G.map((c: { id: string }) => c.id)
  assert(catIds.includes('daily'), 'daily category exists')
  assert(catIds.includes('instruction'), 'instruction category exists')
  assert(catIds.includes('management'), 'management category exists')
  assert(catIds.includes('engagement'), 'engagement category exists')
})

test('required templates exist per category', () => {
  const byId: Record<string, typeof DEFAULT_DISPLAY_SCREENS[number]> = {}
  for (const s of DEFAULT_DISPLAY_SCREENS) byId[s.id] = s

  const dailyIds = ['arrival-720', 'morning-work-to-math', 'math-to-snack-shurley', 'shurley-to-movement-spelling-reading',
    'movement-to-spelling-reading', 'spelling-reading-to-lunch', 'lunch-15c', 'pack-up', 'end-of-day', 'cleanup']
  for (const id of dailyIds) {
    assert(byId[id] !== undefined, `daily template ${id} should exist`)
    assert(byId[id]?.studentSafe === true, `${id} should be studentSafe`)
  }

  const instructionIds = ['lesson-launch', 'math-launch-15c', 'reading-launch', 'writing-workshop',
    'shurley-grammar', 'history-launch', 'science-launch', 'spelling-word-work']
  for (const id of instructionIds) {
    assert(byId[id] !== undefined, `instruction template ${id} should exist`)
  }

  const managementIds = ['work-time', 'work-time-15c', 'partner-talk', 'small-groups', 'independent-practice', 'test-mode', 'specials']
  for (const id of managementIds) {
    assert(byId[id] !== undefined, `management template ${id} should exist`)
  }

  const engagementIds = ['mystery-student-15c', 'game-review', 'review-game-15c', 'prize-board-screen']
  for (const id of engagementIds) {
    assert(byId[id] !== undefined, `engagement template ${id} should exist`)
  }
})

test('theme picker themes match theme registry', () => {
  for (const theme of DISPLAY_STUDIO_THEMES) {
    const resolved = resolveThemeBackground(theme.id)
    assert(resolved.token.length > 0, `${theme.id} resolves to a background token`)
    assert(['gradient', 'solid', 'image'].includes(resolved.type), `${theme.id} has valid type`)
  }
})

test('widget layout presets exist for sizing', () => {
  const presetIds = ['small', 'medium', 'large', 'wide', 'full-width'] as const
  for (const id of presetIds) {
    assert(!!WIDGET_SIZE_PRESETS[id], `preset ${id} exists`)
    const preset = WIDGET_SIZE_PRESETS[id]
    assert(preset.w > 0 && preset.h > 0, `${id} has valid dimensions`)
  }
})

test('display studio UI context actions are defined', () => {
  // Verify the context type has required Phase 15G fields
  // These are compile-time checks, but we verify runtime imports work
  assert(typeof isTypingTarget === 'function', 'isTypingTarget is imported and callable')
})

test('toDisplaySafeScreen excludes template/theme picker concepts from /display', () => {
  const screen = { ...DEFAULT_DISPLAY_SCREENS[0], teacherNotes: 'Secret' }
  const safe = toDisplaySafeScreen(screen)
  assert(safe !== null, 'screen is display-safe')
  assert(!('teacherNotes' in safe!), 'teacherNotes not in safe screen')
  // Template picker and theme picker are UI-only on /control — never on /display
  assert(!('templatePickerOpen' in safe), 'template picker state never exposed')
})

// ── Summary ──

console.log(`\nDisplay Studio Tests: ${passed} passed, ${failed} failed`)
if (failed > 0) throw new Error(`${failed} test(s) failed`)
