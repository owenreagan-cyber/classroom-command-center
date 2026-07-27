function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { buildLessonPackagesFromPack, buildOmniNotePayload } from './lessonPackageBuilder'
import { detectLessonsFromPresentations, parseLessonTitleFromPresentation } from './lessonDetector'
import {
  hasRequiredPackSections,
  isShurleyTeacherResourcePack,
  parseChapterFromPackName,
  scanTeacherResourcePack,
} from './packScanner'
import { classifySectionResource, mapResourcesForLesson } from './resourceMapper'
import { exportPackTreeFromDrive } from './driveContract'
import { toLibraryLessonPackage } from './packIndexBridge'
import { SHURLEY_CHAPTER_1_PACK_FIXTURE } from './fixtures/shurleyChapter1.fixture'

function testShurleyPackDetected() {
  assert(isShurleyTeacherResourcePack(SHURLEY_CHAPTER_1_PACK_FIXTURE), 'Shurley pack detected')
  assert(hasRequiredPackSections(SHURLEY_CHAPTER_1_PACK_FIXTURE), 'required sections present')
  console.log('  Shurley pack detected OK')
}

function testChapterDetected() {
  const meta = scanTeacherResourcePack(SHURLEY_CHAPTER_1_PACK_FIXTURE)!
  assert(meta.chapter === 1, 'chapter is 1')
  assert(meta.curriculum === 'Shurley English', 'curriculum is Shurley English')
  assert(parseChapterFromPackName('Shurley_Chapter_1_Teacher_Resource_Pack') === 1, 'parse chapter')
  console.log('  chapter detected OK')
}

function testLessonNumbersDetected() {
  const lessons = detectLessonsFromPresentations(SHURLEY_CHAPTER_1_PACK_FIXTURE)
  assert(lessons.length === 4, 'four pilot lessons detected')
  const numbers = lessons.map((l) => l.lessonNumber).join(',')
  assert(numbers === '3,4,5,6', 'lessons 3–6 detected')
  assert(
    parseLessonTitleFromPresentation('Ch.1_Lesson_3_Complete_Sentences.pptx') === 'Complete Sentences',
    'lesson 3 title parsed',
  )
  console.log('  lesson numbers detected OK')
}

function testPresentationMapped() {
  const lessons = detectLessonsFromPresentations(SHURLEY_CHAPTER_1_PACK_FIXTURE)
  const lesson3 = lessons.find((l) => l.lessonNumber === 3)!
  const resources = mapResourcesForLesson(SHURLEY_CHAPTER_1_PACK_FIXTURE, lesson3)
  const presentation = resources.find((r) => r.type === 'presentation')
  assert(Boolean(presentation), 'presentation mapped')
  assert(
    presentation!.filename === 'Ch.1_Lesson_3_Complete_Sentences.pptx',
    'lesson 3 presentation filename',
  )
  assert(
    classifySectionResource('05_Presentations', 'Ch.1_Lesson_3_Complete_Sentences.pptx') ===
      'presentation',
    'presentation classified',
  )
  console.log('  presentation mapped OK')
}

function testTeacherScriptMapped() {
  const lessons = detectLessonsFromPresentations(SHURLEY_CHAPTER_1_PACK_FIXTURE)
  const lesson4 = lessons.find((l) => l.lessonNumber === 4)!
  const resources = mapResourcesForLesson(SHURLEY_CHAPTER_1_PACK_FIXTURE, lesson4)
  const script = resources.find((r) => r.type === 'teacher-notes')
  assert(Boolean(script), 'teacher script mapped')
  assert(script!.filename === 'chapter-01-teacher-scripts.md', 'teacher script filename')
  console.log('  teacher script mapped OK')
}

function testStudentResourcesMapped() {
  const lessons = detectLessonsFromPresentations(SHURLEY_CHAPTER_1_PACK_FIXTURE)
  const lesson5 = lessons.find((l) => l.lessonNumber === 5)!
  const resources = mapResourcesForLesson(SHURLEY_CHAPTER_1_PACK_FIXTURE, lesson5)
  const student = resources.filter((r) => r.type === 'student-resource')
  assert(student.length >= 1, 'student resources mapped')
  assert(
    student.some((r) => r.filename === 'chapter-01-shurley-packet.pdf'),
    'student packet pdf mapped',
  )
  const teacherKey = resources.find((r) => r.type === 'teacher-key')
  assert(Boolean(teacherKey), 'teacher key mapped')
  console.log('  student resources mapped OK')
}

function testLessonPackageCreated() {
  const packages = buildLessonPackagesFromPack(SHURLEY_CHAPTER_1_PACK_FIXTURE)
  const lesson3 = packages.find((p) => p.lessonNumber === 3)!
  assert(
    lesson3.title === 'Shurley Chapter 1 Lesson 3 - Complete Sentences',
    'lesson 3 package title',
  )
  assert(lesson3.workspace === 'shurley', 'workspace is shurley')
  assert(lesson3.omninoteReady === true, 'omninote ready')
  assert(lesson3.resources.some((r) => r.type === 'presentation'), 'has presentation')
  assert(lesson3.resources.some((r) => r.type === 'teacher-notes'), 'has teacher notes')
  assert(lesson3.resources.some((r) => r.type === 'student-resource'), 'has student resource')
  assert(lesson3.resources.some((r) => r.type === 'teacher-key'), 'has teacher key')
  console.log('  lesson package created OK')
}

function testOmniNotePayloadCreated() {
  const packages = buildLessonPackagesFromPack(SHURLEY_CHAPTER_1_PACK_FIXTURE)
  const lesson6 = packages.find((p) => p.lessonNumber === 6)!
  const payload = buildOmniNotePayload(lesson6)
  assert(payload.omninoteReady === true, 'payload omninote ready')
  assert(payload.primaryResource?.type === 'presentation', 'primary is presentation')
  assert(!payload.resources.some((r) => r.type === 'teacher-key'), 'teacher key excluded')
  assert(!payload.resources.some((r) => r.type === 'teacher-notes'), 'teacher notes excluded')
  console.log('  OmniNote payload created OK')
}

function testLibraryBridge() {
  const packages = buildLessonPackagesFromPack(SHURLEY_CHAPTER_1_PACK_FIXTURE)
  const bridged = toLibraryLessonPackage(packages[0]!)
  assert(bridged.subject === 'shurley', 'bridged subject')
  assert(bridged.workspace === 'shurley', 'bridged workspace')
  assert(bridged.resources.length > 0, 'bridged resources')
  console.log('  library bridge OK')
}

function testDriveContractExport() {
  const tree = exportPackTreeFromDrive({
    rootFolderId: 'folder-1',
    rootFolderName: 'Shurley_Chapter_1_Teacher_Resource_Pack',
    folders: [
      { id: 'f-pres', name: '05_Presentations', path: '05_Presentations' },
    ],
    filesByFolderPath: {
      '05_Presentations': [
        {
          id: 'file-1',
          name: 'Ch.1_Lesson_3_Complete_Sentences.pptx',
          path: '05_Presentations/Ch.1_Lesson_3_Complete_Sentences.pptx',
        },
      ],
    },
  })
  assert(tree.rootName === 'Shurley_Chapter_1_Teacher_Resource_Pack', 'drive export root name')
  assert(tree.sections.length === 1, 'drive export section count')
  console.log('  drive contract export OK')
}

console.log('Curriculum pack importer tests')
testShurleyPackDetected()
testChapterDetected()
testLessonNumbersDetected()
testPresentationMapped()
testTeacherScriptMapped()
testStudentResourcesMapped()
testLessonPackageCreated()
testOmniNotePayloadCreated()
testLibraryBridge()
testDriveContractExport()
console.log('All curriculum pack importer tests passed.')
