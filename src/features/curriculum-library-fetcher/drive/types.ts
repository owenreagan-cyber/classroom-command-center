import type { DriveFolderTree, LibraryLessonPackage } from '../types'

/** Google Drive file metadata (internal — not exposed to /display). */
export interface DriveFileMetadata {
  id: string
  name: string
  mimeType?: string
  /** Drive-relative path including filename. */
  path: string
}

/** Google Drive folder entry (internal — not exposed to /display). */
export interface DriveFolderEntry {
  id: string
  name: string
  /** Drive-relative path from library root. */
  path: string
}

/** Sync lifecycle states for Teacher Dock Curriculum Sync tool. */
export type CurriculumSyncStatus = 'ready' | 'syncing' | 'offline-cache'

/** Persisted curriculum library cache payload. */
export interface CurriculumLibraryCache {
  version: 1
  lastSyncAt: number | null
  packages: Record<string, LibraryLessonPackage>
  source: 'drive' | 'fixture' | 'cache' | null
  syncStatus: CurriculumSyncStatus
  /** True when last sync succeeded; false when using stale/offline data. */
  driveAvailable: boolean
}

export { CURRICULUM_LIBRARY_CACHE_KEY } from '../types'

/** Result of a manual curriculum sync operation. */
export interface CurriculumSyncResult {
  success: boolean
  packageCount: number
  syncStatus: CurriculumSyncStatus
  message: string
  tree?: DriveFolderTree
}
