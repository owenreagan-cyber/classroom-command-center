import type { LibraryLessonPackage } from '../types'
import { CURRICULUM_LIBRARY_CACHE_KEY } from '../types'
import type { CurriculumLibraryCache, CurriculumSyncStatus } from './types'

export const CURRICULUM_LIBRARY_CACHE_VERSION = 1 as const

export const DEFAULT_CACHE: CurriculumLibraryCache = {
  version: CURRICULUM_LIBRARY_CACHE_VERSION,
  lastSyncAt: null,
  packages: {},
  source: null,
  syncStatus: 'offline-cache',
  driveAvailable: false,
}

/** Serialize cache for localStorage persistence. */
export function serializeCache(cache: CurriculumLibraryCache): string {
  return JSON.stringify(cache)
}

/** Hydrate cache from persisted JSON — returns stale data when valid, else default. */
export function hydrateCache(raw: unknown): CurriculumLibraryCache {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CACHE }
  const input = raw as Partial<CurriculumLibraryCache>
  const packages: Record<string, LibraryLessonPackage> = {}
  if (input.packages && typeof input.packages === 'object') {
    for (const [id, pkg] of Object.entries(input.packages)) {
      if (pkg && typeof pkg === 'object' && typeof (pkg as LibraryLessonPackage).title === 'string') {
        packages[id] = pkg as LibraryLessonPackage
      }
    }
  }
  const syncStatus = isValidSyncStatus(input.syncStatus) ? input.syncStatus : 'offline-cache'
  return {
    version: CURRICULUM_LIBRARY_CACHE_VERSION,
    lastSyncAt: typeof input.lastSyncAt === 'number' ? input.lastSyncAt : null,
    packages,
    source: input.source === 'drive' ? 'drive' : input.source === 'fixture' ? 'fixture' : input.source === 'cache' ? 'cache' : null,
    syncStatus,
    driveAvailable: input.driveAvailable === true,
  }
}

function isValidSyncStatus(value: unknown): value is CurriculumSyncStatus {
  return value === 'ready' || value === 'syncing' || value === 'offline-cache'
}

/** Load cache from localStorage (browser) or return default (Node tests). */
export function loadCacheFromStorage(): CurriculumLibraryCache {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_CACHE }
  try {
    const raw = localStorage.getItem(CURRICULUM_LIBRARY_CACHE_KEY)
    if (!raw) return { ...DEFAULT_CACHE }
    return hydrateCache(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_CACHE }
  }
}

/** Save cache to localStorage. No-op in Node test environment. */
export function saveCacheToStorage(cache: CurriculumLibraryCache): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CURRICULUM_LIBRARY_CACHE_KEY, serializeCache(cache))
  } catch {
    // Storage full or unavailable — classroom continues with in-memory cache.
  }
}

/** Build cache entry from sync results. */
export function buildCacheFromSync(
  packages: Record<string, LibraryLessonPackage>,
  driveAvailable: boolean,
): CurriculumLibraryCache {
  return {
    version: CURRICULUM_LIBRARY_CACHE_VERSION,
    lastSyncAt: Date.now(),
    packages,
    source: driveAvailable ? 'drive' : 'cache',
    syncStatus: driveAvailable ? 'ready' : 'offline-cache',
    driveAvailable,
  }
}

/** Whether cache has usable lesson packages (stale data is acceptable). */
export function hasUsableCache(cache: CurriculumLibraryCache): boolean {
  return Object.keys(cache.packages).length > 0
}

/** Human-readable cache age label. */
export function formatCacheAge(lastSyncAt: number | null): string {
  if (!lastSyncAt) return 'Never synced'
  const minutes = Math.floor((Date.now() - lastSyncAt) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
