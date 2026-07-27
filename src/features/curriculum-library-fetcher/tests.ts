function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { resolveCurrentLesson } from '../curriculum/pacingResolver'
import {
  buildLessonPackage,
  buildLessonPackages,
  buildOmniNotePayload,
  getFetcherReadinessLabel,
} from './lessonPackageBuilder'
import {
  classifyResourceFilename,
  getPrimaryResource,
  isOmniNoteReady,
} from './resourceClassifier'
import {
  detectSubjectFromPath,
  findScannedLesson,
  parseLessonNumber,
  scanDriveFolderTree,
} from './resourceScanner'
import {
  bootstrapPilotIndex,
  findFetchedLesson,
  getLessonResourceDisplayLabels,
  getPilotDetectionSummary,
  hydrateFetcherState,
  isUsingCachedLessonData,
} from './libraryIndexStore'
import { syncCurriculumFromDrive } from './drive/driveSync'
import { MockDriveProvider } from './drive/driveProvider'
import { SAXON_MATH_DRIVE_FIXTURE } from './fixtures/saxonMathLessons.fixture'

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 9, 0, 0, 0)
}

const july27 = localDate(2026, 7, 27)

function testSaxonLesson2Detected() {
  const scanned = scanDriveFolderTree(SAXON_MATH_DRIVE_FIXTURE)
  const lesson2 = findScannedLesson(scanned, 'math', 2)!
  assert(Boolean(lesson2), 'Saxon Lesson 2 folder detected')
  assert(lesson2.curriculum === 'Saxon Math', 'curriculum is Saxon Math')
  assert(lesson2.subject === 'math', 'subject is math')
  assert(lesson2.files.length === 3, 'lesson 2 has 3 files')
  console.log('  Saxon Lesson 2 detected OK')
}

function testLessonNumberParsed() {
  assert(parseLessonNumber('Lesson 02') === 2, 'Lesson 02 → 2')
  assert(parseLessonNumber('Lesson 6') === 6, 'Lesson 6 → 6')
  assert(parseLessonNumber('Unit 3') === null, 'non-lesson rejected')
  assert(
    detectSubjectFromPath('Curriculum/Math/Saxon Math/Lesson 02') === 'math',
    'math subject from path',
  )
  console.log('  lesson number parsed OK')
}

function testPresentationDetected() {
  assert(classifyResourceFilename('lesson2-slides.pdf') === 'presentation', 'slides → presentation')
  assert(
    classifyResourceFilename('lesson4-slideshow.pdf') === 'presentation',
    'slideshow → presentation',
  )
  assert(
    classifyResourceFilename('lesson3-presentation.pdf') === 'presentation',
    'presentation → presentation',
  )
  console.log('  presentation detected OK')
}

function testTeacherScriptDetected() {
  assert(classifyResourceFilename('lesson2-script.pdf') === 'teacher-notes', 'script → teacher-notes')
  assert(
    classifyResourceFilename('lesson5-teacher-script.pdf') === 'teacher-notes',
    'teacher-script → teacher-notes',
  )
  assert(
    classifyResourceFilename('lesson6-notes.pdf') === 'teacher-notes',
    'notes → teacher-notes',
  )
  console.log('  teacher script detected OK')
}

function testLessonPackageCreated() {
  const scanned = scanDriveFolderTree(SAXON_MATH_DRIVE_FIXTURE)
  const lesson2Folder = findScannedLesson(scanned, 'math', 2)!
  const pkg = buildLessonPackage(lesson2Folder)

  assert(pkg.title === 'Saxon Math Lesson 2', 'package title')
  assert(pkg.lessonNumber === 2, 'package lesson number')
  assert(pkg.workspace === 'math', 'package workspace is math')
  assert(pkg.resources.length === 3, 'package has 3 resources')
  assert(pkg.omninoteReady === true, 'package is omninote ready')
  assert(Boolean(getPrimaryResource(pkg.resources)), 'primary resource exists')
  console.log('  lesson package created OK')
}

function testOmniNotePayloadCreated() {
  const scanned = scanDriveFolderTree(SAXON_MATH_DRIVE_FIXTURE)
  const packages = buildLessonPackages(scanned)
  const lesson2 = packages.find((p) => p.lessonNumber === 2)!
  const payload = buildOmniNotePayload(lesson2)

  assert(payload.title === 'Saxon Math Lesson 2', 'payload title')
  assert(payload.subject === 'math', 'payload subject')
  assert(payload.omninoteReady === true, 'payload omninote ready')
  assert(payload.primaryResource?.type === 'presentation', 'primary is presentation')
  assert(payload.resources.length === 2, 'teacher notes excluded from payload')
  console.log('  OmniNote payload created OK')
}

function testPilotScopeLessons2Through6() {
  const scanned = scanDriveFolderTree(SAXON_MATH_DRIVE_FIXTURE)
  assert(scanned.length === 5, 'pilot finds exactly 5 lessons (2–6)')
  const numbers = scanned.map((s) => s.lessonNumber).sort((a, b) => a - b)
  assert(numbers.join(',') === '2,3,4,5,6', 'lessons 2–6 only')
  console.log('  pilot scope lessons 2–6 OK')
}

function testBootstrapPilotIndex() {
  const state = bootstrapPilotIndex()
  assert(Object.keys(state.packages).length === 9, 'bootstrap loads Saxon + Shurley packages')
  assert(state.source === 'fixture', 'source is fixture')
  assert(state.syncStatus === 'offline-cache', 'bootstrap uses offline cache status')
  const lesson4 = findFetchedLesson(state.packages, 'math', 4)
  assert(Boolean(lesson4), 'lesson 4 in index')
  assert(lesson4!.omninoteReady === true, 'lesson 4 ready')
  const shurley3 = findFetchedLesson(state.packages, 'shurley', 3)
  assert(Boolean(shurley3), 'shurley lesson 3 in index')
  assert(shurley3!.workspace === 'shurley', 'shurley lesson 3 workspace')
  console.log('  bootstrap pilot index OK')
}

function testPacingAlignsWithFetcher() {
  const state = bootstrapPilotIndex()
  const plan = resolveCurrentLesson('math', july27)!
  assert(plan.lessonNumber === 2, 'pacing resolves lesson 2 on July 27')
  const fetched = findFetchedLesson(state.packages, 'math', plan.lessonNumber)
  assert(Boolean(fetched), 'fetcher has pacing lesson')
  assert(fetched!.title === 'Saxon Math Lesson 2', 'fetched title matches pacing')
  console.log('  pacing aligns with fetcher OK')
}

function testWorksheetAndAssessmentClassification() {
  assert(classifyResourceFilename('lesson2-practice.pdf') === 'worksheet', 'practice → worksheet')
  assert(classifyResourceFilename('lesson3-assessment.pdf') === 'assessment', 'assessment detected')
  assert(classifyResourceFilename('lesson6-quiz.pdf') === 'assessment', 'quiz → assessment')
  console.log('  worksheet and assessment classification OK')
}

function testReadinessLabel() {
  assert(getFetcherReadinessLabel(true) === 'Ready', 'ready label')
  assert(getFetcherReadinessLabel(false) === 'Partial', 'partial label')
  const resources = [{ type: 'pdf' as const }]
  assert(isOmniNoteReady(resources) === true, 'pdf alone is omninote ready')
  console.log('  readiness label OK')
}

function testHydrateFetcherState() {
  const hydrated = hydrateFetcherState({ packages: {} })
  assert(Object.keys(hydrated.packages).length === 9, 'empty hydrate bootstraps Saxon + Shurley')
  console.log('  hydrate fetcher state OK')
}

function testDetectionSummary() {
  const summary = getPilotDetectionSummary()
  assert(summary.lessonCount === 5, 'summary lesson count')
  assert(summary.lessons.every((l) => l.omninoteReady), 'all pilot lessons ready')
  console.log('  detection summary OK')
}

function testDriveSyncIntegration() {
  const provider = new MockDriveProvider()
  return syncCurriculumFromDrive(provider).then((result) => {
    assert(result.success === true, 'drive sync succeeds')
    assert(result.packageCount === 5, 'drive sync package count')
    console.log('  drive sync integration OK')
  })
}

function testLessonResourceDisplayLabels() {
  const state = bootstrapPilotIndex()
  const lesson2 = findFetchedLesson(state.packages, 'math', 2)!
  const labels = getLessonResourceDisplayLabels(lesson2)
  assert(labels.some((l) => l.label === 'Presentation' && l.present), 'presentation present')
  assert(labels.some((l) => l.label === 'Teacher Notes' && l.present), 'teacher notes present')
  assert(labels.some((l) => l.label === 'Practice' && l.present), 'practice present')
  console.log('  lesson resource display labels OK')
}

function testCachedLessonDataFlag() {
  assert(isUsingCachedLessonData({ driveAvailable: false, syncStatus: 'ready' }), 'cached when unavailable')
  assert(!isUsingCachedLessonData({ driveAvailable: true, syncStatus: 'ready' }), 'live when available')
  console.log('  cached lesson data flag OK')
}

async function runFetcherTests() {
console.log('Curriculum library fetcher tests')
testSaxonLesson2Detected()
testLessonNumberParsed()
testPresentationDetected()
testTeacherScriptDetected()
testLessonPackageCreated()
testOmniNotePayloadCreated()
testPilotScopeLessons2Through6()
testBootstrapPilotIndex()
testPacingAlignsWithFetcher()
testWorksheetAndAssessmentClassification()
testReadinessLabel()
testHydrateFetcherState()
testDetectionSummary()
await testDriveSyncIntegration()
testLessonResourceDisplayLabels()
testCachedLessonDataFlag()
console.log('All curriculum library fetcher tests passed.')
}

void runFetcherTests()
