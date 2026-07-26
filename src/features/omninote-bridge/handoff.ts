import type {
  LessonPackage,
  OmniNoteHandoffRequest,
  OmniNoteHandoffResult,
} from './types'
import { buildOmniNoteDeepLink } from './types'

/**
 * Execute an OmniNote handoff request.
 * Level 1: manual + copy-link. Level 3: deep-link (requires native app).
 */
export function executeHandoff(
  request: OmniNoteHandoffRequest,
): OmniNoteHandoffResult {
  const { package: pkg, method } = request

  switch (method) {
    case 'manual':
      return {
        success: true,
        method,
        message: `Open "${pkg.title}" manually in OmniNote on iPad.`,
      }

    case 'copy-link': {
      const link = pkg.resource.webUrl ?? pkg.resource.source ?? ''
      if (!link) {
        return {
          success: false,
          method,
          message: 'No URL available to copy for this resource.',
        }
      }
      return {
        success: true,
        method,
        message: `Link copied. Paste into OmniNote: ${pkg.title}`,
      }
    }

    case 'deep-link': {
      const deepLink = buildOmniNoteDeepLink(pkg)
      return {
        success: true,
        method,
        message: `Deep link prepared for "${pkg.title}".`,
        deepLink,
      }
    }

    case 'share-sheet':
      return {
        success: true,
        method,
        message: `Use Share Sheet to send "${pkg.title}" to OmniNote.`,
      }

    default:
      return {
        success: false,
        method,
        message: 'Unknown handoff method.',
      }
  }
}

/** Copy resource URL to clipboard (teacher action). */
export async function copyResourceForOmniNote(
  pkg: LessonPackage,
): Promise<boolean> {
  const url = pkg.resource.webUrl ?? pkg.resource.source
  if (!url) return false
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

/** Open resource in new tab for teacher preview before OmniNote handoff. */
export function openResourcePreview(pkg: LessonPackage): void {
  const url = pkg.resource.webUrl ?? pkg.resource.source
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

/** Determine the best available handoff method for a package. */
export function getAvailableHandoffMethods(
  pkg: LessonPackage,
): Array<'manual' | 'copy-link' | 'deep-link' | 'share-sheet'> {
  const methods: Array<'manual' | 'copy-link' | 'deep-link' | 'share-sheet'> = [
    'manual',
  ]
  if (pkg.resource.webUrl || pkg.resource.source) {
    methods.push('copy-link')
  }
  methods.push('deep-link')
  return methods
}
