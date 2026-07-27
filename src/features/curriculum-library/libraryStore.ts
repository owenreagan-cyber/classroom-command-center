import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurriculumSubjectId } from '../curriculum/types'
import type { LessonPlan } from '../curriculum/types'
import { createLessonPackageFromPlan } from '../curriculum/lessonPackage'
import { resolveCurrentLesson } from '../curriculum/pacingResolver'
import type { ScreenId } from '../../data/types'
import { resolveSubjectFromScreen } from '../curriculum/pacingResolver'
import { importFromDriveIndex } from './driveImport'
import { findPackageForLesson } from './lessonScanner'
import type {
  DriveFolderIndex,
  LibraryLessonPackage,
  LibraryPersistedState,
} from './types'
import { LIBRARY_STORAGE_KEY, LIBRARY_STORAGE_VERSION } from './types'

export const DEFAULT_LIBRARY_STATE: LibraryPersistedState = {
  version: LIBRARY_STORAGE_VERSION,
  packages: {},
  lastImportedAt: null,
}

export function hydrateLibraryState(raw: unknown): LibraryPersistedState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_LIBRARY_STATE }
  const input = raw as Partial<LibraryPersistedState>
  const packages: Record<string, LibraryLessonPackage> = {}
  if (input.packages && typeof input.packages === 'object') {
    for (const [id, pkg] of Object.entries(input.packages)) {
      if (pkg && typeof pkg === 'object' && typeof pkg.title === 'string') {
        packages[id] = pkg as LibraryLessonPackage
      }
    }
  }
  return {
    version: LIBRARY_STORAGE_VERSION,
    packages,
    lastImportedAt:
      typeof input.lastImportedAt === 'number' ? input.lastImportedAt : null,
  }
}

interface LibraryStore extends LibraryPersistedState {
  importDriveIndex: (index: DriveFolderIndex) => void
  getPackageById: (id: string) => LibraryLessonPackage | undefined
  getPackageForLesson: (
    subject: CurriculumSubjectId,
    lessonNumber: number,
  ) => LibraryLessonPackage | undefined
  getAllPackages: () => LibraryLessonPackage[]
  clearLibrary: () => void
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_LIBRARY_STATE,

      importDriveIndex: (index) => {
        const result = importFromDriveIndex(index)
        const packages: Record<string, LibraryLessonPackage> = {}
        for (const pkg of result.packages) {
          packages[pkg.id] = pkg
        }
        set({ packages, lastImportedAt: result.importedAt })
      },

      getPackageById: (id) => get().packages[id],

      getPackageForLesson: (subject, lessonNumber) => {
        const all = Object.values(get().packages)
        return findPackageForLesson(all, subject, lessonNumber)
      },

      getAllPackages: () => Object.values(get().packages),

      clearLibrary: () => set({ ...DEFAULT_LIBRARY_STATE }),
    }),
    {
      name: LIBRARY_STORAGE_KEY,
      version: LIBRARY_STORAGE_VERSION,
      partialize: (state) => ({
        version: state.version,
        packages: state.packages,
        lastImportedAt: state.lastImportedAt,
      }),
      migrate: (persisted) => hydrateLibraryState(persisted),
    },
  ),
)

/** Resolve the active library lesson for a screen, falling back to pacing stubs. */
export function resolveLibraryLessonForScreen(
  screenId: ScreenId,
  date = new Date(),
  packages: Record<string, LibraryLessonPackage> = {},
): LibraryLessonPackage | null {
  const subjectId = resolveSubjectFromScreen(screenId, date)
  if (!subjectId) return null

  const plan = resolveCurrentLesson(subjectId, date)
  if (!plan) return null

  const imported = findPackageForLesson(
    Object.values(packages),
    subjectId,
    plan.lessonNumber,
  )
  if (imported) return imported

  const stub = createLessonPackageFromPlan(plan)
  return {
    id: stub.id,
    title: stub.title,
    subject: stub.subject,
    curriculum: stub.curriculum,
    lessonNumber: stub.lessonNumber,
    resources: stub.resources.map((r, i) => ({
      id: r.id,
      type: mapCurriculumKindToLibraryType(r.kind),
      file: r.source ?? `${r.kind}-${i + 1}`,
      title: r.title,
    })),
    workspace: stub.subject === 'math' ? 'math' : stub.subject === 'reading' ? 'reading' : 'morning',
    annotationMode: stub.annotationMode,
    displayMode: stub.displayMode,
    readiness: stub.resources.length > 0 ? 'partial' : 'missing',
  }
}

function mapCurriculumKindToLibraryType(
  kind: string,
): LibraryLessonPackage['resources'][number]['type'] {
  switch (kind) {
    case 'slides':
      return 'presentation'
    case 'teacher-notes':
      return 'teacher-notes'
    case 'worksheet':
      return 'worksheet'
    case 'answer-key':
      return 'answer-key'
    case 'image':
      return 'image'
    case 'pdf':
    default:
      return 'pdf'
  }
}

/** Build library lesson from a pacing LessonPlan (for tests and fallback). */
export function libraryPackageFromPlan(plan: LessonPlan): LibraryLessonPackage {
  const stub = createLessonPackageFromPlan(plan)
  return {
    id: stub.id,
    title: stub.title,
    subject: stub.subject,
    curriculum: stub.curriculum,
    lessonNumber: stub.lessonNumber,
    resources: stub.resources.map((r, i) => ({
      id: r.id,
      type: mapCurriculumKindToLibraryType(r.kind),
      file: r.source ?? `resource-${i + 1}`,
      title: r.title,
    })),
    workspace: stub.subject === 'math' ? 'math' : stub.subject === 'reading' ? 'reading' : 'morning',
    annotationMode: stub.annotationMode,
    displayMode: stub.displayMode,
    readiness: 'partial',
  }
}

export function getReadinessLabel(readiness: LibraryLessonPackage['readiness']): string {
  switch (readiness) {
    case 'ready':
      return 'Ready'
    case 'partial':
      return 'Partial'
    case 'missing':
      return 'Missing materials'
    default:
      return 'Ready'
  }
}
