import type { DriveFolderIndex, LibraryLessonPackage } from './types'
import { findPackageForLesson, scanLessonFolders } from './lessonScanner'

export interface DriveImportResult {
  root: string
  packages: LibraryLessonPackage[]
  importedAt: number
  folderCount: number
  lessonCount: number
}

/** Import lesson packages from a simulated Drive folder index. */
export function importFromDriveIndex(
  index: DriveFolderIndex,
  options: { grade?: string; track?: string; week?: number } = {},
): DriveImportResult {
  const packages = scanLessonFolders(index.folders, options)
  return {
    root: index.root,
    packages,
    importedAt: Date.now(),
    folderCount: index.folders.length,
    lessonCount: packages.length,
  }
}

/** Convert import result to a keyed package map for library store. */
export function packagesToMap(
  packages: readonly LibraryLessonPackage[],
): Record<string, LibraryLessonPackage> {
  const map: Record<string, LibraryLessonPackage> = {}
  for (const pkg of packages) {
    map[pkg.id] = pkg
  }
  return map
}

/** Lookup a lesson package by subject and lesson number from an import. */
export function lookupLessonFromImport(
  result: DriveImportResult,
  subject: LibraryLessonPackage['subject'],
  lessonNumber: number,
): LibraryLessonPackage | undefined {
  return findPackageForLesson(result.packages, subject, lessonNumber)
}

/** Default sample index path for development (not loaded at runtime). */
export const SAMPLE_DRIVE_INDEX_PATH = 'examples/curriculum-library/drive-folder-index.sample.json'
