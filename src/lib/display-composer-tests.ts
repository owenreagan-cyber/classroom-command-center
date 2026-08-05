import { DEFAULT_DISPLAY_SCREENS, DEFAULT_DISPLAY_SCREEN_ORDER, getDefaultScreenById, isDefaultScreenId } from '../features/display-composer/defaultScreens'
import {
  applyScreenPatch,
  buildCustomScreen,
  buildSeededScreensState,
  duplicateScreenData,
  generateScreenId,
  resetScreenToDefault,
} from '../features/display-composer/displayComposerLogic'
import { displaySafeScreenHasNoForbiddenKeys, toDisplaySafeScreen } from '../features/display-composer/displaySafe'
import { draftLessonDisplayScreen } from '../features/display-composer/messageDraft'
import { resolveDisplayBackground } from '../features/display-composer/backgroundStyles'
import type { DisplayScreen } from '../features/display-composer/types'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

// --- Default screens load ---

assert(DEFAULT_DISPLAY_SCREENS.length === 15, 'exactly 15 default display screens are seeded')
assert(DEFAULT_DISPLAY_SCREEN_ORDER.length === 15, 'default order has 15 entries')

const expectedTitles = [
  '7:20 Arrival',
  'Morning Work → Math',
  'Math → Snack and Shurley',
  'Shurley → Movement and Spelling/Reading',
  'Movement → Spelling/Reading',
  'Spelling/Reading → Lunch',
  'Specials',
  'Lesson Launch',
  'Work Time',
  'Cleanup',
  'Pack Up',
  'End of Day',
]
for (const title of expectedTitles) {
  assert(
    DEFAULT_DISPLAY_SCREENS.some((s) => s.title === title),
    `default screens include "${title}"`,
  )
}

for (const screen of DEFAULT_DISPLAY_SCREENS) {
  assert(screen.studentSafe === true, `${screen.id} is studentSafe by default`)
  assert(typeof screen.showClock === 'boolean', `${screen.id} has showClock boolean`)
  assert(['none', 'general', 'transition', 'task', 'routine'].includes(screen.timerWidget.kind), `${screen.id} has a valid timer kind`)
}

assert(isDefaultScreenId('arrival-720'), 'arrival-720 recognized as a default screen id')
assert(!isDefaultScreenId('not-a-real-id'), 'unknown id is not a default screen id')
assert(getDefaultScreenById('arrival-720') !== undefined, 'getDefaultScreenById finds a seeded screen')

// Reuse of existing timer system: specific screens must reference the *real*
// pre-existing timer ids rather than inventing parallel state.
const mathToSnack = DEFAULT_DISPLAY_SCREENS.find((s) => s.id === 'math-to-snack-shurley')!
assert(mathToSnack.timerWidget.timerId === 'math-wrap-up', 'Math → Snack/Shurley reuses existing "math-wrap-up" transition timer')

const morningToMath = DEFAULT_DISPLAY_SCREENS.find((s) => s.id === 'morning-work-to-math')!
assert(morningToMath.timerWidget.timerId === 'homeroom-clean-up-math', 'Morning Work → Math reuses existing "homeroom-clean-up-math" transition timer')

const lunchScreen = DEFAULT_DISPLAY_SCREENS.find((s) => s.id === 'spelling-reading-to-lunch')!
assert(lunchScreen.timerWidget.kind === 'routine' && lunchScreen.timerWidget.timerId === 'lunch-routine', 'Spelling/Reading → Lunch uses the routine timer ("lunch-routine")')

// --- Seeded store state shape ---

const seeded = buildSeededScreensState()
assert(Object.keys(seeded.screens).length === 15, 'seeded state has 15 screens')
assert(seeded.order.length === 15, 'seeded order has 15 entries')

// --- Screen CRUD logic ---

const now = Date.now()
const arrival = seeded.screens['arrival-720']
const patched = applyScreenPatch(arrival, { title: 'Renamed Arrival' }, now)
assert(patched.title === 'Renamed Arrival', 'applyScreenPatch updates title')
assert(patched.version === arrival.version + 1, 'applyScreenPatch bumps version')
assert(patched.updatedAt === now, 'applyScreenPatch sets updatedAt')
assert(patched.id === arrival.id, 'applyScreenPatch preserves id')

const duplicate = duplicateScreenData(arrival, seeded.screens, now)
assert(duplicate.id !== arrival.id, 'duplicateScreenData assigns a new id')
assert(duplicate.title === `${arrival.title} (Copy)`, 'duplicateScreenData suffixes the title')
assert(duplicate.version === 1, 'duplicateScreenData resets version to 1')

const reset = resetScreenToDefault('arrival-720', now)
assert(reset !== undefined && reset.title === '7:20 Arrival', 'resetScreenToDefault restores shipped content')
assert(resetScreenToDefault('not-a-real-id', now) === undefined, 'resetScreenToDefault no-ops for unknown ids')

const customId = generateScreenId('7:20 Arrival', seeded.screens)
assert(customId !== 'arrival-720', 'generateScreenId avoids collision with an existing id')

const custom = buildCustomScreen('My New Screen', seeded.screens, now)
assert(custom.mode === 'custom', 'buildCustomScreen defaults to custom mode')
assert(custom.timerWidget.kind === 'none', 'buildCustomScreen defaults timer to none')

// --- displaySafe ---

const safeArrival = toDisplaySafeScreen(arrival)
assert(safeArrival !== null, 'studentSafe screen produces a display-safe payload')
assert(displaySafeScreenHasNoForbiddenKeys(safeArrival!), 'display-safe payload excludes updatedAt/version')

const unsafeScreen: DisplayScreen = { ...arrival, studentSafe: false }
assert(toDisplaySafeScreen(unsafeScreen) === null, 'studentSafe=false screens never produce a display-safe payload')
assert(toDisplaySafeScreen(undefined) === null, 'toDisplaySafeScreen handles missing screen')

// --- Background resolution (gradient | image | solid) ---

const gradientBg = resolveDisplayBackground({ type: 'gradient', token: 'sunny-specials' })
assert(gradientBg.backgroundImage.includes('linear-gradient'), 'gradient background resolves to a CSS gradient')

const solidBg = resolveDisplayBackground({ type: 'solid', token: 'focus-navy' })
assert(solidBg.backgroundColor === '#0f172a', 'solid background resolves to a flat color')

const imageBg = resolveDisplayBackground({ type: 'image', token: 'math-training-lab' })
assert(imageBg.backgroundImage.includes('math-training-lab'), 'image background resolves to the shared asset path')

const fallbackBg = resolveDisplayBackground({ type: 'gradient', token: 'not-a-real-token' })
assert(fallbackBg.backgroundImage.includes('linear-gradient'), 'unknown token falls back to a safe default gradient')

// --- Deterministic lesson-message draft (no AI) ---

const draftInput = {
  subject: 'Math',
  lessonTitle: 'Fractions',
  objective: 'Add fractions with like denominators.',
  materials: ['Math notebook', 'Pencil'],
  activityType: 'lessonLaunch' as const,
}
const draftA = draftLessonDisplayScreen(draftInput)
const draftB = draftLessonDisplayScreen(draftInput)
assert(JSON.stringify(draftA) === JSON.stringify(draftB), 'draftLessonDisplayScreen is deterministic for identical input')
assert(draftA.title === 'Math Time!', 'draft title fills subject template')
assert(draftA.studentChecklist.length === 3, 'draft student checklist always has exactly 3 steps')
assert(draftA.materialsChecklist.length === 2, 'draft materials checklist passes through provided materials')
assert(draftA.suggestedTimerMinutes === 10, 'draft suggests a timer duration for lessonLaunch')
assert(draftA.studentMessage.includes('Fractions'), 'draft student message references the lesson title')

const transitionDraft = draftLessonDisplayScreen({ subject: 'Reading', lessonTitle: 'Chapter 3', activityType: 'transition' })
assert(transitionDraft.suggestedTimerMinutes === 4, 'transition activity type suggests a short timer')
assert(transitionDraft.materialsChecklist.length === 0, 'draft materials checklist is empty when none provided')

// --- Runtime hardening (Phase 14E): malformed/old hydration records never crash the safe projection ---

const wellFormedScreen = DEFAULT_DISPLAY_SCREENS[0]

const missingBackground = { ...wellFormedScreen } as Partial<DisplayScreen> as DisplayScreen
delete (missingBackground as Partial<DisplayScreen>).background
const safeMissingBackground = toDisplaySafeScreen(missingBackground)
assert(safeMissingBackground !== null, 'a screen missing its background field still produces a display-safe payload')
assert(safeMissingBackground!.background.type === 'gradient', 'missing background fills a safe default gradient')

const missingTimerWidget = { ...wellFormedScreen } as Partial<DisplayScreen> as DisplayScreen
delete (missingTimerWidget as Partial<DisplayScreen>).timerWidget
const safeMissingTimer = toDisplaySafeScreen(missingTimerWidget)
assert(safeMissingTimer !== null, 'a screen missing its timerWidget field still produces a display-safe payload')
assert(safeMissingTimer!.timerWidget.kind === 'none', 'missing timerWidget fills a safe "none" default')

const missingShowClock = { ...wellFormedScreen } as Partial<DisplayScreen> as DisplayScreen
delete (missingShowClock as Partial<DisplayScreen>).showClock
const safeMissingShowClock = toDisplaySafeScreen(missingShowClock)
assert(safeMissingShowClock !== null && typeof safeMissingShowClock.showClock === 'boolean', 'missing showClock fills a safe boolean default')

console.log('All display composer tests passed.')
