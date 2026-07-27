function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { createLessonPackage } from '../curriculum/lessonPackage'
import { resolveCurrentLesson } from '../curriculum/pacingResolver'
import { importFromDriveIndex, packagesToMap } from './driveImport'
import {
  buildLessonPackageFromFolder,
  detectSubjectFromPath,
  findPackageForLesson,
  parseLessonFolder,
  parseLessonNumber,
  resolveWorkspaceForSubject,
  scanLessonFolders,
} from './lessonScanner'
import {
  buildResourceFromFile,
  classifyResourceFile,
  getPrimaryResource,
  getStudentSafeResources,
  getTeacherResource,
} from './resourceClassifier'
import {
  buildOmniNoteHandoffPayload,
  getMaterialsResource,
  serializeHandoffPayload,
  toBridgeLessonPackage,
} from './omninoteHandoff'
import {
  getReadinessLabel,
  hydrateLibraryState,
  libraryPackageFromPlan,
} from './libraryStore'
import type { DriveFolderIndex, LibraryLessonPackage } from './types'

const SAMPLE_DRIVE_INDEX: DriveFolderIndex = {
  root: 'Teacher AI Workstation',
  folders: [
    {
      path: 'Curriculum/Math/Saxon Math/Lesson 02',
      files: ['lesson2-slides.pdf', 'lesson2-script.pdf', 'lesson2-practice.pdf'],
    },
    {
      path: 'Curriculum/Reading/Reading Mastery/Lesson 01',
      files: ['lesson1-story.pdf', 'lesson1-worksheet.pdf'],
    },
  ],
}

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 9, 0, 0, 0)
}

const july27 = localDate(2026, 7, 27)

function testLessonPackageCreation() {
  const entry = SAMPLE_DRIVE_INDEX.folders[0]!
  const parsed = parseLessonFolder(entry)!
  const pkg = buildLessonPackageFromFolder(parsed, { grade: '4', week: 2 })

  assert(pkg.subject === 'math', 'package subject is math')
  assert(pkg.curriculum === 'Saxon Math', 'package curriculum is Saxon Math')
  assert(Number(pkg.lessonNumber) === 2, 'package lesson number is 2')
  assert(pkg.resources.length === 3, 'package has 3 resources')
  assert(pkg.readiness === 'ready', 'package is ready')
  assert(pkg.workspace === 'math', 'package workspace is math')
  console.log('  lesson package creation OK')
}

function testResourceClassification() {
  assert(classifyResourceFile('lesson2-slides.pdf') === 'presentation', 'slides → presentation')
  assert(classifyResourceFile('lesson2-script.pdf') === 'teacher-notes', 'script → teacher-notes')
  assert(classifyResourceFile('lesson2-practice.pdf') === 'worksheet', 'practice → worksheet')
  assert(classifyResourceFile('unit1-answer-key.pdf') === 'answer-key', 'answer key detected')
  assert(classifyResourceFile('transition-chime.mp3') === 'audio', 'mp3 → audio')
  assert(classifyResourceFile('diagram.png') === 'image', 'png → image')
  assert(classifyResourceFile('intro.mp4') === 'video', 'mp4 → video')
  assert(classifyResourceFile('blank-canvas.pdf') === 'blank-canvas', 'blank canvas detected')
  console.log('  resource classification OK')
}

function testSubjectDetection() {
  assert(
    detectSubjectFromPath('Curriculum/Math/Saxon Math/Lesson 02') === 'math',
    'math subject detected',
  )
  assert(
    detectSubjectFromPath('Curriculum/Reading/Reading Mastery/Lesson 01') === 'reading',
    'reading subject detected',
  )
  assert(parseLessonNumber('Lesson 02') === 2, 'lesson 02 parsed')
  assert(parseLessonNumber('Lesson 15') === 15, 'lesson 15 parsed')
  assert(parseLessonNumber('Unit 3') === null, 'non-lesson folder rejected')
  console.log('  subject detection OK')
}

function testWorkspaceRouting() {
  assert(resolveWorkspaceForSubject('math') === 'math', 'math → math workspace')
  assert(resolveWorkspaceForSubject('reading') === 'reading', 'reading → reading workspace')
  assert(resolveWorkspaceForSubject('spelling') === 'morning', 'spelling → morning workspace')
  assert(resolveWorkspaceForSubject('history') === 'morning', 'history → morning workspace')
  console.log('  workspace routing OK')
}

function testDriveImport() {
  const result = importFromDriveIndex(SAMPLE_DRIVE_INDEX, { grade: '4' })
  assert(result.lessonCount === 2, 'import finds 2 lessons')
  assert(result.root === 'Teacher AI Workstation', 'import preserves root')

  const mathPkg = findPackageForLesson(result.packages, 'math', 2)!
  assert(Boolean(mathPkg), 'math lesson 2 found')
  assert(mathPkg.title.includes('Saxon Math'), 'math package title')

  const map = packagesToMap(result.packages)
  assert(Object.keys(map).length === 2, 'package map has 2 entries')
  console.log('  drive import OK')
}

function testOmniNoteHandoffPayload() {
  const entry = SAMPLE_DRIVE_INDEX.folders[0]!
  const pkg = buildLessonPackageFromFolder(parseLessonFolder(entry)!, { grade: '4' })

  const handoff = buildOmniNoteHandoffPayload(pkg)
  assert(handoff.title === pkg.title, 'handoff title matches')
  assert(handoff.subject === 'math', 'handoff subject is math')
  assert(handoff.grade === '4', 'handoff grade included')
  assert(handoff.resources.length === 2, 'teacher-only resources excluded from student handoff')
  assert(handoff.primaryResource?.type === 'presentation', 'primary is presentation')

  const bridge = toBridgeLessonPackage(pkg)
  assert(bridge.subject === 'math', 'bridge package subject')
  assert(bridge.resource.kind === 'slide-deck', 'bridge resource kind is slide-deck')

  const serialized = serializeHandoffPayload(handoff)
  assert(serialized.includes('"subject":"math"'), 'serialized payload includes subject')
  console.log('  omninote handoff payload OK')
}

function testLibraryPackageFromPlan() {
  const plan = resolveCurrentLesson('math', july27)!
  const pkg = libraryPackageFromPlan(plan)
  assert(pkg.subject === 'math', 'plan package subject')
  assert(Number(pkg.lessonNumber) === 2, 'plan package lesson number')
  assert(pkg.resources.length >= 2, 'plan package has resources')
  console.log('  library package from plan OK')
}

function testReadinessLabels() {
  const resources = [
    buildResourceFromFile('lesson2-slides.pdf', 0, 'test'),
    buildResourceFromFile('lesson2-practice.pdf', 1, 'test'),
  ]
  const pkg: LibraryLessonPackage = {
    id: 'test',
    title: 'Test',
    subject: 'math',
    curriculum: 'Saxon Math',
    lessonNumber: 2,
    resources,
    workspace: 'math',
    annotationMode: 'annotate',
    displayMode: 'student-safe',
    readiness: 'ready',
  }
  assert(getReadinessLabel(pkg.readiness) === 'Ready', 'ready label')
  assert(Boolean(getPrimaryResource(resources)), 'primary resource found')
  assert(Boolean(getTeacherResource(resources)) === false, 'no teacher resource in set')
  assert(Boolean(getMaterialsResource(pkg)), 'materials resource found')
  assert(getStudentSafeResources(resources).length === 2, 'student safe count')
  console.log('  readiness labels OK')
}

function testLibraryPersistenceHydrate() {
  const hydrated = hydrateLibraryState({
    packages: {
      'saxon-math-lesson-02': {
        id: 'saxon-math-lesson-02',
        title: 'Saxon Math Lesson 2',
        subject: 'math',
        curriculum: 'Saxon Math',
        lessonNumber: 2,
        resources: [],
        workspace: 'math',
        annotationMode: 'annotate',
        displayMode: 'student-safe',
      },
    },
    lastImportedAt: 12345,
  })
  assert(hydrated.packages['saxon-math-lesson-02']?.title === 'Saxon Math Lesson 2', 'hydrated package')
  assert(hydrated.lastImportedAt === 12345, 'hydrated timestamp')
  console.log('  library persistence hydrate OK')
}

function testScanLessonFolders() {
  const packages = scanLessonFolders(SAMPLE_DRIVE_INDEX.folders, { grade: '4' })
  assert(packages.length === 2, 'scan finds 2 packages')
  const reading = packages.find((p) => p.subject === 'reading')
  assert(Boolean(reading), 'reading package scanned')
  console.log('  scan lesson folders OK')
}

function testCreateLessonPackageHelper() {
  const pkg = createLessonPackage({
    title: 'Spelling Week 3',
    subject: 'spelling',
    curriculum: 'spelling-curriculum',
    lessonNumber: 3,
    resources: [
      { id: 'r1', title: 'List', kind: 'pdf', source: 'spelling/list.pdf' },
    ],
  })
  assert(pkg.subject === 'spelling', 'curriculum createLessonPackage works')
  console.log('  create lesson package helper OK')
}

console.log('Curriculum library tests')
testLessonPackageCreation()
testResourceClassification()
testSubjectDetection()
testWorkspaceRouting()
testDriveImport()
testOmniNoteHandoffPayload()
testLibraryPackageFromPlan()
testReadinessLabels()
testLibraryPersistenceHydrate()
testScanLessonFolders()
testCreateLessonPackageHelper()
console.log('All curriculum library tests passed.')
