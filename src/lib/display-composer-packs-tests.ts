import { DEFAULT_DISPLAY_SCREENS } from '../features/display-composer/defaultScreens'
import {
  applyScreenPatch,
  buildSeededScreensState,
  resetScreenToDefault,
} from '../features/display-composer/displayComposerLogic'
import { toDisplaySafeScreen } from '../features/display-composer/displaySafe'
import {
  countScreensByPack,
  DISPLAY_SCREEN_PACKS,
  filterScreensByPack,
  getScreenPackById,
  isValidPackId,
} from '../features/display-composer/screenPacks'
import {
  buildQuickStartScreenPatch,
  finalizeQuickStartPatch,
  QUICK_START_TEMPLATES,
} from '../features/display-composer/quickStartTemplates'
import { computeReadabilityWarnings } from '../features/display-composer/readabilityChecks'
import type { DisplayScreen } from '../features/display-composer/types'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

// --- Screen pack registry ---

assert(DISPLAY_SCREEN_PACKS.length === 8, 'exactly 8 screen packs (one per DisplayScreenMode)')
assert(getScreenPackById('arrival') !== undefined, 'getScreenPackById finds a real pack')
assert(getScreenPackById('not-a-real-pack') === undefined, 'getScreenPackById returns undefined for unknown id')
assert(isValidPackId('transition'), 'isValidPackId true for a real pack id')
assert(!isValidPackId('not-a-real-pack'), 'isValidPackId false for an unknown pack id')

// --- Filtering: valid pack with screens ---

const seededScreens = Object.values(buildSeededScreensState().screens)
const transitionScreens = filterScreensByPack(seededScreens, 'transition')
assert(transitionScreens.length === 5, `transition pack has 5 seeded screens (4 originals + cleanup), got ${transitionScreens.length}`)
assert(transitionScreens.every((s) => s.mode === 'transition'), 'filterScreensByPack only returns matching-mode screens')

// --- Non-empty packs (Phase 15B added more templates) ---

const lessonLaunchScreens = filterScreensByPack(seededScreens, 'lessonLaunch')
assert(lessonLaunchScreens.length === 10, `lessonLaunch pack has 10 seeded screens, got ${lessonLaunchScreens.length}`)

const workTimeScreens = filterScreensByPack(seededScreens, 'workTime')
assert(workTimeScreens.length === 6, `workTime pack has 6 seeded screens, got ${workTimeScreens.length}`)

const packUpScreens = filterScreensByPack(seededScreens, 'packUp')
assert(packUpScreens.length === 2, `packUp pack has 2 seeded screens, got ${packUpScreens.length}`)

// --- Failure mode: unknown pack id never throws, just returns empty ---

assert(filterScreensByPack(seededScreens, 'totally-bogus-pack').length === 0, 'unknown pack id returns an empty list, not a crash')
assert(filterScreensByPack([], 'arrival').length === 0, 'filtering an empty screen list is safe')

// --- Pack counts ---

const counts = countScreensByPack(seededScreens)
assert(counts.arrival === 1, 'arrival pack count is 1')
assert(counts.transition === 5, 'transition pack count is 5')
assert(counts.lunch === 2, 'lunch pack count is 2')
assert(counts.specials === 1, 'specials pack count is 1')
assert(counts.workTime === 6, 'workTime pack count is 6')
assert(counts.lessonLaunch === 10, 'lessonLaunch pack count is 10')
assert(counts.packUp === 2, 'packUp pack count is 2')

// --- Quick-start templates ---

assert(QUICK_START_TEMPLATES.length === 5, 'exactly 5 quick-start templates')
for (const template of QUICK_START_TEMPLATES) {
  const patch = buildQuickStartScreenPatch(template.id)
  assert(patch !== undefined, `quick-start template "${template.id}" builds a patch`)
  assert(patch!.studentSafe === true, `quick-start template "${template.id}" defaults studentSafe to true`)
  assert(patch!.mode === template.mode, `quick-start template "${template.id}" sets the declared mode`)
}

// --- Failure mode: unknown quick-start template id ---

assert(buildQuickStartScreenPatch('not-a-real-template') === undefined, 'unknown quick-start template id returns undefined, not a crash')

// --- Regression (Phase 14F field test): quick-start templates that promise a
// timer must end up with a real timerId, or the timer silently never renders
// (a real bug found during the classroom field test — "Blank Lesson Launch"
// and "Blank Transition" set a timer kind but no id). ---

for (const template of QUICK_START_TEMPLATES) {
  const rawPatch = buildQuickStartScreenPatch(template.id)!
  const finalized = finalizeQuickStartPatch(rawPatch, 'demo-screen-id')
  if (rawPatch.timerWidget && rawPatch.timerWidget.kind !== 'none') {
    assert(
      Boolean(finalized.timerWidget?.timerId),
      `quick-start template "${template.id}" promises a ${rawPatch.timerWidget.kind} timer and ends up with a real timerId after finalization`,
    )
  }
}

const patchWithNoTimer = finalizeQuickStartPatch({ timerWidget: { kind: 'none' } }, 'demo-screen-id')
assert(patchWithNoTimer.timerWidget?.timerId === undefined, 'finalizeQuickStartPatch leaves a "none" timer kind untouched')

const patchAlreadyHasId = finalizeQuickStartPatch({ timerWidget: { kind: 'routine', timerId: 'lunch-routine' } }, 'demo-screen-id')
assert(patchAlreadyHasId.timerWidget?.timerId === 'lunch-routine', 'finalizeQuickStartPatch never overwrites an existing timerId')

// --- Readability warnings: normal seeded screens produce no warnings ---

for (const screen of DEFAULT_DISPLAY_SCREENS) {
  const warnings = computeReadabilityWarnings(screen)
  assert(warnings.length === 0, `seeded screen "${screen.id}" has no readability warnings, got ${warnings.map((w) => w.id).join(', ')}`)
}

// --- Readability warnings: too-long title ---

const longTitleScreen: DisplayScreen = {
  ...DEFAULT_DISPLAY_SCREENS[0],
  title: 'This Is A Very Long Screen Title That Will Definitely Wrap On A Projector',
}
const titleWarnings = computeReadabilityWarnings(longTitleScreen)
assert(titleWarnings.some((w) => w.id === 'title-too-long'), 'long title produces a title-too-long warning')
assert(titleWarnings[0].icon.length > 0, 'readability warnings carry an icon, not color-only signaling')

// --- Readability warnings: too-long student message ---

const longMessageScreen: DisplayScreen = {
  ...DEFAULT_DISPLAY_SCREENS[0],
  studentMessage: 'A'.repeat(150),
}
assert(
  computeReadabilityWarnings(longMessageScreen).some((w) => w.id === 'message-too-long'),
  'long student message produces a message-too-long warning',
)

// --- Readability warnings: checklist over 5 items ---

const longChecklistScreen: DisplayScreen = {
  ...DEFAULT_DISPLAY_SCREENS[0],
  checklistCard: {
    heading: 'Checklist',
    items: Array.from({ length: 6 }, (_, i) => ({ id: `item-${i}`, icon: '✔', text: `Item ${i}`, checked: false })),
  },
}
assert(
  computeReadabilityWarnings(longChecklistScreen).some((w) => w.id === 'checklist-too-long'),
  'checklist with 6 items produces a checklist-too-long warning',
)

// --- Readability warnings: materials too dense ---

const denseMaterialsScreen: DisplayScreen = {
  ...DEFAULT_DISPLAY_SCREENS[0],
  materialsCard: {
    heading: 'Materials',
    sections: [{ id: 'section-1', items: Array.from({ length: 9 }, (_, i) => `Item ${i}`) }],
  },
}
assert(
  computeReadabilityWarnings(denseMaterialsScreen).some((w) => w.id === 'materials-too-dense'),
  'dense materials card produces a materials-too-dense warning',
)

// --- Regression: reset-to-default does not affect sibling screens ---

const now = Date.now()
const seeded = buildSeededScreensState()
const customScreen: DisplayScreen = {
  id: 'my-custom-screen',
  title: 'My Custom Screen',
  mode: 'custom',
  background: { type: 'gradient', token: 'calm-focus' },
  showClock: true,
  timerWidget: { kind: 'none' },
  studentSafe: true,
  updatedAt: now,
  version: 1,
}
const withCustom: Record<string, DisplayScreen> = { ...seeded.screens, [customScreen.id]: customScreen }
const editedArrival = applyScreenPatch(withCustom['arrival-720'], { title: 'Edited Arrival Title' }, now)
const stateWithEdits: Record<string, DisplayScreen> = { ...withCustom, 'arrival-720': editedArrival }

// Resetting a *different* default screen must not touch the custom screen or the edited arrival screen.
const resetMath = resetScreenToDefault('math-to-snack-shurley', now)
assert(resetMath !== undefined, 'resetScreenToDefault succeeds for a real default id')
const stateAfterReset: Record<string, DisplayScreen> = { ...stateWithEdits, 'math-to-snack-shurley': resetMath! }
assert(stateAfterReset['my-custom-screen'].title === 'My Custom Screen', 'resetting a default screen leaves a custom screen untouched')
assert(stateAfterReset['arrival-720'].title === 'Edited Arrival Title', 'resetting a different screen leaves the teacher\'s edit on another screen untouched')

// Resetting an unknown/custom id must no-op rather than destroying anything.
assert(resetScreenToDefault('my-custom-screen', now) === undefined, 'resetScreenToDefault refuses to reset a non-default (custom) screen id')

// --- Failure mode: unknown screen id lookups are handled gracefully everywhere ---

assert(toDisplaySafeScreen(undefined) === null, 'toDisplaySafeScreen handles a missing/unknown screen id')
assert(withCustom['not-a-real-screen-id'] === undefined, 'looking up an unknown screen id yields undefined, not a crash')

console.log('All display composer pack/template/readability tests passed.')
