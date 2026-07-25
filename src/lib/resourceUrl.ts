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
