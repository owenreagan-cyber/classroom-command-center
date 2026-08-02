import { BACKGROUND_ASSETS } from '../../data/backgroundAssets'
import type { DisplayScreenBackground } from './types'

/** Display Composer's own gradient/solid tokens — independent of the image asset library. */
export interface DisplayGradientToken {
  id: string
  label: string
  css: string
}

export const DISPLAY_BACKGROUND_GRADIENTS: DisplayGradientToken[] = [
  {
    id: 'sunny-specials',
    label: 'Sunny Specials',
    css: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #fde047 100%)',
  },
  {
    id: 'calm-focus',
    label: 'Calm Focus',
    css: 'linear-gradient(135deg, #0f172a 0%, #155e75 45%, #67e8f9 100%)',
  },
  {
    id: 'quiet-morning',
    label: 'Quiet Morning',
    css: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 45%, #a5b4fc 100%)',
  },
]

export interface DisplaySolidToken {
  id: string
  label: string
  css: string
}

export const DISPLAY_BACKGROUND_SOLIDS: DisplaySolidToken[] = [
  { id: 'focus-navy', label: 'Focus Navy', css: '#0f172a' },
  { id: 'soft-slate', label: 'Soft Slate', css: '#1e293b' },
  { id: 'warm-charcoal', label: 'Warm Charcoal', css: '#292524' },
]

const GRADIENTS_BY_ID = new Map(DISPLAY_BACKGROUND_GRADIENTS.map((g) => [g.id, g]))
const SOLIDS_BY_ID = new Map(DISPLAY_BACKGROUND_SOLIDS.map((s) => [s.id, s]))
const IMAGE_ASSETS_BY_ID = new Map(BACKGROUND_ASSETS.map((a) => [a.id, a]))

export interface ResolvedDisplayBackground {
  /** CSS background-image value (gradient or url()) — always set, even for solids (transparent). */
  backgroundImage: string
  backgroundColor?: string
  label: string
}

/** Resolve a screen's background into concrete CSS, with a safe gradient fallback. */
export function resolveDisplayBackground(
  background: DisplayScreenBackground,
): ResolvedDisplayBackground {
  if (background.type === 'gradient') {
    const token = GRADIENTS_BY_ID.get(background.token)
    if (token) {
      return { backgroundImage: token.css, label: token.label }
    }
  }

  if (background.type === 'solid') {
    const token = SOLIDS_BY_ID.get(background.token)
    if (token) {
      return {
        backgroundImage: 'none',
        backgroundColor: token.css,
        label: token.label,
      }
    }
  }

  if (background.type === 'image') {
    const asset = IMAGE_ASSETS_BY_ID.get(background.token as never)
    if (asset) {
      return {
        backgroundImage: `url('${asset.path}'), ${asset.fallbackGradient}`,
        label: asset.label,
      }
    }
  }

  return {
    backgroundImage: DISPLAY_BACKGROUND_GRADIENTS[0].css,
    label: 'Default',
  }
}
