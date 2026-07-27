function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

import { resolveCurrentLesson } from '../../curriculum/pacingResolver'
import {
  buildLessonPackage,
  buildOmniNotePayload,
  getFetcherReadinessLabel,
} from '../lessonPackageBuilder'
import {
  classifyResourceFilename,
  getStudentSafeResources,
} from '../resourceClassifier'
import {
  detectSubjectFromPath,
  findScannedLesson,
  parseLessonNumber,
  scanDriveFolderTree,
} from '../resourceScanner'
import {
  bootstrapPilotIndex,
  getLessonResourceDisplayLabels,
  hydrateFetcherState,
  isUsingCachedLessonData,
  toBridgeLessonPackageFromFetcher,
} from '../libraryIndexStore'
import { SAXON_MATH_DRIVE_FIXTURE } from '../fixtures/saxonMathLessons.fixture'
import { MockDriveProvider } from './driveProvider'
import { normalizeFolderTree } from './driveMapper'
import {
  buildCacheFromSync,
  hydrateCache,
  hasUsableCache,
  serializeCache,
} from './driveCache'
import { applySyncResult, syncCurriculumFromDrive } from './driveSync'
import { listLessonFolderPaths } from './driveMapper'

function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 9, 0, 0, 0)
}

const july27 = localDate(2026, 7, 27)

function testMockProviderFolderTree() {
  const provider = new MockDriveProvider()
  const tree = provider.getFolderTree()
  return tree.then((t) => {
    assert(t.folders.length >= 5, 'mock tree has lesson folders')
    const paths = listLessonFolderPaths(t)
    assert(paths.some((p) => p.includes('Lesson 02')), 'Lesson 02 in tree')
    console.log('  mock provider folder tree OK')
  })
}

function testMockProviderFileMetadata() {
  const provider = new MockDriveProvider()
  return provider.getFileMetadata('file-Curriculum/Math/Saxon Math/Lesson 02-0').then((meta) => {
    assert(Boolean(meta), 'file metadata resolved')
    assert(meta!.name === 'lesson2-slides.pdf', 'file name correct')
    assert(!meta!.id.includes('drive.google'), 'no real drive IDs exposed')
    console.log('  mock provider file metadata OK')
  })
}

function testDriveTreeMapsToScanner() {
  const provider = new MockDriveProvider()
  return provider.getFolderTree().then((tree) => {
    const normalized = normalizeFolderTree(tree)
    const scanned = scanDriveFolderTree(normalized)
    assert(scanned.length === 5, 'drive tree scans to 5 pilot lessons')
    console.log('  drive tree maps to scanner OK')
  })
}

function testCacheSaveLoad() {
  const state = bootstrapPilotIndex()
  const cache = buildCacheFromSync(state.packages, true)
  const raw = JSON.parse(serializeCache(cache))
  const hydrated = hydrateCache(raw)
  assert(Object.keys(hydrated.packages).length === 9, 'cache round-trip preserves packages')
  assert(hydrated.syncStatus === 'ready', 'cache sync status ready')
  assert(hydrated.driveAvailable === true, 'cache drive available')
  console.log('  cache save/load OK')
}

function testOfflineFallback() {
  const offlineProvider = new MockDriveProvider(SAXON_MATH_DRIVE_FIXTURE, false)
  const existing = buildCacheFromSync(bootstrapPilotIndex().packages, true)
  return syncCurriculumFromDrive(offlineProvider, existing).then((result) => {
    assert(result.syncStatus === 'offline-cache', 'offline sync status')
    assert(result.success === true, 'offline fallback uses cache')
    assert(result.message.includes('cached'), 'offline message mentions cache')
    console.log('  offline fallback OK')
  })
}

function testSyncFromDrive() {
  const provider = new MockDriveProvider()
  return syncCurriculumFromDrive(provider).then((result) => {
    assert(result.success === true, 'sync succeeds')
    assert(result.syncStatus === 'ready', 'sync status ready')
    assert(result.packageCount === 5, 'sync finds 5 packages')
    console.log('  sync from drive OK')
  })
}

function testApplySyncOfflineKeepsCache() {
  const existing = buildCacheFromSync(bootstrapPilotIndex().packages, true)
  const result = {
    success: true,
    packageCount: 5,
    syncStatus: 'offline-cache' as const,
    message: 'Using cached lesson data',
  }
  const applied = applySyncResult(result, existing)
  assert(Object.keys(applied.packages).length === 9, 'offline apply keeps packages')
  assert(applied.syncStatus === 'offline-cache', 'offline apply status')
  console.log('  apply sync offline keeps cache OK')
}

function testIntegrationSaxonLesson2Pipeline() {
  const provider = new MockDriveProvider()
  return provider.getFolderTree().then((tree) => {
    const scanned = scanDriveFolderTree(normalizeFolderTree(tree))
    const lesson2Folder = findScannedLesson(scanned, 'math', 2)!
    const pkg = buildLessonPackage(lesson2Folder)
    const payload = buildOmniNotePayload(pkg)
    const labels = getLessonResourceDisplayLabels(pkg)

    assert(pkg.title === 'Saxon Math Lesson 2', 'integration title')
    assert(getFetcherReadinessLabel(pkg.omninoteReady) === 'Ready', 'integration ready')
    assert(labels.some((l) => l.label === 'Presentation' && l.present), 'presentation label')
    assert(labels.some((l) => l.label === 'Practice' && l.present), 'practice label')
    assert(payload.omninoteReady === true, 'omninote payload ready')
    assert(payload.resources.every((r) => r.type !== 'teacher-notes'), 'teacher notes excluded from payload')

    const bridge = toBridgeLessonPackageFromFetcher(pkg)
    assert(bridge.resource.kind === 'slide-deck', 'bridge kind slide-deck')
    assert(Boolean(bridge.resource.source), 'bridge has source path')

    const plan = resolveCurrentLesson('math', july27)!
    assert(plan.lessonNumber === 2, 'pacing lesson 2 on July 27')
    console.log('  integration Saxon Lesson 2 pipeline OK')
  })
}

function testStudentSafeResourcesExcludeTeacherNotes() {
  const scanned = scanDriveFolderTree(SAXON_MATH_DRIVE_FIXTURE)
  const pkg = buildLessonPackage(findScannedLesson(scanned, 'math', 2)!)
  const safe = getStudentSafeResources(pkg.resources)
  assert(!safe.some((r) => r.type === 'teacher-notes'), 'teacher notes excluded from student safe')
  assert(safe.length === 2, '2 student-safe resources for lesson 2')
  console.log('  student safe resources exclude teacher notes OK')
}

function testHydrateFetcherStateWithSyncFields() {
  const hydrated = hydrateFetcherState({
    packages: bootstrapPilotIndex().packages,
    source: 'drive',
    syncStatus: 'ready',
    driveAvailable: true,
  })
  assert(hydrated.syncStatus === 'ready', 'hydrate sync status')
  assert(hydrated.driveAvailable === true, 'hydrate drive available')
  console.log('  hydrate fetcher state with sync fields OK')
}

function testIsUsingCachedLessonData() {
  assert(isUsingCachedLessonData({ driveAvailable: false, syncStatus: 'ready' }) === true, 'not available = cached')
  assert(isUsingCachedLessonData({ driveAvailable: true, syncStatus: 'offline-cache' }) === true, 'offline status = cached')
  assert(isUsingCachedLessonData({ driveAvailable: true, syncStatus: 'ready' }) === false, 'live ready = not cached')
  console.log('  is using cached lesson data OK')
}

function testHasUsableCache() {
  assert(hasUsableCache(buildCacheFromSync(bootstrapPilotIndex().packages, false)) === true, 'has usable cache')
  assert(hasUsableCache(buildCacheFromSync({}, false)) === false, 'empty cache not usable')
  console.log('  has usable cache OK')
}

function testClassificationUnchanged() {
  assert(classifyResourceFilename('lesson2-slides.pdf') === 'presentation', 'presentation rule preserved')
  assert(classifyResourceFilename('lesson2-script.pdf') === 'teacher-notes', 'teacher notes rule preserved')
  assert(classifyResourceFilename('lesson2-practice.pdf') === 'worksheet', 'worksheet rule preserved')
  console.log('  classification unchanged OK')
}

function testParseLessonNumber() {
  assert(parseLessonNumber('Lesson 02') === 2, 'Lesson 02 → 2')
  assert(detectSubjectFromPath('Curriculum/Math/Saxon Math/Lesson 02') === 'math', 'math subject')
  console.log('  parse lesson number OK')
}

async function runAllTests() {
  console.log('Drive connector tests')
  await testMockProviderFolderTree()
  await testMockProviderFileMetadata()
  await testDriveTreeMapsToScanner()
  testCacheSaveLoad()
  await testOfflineFallback()
  await testSyncFromDrive()
  testApplySyncOfflineKeepsCache()
  await testIntegrationSaxonLesson2Pipeline()
  testStudentSafeResourcesExcludeTeacherNotes()
  testHydrateFetcherStateWithSyncFields()
  testIsUsingCachedLessonData()
  testHasUsableCache()
  testClassificationUnchanged()
  testParseLessonNumber()
  console.log('All drive connector tests passed.')
}

void runAllTests()
