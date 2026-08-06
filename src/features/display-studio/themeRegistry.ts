/**
 * Phase 15F — Display Studio Theme Registry.
 *
 * Each theme bundles a background, text colors, accent, and readability
 * controls so that templates can declare a theme intent without hardcoding
 * a single gradient/solid token. Themes are safe for projector use:
 * high contrast, no tiny text, readable overlays.
 */

/** One of the 10 required classroom themes. */
export type DisplayStudioThemeId =
  | 'calm-focus'
  | 'bright-classroom'
  | 'soft-pastel'
  | 'high-contrast'
  | 'game-day'
  | 'minimal-projector'
  | 'anime-energy'
  | 'cozy-seasonal'
  | 'winter-focus'
  | 'outdoor-nature'

export interface DisplayStudioTheme {
  id: DisplayStudioThemeId
  label: string
  description: string
  /** Default background for this theme. */
  backgroundToken: string
  backgroundType: 'gradient' | 'solid' | 'image'
  /** CSS color for title text. */
  titleColor: string
  /** CSS color for student messages. */
  messageColor: string
  /** CSS color for card headings. */
  cardHeadingColor: string
  /** CSS color for card body text. */
  cardBodyColor: string
  /** Border color for cards/widgets. */
  cardBorderColor: string
  /** Card background with opacity (Tailwind class). */
  cardBgClass: string
  /** Widget background with opacity. */
  widgetBgClass: string
  /** Accent color for highlights, badges, active indicators. */
  accentColor: string
  /** Overlay strength for scrim over image backgrounds (Tailwind opacity). */
  overlayStrength: string
  /** Whether text should use a background pill/container for readability. */
  useTextBackground: boolean
  /** Categories this theme is recommended for. */
  categories: string[]
}

export const DISPLAY_STUDIO_THEMES: DisplayStudioTheme[] = [
  {
    id: 'calm-focus',
    label: 'Calm Focus',
    description: 'Dark blue with cyan highlights — ideal for instruction and independent work.',
    backgroundToken: 'calm-focus',
    backgroundType: 'gradient',
    titleColor: '#ffffff',
    messageColor: '#e0f2fe',
    cardHeadingColor: '#67e8f9',
    cardBodyColor: '#cbd5e1',
    cardBorderColor: '#0e7490',
    cardBgClass: 'bg-slate-950/80',
    widgetBgClass: 'bg-slate-950/80',
    accentColor: '#06b6d4',
    overlayStrength: 'from-slate-950/55 via-slate-950/25 to-slate-950/55',
    useTextBackground: true,
    categories: ['instruction', 'management', 'daily'],
  },
  {
    id: 'bright-classroom',
    label: 'Bright Classroom',
    description: 'Sky blue gradient — energetic and welcoming for morning work.',
    backgroundToken: 'bright-classroom',
    backgroundType: 'gradient',
    titleColor: '#ffffff',
    messageColor: '#e0f2fe',
    cardHeadingColor: '#38bdf8',
    cardBodyColor: '#e2e8f0',
    cardBorderColor: '#0284c7',
    cardBgClass: 'bg-slate-900/80',
    widgetBgClass: 'bg-slate-900/80',
    accentColor: '#0ea5e9',
    overlayStrength: 'from-slate-950/40 via-slate-950/20 to-slate-950/50',
    useTextBackground: true,
    categories: ['daily', 'instruction', 'engagement'],
  },
  {
    id: 'soft-pastel',
    label: 'Soft Pastel',
    description: 'Purple gradient — gentle and calming for writing, reading, and creative work.',
    backgroundToken: 'soft-pastel',
    backgroundType: 'gradient',
    titleColor: '#ffffff',
    messageColor: '#ede9fe',
    cardHeadingColor: '#c4b5fd',
    cardBodyColor: '#d1d5db',
    cardBorderColor: '#7c3aed',
    cardBgClass: 'bg-slate-950/80',
    widgetBgClass: 'bg-slate-950/80',
    accentColor: '#8b5cf6',
    overlayStrength: 'from-slate-950/50 via-slate-950/25 to-slate-950/50',
    useTextBackground: true,
    categories: ['instruction', 'management'],
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    description: 'Deep black solid with white text — maximum projector readability.',
    backgroundToken: 'deep-black',
    backgroundType: 'solid',
    titleColor: '#ffffff',
    messageColor: '#f1f5f9',
    cardHeadingColor: '#38bdf8',
    cardBodyColor: '#f8fafc',
    cardBorderColor: '#475569',
    cardBgClass: 'bg-slate-900/90',
    widgetBgClass: 'bg-slate-900/90',
    accentColor: '#facc15',
    overlayStrength: 'from-slate-950/30 via-transparent to-slate-950/30',
    useTextBackground: true,
    categories: ['management', 'instruction', 'daily'],
  },
  {
    id: 'game-day',
    label: 'Game Day',
    description: 'Red-to-gold gradient — exciting and energetic for review games and prizes.',
    backgroundToken: 'game-day',
    backgroundType: 'gradient',
    titleColor: '#ffffff',
    messageColor: '#fef3c7',
    cardHeadingColor: '#fbbf24',
    cardBodyColor: '#e2e8f0',
    cardBorderColor: '#dc2626',
    cardBgClass: 'bg-red-950/80',
    widgetBgClass: 'bg-red-950/70',
    accentColor: '#fbbf24',
    overlayStrength: 'from-red-950/40 via-red-950/20 to-red-950/50',
    useTextBackground: true,
    categories: ['engagement', 'daily'],
  },
  {
    id: 'minimal-projector',
    label: 'Minimal Projector',
    description: 'Simple slate gradient — low distraction for test mode and quiet work.',
    backgroundToken: 'minimal-projector',
    backgroundType: 'gradient',
    titleColor: '#ffffff',
    messageColor: '#e2e8f0',
    cardHeadingColor: '#94a3b8',
    cardBodyColor: '#cbd5e1',
    cardBorderColor: '#475569',
    cardBgClass: 'bg-slate-950/85',
    widgetBgClass: 'bg-slate-950/75',
    accentColor: '#64748b',
    overlayStrength: 'from-slate-950/40 via-transparent to-slate-950/40',
    useTextBackground: false,
    categories: ['management', 'instruction'],
  },
  {
    id: 'anime-energy',
    label: 'Anime Energy',
    description: 'Vibrant purple/magenta gradient — high-energy for special activities.',
    backgroundToken: 'anime-energy',
    backgroundType: 'gradient',
    titleColor: '#ffffff',
    messageColor: '#f5d0fe',
    cardHeadingColor: '#e879f9',
    cardBodyColor: '#e2e8f0',
    cardBorderColor: '#a21caf',
    cardBgClass: 'bg-purple-950/80',
    widgetBgClass: 'bg-purple-950/70',
    accentColor: '#c084fc',
    overlayStrength: 'from-purple-950/45 via-purple-950/20 to-purple-950/55',
    useTextBackground: true,
    categories: ['engagement', 'daily'],
  },
  {
    id: 'cozy-seasonal',
    label: 'Cozy Seasonal',
    description: 'Warm brown/amber gradient — perfect for fall, holidays, and cozy vibes.',
    backgroundToken: 'cozy-seasonal',
    backgroundType: 'gradient',
    titleColor: '#ffffff',
    messageColor: '#fef3c7',
    cardHeadingColor: '#fcd34d',
    cardBodyColor: '#e2e8f0',
    cardBorderColor: '#92400e',
    cardBgClass: 'bg-amber-950/80',
    widgetBgClass: 'bg-amber-950/70',
    accentColor: '#f59e0b',
    overlayStrength: 'from-amber-950/45 via-amber-950/20 to-amber-950/55',
    useTextBackground: true,
    categories: ['daily', 'management'],
  },
  {
    id: 'winter-focus',
    label: 'Winter Focus',
    description: 'Cool blue gradient — crisp and calm for winter classroom days.',
    backgroundToken: 'winter-focus',
    backgroundType: 'gradient',
    titleColor: '#ffffff',
    messageColor: '#dbeafe',
    cardHeadingColor: '#93c5fd',
    cardBodyColor: '#cbd5e1',
    cardBorderColor: '#1e40af',
    cardBgClass: 'bg-blue-950/80',
    widgetBgClass: 'bg-blue-950/80',
    accentColor: '#60a5fa',
    overlayStrength: 'from-blue-950/50 via-blue-950/25 to-blue-950/55',
    useTextBackground: true,
    categories: ['instruction', 'management'],
  },
  {
    id: 'outdoor-nature',
    label: 'Outdoor Nature',
    description: 'Green gradient — fresh and natural for science, reading, and outdoor lessons.',
    backgroundToken: 'outdoor-nature',
    backgroundType: 'gradient',
    titleColor: '#ffffff',
    messageColor: '#dcfce7',
    cardHeadingColor: '#86efac',
    cardBodyColor: '#d1d5db',
    cardBorderColor: '#047857',
    cardBgClass: 'bg-emerald-950/80',
    widgetBgClass: 'bg-emerald-950/70',
    accentColor: '#34d399',
    overlayStrength: 'from-emerald-950/50 via-emerald-950/25 to-emerald-950/55',
    useTextBackground: true,
    categories: ['instruction', 'management', 'daily'],
  },
]

const THEMES_BY_ID = new Map(DISPLAY_STUDIO_THEMES.map((t) => [t.id, t]))

export function getTheme(id: string): DisplayStudioTheme | undefined {
  return THEMES_BY_ID.get(id as DisplayStudioThemeId)
}

export function getDefaultTheme(): DisplayStudioTheme {
  return DISPLAY_STUDIO_THEMES[0]
}

export function getThemesForCategory(category: string): DisplayStudioTheme[] {
  return DISPLAY_STUDIO_THEMES.filter((t) => t.categories.includes(category))
}

/** Resolve a theme to its concrete background token and type for use with resolveDisplayBackground. */
export function resolveThemeBackground(themeId: DisplayStudioThemeId): {
  type: 'gradient' | 'solid' | 'image'
  token: string
} {
  const theme = getTheme(themeId) ?? getDefaultTheme()
  return { type: theme.backgroundType, token: theme.backgroundToken }
}

/** Get overlay strength CSS classes for image backgrounds. */
export function getThemeOverlay(themeId: DisplayStudioThemeId): string {
  const theme = getTheme(themeId) ?? getDefaultTheme()
  return theme.overlayStrength
}
