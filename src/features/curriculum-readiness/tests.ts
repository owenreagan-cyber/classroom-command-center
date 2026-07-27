function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { resolveCurrentLesson } from '../curriculum/pacingResolver'
import { createLessonPackageFromPlan } from '../curriculum/lessonPackage'
import { buildLessonPackage } from '../curriculum-library-fetcher/lessonPackageBuilder'
import { findScannedLesson, scanDriveFolderTree } from '../curriculum-library-fetcher/resourceScanner'
import { SAXON_MATH_DRIVE_FIXTURE } from '../curriculum-library-fetcher/fixtures/saxonMathLessons.fixture'
import { bootstrapPilotIndex, findFetchedLesson } from '../curriculum-library-fetcher/libraryIndexStore'
import { isDisplaySafePayload } from '../device-manager/displayTargetService'
import {
  detectAvailableSlots,
  getReadinessResourceChecklist,
  isDisplayReadyFromResources,
  isOmniNoteReadyFromResources,
  isTeacherReadyFromResources,
  scoreLessonReadiness,
} from './readinessScorer'
import { getSubjectReadinessRule } from './readinessRules'
import { scoreLibraryPackageReadiness } from './readinessStore'
import type { CurriculumSubjectId } from '../curriculum/types'
import type { FetcherResourceType } from '../curriculum-library-fetcher/types'
import type { LibraryLessonPackage } from '../curriculum-library-fetcher/types'

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 9, 0, 0, 0)
}

const july27 = localDate(2026, 7, 27)

function testCompleteLessonScores100() {
  const scanned = scanDriveFolderTree(SAXON_MATH_DRIVE_FIXTURE)
  const lesson2 = buildLessonPackage(findScannedLesson(scanned, 'math', 2)!)
  const readiness = scoreLibraryPackageReadiness(lesson2)
  assert(readiness.score === 100, 'complete lesson scores 100')
  assert(readiness.status === 'ready', 'complete lesson status ready')
  assert(readiness.omninoteReady === true, 'omninote ready')
  assert(readiness.displayReady === true, 'display ready')
  assert(readiness.teacherReady === true, 'teacher ready')
  console.log('  complete lesson scores 100 OK')
}

function testMissingTeacherNotesCreatesWarning() {
  const readiness = scoreLessonReadiness({
    lessonId: 'history-lesson-4',
    subject: 'history',
    resources: [
      { type: 'presentation', path: 'history/lesson-4/slides.pdf', filename: 'slides.pdf' },
      { type: 'pdf', path: 'history/lesson-4/student.pdf', filename: 'student.pdf' },
    ],
  })
  assert(readiness.status === 'warning', 'missing teacher notes creates warning')
  assert(readiness.missingRecommended.includes('Teacher Notes'), 'teacher notes in missing recommended')
  assert(readiness.score >= 70 && readiness.score < 100, 'warning score range')
  console.log('  missing teacher notes creates warning OK')
}

function testMissingPresentationCreatesIncomplete() {
  const readiness = scoreLessonReadiness({
    lessonId: 'math-lesson-x',
    subject: 'math',
    resources: [
      { type: 'worksheet', path: 'math/practice.pdf', filename: 'practice.pdf' },
    ],
  })
  assert(readiness.status === 'incomplete', 'missing presentation creates incomplete')
  assert(readiness.missingResources.includes('Presentation'), 'presentation missing')
  assert(readiness.score <= 50, 'incomplete score low')
  console.log('  missing presentation creates incomplete OK')
}

function testOmniNoteReadinessDetected() {
  const resources = [
    { type: 'presentation' as const, path: 'a/slides.pdf', filename: 'slides.pdf' },
  ]
  assert(isOmniNoteReadyFromResources(resources) === true, 'omninote from presentation')
  assert(isOmniNoteReadyFromResources([]) === false, 'omninote false when empty')
  console.log('  OmniNote readiness detected OK')
}

function testDisplayReadinessDetected() {
  const resources = [
    { type: 'worksheet' as const, path: 'a/practice.pdf', filename: 'practice.pdf' },
  ]
  assert(isDisplayReadyFromResources(resources) === true, 'display ready from worksheet')
  const teacherOnly = [
    { type: 'teacher-notes' as const, path: '02_Teacher_Scripts/script.md', filename: 'script.md' },
  ]
  assert(isDisplayReadyFromResources(teacherOnly) === false, 'display not ready teacher only')
  console.log('  display readiness detected OK')
}

function testTeacherReadyDetected() {
  const resources = [
    { type: 'teacher-notes' as const, path: 'script.pdf', filename: 'script.pdf' },
  ]
  assert(isTeacherReadyFromResources(resources) === true, 'teacher ready with notes')
  console.log('  teacher ready detected OK')
}

function testSubjectRulesRegistered() {
  assert(getSubjectReadinessRule('math').required.length === 2, 'math required groups')
  assert(getSubjectReadinessRule('shurley').recommended.includes('teacher-key'), 'shurley teacher key recommended')
  assert(getSubjectReadinessRule('reading').required[0]!.oneOf.includes('lesson-resource'), 'reading lesson resource rule')
  console.log('  subject rules registered OK')
}

function testTeacherOverrideAllowsReady() {
  const readiness = scoreLessonReadiness({
    lessonId: 'history-lesson-4',
    subject: 'history',
    resources: [{ type: 'pdf', path: 'student.pdf', filename: 'student.pdf' }],
    teacherOverride: true,
  })
  assert(readiness.status === 'ready', 'override marks ready')
  assert(readiness.score === 100, 'override score 100')
  assert(readiness.teacherOverride === true, 'override flag set')
  console.log('  teacher override allows ready OK')
}

function testSaxonLesson2IntegrationReady() {
  const state = bootstrapPilotIndex()
  const lesson2 = findFetchedLesson(state.packages, 'math', 2)!
  assert(lesson2.readiness?.status === 'ready', 'Saxon Lesson 2 ready')
  assert(lesson2.readiness?.score === 100, 'Saxon Lesson 2 score 100')
  const plan = resolveCurrentLesson('math', july27)!
  assert(plan.lessonNumber === 2, 'pacing aligns lesson 2')
  console.log('  Saxon Lesson 2 integration ready OK')
}

function testShurleyLesson3IntegrationReady() {
  const state = bootstrapPilotIndex()
  const lesson3 = findFetchedLesson(state.packages, 'shurley', 3)!
  assert(lesson3.readiness?.status === 'ready', 'Shurley Lesson 3 ready')
  assert(lesson3.readiness?.omninoteReady === true, 'Shurley Lesson 3 omninote ready')
  console.log('  Shurley Lesson 3 integration ready OK')
}

function testIncompleteLessonWarningWorks() {
  const incomplete: LibraryLessonPackage = {
    id: 'history-lesson-incomplete',
    title: 'History Lesson 4',
    subject: 'history' as CurriculumSubjectId,
    curriculum: 'history-units',
    lessonNumber: 4,
    workspace: 'morning',
    resources: [
      {
        id: 'r1',
        filename: 'packet.pdf',
        type: 'pdf' as FetcherResourceType,
        path: 'history/packet.pdf',
      },
    ],
    omninoteReady: true,
  }
  const readiness = scoreLibraryPackageReadiness(incomplete)
  assert(readiness.status === 'incomplete' || readiness.status === 'warning', 'incomplete lesson warns')
  const checklist = getReadinessResourceChecklist('history', incomplete.resources)
  assert(checklist.some((row) => !row.present), 'checklist shows missing row')
  console.log('  incomplete lesson warning works OK')
}

function testReadinessBlockedFromDisplay() {
  const unsafe = {
    readiness: { status: 'warning', score: 85 },
    missingResources: ['Teacher Notes'],
    lessonReadiness: { teacherReady: false },
  }
  assert(!isDisplaySafePayload(unsafe), 'readiness metadata blocked from display')
  console.log('  readiness blocked from display OK')
}

function testCurriculumLessonPackageHasReadiness() {
  const plan = resolveCurrentLesson('math', july27)!
  const pkg = createLessonPackageFromPlan(plan)
  assert(Boolean(pkg.readiness), 'curriculum lesson package has readiness')
  assert(pkg.readiness!.score === 100, 'default math package ready')
  console.log('  curriculum lesson package has readiness OK')
}

function testAvailableSlotsDetection() {
  const slots = detectAvailableSlots([
    { type: 'presentation', path: 'slides.pdf', filename: 'slides.pdf' },
    { type: 'worksheet', path: 'practice.pdf', filename: 'lesson2-practice.pdf' },
    { type: 'teacher-notes', path: 'script.pdf', filename: 'script.pdf' },
  ])
  assert(slots.has('presentation'), 'presentation slot')
  assert(slots.has('student-resource'), 'student resource slot')
  assert(slots.has('practice'), 'practice slot')
  assert(slots.has('teacher-notes'), 'teacher notes slot')
  console.log('  available slots detection OK')
}

console.log('Curriculum readiness tests')
testCompleteLessonScores100()
testMissingTeacherNotesCreatesWarning()
testMissingPresentationCreatesIncomplete()
testOmniNoteReadinessDetected()
testDisplayReadinessDetected()
testTeacherReadyDetected()
testSubjectRulesRegistered()
testTeacherOverrideAllowsReady()
testSaxonLesson2IntegrationReady()
testShurleyLesson3IntegrationReady()
testIncompleteLessonWarningWorks()
testReadinessBlockedFromDisplay()
testCurriculumLessonPackageHasReadiness()
testAvailableSlotsDetection()
console.log('All curriculum readiness tests passed.')
