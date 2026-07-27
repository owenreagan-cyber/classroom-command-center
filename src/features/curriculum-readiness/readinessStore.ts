import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurriculumSubjectId } from '../curriculum/types'
import type { LibraryLessonPackage } from '../curriculum-library-fetcher/types'
import {
  getReadinessResourceChecklist,
  scoreLessonReadiness,
  toReadinessSummary,
} from './readinessScorer'
import type { LessonReadiness, ReadinessPersistedState } from './types'
import { READINESS_STORAGE_KEY, READINESS_STORAGE_VERSION } from './types'

export const DEFAULT_READINESS_STATE: ReadinessPersistedState = {
  version: READINESS_STORAGE_VERSION,
  teacherOverrides: {},
}

export function hydrateReadinessState(raw: unknown): ReadinessPersistedState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_READINESS_STATE }
  const input = raw as Partial<ReadinessPersistedState>
  const overrides: Record<string, boolean> = {}
  if (input.teacherOverrides && typeof input.teacherOverrides === 'object') {
    for (const [id, value] of Object.entries(input.teacherOverrides)) {
      if (value === true) overrides[id] = true
    }
  }
  return {
    version: READINESS_STORAGE_VERSION,
    teacherOverrides: overrides,
  }
}

interface ReadinessStore extends ReadinessPersistedState {
  scorePackage: (pkg: LibraryLessonPackage) => LessonReadiness
  setTeacherOverride: (lessonId: string, enabled: boolean) => void
  hasTeacherOverride: (lessonId: string) => boolean
  getResourceChecklist: (pkg: LibraryLessonPackage) => ReturnType<typeof getReadinessResourceChecklist>
}

export const useReadinessStore = create<ReadinessStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_READINESS_STATE,

      scorePackage: (pkg) => {
        const override = get().teacherOverrides[pkg.id] === true
        return scoreLessonReadiness({
          lessonId: pkg.id,
          subject: pkg.subject,
          resources: pkg.resources,
          teacherOverride: override,
        })
      },

      setTeacherOverride: (lessonId, enabled) => {
        set((state) => {
          const next = { ...state.teacherOverrides }
          if (enabled) next[lessonId] = true
          else delete next[lessonId]
          return { teacherOverrides: next }
        })
      },

      hasTeacherOverride: (lessonId) => get().teacherOverrides[lessonId] === true,

      getResourceChecklist: (pkg) => getReadinessResourceChecklist(pkg.subject, pkg.resources),
    }),
    {
      name: READINESS_STORAGE_KEY,
      version: READINESS_STORAGE_VERSION,
      partialize: (state) => ({
        version: state.version,
        teacherOverrides: state.teacherOverrides,
      }),
      migrate: (persisted) => hydrateReadinessState(persisted),
    },
  ),
)

/** Score without React — for tests and library index bootstrap. */
export function scoreLibraryPackageReadiness(
  pkg: LibraryLessonPackage,
  overrides: Record<string, boolean> = {},
): LessonReadiness {
  return scoreLessonReadiness({
    lessonId: pkg.id,
    subject: pkg.subject,
    resources: pkg.resources,
    teacherOverride: overrides[pkg.id] === true,
  })
}

/** Attach readiness summary to a library lesson package. */
export function attachReadinessToLibraryPackage(
  pkg: LibraryLessonPackage,
  overrides: Record<string, boolean> = {},
): LibraryLessonPackage {
  const readiness = toReadinessSummary(scoreLibraryPackageReadiness(pkg, overrides))
  return { ...pkg, readiness, omninoteReady: readiness.omninoteReady }
}

/** Batch attach readiness to all packages in an index. */
export function attachReadinessToPackages(
  packages: Record<string, LibraryLessonPackage>,
  overrides: Record<string, boolean> = {},
): Record<string, LibraryLessonPackage> {
  const result: Record<string, LibraryLessonPackage> = {}
  for (const [id, pkg] of Object.entries(packages)) {
    result[id] = attachReadinessToLibraryPackage(pkg, overrides)
  }
  return result
}

/** Lookup readiness for subject integration tests. */
export function scorePackageForSubject(
  pkg: LibraryLessonPackage,
  subject: CurriculumSubjectId,
): LessonReadiness {
  return scoreLessonReadiness({
    lessonId: pkg.id,
    subject,
    resources: pkg.resources,
  })
}
