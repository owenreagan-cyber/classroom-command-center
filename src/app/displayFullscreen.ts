/** Browser fullscreen helpers — no state mutation, control-route initiated. */

export const FULLSCREEN_UNAVAILABLE_MESSAGE =
  'Fullscreen is not available in this browser. Use the browser menu or maximize the window.'

export const FULLSCREEN_DENIED_MESSAGE =
  'Fullscreen was blocked. Click the button again or use the browser menu.'

export type RequestFullscreenResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' | 'denied' }

function getFullscreenElement(doc: Document): Element | null {
  return (
    doc.fullscreenElement ??
    (doc as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ??
    null
  )
}

/** True when the document is in browser fullscreen. */
export function isBrowserFullscreen(doc: Document): boolean {
  return getFullscreenElement(doc) !== null
}

/** Request fullscreen on the document element via a user gesture. */
export async function requestBrowserFullscreen(
  doc: Document,
): Promise<RequestFullscreenResult> {
  const el = doc.documentElement
  const request =
    el.requestFullscreen?.bind(el) ??
    (el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
      .webkitRequestFullscreen?.bind(el)

  if (!request) {
    return { ok: false, reason: 'unavailable' }
  }

  try {
    await request()
    return { ok: true }
  } catch {
    return { ok: false, reason: 'denied' }
  }
}

/** Exit browser fullscreen when active. */
export async function exitBrowserFullscreen(doc: Document): Promise<void> {
  if (!isBrowserFullscreen(doc)) return
  const exit =
    doc.exitFullscreen?.bind(doc) ??
    (doc as Document & { webkitExitFullscreen?: () => Promise<void> })
      .webkitExitFullscreen?.bind(doc)
  await exit?.()
}
