export type AppRoute = 'control' | 'display' | 'root' | 'canvasSpike' | 'boardLab'

export type AppShellRoute = Exclude<AppRoute, 'root'>

const CONTROL_PATH = '/control'
const DISPLAY_PATH = '/display'
const CANVAS_SPIKE_PATH = '/canvas-spike'
const BOARD_LAB_PATH = '/board-lab'

function normalizePathname(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed || '/'
}

/** Map a pathname to the active app route. */
export function getAppRoute(pathname: string): AppRoute {
  const normalized = normalizePathname(pathname)
  if (normalized === CONTROL_PATH) return 'control'
  if (normalized === DISPLAY_PATH) return 'display'
  if (normalized === CANVAS_SPIKE_PATH) return 'canvasSpike'
  if (normalized === BOARD_LAB_PATH) return 'boardLab'
  return 'root'
}

/** Replace the current URL with `/control` without adding a history entry. */
export function redirectRootToControl(): void {
  window.history.replaceState(null, '', CONTROL_PATH)
}

export function controlPath(): string {
  return CONTROL_PATH
}

export function displayPath(): string {
  return DISPLAY_PATH
}
