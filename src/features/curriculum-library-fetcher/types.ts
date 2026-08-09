import type { CurriculumSubjectId } from '../curriculum/types'
import type { TeachingWorkspaceId } from '../workspace/types'
import type { LessonReadinessSummary } from '../curriculum-readiness/types'

/** Resource types supported by the fetcher pilot. */
export type FetcherResourceType =
  | 'presentation'
  | 'pdf'
  | 'teacher-notes'
  | 'worksheet'
  | 'assessment'
  | 'image'
  | 'video'

export interface LessonResource {
  id: string
  filename: string
  type: FetcherResourceType
  /** Drive-relative path including filename. */
  path: string
}

/** Lesson package built from scanned Drive folder fixtures. */
export interface LibraryLessonPackage {
  id: string
  title: string
  subject: CurriculumSubjectId
  curriculum: string
  lessonNumber: number
  workspace: TeachingWorkspaceId
  resources: readonly LessonResource[]
  /** True when presentation exists and package can hand off to OmniNote. */
  omninoteReady: boolean
  /** Classroom readiness quality gate — teacher control only. */
  readiness?: LessonReadinessSummary
  /** Drive folder path relative to library root. */
  drivePath?: string
}

/** Google Drive style folder node for fixture trees. */
export interface DriveFolderNode {
  path: string
  files: readonly string[]
}

export interface DriveFolderTree {
  root: string
  folders: readonly DriveFolderNode[]
}

/** Parsed lesson folder before package build. */
export interface ScannedLessonFolder {
  subject: CurriculumSubjectId
  curriculum: string
  lessonNumber: number
  drivePath: string
  files: readonly string[]
}

/** OmniNote handoff payload from a fetched lesson package. */
export interface OmniNoteFetchPayload {
  title: string
  subject: CurriculumSubjectId
  curriculum: string
  lessonNumber: number
  primaryResource: LessonResource | null
  resources: readonly LessonResource[]
  omninoteReady: boolean
}

export const FETCHER_STORAGE_KEY = 'classroom-curriculum-library-fetcher-v1'
export const FETCHER_STORAGE_VERSION = 1 as const

/** @deprecated Use FETCHER_STORAGE_KEY — alias for the fetcher/index cache key. */
export const CURRICULUM_LIBRARY_CACHE_KEY = FETCHER_STORAGE_KEY

export type CurriculumSyncStatus = 'ready' | 'syncing' | 'offline-cache'

export interface FetcherIndexState {
  version: typeof FETCHER_STORAGE_VERSION
  packages: Record<string, LibraryLessonPackage>
  lastScannedAt: number | null
  source: 'fixture' | 'drive' | 'cache' | null
  syncStatus: CurriculumSyncStatus
  /** True when last sync reached Drive; false when using stale/offline cache. */
  driveAvailable: boolean
}

export const SUBJECT_FOLDER_MAP: Record<string, CurriculumSubjectId> = {
  math: 'math',
  reading: 'reading',
  spelling: 'spelling',
  shurley: 'shurley',
  history: 'history',
  science: 'science',
}

export const SUBJECT_TO_WORKSPACE: Record<CurriculumSubjectId, TeachingWorkspaceId> = {
  math: 'math',
  reading: 'reading',
  spelling: 'morning',
  shurley: 'shurley',
  history: 'morning',
  science: 'morning',
}

/** Pilot scope: Saxon Math lessons 2–6 only. */
export const PILOT_LESSON_RANGE = { min: 2, max: 6 } as const
export const PILOT_CURRICULUM = 'Saxon Math' as const
export const PILOT_SUBJECT: CurriculumSubjectId = 'math'
