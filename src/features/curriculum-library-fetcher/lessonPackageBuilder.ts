import { classifyResourceFilename, getPrimaryResource, isOmniNoteReady } from './resourceClassifier'
import { attachReadinessToLibraryPackage } from '../curriculum-readiness/readinessStore'
import type { ScannedLessonFolder } from './types'
import type { LessonResource, LibraryLessonPackage, OmniNoteFetchPayload } from './types'
import { SUBJECT_TO_WORKSPACE } from './types'

function buildResourceId(packageId: string, index: number): string {
  return `${packageId}-res-${index + 1}`
}

function buildPackageId(curriculum: string, lessonNumber: number): string {
  const slug = curriculum.toLowerCase().replace(/\s+/g, '-')
  return `${slug}-lesson-${String(lessonNumber).padStart(2, '0')}`
}

/** Build LessonResource entries from scanned folder files. */
export function buildResourcesFromFolder(
  folder: ScannedLessonFolder,
  packageId: string,
): LessonResource[] {
  return folder.files.map((filename, index) => ({
    id: buildResourceId(packageId, index),
    filename,
    type: classifyResourceFilename(filename),
    path: `${folder.drivePath}/${filename}`,
  }))
}

/** Build a LibraryLessonPackage from a scanned lesson folder. */
export function buildLessonPackage(folder: ScannedLessonFolder): LibraryLessonPackage {
  const packageId = buildPackageId(folder.curriculum, folder.lessonNumber)
  const resources = buildResourcesFromFolder(folder, packageId)
  const omninoteReady = isOmniNoteReady(resources)

  return attachReadinessToLibraryPackage({
    id: packageId,
    title: `${folder.curriculum} Lesson ${folder.lessonNumber}`,
    subject: folder.subject,
    curriculum: folder.curriculum,
    lessonNumber: folder.lessonNumber,
    workspace: SUBJECT_TO_WORKSPACE[folder.subject],
    resources,
    omninoteReady,
    drivePath: folder.drivePath,
  })
}

/** Build packages from multiple scanned folders. */
export function buildLessonPackages(
  folders: readonly ScannedLessonFolder[],
): LibraryLessonPackage[] {
  return folders.map(buildLessonPackage)
}

/** Build OmniNote handoff payload from a fetched lesson package. */
export function buildOmniNotePayload(pkg: LibraryLessonPackage): OmniNoteFetchPayload {
  const primary = getPrimaryResource(pkg.resources) ?? null
  return {
    title: pkg.title,
    subject: pkg.subject,
    curriculum: pkg.curriculum,
    lessonNumber: pkg.lessonNumber,
    primaryResource: primary,
    resources: pkg.resources.filter(
      (r) => r.type !== 'teacher-notes',
    ),
    omninoteReady: pkg.omninoteReady,
  }
}

/** Convert fetch payload to bridge-compatible source path for handoff. */
export function getOmniNoteSourcePath(payload: OmniNoteFetchPayload): string | null {
  return payload.primaryResource?.path ?? null
}

/** Readiness label for Today Prep display. */
export function getFetcherReadinessLabel(omninoteReady: boolean): string {
  return omninoteReady ? 'Ready' : 'Partial'
}
