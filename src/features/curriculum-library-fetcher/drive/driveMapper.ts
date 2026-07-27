import type { DriveFolderTree } from '../types'
import type { DriveFileMetadata, DriveFolderEntry } from './types'

/** Map provider folder + file lists into a DriveFolderTree for the scanner pipeline. */
export function mapProviderToFolderTree(
  root: string,
  folders: readonly DriveFolderEntry[],
  filesByFolderPath: Readonly<Record<string, readonly DriveFileMetadata[]>>,
): DriveFolderTree {
  const lessonFolders = folders.filter((f) => /Lesson\s*\d+/i.test(f.name))

  return {
    root,
    folders: lessonFolders.map((folder) => ({
      path: folder.path,
      files: (filesByFolderPath[folder.path] ?? []).map((f) => f.name),
    })),
  }
}

/** Build a DriveFolderTree directly from provider getFolderTree result (pass-through). */
export function normalizeFolderTree(tree: DriveFolderTree): DriveFolderTree {
  return {
    root: tree.root,
    folders: tree.folders.map((node) => ({
      path: node.path,
      files: [...node.files],
    })),
  }
}

/** Collect lesson folder paths from a folder tree (for reporting). */
export function listLessonFolderPaths(tree: DriveFolderTree): string[] {
  return tree.folders
    .filter((node) => /Lesson\s*\d+/i.test(node.path))
    .map((node) => node.path)
}
