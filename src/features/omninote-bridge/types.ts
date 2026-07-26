/** OmniNote handoff — lesson package model and bridge types. */

export type LessonResourceKind =
  | 'pdf'
  | 'worksheet'
  | 'slide-deck'
  | 'blank-canvas'
  | 'google-slides'
  | 'google-docs'

export type DisplayMode = 'projector' | 'ipad-only' | 'both'

export type AnnotationMode = 'pen' | 'highlighter' | 'read-only'

export interface LessonResource {
  id: string
  title: string
  kind: LessonResourceKind
  /** URL or local path to the resource file. */
  source?: string
  /** Google Slides/Docs URL for export handoff. */
  webUrl?: string
}

export interface LessonPackage {
  id: string
  title: string
  subject: string
  resource: LessonResource
  displayMode: DisplayMode
  annotationMode: AnnotationMode
  /** Safe label shown on student display. */
  displayLabel: string
  createdAt: number
}

export type OmniNoteHandoffMethod =
  | 'manual'
  | 'copy-link'
  | 'deep-link'
  | 'share-sheet'

export interface OmniNoteHandoffRequest {
  package: LessonPackage
  method: OmniNoteHandoffMethod
}

export interface OmniNoteHandoffResult {
  success: boolean
  method: OmniNoteHandoffMethod
  message: string
  /** Deep link URL if method is deep-link. */
  deepLink?: string
}

/** OmniNote custom URL scheme (future native app support). */
export const OMNINOTE_SCHEME = 'omninote'

export function buildOmniNoteDeepLink(pkg: LessonPackage): string {
  const params = new URLSearchParams({
    title: pkg.title,
    subject: pkg.subject,
    kind: pkg.resource.kind,
    mode: pkg.annotationMode,
  })
  if (pkg.resource.source) params.set('source', pkg.resource.source)
  if (pkg.resource.webUrl) params.set('url', pkg.resource.webUrl)
  return `${OMNINOTE_SCHEME}://open?${params.toString()}`
}

export function buildLessonPackage(input: {
  title: string
  subject: string
  kind: LessonResourceKind
  source?: string
  webUrl?: string
  displayMode?: DisplayMode
  annotationMode?: AnnotationMode
}): LessonPackage {
  return {
    id: `lesson-${Date.now()}`,
    title: input.title,
    subject: input.subject,
    resource: {
      id: `resource-${Date.now()}`,
      title: input.title,
      kind: input.kind,
      source: input.source,
      webUrl: input.webUrl,
    },
    displayMode: input.displayMode ?? 'both',
    annotationMode: input.annotationMode ?? 'pen',
    displayLabel: input.title,
    createdAt: Date.now(),
  }
}
