import type { TeacherResourcePackTree } from './types'

/**
 * Google Drive export contract for Teacher Resource Packs.
 * No OAuth — defines the shape of a future Drive folder → pack scanner pipeline.
 *
 * Flow (future):
 *   Google Drive folder → exportPackTreeFromDrive() → TeacherResourcePackTree
 *   → same packScanner / lessonDetector / resourceMapper / lessonPackageBuilder
 */

/** Drive file metadata for pack import (no OAuth implementation). */
export interface DrivePackFileEntry {
  id: string
  name: string
  mimeType?: string
  /** Drive path relative to pack root, e.g. 05_Presentations/Ch.1_Lesson_3.pptx */
  path: string
}

/** Drive folder metadata for pack sections. */
export interface DrivePackFolderEntry {
  id: string
  name: string
  path: string
}

/** Raw Drive listing before conversion to TeacherResourcePackTree. */
export interface DrivePackListing {
  rootFolderId: string
  rootFolderName: string
  folders: readonly DrivePackFolderEntry[]
  filesByFolderPath: Readonly<Record<string, readonly DrivePackFileEntry[]>>
}

/** Result of a future Drive pack import operation. */
export interface DrivePackImportResult {
  success: boolean
  tree: TeacherResourcePackTree | null
  message: string
  packageCount: number
}

/** Convert a Drive listing into a TeacherResourcePackTree for the shared scanner. */
export function exportPackTreeFromDrive(listing: DrivePackListing): TeacherResourcePackTree {
  const sections = listing.folders.map((folder) => ({
    section: folder.name as TeacherResourcePackTree['sections'][number]['section'],
    folderName: folder.name,
    files: (listing.filesByFolderPath[folder.path] ?? []).map((file) => file.name),
  }))

  return {
    rootName: listing.rootFolderName,
    packPath: listing.rootFolderName,
    sections,
  }
}

/** Serialize import contract for logging / future sync UI. */
export function serializeDrivePackListing(listing: DrivePackListing): string {
  const fileCount = Object.values(listing.filesByFolderPath).reduce(
    (sum, files) => sum + files.length,
    0,
  )
  return JSON.stringify({
    root: listing.rootFolderName,
    folderCount: listing.folders.length,
    fileCount,
  })
}
