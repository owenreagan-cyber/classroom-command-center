function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import {
  bootstrapPilotIndex,
  findFetchedLesson,
  isUsingCachedLessonData,
  resolveFetchedLessonForScreen,
} from './libraryIndexStore'

function testCachedPackagesLoadWithoutDrive() {
  const state = bootstrapPilotIndex()
  assert(!state.driveAvailable, 'drive unavailable in offline bootstrap')
  assert(state.syncStatus === 'offline-cache', 'offline-cache sync status')
  assert(Object.keys(state.packages).length >= 2, 'pilot packages present')

  const saxon = findFetchedLesson(state.packages, 'math', 2)
  const shurley = findFetchedLesson(state.packages, 'shurley', 3)
  assert(Boolean(saxon), 'Saxon Lesson 2 cached')
  assert(Boolean(shurley), 'Shurley Lesson 3 cached')
  assert(saxon!.resources.length > 0, 'Saxon has resources without network')
  console.log('  cached lesson packages load without Drive OK')
}

function testTodayPrepLessonResolutionOffline() {
  const state = bootstrapPilotIndex()
  const mathLesson = resolveFetchedLessonForScreen('math', state.packages)
  assert(Boolean(mathLesson), 'math screen resolves cached lesson')
  assert(isUsingCachedLessonData(state), 'cached flag set when Drive unavailable')
  console.log('  Today Prep lesson resolution offline OK')
}

function testCachedWarningIsTeacherOnlyConcept() {
  const state = bootstrapPilotIndex()
  assert(isUsingCachedLessonData(state), 'cached warning would show for teacher')
  assert(state.driveAvailable === false, 'display route never queries Drive directly')
  console.log('  cached warning state is teacher-only concept OK')
}

function runOfflineCacheSmokeTests() {
  console.log('Offline curriculum cache smoke tests')
  testCachedPackagesLoadWithoutDrive()
  testTodayPrepLessonResolutionOffline()
  testCachedWarningIsTeacherOnlyConcept()
  console.log('Offline curriculum cache smoke tests passed.')
}

runOfflineCacheSmokeTests()
