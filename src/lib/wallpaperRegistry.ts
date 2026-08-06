/**
 * Phase 15F — Wallpaper Metadata Registry.
 *
 * Structured metadata for classroom wallpapers so Display Studio
 * can present, preview, and safely use wallpaper assets without
 * hardcoding file paths or leaking teacher data to /display.
 *
 * Design principles:
 * - All entries are metadata — actual image files are either
 *   built-in gradients/solids (no file needed) or teacher-provided
 *   (stored in public/assets/backgrounds/teacher-provided/).
 * - Category tags allow filtering in the theme/wallpaper picker.
 * - studentSafe flag ensures wallpaper intent is gated.
 * - source field distinguishes builtIn vs teacherProvided vs placeholder.
 */

export type WallpaperSource = 'builtIn' | 'teacherProvided' | 'localImport' | 'placeholder'
export type WallpaperCategory =
  | 'seasonal'
  | 'anime'
  | 'sports'
  | 'nature'
  | 'winter'
  | 'calm'
  | 'holiday'
  | 'classroom'

export interface WallpaperMetadata {
  /** Unique id — use kebab-case, e.g. 'winter-mountains'. */
  id: string
  /** Display label shown in the wallpaper picker. */
  label: string
  /** Category for filtering in the UI. */
  category: WallpaperCategory
  /** Whether this is builtIn (gradient/solid), teacherProvided (uploaded file), or placeholder (future). */
  source: WallpaperSource
  /** Mood tags for search/filter. */
  tags: string[]
  /**
   * Path to the image asset relative to public/.
   * For builtIn: null (use gradient/solid CSS instead).
   * For teacherProvided: e.g. '/assets/backgrounds/teacher-provided/winter-mountains.png'.
   */
  assetPath: string | null
  /**
   * For builtIn wallpapers: background token that maps to a gradient or solid
   * in DISPLAY_BACKGROUND_GRADIENTS or DISPLAY_BACKGROUND_SOLIDS.
   */
  backgroundToken: string | null
  /** Dominant color hex for preview thumbnails. */
  dominantColor: string
  /** Overlay strength recommendation for text readability. */
  overlayStrength: 'light' | 'medium' | 'strong'
  /** Which themes this wallpaper complements. */
  recommendedThemes: string[]
  /** Template categories this wallpaper is recommended for. */
  recommendedCategories: string[]
  /** Safe for student display. All committed wallpapers should be true. */
  studentSafe: boolean
  /** Notes for the teacher — never shown on /display, only in wallpaper picker tooltip. */
  notes?: string
}

/**
 * Built-in wallpaper entries.
 * These use existing gradient/solid tokens — no external files needed.
 * Teacher-provided wallpapers are added by the teacher via local import
 * and are NOT committed by default.
 */
export const BUILT_IN_WALLPAPERS: WallpaperMetadata[] = [
  {
    id: 'wp-calm-focus',
    label: 'Calm Focus Blue',
    category: 'calm',
    source: 'builtIn',
    tags: ['blue', 'calm', 'focus', 'instruction'],
    assetPath: null,
    backgroundToken: 'calm-focus',
    dominantColor: '#0f172a',
    overlayStrength: 'medium',
    recommendedThemes: ['calm-focus', 'winter-focus'],
    recommendedCategories: ['instruction', 'management'],
    studentSafe: true,
    notes: 'Best for math, reading, writing, and independent work.',
  },
  {
    id: 'wp-bright-classroom',
    label: 'Bright Classroom Sky',
    category: 'classroom',
    source: 'builtIn',
    tags: ['blue', 'bright', 'morning', 'welcome'],
    assetPath: null,
    backgroundToken: 'bright-classroom',
    dominantColor: '#0284c7',
    overlayStrength: 'light',
    recommendedThemes: ['bright-classroom'],
    recommendedCategories: ['daily', 'instruction'],
    studentSafe: true,
    notes: 'Welcoming morning vibe — good for Arrival and Morning Work.',
  },
  {
    id: 'wp-soft-pastel',
    label: 'Soft Pastel Purple',
    category: 'calm',
    source: 'builtIn',
    tags: ['purple', 'calm', 'creative', 'gentle'],
    assetPath: null,
    backgroundToken: 'soft-pastel',
    dominantColor: '#4c1d95',
    overlayStrength: 'medium',
    recommendedThemes: ['soft-pastel'],
    recommendedCategories: ['instruction', 'management'],
    studentSafe: true,
    notes: 'Gentle creative feel — good for writing workshop and reading.',
  },
  {
    id: 'wp-game-day',
    label: 'Game Day Red',
    category: 'sports',
    source: 'builtIn',
    tags: ['red', 'gold', 'game', 'review', 'exciting'],
    assetPath: null,
    backgroundToken: 'game-day',
    dominantColor: '#991b1b',
    overlayStrength: 'medium',
    recommendedThemes: ['game-day'],
    recommendedCategories: ['engagement'],
    studentSafe: true,
    notes: 'Exciting game-show feel — perfect for review games and prizes.',
  },
  {
    id: 'wp-minimal-projector',
    label: 'Minimal Projector Slate',
    category: 'calm',
    source: 'builtIn',
    tags: ['slate', 'minimal', 'test', 'quiet', 'assessment'],
    assetPath: null,
    backgroundToken: 'minimal-projector',
    dominantColor: '#0f172a',
    overlayStrength: 'light',
    recommendedThemes: ['minimal-projector', 'high-contrast'],
    recommendedCategories: ['management'],
    studentSafe: true,
    notes: 'Ultra-minimal — best for assessments and quiet work.',
  },
  {
    id: 'wp-anime-energy',
    label: 'Anime Energy Purple',
    category: 'anime',
    source: 'builtIn',
    tags: ['purple', 'magenta', 'anime', 'fun', 'energy'],
    assetPath: null,
    backgroundToken: 'anime-energy',
    dominantColor: '#4a044e',
    overlayStrength: 'medium',
    recommendedThemes: ['anime-energy'],
    recommendedCategories: ['engagement', 'daily'],
    studentSafe: true,
    notes: 'High-energy anime-inspired gradient — for special activities.',
  },
  {
    id: 'wp-cozy-seasonal',
    label: 'Cozy Seasonal Amber',
    category: 'seasonal',
    source: 'builtIn',
    tags: ['amber', 'cozy', 'fall', 'holiday', 'warm'],
    assetPath: null,
    backgroundToken: 'cozy-seasonal',
    dominantColor: '#78350f',
    overlayStrength: 'medium',
    recommendedThemes: ['cozy-seasonal'],
    recommendedCategories: ['daily', 'management'],
    studentSafe: true,
    notes: 'Cozy fall/holiday feel — perfect for seasonal classroom vibes.',
  },
  {
    id: 'wp-winter-focus',
    label: 'Winter Focus Blue',
    category: 'winter',
    source: 'builtIn',
    tags: ['blue', 'winter', 'crisp', 'calm'],
    assetPath: null,
    backgroundToken: 'winter-focus',
    dominantColor: '#0c4a6e',
    overlayStrength: 'medium',
    recommendedThemes: ['winter-focus', 'calm-focus'],
    recommendedCategories: ['instruction', 'management'],
    studentSafe: true,
    notes: 'Crisp winter blue — good for chilly classroom days.',
  },
  {
    id: 'wp-outdoor-nature',
    label: 'Outdoor Nature Green',
    category: 'nature',
    source: 'builtIn',
    tags: ['green', 'nature', 'science', 'fresh'],
    assetPath: null,
    backgroundToken: 'outdoor-nature',
    dominantColor: '#064e3b',
    overlayStrength: 'medium',
    recommendedThemes: ['outdoor-nature'],
    recommendedCategories: ['instruction', 'management'],
    studentSafe: true,
    notes: 'Fresh nature feel — good for science, reading outdoors, or calm work.',
  },
  {
    id: 'wp-sunny-specials',
    label: 'Sunny Specials Orange',
    category: 'classroom',
    source: 'builtIn',
    tags: ['orange', 'yellow', 'sunny', 'specials', 'bright'],
    assetPath: null,
    backgroundToken: 'sunny-specials',
    dominantColor: '#7c2d12',
    overlayStrength: 'medium',
    recommendedThemes: ['game-day'],
    recommendedCategories: ['daily', 'engagement'],
    studentSafe: true,
    notes: 'Warm sunny feel — great for Specials, game time, and partner talk.',
  },
  {
    id: 'wp-rise-and-shine',
    label: 'Rise and Shine',
    category: 'classroom',
    source: 'builtIn',
    tags: ['blue', 'gold', 'morning', 'arrival'],
    assetPath: null,
    backgroundToken: 'rise-and-shine',
    dominantColor: '#1e3a5f',
    overlayStrength: 'light',
    recommendedThemes: ['bright-classroom'],
    recommendedCategories: ['daily'],
    studentSafe: true,
    notes: 'Morning arrival feel — blue-to-gold gradient.',
  },
  {
    id: 'wp-deep-focus',
    label: 'Deep Focus Indigo',
    category: 'calm',
    source: 'builtIn',
    tags: ['indigo', 'deep', 'focus', 'reading', 'test'],
    assetPath: null,
    backgroundToken: 'deep-focus',
    dominantColor: '#1e1b4b',
    overlayStrength: 'medium',
    recommendedThemes: ['calm-focus', 'minimal-projector'],
    recommendedCategories: ['instruction', 'management'],
    studentSafe: true,
    notes: 'Deep indigo focus — good for sustained reading or writing.',
  },
]

const WALLPAPERS_BY_ID = new Map(BUILT_IN_WALLPAPERS.map((w) => [w.id, w]))

export function getWallpaper(id: string): WallpaperMetadata | undefined {
  return WALLPAPERS_BY_ID.get(id)
}

export function getWallpapersForCategory(category: WallpaperCategory): WallpaperMetadata[] {
  return BUILT_IN_WALLPAPERS.filter((w) => w.category === category)
}

export function getWallpapersForTheme(themeId: string): WallpaperMetadata[] {
  return BUILT_IN_WALLPAPERS.filter((w) => w.recommendedThemes.includes(themeId))
}

export function getDefaultWallpaper(): WallpaperMetadata {
  return BUILT_IN_WALLPAPERS[0]
}
