// Deterministic routine tests.
// Run via: npm run test:routines

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { BLOCK_ROUTINE_WINDOWS, CANONICAL_DAILY_BLOCKS, ROUTINE_SCHEDULES, assertInstructionalBlockOrder, getDayKey, getDateTimeForMinutes, getRoutineWeekday, isWeekdayEnabled, normalizeRoutineControlState, normalizeRoutineSuggestion, phaseDurationMs, resolveBlockDisplayLabel, resolveBlockPageSuggestion, resolveBlockScreenId, resolveCurriculumTrack, resolveHistoryScienceSubject, timeToMinutes, toScheduleBlockModel, TRACK_HISTORY_SCIENCE_MAP, INSTRUCTIONAL_BLOCK_ORDER } from '../data/routineSchedule'
import { advanceRoutineControlToNextPhase, buildManualRoutineControl, buildPausedRoutineControl, getBlockRoutineTimeline, getDailyBlockTimeline, getRoutineTimeline, restartRoutineControl } from './routineEngine'
import type { VibePageId } from '../data/types'

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

function localDate(year: number, month: number, day: number, hour: number, minute: number, second = 0) {
  return new Date(year, month - 1, day, hour, minute, second, 0)
}

function sameTime(actual: number | null | undefined, expected: number) {
  return actual === expected
}

const monday = localDate(2026, 7, 6, 0, 0)
const t0719 = localDate(2026, 7, 6, 7, 19)
const t0720 = localDate(2026, 7, 6, 7, 20)
const t0745 = localDate(2026, 7, 6, 7, 45)
const t0746 = localDate(2026, 7, 6, 7, 46)
const t0747 = localDate(2026, 7, 6, 7, 47)
const t0749 = localDate(2026, 7, 6, 7, 49)
const t0750 = localDate(2026, 7, 6, 7, 50)
const t0810 = localDate(2026, 7, 6, 8, 10)
const t0859 = localDate(2026, 7, 6, 8, 59)
const t0900 = localDate(2026, 7, 6, 9, 0)
const t0905 = localDate(2026, 7, 6, 9, 5)
const t0911 = localDate(2026, 7, 6, 9, 11)
const t0912 = localDate(2026, 7, 6, 9, 12)
const t0915 = localDate(2026, 7, 6, 9, 15)
const t0920 = localDate(2026, 7, 6, 9, 20)
const t0922 = localDate(2026, 7, 6, 9, 22)
const t0958 = localDate(2026, 7, 6, 9, 58)
const t1000 = localDate(2026, 7, 6, 10, 0)
const t1315 = localDate(2026, 7, 6, 13, 15)
const t1317 = localDate(2026, 7, 6, 13, 17)
const t1343 = localDate(2026, 7, 6, 13, 43)
const t1344 = localDate(2026, 7, 6, 13, 44)
const t1345 = localDate(2026, 7, 6, 13, 45)
const t1040 = localDate(2026, 7, 6, 10, 40)
const t1042 = localDate(2026, 7, 6, 10, 42)
const t1110 = localDate(2026, 7, 6, 11, 10)
const t1112 = localDate(2026, 7, 6, 11, 12)
const t1208 = localDate(2026, 7, 6, 12, 8)
const t1210 = localDate(2026, 7, 6, 12, 10)
const t1215 = localDate(2026, 7, 6, 12, 15)
const t1220 = localDate(2026, 7, 6, 12, 20)
const t1228 = localDate(2026, 7, 6, 12, 28)
const t1241 = localDate(2026, 7, 6, 12, 41)
const t1245 = localDate(2026, 7, 6, 12, 45)
const t1250 = localDate(2026, 7, 6, 12, 50)
const saturday = localDate(2026, 7, 11, 7, 20)

const homeroomSchedule = ROUTINE_SCHEDULES.find((schedule) => schedule.id === 'homeroom-arrival')!
const snackSchedule = ROUTINE_SCHEDULES.find((schedule) => schedule.id === 'snack-routine')!
const lunchSchedule = ROUTINE_SCHEDULES.find((schedule) => schedule.id === 'lunch-routine')!

// Weekday and weekend checks
assert('Monday is a weekday', getRoutineWeekday(monday) === 'mon')
assert('Saturday is not a weekday', getRoutineWeekday(saturday) === null)
assert('Weekday gate allows Monday', isWeekdayEnabled(homeroomSchedule.weekdays, monday))
assert('Weekday gate blocks Saturday', !isWeekdayEnabled(homeroomSchedule.weekdays, saturday))

// Exact homeroom boundaries
assert('Homeroom silent work starts at 7:20', homeroomSchedule.phases[0].startTime === '7:20')
assert('Homeroom silent work ends at 7:47', homeroomSchedule.phases[0].endTime === '7:47')
assert('Homeroom clean up starts at 7:47', homeroomSchedule.phases[1].startTime === '7:47')
assert('Homeroom clean up ends at 7:49', homeroomSchedule.phases[1].endTime === '7:49')
assert('Silent work lasts 27 minutes', phaseDurationMs(homeroomSchedule.phases[0]) === 27 * 60_000)
assert('Clean up lasts 2 minutes', phaseDurationMs(homeroomSchedule.phases[1]) === 2 * 60_000)

const blockBefore = getDailyBlockTimeline(t0719)
assert('7:19 is before Carpool/Homeroom', blockBefore.currentBlock === null)
assert('7:19 points to Carpool/Homeroom next', blockBefore.nextBlock?.id === 'carpool-homeroom')

const blockStart = getDailyBlockTimeline(t0720)
assert('7:20 starts Carpool/Homeroom', blockStart.currentBlock?.id === 'carpool-homeroom')
assert('7:20 block label stays canonical', blockStart.currentBlock?.label === 'Carpool/Homeroom')

const homeroomActive = getRoutineTimeline('homeroom-arrival', t0720)
assert('7:20 homeroom routine is active', homeroomActive.status === 'active')
assert('7:20 homeroom routine is silent work', homeroomActive.phase?.id === 'silent-work')
assert('7:20 homeroom suggestion points to math', homeroomActive.suggestion?.screenId === 'math')

const homeroomAfterOfficialBlock = getDailyBlockTimeline(t0746)
assert('7:46 has no canonical block', homeroomAfterOfficialBlock.currentBlock === null)
const transitionActive = getRoutineTimeline('homeroom-arrival', t0746)
assert('7:46 still shows silent work', transitionActive.phase?.id === 'silent-work')
assert('7:46 silent work can extend past the official block', (transitionActive.phase?.endsAt ?? 0) > t0745.getTime())

const cleanUpActive = getRoutineTimeline('homeroom-arrival', t0747)
assert('7:47 switches to clean up', cleanUpActive.phase?.id === 'clean-up')
assert('7:47 clean up runs until 7:49', cleanUpActive.phase?.endsAt === t0749.getTime())
assert('7:49 ends the homeroom routine', getRoutineTimeline('homeroom-arrival', t0749).status === 'finished')
assert('7:50 starts Math block', getDailyBlockTimeline(t0750).currentBlock?.id === 'math')

// Friday / weekend activity
assert('Monday timeline is not idle', getRoutineTimeline('homeroom-arrival', t0720).status !== 'idle')
assert('Saturday timeline is idle', getRoutineTimeline('homeroom-arrival', saturday).status === 'idle')
assert('Saturday has no current block', getDailyBlockTimeline(saturday).currentBlock === null)

// Snack phases and explicit 7/3 split
assert('Snack quiet phase lasts 7 minutes', phaseDurationMs(snackSchedule.phases[0]) === 7 * 60_000)
assert('Snack cleanup phase lasts 3 minutes', phaseDurationMs(snackSchedule.phases[1]) === 3 * 60_000)
assert('Snack 9:05 is quiet snack', getRoutineTimeline('snack-routine', t0905).phase?.id === 'quiet-snack')
assert('Snack 9:11 is still quiet snack', getRoutineTimeline('snack-routine', t0911).phase?.id === 'quiet-snack')
assert('Snack 9:12 switches to cleanup', getRoutineTimeline('snack-routine', t0912).phase?.id === 'silent-clean-up')
assert('Snack 9:15 finishes the routine', getRoutineTimeline('snack-routine', t0915).status === 'finished')

// Lunch phases and 5/8/13/4 split
assert('Lunch quiet phase A lasts 5 minutes', phaseDurationMs(lunchSchedule.phases[0]) === 5 * 60_000)
assert('Lunch silent chew lasts 8 minutes', phaseDurationMs(lunchSchedule.phases[1]) === 8 * 60_000)
assert('Lunch quiet phase B lasts 13 minutes', phaseDurationMs(lunchSchedule.phases[2]) === 13 * 60_000)
assert('Lunch cleanup lasts 4 minutes', phaseDurationMs(lunchSchedule.phases[3]) === 4 * 60_000)
assert('Lunch 12:15 is quiet lunch A', getRoutineTimeline('lunch-routine', t1215).phase?.id === 'quiet-lunch-a')
assert('Lunch 12:20 is silent chew', getRoutineTimeline('lunch-routine', t1220).phase?.id === 'silent-chew')
assert('Lunch 12:28 is quiet lunch B', getRoutineTimeline('lunch-routine', t1228).phase?.id === 'quiet-lunch-b')
assert('Lunch 12:41 is silent cleanup', getRoutineTimeline('lunch-routine', t1241).phase?.id === 'silent-clean-up-lunch')
assert('Lunch 12:45 finishes the routine', getRoutineTimeline('lunch-routine', t1245).status === 'finished')

// Block windows
assert('Math get-ready opens at 7:50', BLOCK_ROUTINE_WINDOWS.find((window) => window.id === 'math-get-ready')?.startTime === '7:50')
assert('Math wrap-up closes at 9:00', BLOCK_ROUTINE_WINDOWS.find((window) => window.id === 'math-wrap-up')?.endTime === '9:00')
assert('Math get-ready is active at 7:51', getBlockRoutineTimeline('math', localDate(2026, 7, 6, 7, 51)).currentWindow?.id === 'math-get-ready')
assert('Math wrap-up is active at 8:59', getBlockRoutineTimeline('math', t0859).currentWindow?.id === 'math-wrap-up')
assert('Math wrap-up is gone at 9:00', getBlockRoutineTimeline('math', t0900).currentWindow === null)
assert('Math has no routine window at 8:10', getBlockRoutineTimeline('math', t0810).currentWindow === null)
assert('Reading get-ready opens at 11:10', getBlockRoutineTimeline('reading', t1110).currentWindow?.id === 'reading-get-ready')
assert('Reading wrap-up is active at 12:09', getBlockRoutineTimeline('reading', localDate(2026, 7, 6, 12, 9)).currentWindow?.id === 'reading-wrap-up')
assert('Reading has no routine window at 11:12', getBlockRoutineTimeline('reading', t1112).currentWindow === null)
assert('Reading block is still active at 12:08', getDailyBlockTimeline(t1208).currentBlock?.id === 'reading')
assert('Reading block clears at 12:10', getDailyBlockTimeline(t1210).currentBlock === null)
assert('Shurley/Writing get-ready opens at 9:20', getBlockRoutineTimeline('writing', t0920).currentWindow?.id === 'shurley-writing-get-ready')
assert('Shurley/Writing wrap-up is active at 9:58', getBlockRoutineTimeline('writing', t0958).currentWindow?.id === 'shurley-writing-wrap-up')
assert('Shurley/Writing has no routine window at 9:22', getBlockRoutineTimeline('writing', t0922).currentWindow === null)
assert('Shurley/Writing wrap-up finishes at 10:00', getBlockRoutineTimeline('writing', t1000).currentWindow === null)
assert('History/Science get-ready opens at 1:15 PM', getBlockRoutineTimeline('history-science', t1315).currentWindow?.id === 'history-science-get-ready')
assert('History/Science wrap-up is active at 1:43 PM', getBlockRoutineTimeline('history-science', t1343).currentWindow?.id === 'history-science-wrap-up')
assert('History/Science has no routine window at 1:17 PM', getBlockRoutineTimeline('history-science', t1317).currentWindow === null)
assert('History/Science block is active at 1:44 PM', getDailyBlockTimeline(t1344).currentBlock?.id === 'history-science')
assert('History/Science block clears at 1:45 PM', getDailyBlockTimeline(t1345).currentBlock === null)
assert('Spelling get-ready opens at 10:40', getBlockRoutineTimeline('spelling', t1040).currentWindow?.id === 'spelling-get-ready')
assert('Spelling has no routine window at 10:42', getBlockRoutineTimeline('spelling', t1042).currentWindow === null)
assert('Lunch block starts at 12:50 as recess', getDailyBlockTimeline(t1250).currentBlock?.id === 'recess')

// Pause, resume, skip, restart, manual override
const pausedHomeroom = buildPausedRoutineControl('homeroom-arrival', undefined, t0746)
assert('Paused homeroom control can be built from timestamps', pausedHomeroom !== null)
assert('Paused control keeps remaining time', (pausedHomeroom?.remainingMs ?? 0) === 60_000)

const pausedTimeline = getRoutineTimeline('homeroom-arrival', t0747, { 'homeroom-arrival': pausedHomeroom! })
assert('Paused timeline stays paused', pausedTimeline.status === 'paused')
assert('Paused timeline preserves the original phase', pausedTimeline.phase?.id === 'silent-work')

const resumedControl = pausedHomeroom
  ? { ...pausedHomeroom, mode: 'manual' as const, endsAt: t0747.getTime() + (pausedHomeroom.remainingMs ?? 0) }
  : null
const resumedTimeline = resumedControl
  ? getRoutineTimeline('homeroom-arrival', localDate(2026, 7, 6, 7, 47, 30), { 'homeroom-arrival': resumedControl })
  : null
assert('Resume reconstruction restores manual mode', resumedTimeline?.status === 'manual')
assert('Resume reconstruction preserves phase id', resumedTimeline?.phase?.id === 'silent-work')

const skipControl = advanceRoutineControlToNextPhase('homeroom-arrival', {
  'homeroom-arrival': buildManualRoutineControl('homeroom-arrival', 'silent-work', undefined, t0746)!,
}, t0746)
assert('Skip advances to the next phase', skipControl?.phaseId === 'clean-up')

const restartControl = restartRoutineControl('homeroom-arrival', {
  'homeroom-arrival': buildManualRoutineControl('homeroom-arrival', 'clean-up', undefined, t0747)!,
}, t0747)
assert('Restart returns to the current phase', restartControl?.phaseId === 'clean-up')
assert('Restart keeps the phase suggestion', restartControl?.suggestion?.screenId === 'math')

const manualOverride = buildManualRoutineControl('homeroom-arrival', 'clean-up', undefined, t0746)
assert('Manual override can target clean up', manualOverride?.phaseId === 'clean-up')
assert('Manual override keeps next-page suggestion', manualOverride?.suggestion?.screenId === 'math')

// Next-screen suggestions and legacy tolerance
const finishedSuggestion = getRoutineTimeline('homeroom-arrival', t0749).suggestion
assert('Finished homeroom still suggests math', finishedSuggestion?.screenId === 'math')
assert('Suggestions can omit screenId safely', normalizeRoutineSuggestion({ label: 'No screen' })?.screenId === undefined)
assert('Legacy recess suggestion remaps from ready-position/carpool-checkout', normalizeRoutineSuggestion({
  label: 'Open Recess',
  screenId: 'ready-position',
  pageId: 'carpool-checkout' as unknown as VibePageId,
})?.screenId === 'recess')
assert('Legacy recess suggestion remaps to recess-play', normalizeRoutineSuggestion({
  label: 'Open Recess',
  screenId: 'ready-position',
  pageId: 'carpool-checkout' as unknown as VibePageId,
})?.pageId === 'recess-play')
assert('Legacy routine control suggestions are normalized', normalizeRoutineControlState({
  mode: 'manual',
  dateKey: '2026-07-06',
  phaseId: 'silent-work',
  phaseLabel: 'Silent Work',
  remainingMs: 60_000,
  endsAt: t0747.getTime(),
  pageId: 'homeroom-arrival' as unknown as VibePageId,
  suggestion: {
    label: 'Open Recess',
    screenId: 'ready-position',
    pageId: 'carpool-checkout' as unknown as VibePageId,
  },
})?.suggestion?.screenId === 'recess')

// Safety and non-mutation checks
const fairnessHistory = [{ studentId: 's1', points: 1 }]
const fairnessSnapshot = JSON.stringify(fairnessHistory)
const mysterySessions = { homeroom: { id: 'session-1', status: 'active' } }
const mysterySnapshot = JSON.stringify(mysterySessions)
const displayTimeline = getRoutineTimeline('lunch-routine', t1215)
assert('Routine display model does not expose student data keys', !('students' in displayTimeline) && !('fairnessHistory' in displayTimeline) && !('activeMysterySessions' in displayTimeline))
assert('Routine display model does not leak sample student names', !JSON.stringify(displayTimeline).includes('Avery'))
void getRoutineTimeline('snack-routine', t0912)
void advanceRoutineControlToNextPhase('lunch-routine', { 'lunch-routine': buildManualRoutineControl('lunch-routine', 'quiet-lunch-a', undefined, t1215)! }, t1215)
assert('Fairness history remains unchanged', JSON.stringify(fairnessHistory) === fairnessSnapshot)
assert('Mystery sessions remain unchanged', JSON.stringify(mysterySessions) === mysterySnapshot)

// Date helpers
assert('Day key uses the injected date', getDayKey(t1215) === '2026-07-06')
assert('Minute conversion is exact', timeToMinutes('12:45') === 765)
assert('Date time conversion preserves local time', sameTime(getDateTimeForMinutes(t1215, 765), t1245.getTime()))

// Track-aware schedule model
assert('Instructional block order matches canonical sequence', assertInstructionalBlockOrder(CANONICAL_DAILY_BLOCKS))
const writingIndex = CANONICAL_DAILY_BLOCKS.findIndex((block) => block.id === 'writing')
const historyIndex = CANONICAL_DAILY_BLOCKS.findIndex((block) => block.id === 'history-science')
assert('Shurley/Writing appears before History/Science', writingIndex >= 0 && historyIndex >= 0 && writingIndex < historyIndex)
assert('Reading block remains in schedule', CANONICAL_DAILY_BLOCKS.some((block) => block.id === 'reading' && block.startTime === '11:10'))
assert('Track 1 resolves to History', resolveHistoryScienceSubject(1) === 'history')
assert('Track 2 resolves to Science', resolveHistoryScienceSubject(2) === 'science')
assert('Track 3 resolves to History', resolveHistoryScienceSubject(3) === 'history')
assert('Track 4 resolves to Science', resolveHistoryScienceSubject(4) === 'science')
assert('Track map covers all four tracks', Object.keys(TRACK_HISTORY_SCIENCE_MAP).length === 4)
const mondayTrack = resolveCurriculumTrack(monday)
assert('Curriculum track resolves for Monday test date', mondayTrack >= 1 && mondayTrack <= 4)
const historyBlock = CANONICAL_DAILY_BLOCKS.find((block) => block.id === 'history-science')!
assert('Track 1 history label resolves', resolveBlockDisplayLabel(historyBlock, 1) === 'History')
assert('Track 2 science label resolves', resolveBlockDisplayLabel(historyBlock, 2) === 'Science')
assert('Snack cleanup suggests Shurley/Writing', snackSchedule.phases[1].nextPageSuggestion?.screenId === 'writing')

// ScheduleBlockModel and track screen routing
const historyBlockModel = toScheduleBlockModel(historyBlock)
assert('ScheduleBlockModel preserves block id', historyBlockModel.blockId === 'history-science')
assert('ScheduleBlockModel includes duration', historyBlockModel.durationMinutes === 30)
assert('ScheduleBlockModel includes track overrides', historyBlockModel.trackOverrides?.[1]?.title === 'History')
assert('Track 1 routes to social-studies screen', resolveBlockScreenId(historyBlock, 1) === 'social-studies')
assert('Track 2 routes to science screen', resolveBlockScreenId(historyBlock, 2) === 'science')
assert('Track 3 routes to social-studies screen', resolveBlockScreenId(historyBlock, 3) === 'social-studies')
assert('Track 4 routes to science screen', resolveBlockScreenId(historyBlock, 4) === 'science')

// Exact instructional block order
const instructionalIds = CANONICAL_DAILY_BLOCKS
  .filter((block) => INSTRUCTIONAL_BLOCK_ORDER.includes(block.id as typeof INSTRUCTIONAL_BLOCK_ORDER[number]))
  .map((block) => block.id)
assert(
  'Instructional blocks appear in canonical order',
  INSTRUCTIONAL_BLOCK_ORDER.every((id, index) => instructionalIds[index] === id),
)
assert('Snack precedes Shurley/Writing in schedule', instructionalIds.indexOf('snack') < instructionalIds.indexOf('writing'))
assert('Recess precedes History/Science in schedule', instructionalIds.indexOf('recess') < instructionalIds.indexOf('history-science'))

const movementBlock = CANONICAL_DAILY_BLOCKS.find((block) => block.id === 'movement')!
assert('Movement block resolves to movement screen', movementBlock.screenId === 'movement')
assert('Movement block does not resolve to science', movementBlock.screenId !== 'science')
assert('resolveBlockScreenId for movement stays movement', resolveBlockScreenId(movementBlock, 1) === 'movement')

const recessBlock = CANONICAL_DAILY_BLOCKS.find((block) => block.id === 'recess')!
const recessTrack1 = resolveBlockPageSuggestion(recessBlock, 1, historyBlock)
assert('Recess Track 1 suggests Open History', recessTrack1?.label === 'Open History')
assert('Recess Track 1 routes to social-studies', recessTrack1?.screenId === 'social-studies')
const recessTrack2 = resolveBlockPageSuggestion(recessBlock, 2, historyBlock)
assert('Recess Track 2 suggests Open Science', recessTrack2?.label === 'Open Science')
assert('Recess Track 2 routes to science', recessTrack2?.screenId === 'science')
const recessTrack3 = resolveBlockPageSuggestion(recessBlock, 3, historyBlock)
assert('Recess Track 3 suggests Open History', recessTrack3?.label === 'Open History')
const recessTrack4 = resolveBlockPageSuggestion(recessBlock, 4, historyBlock)
assert('Recess Track 4 suggests Open Science', recessTrack4?.label === 'Open Science')
assert('Recess block has no static History/Science pageSuggestion', recessBlock.pageSuggestion === undefined)

console.log(`Passed: ${passed}, Failed: ${failed}`)
process.exitCode = failed > 0 ? 1 : 0
