export type ResourceUrlStatus = 'valid' | 'blank' | 'invalid'

export function getResourceUrlStatus(url: string): ResourceUrlStatus {
  const trimmed = url.trim()
  if (!trimmed) return 'blank'
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return 'valid'
    }
    return 'invalid'
  } catch {
    return 'invalid'
  }
}

export function isValidResourceUrl(url: string): boolean {
  return getResourceUrlStatus(url) === 'valid'
}

export function getResourceUrlWarning(url: string): string | null {
  const status = getResourceUrlStatus(url)
  if (status === 'blank') return 'Missing URL — add http:// or https:// link.'
  if (status === 'invalid') return 'Invalid URL — use http:// or https:// only.'
  return null
}

export type CopyResourceUrlResult = { ok: true } | { ok: false; reason: 'clipboard_unavailable' | 'invalid_url' }

/** Copy a validated resource URL to the clipboard (control route only). */
export async function copyResourceUrl(
  clipboard: Pick<Clipboard, 'writeText'> | undefined,
  url: string,
): Promise<CopyResourceUrlResult> {
  if (!isValidResourceUrl(url)) {
    return { ok: false, reason: 'invalid_url' }
  }
  if (!clipboard?.writeText) {
    return { ok: false, reason: 'clipboard_unavailable' }
  }
  try {
    await clipboard.writeText(url.trim())
    return { ok: true }
  } catch {
    return { ok: false, reason: 'clipboard_unavailable' }
  }
}
