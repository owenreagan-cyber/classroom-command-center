import type { CurriculumSubjectId } from '../curriculum/types'
import type { TeachingWorkspaceId } from '../workspace/types'

/** Canonical resource types for curriculum library import. */
export type LibraryResourceType =
  | 'presentation'
  | 'pdf'
  | 'teacher-notes'
  | 'worksheet'
  | 'answer-key'
  | 'image'
  | 'video'
  | 'audio'
  | 'template'
  | 'blank-canvas'

export type LessonAnnotationMode = 'annotate' | 'present' | 'read-only'
export type LessonDisplayMode = 'student-safe' | 'teacher-only' | 'none'
export type LessonReadiness = 'ready' | 'partial' | 'missing'

export interface LibraryResource {
  id: string
  type: LibraryResourceType
  /** Filename or Drive-relative path. */
  file: string
  title?: string
  driveFileId?: string
  mimeType?: string
}

/** Lesson package discovered from Google Drive or sample fixtures. */
export interface LibraryLessonPackage {
  id: string
  title: string
  subject: CurriculumSubjectId
  curriculum: string
  grade?: string
  track?: string
  week?: number
  lessonNumber: number | string
  resources: readonly LibraryResource[]
  workspace: TeachingWorkspaceId
  annotationMode: LessonAnnotationMode
  displayMode: LessonDisplayMode
  readiness?: LessonReadiness
  /** Drive folder path relative to library root. */
  drivePath?: string
}

/** Simulated Drive folder entry for import tests. */
export interface DriveFolderEntry {
  path: string
  files: readonly string[]
}

/** Simulated Drive tree index (no copyrighted content). */
export interface DriveFolderIndex {
  root: string
  folders: readonly DriveFolderEntry[]
}

/** OmniNote handoff payload derived from a library lesson package. */
export interface OmniNoteLessonHandoff {
  title: string
  subject: CurriculumSubjectId
  grade?: string
  resources: readonly LibraryResource[]
  annotationMode: LessonAnnotationMode
  displayMode: LessonDisplayMode
  primaryResource?: LibraryResource
}

export const LIBRARY_STORAGE_KEY = 'classroom-curriculum-library-v1'
export const LIBRARY_STORAGE_VERSION = 1 as const

export interface LibraryPersistedState {
  version: typeof LIBRARY_STORAGE_VERSION
  /** Imported packages keyed by id. */
  packages: Record<string, LibraryLessonPackage>
  /** Last import timestamp (epoch ms). */
  lastImportedAt: number | null
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
  shurley: 'morning',
  history: 'morning',
  science: 'morning',
}
