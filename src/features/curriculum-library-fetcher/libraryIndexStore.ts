import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurriculumSubjectId } from '../curriculum/types'
import { resolveCurrentLesson } from '../curriculum/pacingResolver'
import { resolveSubjectFromScreen } from '../curriculum/pacingResolver'
import type { ScreenId } from '../../data/types'
import { buildLessonPackage as buildBridgePackage } from '../omninote-bridge/types'
import type { LessonPackage as BridgeLessonPackage } from '../omninote-bridge/types'
import { SAXON_MATH_DRIVE_FIXTURE } from './fixtures/saxonMathLessons.fixture'
import { buildLessonPackagesFromPack } from '../curriculum-pack-importer/lessonPackageBuilder'
import { SHURLEY_CHAPTER_1_PACK_FIXTURE } from '../curriculum-pack-importer/fixtures/shurleyChapter1.fixture'
import {
  toLibraryLessonPackages,
} from '../curriculum-pack-importer/packIndexBridge'
import {
  attachReadinessToPackages,
  scoreLibraryPackageReadiness,
} from '../curriculum-readiness/readinessStore'
import {
  getReadinessResourceChecklist,
  getReadinessStatusLabel,
} from '../curriculum-readiness/readinessScorer'
import {
  buildLessonPackages,
  buildOmniNotePayload,
  getFetcherReadinessLabel,
} from './lessonPackageBuilder'
import { getPrimaryResource, getTeacherResource } from './resourceClassifier'
import { findScannedLesson, scanDriveFolderTree } from './resourceScanner'
import { createDefaultDriveProvider } from './drive/driveProvider'
import type { DriveFolderProvider } from './drive/driveProvider'
import { applySyncResult, bootstrapPackagesFromTree, syncCurriculumFromDrive } from './drive/driveSync'
import { formatCacheAge, hasUsableCache } from './drive/driveCache'
import type {
  CurriculumSyncStatus,
  DriveFolderTree,
  FetcherIndexState,
  FetcherResourceType,
  LibraryLessonPackage,
  LessonResource,
} from './types'
import { FETCHER_STORAGE_KEY, FETCHER_STORAGE_VERSION } from './types'

export const DEFAULT_FETCHER_STATE: FetcherIndexState = {
  version: FETCHER_STORAGE_VERSION,
  packages: {},
  lastScannedAt: null,
  source: null,
  syncStatus: 'offline-cache',
  driveAvailable: false,
}

function packagesFromTree(tree: DriveFolderTree): Record<string, LibraryLessonPackage> {
  return bootstrapPackagesFromTree(tree)
}

function shurleyPackPackages(): Record<string, LibraryLessonPackage> {
  const packages = buildLessonPackagesFromPack(SHURLEY_CHAPTER_1_PACK_FIXTURE)
  return toLibraryLessonPackages(packages)
}

function mergePilotPackages(
  saxon: Record<string, LibraryLessonPackage>,
  shurley: Record<string, LibraryLessonPackage>,
): Record<string, LibraryLessonPackage> {
  return { ...saxon, ...shurley }
}

function bootstrapAllPilotPackages(): Record<string, LibraryLessonPackage> {
  return attachReadinessToPackages(
    mergePilotPackages(
      packagesFromTree(SAXON_MATH_DRIVE_FIXTURE),
      shurleyPackPackages(),
    ),
  )
}

/** Bootstrap pilot index from Saxon Math + Shurley pack fixtures (offline fallback). */
export function bootstrapPilotIndex(): FetcherIndexState {
  return {
    version: FETCHER_STORAGE_VERSION,
    packages: bootstrapAllPilotPackages(),
    lastScannedAt: Date.now(),
    source: 'fixture',
    syncStatus: 'offline-cache',
    driveAvailable: false,
  }
}

export function hydrateFetcherState(raw: unknown): FetcherIndexState {
  if (!raw || typeof raw !== 'object') return bootstrapPilotIndex()
  const input = raw as Partial<FetcherIndexState>
  const packages: Record<string, LibraryLessonPackage> = {}
  if (input.packages && typeof input.packages === 'object') {
    for (const [id, pkg] of Object.entries(input.packages)) {
      if (pkg && typeof pkg === 'object' && typeof pkg.title === 'string') {
        packages[id] = pkg as LibraryLessonPackage
      }
    }
  }
  if (Object.keys(packages).length === 0) {
    return bootstrapPilotIndex()
  }
  const syncStatus: CurriculumSyncStatus =
    input.syncStatus === 'ready' || input.syncStatus === 'syncing' || input.syncStatus === 'offline-cache'
      ? input.syncStatus
      : input.source === 'drive'
        ? 'ready'
        : 'offline-cache'
  return {
    version: FETCHER_STORAGE_VERSION,
    packages,
    lastScannedAt: typeof input.lastScannedAt === 'number' ? input.lastScannedAt : null,
    source:
      input.source === 'drive'
        ? 'drive'
        : input.source === 'cache'
          ? 'cache'
          : 'fixture',
    syncStatus,
    driveAvailable: input.driveAvailable === true,
  }
}

interface LibraryIndexStore extends FetcherIndexState {
  scanFolderTree: (tree: DriveFolderTree) => void
  getPackageById: (id: string) => LibraryLessonPackage | undefined
  getPackageForLesson: (
    subject: CurriculumSubjectId,
    lessonNumber: number,
  ) => LibraryLessonPackage | undefined
  getAllPackages: () => LibraryLessonPackage[]
  rescanPilotFixture: () => void
  syncCurriculumLibrary: (provider?: DriveFolderProvider) => Promise<{ message: string }>
}

export const useLibraryIndexStore = create<LibraryIndexStore>()(
  persist(
    (set, get) => ({
      ...bootstrapPilotIndex(),

      scanFolderTree: (tree) => {
        const packages = packagesFromTree(tree)
        set({
          packages,
          lastScannedAt: Date.now(),
          source: 'drive',
          syncStatus: 'ready',
          driveAvailable: true,
        })
      },

      getPackageById: (id) => get().packages[id],

      getPackageForLesson: (subject, lessonNumber) => {
        return Object.values(get().packages).find(
          (pkg) => pkg.subject === subject && pkg.lessonNumber === lessonNumber,
        )
      },

      getAllPackages: () => Object.values(get().packages),

      rescanPilotFixture: () => {
        set(bootstrapPilotIndex())
      },

      syncCurriculumLibrary: async (provider = createDefaultDriveProvider()) => {
        set({ syncStatus: 'syncing' })
        const current = get()
        const result = await syncCurriculumFromDrive(provider, {
          version: 1,
          lastSyncAt: current.lastScannedAt,
          packages: current.packages,
          source: current.source,
          syncStatus: current.syncStatus,
          driveAvailable: current.driveAvailable,
        })

        if (result.syncStatus === 'ready' && result.tree) {
          const packages = packagesFromTree(result.tree)
          set({
            packages,
            lastScannedAt: Date.now(),
            source: 'drive',
            syncStatus: 'ready',
            driveAvailable: true,
          })
          return { message: result.message }
        }

        const cache = applySyncResult(result, {
          version: 1,
          lastSyncAt: current.lastScannedAt,
          packages: current.packages,
          source: current.source,
          syncStatus: current.syncStatus,
          driveAvailable: current.driveAvailable,
        })
        set({
          packages: cache.packages,
          syncStatus: cache.syncStatus,
          driveAvailable: cache.driveAvailable,
          source: cache.source,
        })
        return { message: result.message }
      },
    }),
    {
      name: FETCHER_STORAGE_KEY,
      version: FETCHER_STORAGE_VERSION,
      partialize: (state) => ({
        version: state.version,
        packages: state.packages,
        lastScannedAt: state.lastScannedAt,
        source: state.source,
        syncStatus: state.syncStatus,
        driveAvailable: state.driveAvailable,
      }),
      migrate: (persisted) => hydrateFetcherState(persisted),
    },
  ),
)

/** Resolve fetched lesson for active screen using pacing + index. */
export function resolveFetchedLessonForScreen(
  screenId: ScreenId,
  packages: Record<string, LibraryLessonPackage>,
  date = new Date(),
): LibraryLessonPackage | null {
  const subjectId = resolveSubjectFromScreen(screenId, date)
  if (!subjectId) return null

  const plan = resolveCurrentLesson(subjectId, date)
  if (!plan) return null

  const fetched = Object.values(packages).find(
    (pkg) => pkg.subject === subjectId && pkg.lessonNumber === plan.lessonNumber,
  )
  return fetched ?? null
}

export function getMaterialsResourceFromPackage(
  pkg: LibraryLessonPackage,
): LessonResource | undefined {
  return getTeacherResource(pkg.resources) ?? getPrimaryResource(pkg.resources)
}

/** Readiness-aware resource checklist for Today Prep (teacher control only). */
export function getLessonReadinessChecklist(
  pkg: LibraryLessonPackage,
): Array<{ label: string; present: boolean; recommended?: boolean }> {
  return getReadinessResourceChecklist(pkg.subject, pkg.resources)
}

/** Full readiness score for a library package. */
export function getLibraryLessonReadiness(
  pkg: LibraryLessonPackage,
  overrides: Record<string, boolean> = {},
) {
  return scoreLibraryPackageReadiness(pkg, overrides)
}

export function getLessonReadinessStatusLabel(
  pkg: LibraryLessonPackage,
  overrides: Record<string, boolean> = {},
): string {
  const readiness = pkg.readiness ?? scoreLibraryPackageReadiness(pkg, overrides)
  return getReadinessStatusLabel(readiness.status, readiness.teacherOverride)
}

/** Student-safe resource labels for Today Prep display (no teacher notes / answer keys). */
export function getLessonResourceDisplayLabels(
  pkg: LibraryLessonPackage,
): Array<{ label: string; present: boolean }> {
  return getLessonReadinessChecklist(pkg).map((item) => ({
    label: item.label,
    present: item.present,
  }))
}

/** Whether UI should show offline cache banner. */
export function isUsingCachedLessonData(state: Pick<FetcherIndexState, 'driveAvailable' | 'syncStatus'>): boolean {
  return !state.driveAvailable || state.syncStatus === 'offline-cache'
}

/** Cache status label for Teacher Dock Curriculum Sync tool. */
export function getSyncStatusLabel(status: CurriculumSyncStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready'
    case 'syncing':
      return 'Syncing'
    case 'offline-cache':
      return 'Offline Cache'
  }
}

/** Map fetcher resource to OmniNote bridge package. */
export function toBridgeLessonPackageFromFetcher(
  pkg: LibraryLessonPackage,
  resource?: LessonResource,
): BridgeLessonPackage {
  const target = resource ?? getPrimaryResource(pkg.resources)
  const kind =
    target?.type === 'presentation'
      ? 'slide-deck'
      : target?.type === 'worksheet'
        ? 'worksheet'
        : 'pdf'

  return buildBridgePackage({
    title: target ? target.filename : pkg.title,
    subject: pkg.subject,
    kind,
    source: target?.path,
  })
}

export { getFetcherReadinessLabel, buildOmniNotePayload, formatCacheAge, hasUsableCache, getReadinessStatusLabel }

/** Lookup helper for tests. */
export function findFetchedLesson(
  packages: Record<string, LibraryLessonPackage>,
  subject: CurriculumSubjectId,
  lessonNumber: number,
): LibraryLessonPackage | undefined {
  return Object.values(packages).find(
    (pkg) => pkg.subject === subject && pkg.lessonNumber === lessonNumber,
  )
}

/** Scan fixture and return detection summary for reporting. */
export function getPilotDetectionSummary(): {
  lessonCount: number
  lessons: Array<{ lessonNumber: number; resourceCount: number; omninoteReady: boolean }>
} {
  const scanned = scanDriveFolderTree(SAXON_MATH_DRIVE_FIXTURE, { pilotOnly: true })
  const packages = buildLessonPackages(scanned)
  return {
    lessonCount: packages.length,
    lessons: packages.map((pkg) => ({
      lessonNumber: pkg.lessonNumber,
      resourceCount: pkg.resources.length,
      omninoteReady: pkg.omninoteReady,
    })),
  }
}

export { findScannedLesson, scanDriveFolderTree, SAXON_MATH_DRIVE_FIXTURE }

/** Resource type display label (privacy-safe — no Drive IDs). */
export function formatResourceTypeLabel(type: FetcherResourceType): string {
  switch (type) {
    case 'presentation':
      return 'Presentation'
    case 'teacher-notes':
      return 'Teacher Notes'
    case 'worksheet':
      return 'Practice'
    case 'assessment':
      return 'Assessment'
    default:
      return type
  }
}
