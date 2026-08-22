import type { BoardTheme, BoardThemeId } from './types'

/**
 * DB-4B — lightweight board themes.
 *
 * A theme is a small, non-secret rendering hint: a recommended text tone, an
 * accent color for teacher chrome, and a surface treatment. Themes help widgets
 * stay readable on any background without being a full design system.
 */

export const BOARD_THEME_IDS: readonly BoardThemeId[] = [
  'minimal-light',
  'minimal-dark',
  'glass-dark',
  'solid-focus',
]

export const DEFAULT_THEME_ID: BoardThemeId = 'minimal-dark'

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  'minimal-light': {
    id: 'minimal-light',
    name: 'Minimal Light',
    textTone: 'dark',
    accent: '#0284c7',
    surface: 'minimal',
  },
  'minimal-dark': {
    id: 'minimal-dark',
    name: 'Minimal Dark',
    textTone: 'light',
    accent: '#22d3ee',
    surface: 'minimal',
  },
  'glass-dark': {
    id: 'glass-dark',
    name: 'Glass Dark',
    textTone: 'light',
    accent: '#34d399',
    surface: 'glass',
  },
  'solid-focus': {
    id: 'solid-focus',
    name: 'Solid Focus',
    textTone: 'light',
    accent: '#f59e0b',
    surface: 'solid',
  },
}

export const DEFAULT_THEME: BoardTheme = BOARD_THEMES[DEFAULT_THEME_ID]

export function isBoardThemeId(v: unknown): v is BoardThemeId {
  return typeof v === 'string' && (BOARD_THEME_IDS as readonly string[]).includes(v)
}

export function getTheme(id: BoardThemeId): BoardTheme {
  return BOARD_THEMES[id]
}
