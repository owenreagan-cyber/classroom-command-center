function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { bootstrapPilotIndex, findFetchedLesson } from '../curriculum-library-fetcher/libraryIndexStore'
import {
  buildStudentSafeExportPackage,
  canTeachInOmniNote,
  prepareOmniNoteLessonHandoff,
} from './lessonPackageExport'
import { writeHandoffPackageToDisk } from './localHandoffWriter'
import { buildOmniNoteLessonUrlFromAbsolutePath, encodeFileSource } from './omniNoteUrl'
import { validateExportPrivacy } from './privacy'

function testSaxonLesson2Export() {
  const state = bootstrapPilotIndex()
  const saxon = findFetchedLesson(state.packages, 'math', 2)
  assert(Boolean(saxon), 'Saxon Lesson 2 found')
  assert(saxon!.omninoteReady, 'Saxon Lesson 2 omninote ready')

  const exportPkg = buildStudentSafeExportPackage(saxon!)
  assert(exportPkg.title === 'Saxon Math Lesson 2', 'export title')
  assert(exportPkg.resources.some((r) => r.type === 'presentation'), 'has presentation')
  assert(!exportPkg.resources.some((r) => r.teacherOnly), 'no teacher-only in student export')
  assert(!exportPkg.resources.some((r) => r.type === 'teacherNotes'), 'no teacher notes')
  assert(validateExportPrivacy(exportPkg).length === 0, 'Saxon privacy clean')

  const plan = prepareOmniNoteLessonHandoff(saxon!, '/tmp/classroom-command-center')
  assert(plan.deepLink.startsWith('omninote://lesson?'), 'Saxon deep link scheme')
  assert(plan.deepLink.includes('type=lessonPackage'), 'Saxon lesson package type')
  assert(plan.deepLink.includes('title=Saxon'), 'Saxon title param present')
  assert(plan.deepLink.includes('Math'), 'Saxon title content present')
  assert(!plan.deepLink.includes('lesson2-script'), 'no teacher script in URL')
  assert(!plan.deepLink.includes('token'), 'no token in URL')
  console.log('  Saxon Lesson 2 export OK')
}

function testShurleyLesson3Export() {
  const state = bootstrapPilotIndex()
  const shurley = findFetchedLesson(state.packages, 'shurley', 3)
  assert(Boolean(shurley), 'Shurley Lesson 3 found')
  assert(shurley!.omninoteReady, 'Shurley Lesson 3 omninote ready')

  const exportPkg = buildStudentSafeExportPackage(shurley!)
  assert(exportPkg.title.includes('Lesson 3'), 'Shurley export title')
  assert(exportPkg.workspace === 'shurley', 'Shurley workspace')
  assert(!exportPkg.resources.some((r) => r.type === 'teacherKey'), 'no teacher key in export')
  assert(!exportPkg.resources.some((r) => r.type === 'answerKey'), 'no answer key in export')
  assert(validateExportPrivacy(exportPkg).length === 0, 'Shurley privacy clean')

  const plan = prepareOmniNoteLessonHandoff(shurley!, '/tmp/classroom-command-center')
  assert(plan.deepLink.includes('type=lessonPackage'), 'Shurley lesson package type')
  assert(!plan.packageJson.includes('readiness'), 'no readiness metadata')
  assert(!plan.packageJson.includes('drivePath'), 'no drive path metadata')
  console.log('  Shurley Lesson 3 export OK')
}

function testUrlEncoding() {
  const url = buildOmniNoteLessonUrlFromAbsolutePath(
    'Saxon Math Lesson 2',
    '/tmp/classroom-command-center/.local/omninote-handoff/saxon-math-lesson-02/package.json',
  )
  assert(url.includes('title=Saxon'), 'title param present')
  assert(url.includes('Math'), 'title words present')
  assert(url.includes('source=file'), 'file source present')
  assert(!url.includes(' '), 'no raw spaces in URL')
  console.log('  URL encoding OK')
}

function testCanTeachGating() {
  const state = bootstrapPilotIndex()
  const saxon = findFetchedLesson(state.packages, 'math', 2)!
  assert(canTeachInOmniNote(saxon, 'ready'), 'ready lesson can teach')
  assert(!canTeachInOmniNote(saxon, 'warning'), 'warning blocks teach')
  assert(canTeachInOmniNote(saxon, 'warning', true), 'override allows teach')
  console.log('  teach gating OK')
}

function testLocalWrite() {
  const state = bootstrapPilotIndex()
  const saxon = findFetchedLesson(state.packages, 'math', 2)!
  const plan = prepareOmniNoteLessonHandoff(saxon, `/tmp/omninote-handoff-test-cc-${Date.now()}`)
  const written = writeHandoffPackageToDisk(plan)
  assert(written.length >= 1, 'at least package written')
  assert(written.some((p) => p.endsWith('package.json')), 'package.json written')
  assert(written.some((p) => p.includes('lesson2-slides.pdf')), 'slides pdf written')

  const source = encodeFileSource(plan.localPackagePath)
  assert(source.startsWith('file://'), 'file source URL')
  console.log('  local write OK')
}

function runTests() {
  console.log('OmniNote handoff export tests:')
  testSaxonLesson2Export()
  testShurleyLesson3Export()
  testUrlEncoding()
  testCanTeachGating()
  testLocalWrite()
  console.log('OmniNote handoff export tests passed.')
}

runTests()
