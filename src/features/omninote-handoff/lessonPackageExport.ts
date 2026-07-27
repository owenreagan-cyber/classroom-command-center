import type { ReadinessStatus } from '../curriculum-readiness/types'
import type { LibraryLessonPackage, LessonResource } from '../curriculum-library-fetcher/types'
import {
  getPrimaryResource,
  getStudentSafeResources,
} from '../curriculum-library-fetcher/resourceClassifier'
import {
  isTeacherOnlyFilename,
  isTeacherOnlyFetcherType,
  isTeacherOnlyOmniNoteKind,
  mapFetcherTypeToOmniNoteKind,
  validateExportPrivacy,
} from './privacy'
import {
  buildOmniNoteLessonUrlFromAbsolutePath,
  resolveLocalPackagePath,
  resolveRelativeHandoffPath,
} from './omniNoteUrl'
import type {
  OmniNoteExportAnnotationMode,
  OmniNoteExportDisplayMode,
  OmniNoteExportLessonPackage,
  OmniNoteExportResource,
  OmniNoteLessonHandoffPlan,
} from './types'

function basename(filename: string): string {
  const slash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'))
  return slash >= 0 ? filename.slice(slash + 1) : filename
}

function toExportResource(resource: LessonResource): OmniNoteExportResource {
  const kind = mapFetcherTypeToOmniNoteKind(resource.type, resource.filename)
  const teacherOnly =
    isTeacherOnlyFetcherType(resource.type) ||
    isTeacherOnlyFilename(resource.filename) ||
    isTeacherOnlyOmniNoteKind(kind)

  return {
    id: resource.id,
    title: basename(resource.filename),
    type: kind,
    file: basename(resource.filename),
    studentVisible: !teacherOnly,
    teacherOnly,
  }
}

/** Build student-safe OmniNote export package from a fetched library lesson. */
export function buildStudentSafeExportPackage(
  pkg: LibraryLessonPackage,
  options?: {
    annotationMode?: OmniNoteExportAnnotationMode
    displayMode?: OmniNoteExportDisplayMode
    grade?: string
  },
): OmniNoteExportLessonPackage {
  const studentResources = getStudentSafeResources(pkg.resources)
  const exportResources = studentResources.map(toExportResource).filter((r) => !r.teacherOnly)

  return {
    id: pkg.id,
    title: pkg.title,
    subject: pkg.subject,
    curriculum: pkg.curriculum,
    grade: options?.grade,
    lessonNumber: String(pkg.lessonNumber),
    workspace: pkg.workspace,
    annotationMode: options?.annotationMode ?? 'annotate',
    displayMode: options?.displayMode ?? 'student-safe',
    resources: exportResources,
  }
}

/** Whether Today Prep can enable Teach in OmniNote. */
export function canTeachInOmniNote(
  pkg: LibraryLessonPackage,
  readinessStatus: ReadinessStatus | null,
  teacherOverride = false,
): boolean {
  if (!pkg.omninoteReady) return false
  const studentResources = getStudentSafeResources(pkg.resources)
  const primary = getPrimaryResource(studentResources)
  if (!primary) return false
  if (teacherOverride) return true
  return readinessStatus === 'ready'
}

function buildHandoffPlan(
  exportPackage: OmniNoteExportLessonPackage,
  absolutePackagePath: string,
  primaryResourceFilename: string | null,
): OmniNoteLessonHandoffPlan {
  return {
    package: exportPackage,
    packageJson: JSON.stringify(exportPackage, null, 2),
    localPackagePath: absolutePackagePath,
    deepLink: buildOmniNoteLessonUrlFromAbsolutePath(exportPackage.title, absolutePackagePath),
    primaryResourceFilename,
  }
}

/** Node/test: prepare handoff with absolute local path under project .local/. */
export function prepareOmniNoteLessonHandoff(
  pkg: LibraryLessonPackage,
  projectRoot: string,
): OmniNoteLessonHandoffPlan {
  const exportPackage = buildStudentSafeExportPackage(pkg)
  const privacyErrors = validateExportPrivacy(exportPackage)
  if (privacyErrors.length > 0) {
    throw new Error(`Handoff export failed privacy validation: ${privacyErrors.join('; ')}`)
  }

  const localPackagePath = resolveLocalPackagePath(exportPackage.id, projectRoot)
  const studentResources = getStudentSafeResources(pkg.resources)
  const primary = getPrimaryResource(studentResources)

  return buildHandoffPlan(
    exportPackage,
    localPackagePath,
    primary ? basename(primary.filename) : null,
  )
}

/** Browser/dev: prepare export JSON + relative path hint (files written by local script). */
export function prepareBrowserOmniNoteHandoff(pkg: LibraryLessonPackage): {
  plan: Omit<OmniNoteLessonHandoffPlan, 'deepLink' | 'localPackagePath'>
  relativePackagePath: string
  copyInstructions: string
} {
  const exportPackage = buildStudentSafeExportPackage(pkg)
  const privacyErrors = validateExportPrivacy(exportPackage)
  if (privacyErrors.length > 0) {
    throw new Error(`Handoff export failed privacy validation: ${privacyErrors.join('; ')}`)
  }

  const relativePackagePath = resolveRelativeHandoffPath(exportPackage.id)
  const studentResources = getStudentSafeResources(pkg.resources)
  const primary = getPrimaryResource(studentResources)

  return {
    plan: {
      package: exportPackage,
      packageJson: JSON.stringify(exportPackage, null, 2),
      primaryResourceFilename: primary ? basename(primary.filename) : null,
    },
    relativePackagePath,
    copyInstructions:
      'Run scripts/test-omninote-command-center-handoff.sh to write package files, then open the OmniNote link on iPad.',
  }
}

export { validateExportPrivacy }
