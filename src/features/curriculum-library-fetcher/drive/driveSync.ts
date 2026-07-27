import { buildLessonPackages } from '../lessonPackageBuilder'
import { scanDriveFolderTree } from '../resourceScanner'
import type { DriveFolderTree, LibraryLessonPackage } from '../types'
import { buildCacheFromSync } from './driveCache'
import { normalizeFolderTree } from './driveMapper'
import type { DriveFolderProvider } from './driveProvider'
import type { CurriculumLibraryCache, CurriculumSyncResult } from './types'

function packagesFromTree(tree: DriveFolderTree): Record<string, LibraryLessonPackage> {
  const scanned = scanDriveFolderTree(tree, { pilotOnly: true })
  const built = buildLessonPackages(scanned)
  const map: Record<string, LibraryLessonPackage> = {}
  for (const pkg of built) {
    map[pkg.id] = pkg
  }
  return map
}

/** Manual sync: Drive Provider → scan → classify → package → cache. */
export async function syncCurriculumFromDrive(
  provider: DriveFolderProvider,
  existingCache?: CurriculumLibraryCache,
): Promise<CurriculumSyncResult> {
  const available = await provider.isAvailable()
  if (!available) {
    const cached = existingCache?.packages ?? {}
    const count = Object.keys(cached).length
    return {
      success: count > 0,
      packageCount: count,
      syncStatus: 'offline-cache',
      message: count > 0
        ? 'Using cached lesson data — Drive unavailable'
        : 'Drive unavailable and no cached lessons found',
    }
  }

  try {
    const rawTree = await provider.getFolderTree()
    const tree = normalizeFolderTree(rawTree)
    const packages = packagesFromTree(tree)
    const count = Object.keys(packages).length
    return {
      success: count > 0,
      packageCount: count,
      syncStatus: 'ready',
      message: `Synced ${count} lesson package(s) from Drive`,
      tree,
    }
  } catch (error) {
    const cached = existingCache?.packages ?? {}
    const count = Object.keys(cached).length
    const message = error instanceof Error ? error.message : 'Sync failed'
    return {
      success: count > 0,
      packageCount: count,
      syncStatus: 'offline-cache',
      message: count > 0
        ? `Using cached lesson data — ${message}`
        : message,
    }
  }
}

/** Build updated cache after sync attempt. */
export function applySyncResult(
  result: CurriculumSyncResult,
  existingCache: CurriculumLibraryCache,
): CurriculumLibraryCache {
  if (result.syncStatus === 'ready' && result.tree) {
    const packages = packagesFromTree(result.tree)
    return buildCacheFromSync(packages, true)
  }
  if (Object.keys(existingCache.packages).length > 0) {
    return {
      ...existingCache,
      syncStatus: 'offline-cache',
      driveAvailable: false,
      source: 'cache',
    }
  }
  return {
    ...existingCache,
    syncStatus: 'offline-cache',
    driveAvailable: false,
  }
}

/** Bootstrap packages from a DriveFolderTree (used by fixture fallback). */
export function bootstrapPackagesFromTree(tree: DriveFolderTree): Record<string, LibraryLessonPackage> {
  return packagesFromTree(tree)
}
