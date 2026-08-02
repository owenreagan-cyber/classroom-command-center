import { DEFAULT_DISPLAY_SCREENS, DEFAULT_DISPLAY_SCREEN_ORDER, getDefaultScreenById } from './defaultScreens'
import type { DisplayScreen } from './types'

export interface DisplayComposerScreensState {
  screens: Record<string, DisplayScreen>
  order: string[]
}

/** Build the initial seeded state — called once, on first-run hydration only. */
export function buildSeededScreensState(): DisplayComposerScreensState {
  const screens: Record<string, DisplayScreen> = {}
  for (const screen of DEFAULT_DISPLAY_SCREENS) {
    screens[screen.id] = structuredClone(screen)
  }
  return { screens, order: [...DEFAULT_DISPLAY_SCREEN_ORDER] }
}

function slugify(text: string): string {
  const base = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return base.length > 0 ? base : 'screen'
}

/** Generate a unique screen id from a title, avoiding collisions in the given state. */
export function generateScreenId(title: string, existing: Record<string, DisplayScreen>): string {
  const base = slugify(title)
  if (!existing[base]) return base
  let suffix = 2
  while (existing[`${base}-${suffix}`]) {
    suffix += 1
  }
  return `${base}-${suffix}`
}

/** Apply a partial patch to a screen, bumping updatedAt/version. Pure — no store dependency. */
export function applyScreenPatch(
  screen: DisplayScreen,
  patch: Partial<Omit<DisplayScreen, 'id'>>,
  now: number,
): DisplayScreen {
  return {
    ...screen,
    ...patch,
    id: screen.id,
    updatedAt: now,
    version: screen.version + 1,
  }
}

/** Duplicate a screen with a new id and "(Copy)" title suffix. */
export function duplicateScreenData(
  screen: DisplayScreen,
  existing: Record<string, DisplayScreen>,
  now: number,
): DisplayScreen {
  const title = `${screen.title} (Copy)`
  const id = generateScreenId(title, existing)
  return {
    ...structuredClone(screen),
    id,
    title,
    updatedAt: now,
    version: 1,
  }
}

/** Reset a screen back to its shipped default definition, if it is one of the seeded ids. */
export function resetScreenToDefault(id: string, now: number): DisplayScreen | undefined {
  const seed = getDefaultScreenById(id)
  if (!seed) return undefined
  return { ...seed, updatedAt: now, version: 1 }
}

export function buildCustomScreen(
  title: string,
  existing: Record<string, DisplayScreen>,
  now: number,
): DisplayScreen {
  return {
    id: generateScreenId(title, existing),
    title,
    mode: 'custom',
    background: { type: 'gradient', token: 'calm-focus' },
    showClock: true,
    timerWidget: { kind: 'none' },
    studentSafe: true,
    updatedAt: now,
    version: 1,
  }
}
