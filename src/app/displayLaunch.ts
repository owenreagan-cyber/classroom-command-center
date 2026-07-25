import { displayPath } from './appRoute'

export const POPUP_BLOCKED_MESSAGE =
  'The student display could not open. Allow popups for this site or use Copy Display Link.'

export const DISPLAY_LINK_COPIED_MESSAGE = 'Display link copied'

export const CLIPBOARD_UNAVAILABLE_MESSAGE =
  'Could not copy the display link. Clipboard access is unavailable.'

/** Absolute URL for the student/projector display route. */
export function getDisplayUrl(locationLike: Pick<Location, 'origin'>): string {
  return new URL(displayPath(), locationLike.origin).toString()
}

export type OpenStudentDisplayResult =
  | { ok: true }
  | { ok: false; reason: 'popup_blocked' }

/** Open `/display` in a new tab without mutating app state. */
export function openStudentDisplay(
  windowLike: Pick<Window, 'open'>,
  locationLike: Pick<Location, 'origin'>,
): OpenStudentDisplayResult {
  const opened = windowLike.open(
    getDisplayUrl(locationLike),
    '_blank',
    'noopener,noreferrer',
  )
  if (opened === null) {
    return { ok: false, reason: 'popup_blocked' }
  }
  return { ok: true }
}

export type CopyDisplayLinkResult =
  | { ok: true }
  | { ok: false; reason: 'clipboard_unavailable' }

/** Copy the absolute `/display` URL to the clipboard. */
export async function copyDisplayLink(
  clipboard: Pick<Clipboard, 'writeText'> | undefined,
  locationLike: Pick<Location, 'origin'>,
): Promise<CopyDisplayLinkResult> {
  if (!clipboard?.writeText) {
    return { ok: false, reason: 'clipboard_unavailable' }
  }

  try {
    await clipboard.writeText(getDisplayUrl(locationLike))
    return { ok: true }
  } catch {
    return { ok: false, reason: 'clipboard_unavailable' }
  }
}
