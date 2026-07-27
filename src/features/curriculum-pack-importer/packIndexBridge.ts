import type { FetcherResourceType, LibraryLessonPackage, LessonResource } from '../curriculum-library-fetcher/types'
import { attachReadinessToLibraryPackage } from '../curriculum-readiness/readinessStore'
import type { CurriculumLessonPackage, PackResource, PackResourceType } from './types'

const PACK_TO_FETCHER_TYPE: Record<PackResourceType, FetcherResourceType> = {
  presentation: 'presentation',
  'teacher-notes': 'teacher-notes',
  'student-resource': 'worksheet',
  'teacher-key': 'teacher-notes',
  assessment: 'assessment',
}

function toFetcherResource(
  resource: PackResource,
  packageId: string,
  index: number,
): LessonResource {
  return {
    id: `${packageId}-res-${index + 1}`,
    filename: resource.filename,
    type: PACK_TO_FETCHER_TYPE[resource.type],
    path: resource.path,
  }
}

/** Convert pack importer lesson package to library fetcher format for Command Center. */
export function toLibraryLessonPackage(pkg: CurriculumLessonPackage): LibraryLessonPackage {
  const resources = pkg.resources.map((resource, index) =>
    toFetcherResource(resource, pkg.id, index),
  )

  return attachReadinessToLibraryPackage({
    id: pkg.id,
    title: pkg.title,
    subject: pkg.subject,
    curriculum: pkg.curriculum,
    lessonNumber: pkg.lessonNumber,
    workspace: pkg.workspace,
    resources,
    omninoteReady: pkg.omninoteReady,
    drivePath: pkg.packPath,
  })
}

/** Convert multiple pack packages for library index merge. */
export function toLibraryLessonPackages(
  packages: readonly CurriculumLessonPackage[],
): Record<string, LibraryLessonPackage> {
  const index: Record<string, LibraryLessonPackage> = {}
  for (const pkg of packages) {
    index[pkg.id] = toLibraryLessonPackage(pkg)
  }
  return index
}

/** Chapter-aware display label for Today Prep. */
export function formatShurleyTodayPrepTitle(pkg: CurriculumLessonPackage): string {
  return pkg.title
}

/** Short chapter/lesson label for active context. */
export function formatShurleyChapterLessonLabel(chapter: number, lessonNumber: number): string {
  return `Chapter ${chapter} Lesson ${lessonNumber}`
}

/** Short chapter/lesson label parsed from a Shurley pack library package. */
export function formatShurleyChapterLessonLabelFromPackage(
  pkg: LibraryLessonPackage,
): string | null {
  const match = pkg.title.match(/Chapter\s+(\d+)\s+Lesson\s+(\d+)/i)
  if (!match?.[1] || !match[2]) return null
  return formatShurleyChapterLessonLabel(parseInt(match[1], 10), parseInt(match[2], 10))
}

/** Resource display labels for Shurley pack lessons (from library index package). */
export function getShurleyResourceDisplayLabelsFromLibrary(
  pkg: LibraryLessonPackage,
): Array<{ label: string; present: boolean }> {
  const paths = pkg.resources.map((r) => r.path)
  return [
    { label: 'Presentation', present: pkg.resources.some((r) => r.type === 'presentation') },
    { label: 'Teacher Notes', present: paths.some((p) => p.includes('02_Teacher_Scripts')) },
    { label: 'Student Resource', present: paths.some((p) => p.includes('03_Student_Resources')) },
    { label: 'Teacher Key', present: paths.some((p) => p.includes('04_Teacher_Keys')) },
    { label: 'Assessment', present: paths.some((p) => p.includes('07_Assessments')) },
  ]
}

/** Resource display labels for Shurley pack lessons. */
export function getShurleyResourceDisplayLabels(
  pkg: CurriculumLessonPackage,
): Array<{ label: string; present: boolean }> {
  const types = new Set(pkg.resources.map((r) => r.type))
  return [
    { label: 'Presentation', present: types.has('presentation') },
    { label: 'Teacher Notes', present: types.has('teacher-notes') },
    { label: 'Student Resource', present: types.has('student-resource') },
    { label: 'Teacher Key', present: types.has('teacher-key') },
    { label: 'Assessment', present: types.has('assessment') },
  ]
}

/** Whether a library package originated from the pack importer. */
export function isShurleyPackPackage(pkg: LibraryLessonPackage): boolean {
  return pkg.subject === 'shurley' && pkg.id.startsWith('shurley-ch')
}
