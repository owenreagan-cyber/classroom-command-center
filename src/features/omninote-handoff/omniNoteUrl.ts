/** Browser + Node safe path helpers (no node:path import). */

export function getDefaultHandoffRoot(projectRoot: string): string {
  const root = projectRoot.replace(/\/$/, '')
  return `${root}/.local/omninote-handoff`
}

export function resolveLocalPackagePath(packageId: string, projectRoot: string): string {
  return `${getDefaultHandoffRoot(projectRoot)}/${packageId}/package.json`
}

export function resolveRelativeHandoffPath(packageId: string): string {
  return `.local/omninote-handoff/${packageId}/package.json`
}

/** Convert absolute path to file:// URL for OmniNote deep link source param. */
export function encodeFileSource(absolutePath: string): string {
  if (!absolutePath.startsWith('/')) {
    throw new Error('OmniNote handoff source must be an absolute file path')
  }
  return `file://${encodeURI(absolutePath)}`
}

export const OMNINOTE_LESSON_SCHEME = 'omninote://lesson'

export function buildOmniNoteLessonUrl(input: {
  title: string
  packagePath: string
  mode?: string
}): string {
  const source = encodeFileSource(input.packagePath)
  const params = new URLSearchParams({
    title: input.title,
    type: 'lessonPackage',
    source,
  })
  if (input.mode) params.set('mode', input.mode)
  return `${OMNINOTE_LESSON_SCHEME}?${params.toString()}`
}

export function buildOmniNoteLessonUrlFromAbsolutePath(
  title: string,
  absolutePackagePath: string,
  mode = 'teach',
): string {
  return buildOmniNoteLessonUrl({ title, packagePath: absolutePackagePath, mode })
}
