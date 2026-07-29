function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import fs from 'fs'
import path from 'path'

import { bootstrapPilotIndex, findFetchedLesson } from '../curriculum-library-fetcher/libraryIndexStore'
import {
  buildStudentSafeExportPackage,
  canTeachInOmniNote,
  prepareOmniNoteLessonHandoff,
} from './lessonPackageExport'
import { writeHandoffPackageToDisk } from './localHandoffWriter'
import { buildOmniNoteLessonUrlFromAbsolutePath, encodeFileSource, resolveRelativeHandoffPath } from './omniNoteUrl'
import { validateExportPrivacy, isTeacherOnlyOmniNoteKind } from './privacy'

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

function testLocalPathUnderDotLocal() {
  const state = bootstrapPilotIndex()
  const saxon = findFetchedLesson(state.packages, 'math', 2)!
  const shurley = findFetchedLesson(state.packages, 'shurley', 3)!
  const root = '/tmp/classroom-command-center'

  for (const lesson of [saxon, shurley]) {
    const plan = prepareOmniNoteLessonHandoff(lesson, root)
    assert(plan.localPackagePath.includes('/.local/omninote-handoff/'), `${lesson.id} under .local/`)
    assert(plan.localPackagePath.endsWith('/package.json'), `${lesson.id} package.json path`)
    const relative = resolveRelativeHandoffPath(plan.package.id)
    assert(relative.startsWith('.local/omninote-handoff/'), `${lesson.id} relative .local/`)
  }
  console.log('  local path under .local/ OK')
}

function testGitignoreCoversLocal() {
  const gitignore = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8')
  assert(gitignore.includes('.local/'), '.local/ gitignored')
  console.log('  .local/ gitignored OK')
}

function testShurleyChapter1Lesson3Title() {
  const state = bootstrapPilotIndex()
  const shurley = findFetchedLesson(state.packages, 'shurley', 3)!
  const exportPkg = buildStudentSafeExportPackage(shurley)
  assert(exportPkg.title.includes('Shurley'), 'Shurley in title')
  assert(exportPkg.title.includes('Lesson 3') || exportPkg.title.includes('Chapter 1'), 'chapter/lesson in title')
  console.log('  Shurley Chapter 1 Lesson 3 title OK')
}

function testNoTeacherOnlyResourcesInExports() {
  const state = bootstrapPilotIndex()
  for (const [subject, lessonNum] of [['math', 2], ['shurley', 3]] as const) {
    const lesson = findFetchedLesson(state.packages, subject, lessonNum)!
    const exportPkg = buildStudentSafeExportPackage(lesson)
    assert(
      !exportPkg.resources.some((r) => r.teacherOnly || isTeacherOnlyOmniNoteKind(r.type)),
      `${lesson.id} has no teacher-only resources`,
    )
  }
  console.log('  no teacher-only resources in exports OK')
}

function testUrlFullyEncoded() {
  const url = buildOmniNoteLessonUrlFromAbsolutePath(
    'Saxon Math Lesson 2',
    '/tmp/classroom-command-center/.local/omninote-handoff/saxon-math-lesson-02/package.json',
  )
  assert(!url.includes(' '), 'no spaces')
  assert(url.includes('%2F') || url.includes('file%3A%2F%2F'), 'path segments encoded')
  assert(decodeURIComponent(url).includes('Saxon Math Lesson 2') || url.includes('Saxon'), 'title preserved')
  console.log('  URL fully encoded OK')
}

function runTests() {
  console.log('OmniNote handoff export tests:')
  testSaxonLesson2Export()
  testShurleyLesson3Export()
  testShurleyChapter1Lesson3Title()
  testNoTeacherOnlyResourcesInExports()
  testUrlEncoding()
  testUrlFullyEncoded()
  testLocalPathUnderDotLocal()
  testGitignoreCoversLocal()
  testCanTeachGating()
  testLocalWrite()
  console.log('OmniNote handoff export tests passed.')
}

runTests()
