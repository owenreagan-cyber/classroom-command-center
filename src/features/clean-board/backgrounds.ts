import type {
  BackgroundCategory,
  BackgroundPresetId,
  BoardBackground,
  ReadabilityOverlay,
} from './types'

/**
 * DB-4B — classroom-safe background presets.
 *
 * A small, fixed set of calm, projection-safe backgrounds. Each preset is pure
 * data: an id, a human name, a semantic category, a recommended text tone, a
 * default readability overlay, and a single CSS `background` value. No external
 * assets, no remote URLs, no animation, no uploaded images.
 */

export interface BackgroundPreset {
  id: BackgroundPresetId
  name: string
  category: BackgroundCategory
  /** Recommended text tone so widgets stay readable on this background. */
  textTone: 'dark' | 'light'
  /** Default readability overlay when the teacher has not overridden it. */
  overlay: ReadabilityOverlay
  /** A single, self-contained CSS `background` value (calm, no external URLs). */
  css: string
}

const gradient = (from: string, to: string, angle = 135): string =>
  `linear-gradient(${angle}deg, ${from}, ${to})`

const grid = (base: string, line: string, size = 48): string =>
  `#${base} repeating-linear-gradient(to right, #${line} 0px, #${line} 1px, transparent 1px, transparent ${size}px), repeating-linear-gradient(to bottom, #${line} 0px, #${line} 1px, transparent 1px, transparent ${size}px)`

export const BACKGROUND_PRESET_IDS: readonly BackgroundPresetId[] = [
  'calm-blue',
  'soft-green',
  'warm-neutral',
  'clean-white',
  'slate-focus',
  'morning-glow',
  'reading-cream',
  'math-grid-subtle',
  'quiet-purple',
  'transition-dark',
]

export const BACKGROUND_PRESETS: readonly BackgroundPreset[] = [
  {
    id: 'calm-blue',
    name: 'Calm Blue',
    category: 'calm',
    textTone: 'light',
    overlay: 'soft',
    css: gradient('#0f172a', '#1e3a8a'),
  },
  {
    id: 'soft-green',
    name: 'Soft Green',
    category: 'calm',
    textTone: 'light',
    overlay: 'soft',
    css: gradient('#052e16', '#14532d'),
  },
  {
    id: 'warm-neutral',
    name: 'Warm Neutral',
    category: 'neutral',
    textTone: 'dark',
    overlay: 'none',
    css: gradient('#f5f0e6', '#e9dfd0'),
  },
  {
    id: 'clean-white',
    name: 'Clean White',
    category: 'neutral',
    textTone: 'dark',
    overlay: 'none',
    css: '#ffffff',
  },
  {
    id: 'slate-focus',
    name: 'Slate Focus',
    category: 'focus',
    textTone: 'light',
    overlay: 'soft',
    css: gradient('#0f172a', '#1e293b'),
  },
  {
    id: 'morning-glow',
    name: 'Morning Glow',
    category: 'morning',
    textTone: 'dark',
    overlay: 'none',
    css: gradient('#fefce8', '#fde68a', 160),
  },
  {
    id: 'reading-cream',
    name: 'Reading Cream',
    category: 'reading',
    textTone: 'dark',
    overlay: 'none',
    css: '#faf6ee',
  },
  {
    id: 'math-grid-subtle',
    name: 'Math Grid Subtle',
    category: 'math',
    textTone: 'dark',
    overlay: 'none',
    css: grid('f8fafc', 'e2e8f0'),
  },
  {
    id: 'quiet-purple',
    name: 'Quiet Purple',
    category: 'calm',
    textTone: 'light',
    overlay: 'soft',
    css: gradient('#312e81', '#4c1d95'),
  },
  {
    id: 'transition-dark',
    name: 'Transition Dark',
    category: 'transition',
    textTone: 'light',
    overlay: 'strong',
    css: '#0b1120',
  },
]

export const DEFAULT_BACKGROUND_PRESET_ID: BackgroundPresetId = 'calm-blue'

export const DEFAULT_BACKGROUND: { type: 'preset'; presetId: BackgroundPresetId } = {
  type: 'preset',
  presetId: DEFAULT_BACKGROUND_PRESET_ID,
}

const PRESET_MAP: Record<BackgroundPresetId, BackgroundPreset> = Object.fromEntries(
  BACKGROUND_PRESETS.map((p) => [p.id, p]),
) as Record<BackgroundPresetId, BackgroundPreset>

export function isBackgroundPresetId(v: unknown): v is BackgroundPresetId {
  return (
    typeof v === 'string' &&
    (BACKGROUND_PRESET_IDS as readonly string[]).includes(v)
  )
}

export function getBackgroundPreset(id: BackgroundPresetId): BackgroundPreset {
  return PRESET_MAP[id]
}

export function isReadabilityOverlay(v: unknown): v is ReadabilityOverlay {
  return v === 'none' || v === 'soft' || v === 'strong'
}

/** Effective overlay: the teacher's explicit choice, or the preset default. */
export function effectiveOverlay(bg: BoardBackground): ReadabilityOverlay {
  if (bg.readabilityOverlay) return bg.readabilityOverlay
  if (bg.type === 'preset') return getBackgroundPreset(bg.presetId).overlay
  return 'none'
}

/** Approximate luminance (0..1) of a `#rgb` / `#rrggbb` hex color. */
function colorLuminance(color: string): number {
  const hex = color.replace('#', '')
  let r: number
  let g: number
  let b: number
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length >= 6) {
    r = parseInt(hex.slice(0, 2), 16)
    g = parseInt(hex.slice(2, 4), 16)
    b = parseInt(hex.slice(4, 6), 16)
  } else {
    return 0.5
  }
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return 0.5
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function isLightColor(color: string): boolean {
  return colorLuminance(color) > 0.6
}

/** Text tone implied by a background (used to direct the scrim contrast). */
export function textToneForBackground(bg: BoardBackground): 'dark' | 'light' {
  if (bg.type === 'preset') return getBackgroundPreset(bg.presetId).textTone
  if (bg.type === 'solid') return isLightColor(bg.color) ? 'dark' : 'light'
  return isLightColor(bg.from) ? 'dark' : 'light'
}

/**
 * A subtle scrim that keeps light text readable over mid-tone backgrounds (and
 * dark text readable over light backgrounds). The direction always *increases*
 * contrast: light text gets a dark scrim, dark text a light one.
 */
export function overlayScrimCss(bg: BoardBackground): { backgroundColor?: string } | null {
  const overlay = effectiveOverlay(bg)
  if (overlay === 'none') return null
  const alpha = overlay === 'soft' ? 0.08 : 0.16
  const rgb = textToneForBackground(bg) === 'light' ? '0, 0, 0' : '255, 255, 255'
  return { backgroundColor: `rgba(${rgb}, ${alpha})` }
}
