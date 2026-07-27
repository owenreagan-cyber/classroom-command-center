import type { LessonPackage as BridgeLessonPackage } from '../omninote-bridge/types'
import { buildLessonPackage as buildBridgePackage } from '../omninote-bridge/types'
import {
  getPrimaryResource,
  getStudentSafeResources,
  getTeacherResource,
} from './resourceClassifier'
import type {
  LibraryLessonPackage,
  LibraryResource,
  OmniNoteLessonHandoff,
} from './types'

/** Build OmniNote handoff payload from a library lesson package. */
export function buildOmniNoteHandoffPayload(
  pkg: LibraryLessonPackage,
): OmniNoteLessonHandoff {
  const primary = getPrimaryResource(pkg.resources)
  return {
    title: pkg.title,
    subject: pkg.subject,
    grade: pkg.grade,
    resources: getStudentSafeResources(pkg.resources),
    annotationMode: pkg.annotationMode,
    displayMode: pkg.displayMode,
    primaryResource: primary,
  }
}

/** Map library resource type to OmniNote bridge resource kind. */
export function mapResourceToBridgeKind(
  resource: LibraryResource,
): BridgeLessonPackage['resource']['kind'] {
  switch (resource.type) {
    case 'presentation':
      return 'slide-deck'
    case 'worksheet':
      return 'worksheet'
    case 'blank-canvas':
      return 'blank-canvas'
    case 'pdf':
    case 'teacher-notes':
    case 'answer-key':
    default:
      return 'pdf'
  }
}

/** Convert library package to OmniNote bridge LessonPackage for handoff execution. */
export function toBridgeLessonPackage(
  pkg: LibraryLessonPackage,
  resource?: LibraryResource,
): BridgeLessonPackage {
  const target = resource ?? getPrimaryResource(pkg.resources)
  if (!target) {
    return buildBridgePackage({
      title: pkg.title,
      subject: pkg.subject,
      kind: 'blank-canvas',
      displayMode: pkg.displayMode === 'student-safe' ? 'both' : 'ipad-only',
      annotationMode: pkg.annotationMode === 'read-only' ? 'read-only' : 'pen',
    })
  }

  return buildBridgePackage({
    title: target.title ?? pkg.title,
    subject: pkg.subject,
    kind: mapResourceToBridgeKind(target),
    source: target.file,
    displayMode: pkg.displayMode === 'student-safe' ? 'both' : 'ipad-only',
    annotationMode: pkg.annotationMode === 'read-only' ? 'read-only' : 'pen',
  })
}

/** Teacher materials resource — notes or answer key preferred. */
export function getMaterialsResource(
  pkg: LibraryLessonPackage,
): LibraryResource | undefined {
  return getTeacherResource(pkg.resources) ?? getPrimaryResource(pkg.resources)
}

/** Serialize handoff payload for logging / future native bridge. */
export function serializeHandoffPayload(handoff: OmniNoteLessonHandoff): string {
  return JSON.stringify({
    title: handoff.title,
    subject: handoff.subject,
    grade: handoff.grade,
    annotationMode: handoff.annotationMode,
    displayMode: handoff.displayMode,
    resourceCount: handoff.resources.length,
    primaryFile: handoff.primaryResource?.file,
  })
}
