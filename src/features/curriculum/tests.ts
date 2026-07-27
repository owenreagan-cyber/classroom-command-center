function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import {
  resolveHistoryScienceForDate,
  resolvePacingTrack,
  resolveSchoolWeekNumber,
  resolveTodaysPacing,
  resolveCurrentLesson,
  formatTodayPrepLabelForScreen,
  formatHistoryScienceBlockLabel,
  SUBJECT_PROMOTED_TOOLS,
} from './pacingResolver'
import { createLessonPackageFromPlan, getResourceByKind } from './lessonPackage'
import { formatLessonPlanLabel } from './lessonPlan'
import { DEFAULT_SCHOOL_YEAR, getWeekPlan } from './curriculumRegistry'
import { hydratePacingState } from './pacingStore'

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 9, 0, 0, 0)
}

const july27 = localDate(2026, 7, 27)
const july24 = localDate(2026, 7, 24)

function testDateResolvesCorrectLesson() {
  assert(resolveSchoolWeekNumber(july27) === 2, 'July 27 is school week 2')
  const pacing = resolveTodaysPacing(july27)
  assert(pacing.lessonNumber === 2, 'week 2 lesson number')
  assert(pacing.lessons.math?.displayTitle === 'Saxon Lesson 2', 'math saxon lesson 2')
  assert(pacing.lessons.reading?.displayTitle === 'Lesson 2', 'reading lesson 2')
  assert(pacing.lessons.spelling?.displayTitle === 'Lesson 2', 'spelling lesson 2')
  console.log('  date resolves correct lesson OK')
}

function testTrackResolvesCorrectSubject() {
  assert(resolvePacingTrack(july24) === 1, 'week 1 track 1')
  assert(resolveHistoryScienceForDate(july24) === 'history', 'week 1 history')
  assert(resolvePacingTrack(july27) === 2, 'week 2 track 2')
  assert(resolveHistoryScienceForDate(july27) === 'science', 'week 2 science')
  console.log('  track resolves correct subject OK')
}

function testMathLessonResolvesCorrectly() {
  const math = resolveCurrentLesson('math', july27)!
  assert(math.program === 'saxon-math', 'saxon math program')
  assert(formatLessonPlanLabel(math) === 'Math — Saxon Lesson 2', 'math today prep label')
  console.log('  math lesson resolves correctly OK')
}

function testHistoryScienceRotationRespected() {
  const historyWeek1 = resolveCurrentLesson('history', july24)
  assert(Boolean(historyWeek1), 'history lesson on track 1 week')
  assert(
    formatHistoryScienceBlockLabel(july24) === 'History — Our Community Chapter 1',
    'week 1 history label',
  )

  const scienceWeek2 = resolveCurrentLesson('science', july27)
  assert(Boolean(scienceWeek2), 'science lesson on track 2 week')
  assert(resolveCurrentLesson('history', july27) === null, 'history inactive on science week')
  assert(
    formatHistoryScienceBlockLabel(july27) === 'Science — Plant Structures Lesson 2',
    'week 2 science label',
  )
  console.log('  history/science rotation respected OK')
}

function testReadingLessonResolvesCorrectly() {
  const reading = resolveCurrentLesson('reading', july27)!
  assert(reading.program === 'reading-mastery', 'reading mastery program')
  assert(formatTodayPrepLabelForScreen('reading', july27) === 'Reading — Lesson 2', 'reading label')
  console.log('  reading lesson resolves correctly OK')
}

function testLessonPackageCreationWorks() {
  const math = resolveCurrentLesson('math', july27)!
  const pkg = createLessonPackageFromPlan(math)
  assert(pkg.subject === 'math', 'package subject math')
  assert(pkg.curriculum === 'saxon-math', 'package curriculum saxon')
  assert(pkg.lessonNumber === 2, 'package lesson number')
  assert(pkg.resources.length >= 2, 'package has resources')
  assert(Boolean(getResourceByKind(pkg, 'pdf')), 'package includes pdf resource')
  assert(Boolean(getResourceByKind(pkg, 'teacher-notes')), 'package includes teacher notes')
  console.log('  lesson package creation works OK')
}

function testTodayPrepScreenLabels() {
  assert(
    formatTodayPrepLabelForScreen('math', july27) === 'Math — Saxon Lesson 2',
    'math screen label',
  )
  assert(
    formatTodayPrepLabelForScreen('social-studies', july24) ===
      'History — Our Community Chapter 1',
    'history screen label week 1',
  )
  assert(
    formatTodayPrepLabelForScreen('science', july27) ===
      'Science — Plant Structures Lesson 2',
    'science screen label week 2',
  )
  console.log('  today prep screen labels OK')
}

function testSchoolYearRegistry() {
  assert(DEFAULT_SCHOOL_YEAR.weekPlans.length === 36, '36 week school year')
  const week2 = getWeekPlan(2)
  assert(week2?.trackId === 2, 'week 2 track id')
  assert(week2?.subjectPlans.some((plan) => plan.subjectId === 'math') === true, 'week 2 has math')
  console.log('  school year registry OK')
}

function testPacingPersistenceHydrate() {
  const hydrated = hydratePacingState({
    lessonOverrides: { '2026-07-27': { math: 5, bogus: -1 } },
  })
  assert(hydrated.lessonOverrides['2026-07-27']?.math === 5, 'lesson override persisted')
  assert(!('bogus' in (hydrated.lessonOverrides['2026-07-27'] ?? {})), 'invalid override removed')
  console.log('  pacing persistence hydrate OK')
}

function testSubjectPromotedTools() {
  assert(SUBJECT_PROMOTED_TOOLS.math[0] === 'omninote', 'math promotes omninote')
  assert(SUBJECT_PROMOTED_TOOLS.history.includes('display'), 'history promotes display')
  assert(SUBJECT_PROMOTED_TOOLS.reading.includes('mystery-star'), 'reading promotes mystery star')
  console.log('  subject promoted tools OK')
}

console.log('Curriculum pacing tests')
testDateResolvesCorrectLesson()
testTrackResolvesCorrectSubject()
testMathLessonResolvesCorrectly()
testHistoryScienceRotationRespected()
testReadingLessonResolvesCorrectly()
testLessonPackageCreationWorks()
testTodayPrepScreenLabels()
testSchoolYearRegistry()
testPacingPersistenceHydrate()
testSubjectPromotedTools()
console.log('All curriculum pacing tests passed.')
