import { BACKGROUND_ASSETS } from '../../data/backgroundAssets'
import type { DisplayScreenBackground } from './types'

/** Display Composer gradient/solid tokens. */
export interface DisplayGradientToken {
  id: string
  label: string
  css: string
}

export const DISPLAY_BACKGROUND_GRADIENTS: DisplayGradientToken[] = [
  { id: 'sunny-specials', label: 'Sunny Specials', css: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 45%, #fde047 100%)' },
  { id: 'calm-focus', label: 'Calm Focus', css: 'linear-gradient(135deg, #0f172a 0%, #155e75 45%, #67e8f9 100%)' },
  { id: 'quiet-morning', label: 'Quiet Morning', css: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 45%, #a5b4fc 100%)' },
  // ── Phase 15F: Expanded gradient library ──
  { id: 'warm-sunset', label: 'Warm Sunset', css: 'linear-gradient(135deg, #7c2d12 0%, #b45309 45%, #f59e0b 100%)' },
  { id: 'bright-classroom', label: 'Bright Classroom', css: 'linear-gradient(135deg, #0369a1 0%, #0284c7 45%, #38bdf8 100%)' },
  { id: 'soft-pastel', label: 'Soft Pastel', css: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 45%, #c4b5fd 100%)' },
  { id: 'game-day', label: 'Game Day', css: 'linear-gradient(135deg, #991b1b 0%, #dc2626 45%, #fbbf24 100%)' },
  { id: 'cozy-seasonal', label: 'Cozy Seasonal', css: 'linear-gradient(135deg, #78350f 0%, #92400e 45%, #fcd34d 100%)' },
  { id: 'winter-focus', label: 'Winter Focus', css: 'linear-gradient(135deg, #0c4a6e 0%, #1e40af 45%, #93c5fd 100%)' },
  { id: 'outdoor-nature', label: 'Outdoor Nature', css: 'linear-gradient(135deg, #064e3b 0%, #047857 45%, #86efac 100%)' },
  { id: 'anime-energy', label: 'Anime Energy', css: 'linear-gradient(135deg, #4a044e 0%, #a21caf 45%, #f472b6 100%)' },
  { id: 'minimal-projector', label: 'Minimal Projector', css: 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)' },
  { id: 'rise-and-shine', label: 'Rise and Shine', css: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 45%, #fde68a 100%)' },
  { id: 'deep-focus', label: 'Deep Focus', css: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #6366f1 100%)' },
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
  // ── Phase 15F: Expanded solid library ──
  { id: 'deep-black', label: 'Deep Black', css: '#020617' },
  { id: 'classroom-white', label: 'Classroom White', css: '#f1f5f9' },
  { id: 'forest-green', label: 'Forest Green', css: '#052e16' },
  { id: 'deep-crimson', label: 'Deep Crimson', css: '#450a0a' },
]

const GRADIENTS_BY_ID = new Map(DISPLAY_BACKGROUND_GRADIENTS.map((g) => [g.id, g]))
const SOLIDS_BY_ID = new Map(DISPLAY_BACKGROUND_SOLIDS.map((s) => [s.id, s]))
const IMAGE_ASSETS_BY_ID = new Map(BACKGROUND_ASSETS.map((a) => [a.id, a]))

export interface ResolvedDisplayBackground {
  backgroundImage: string
  backgroundColor?: string
  label: string
}

export function resolveDisplayBackground(
  background: DisplayScreenBackground,
): ResolvedDisplayBackground {
  if (background.type === 'gradient') {
    const token = GRADIENTS_BY_ID.get(background.token)
    if (token) return { backgroundImage: token.css, label: token.label }
  }
  if (background.type === 'solid') {
    const token = SOLIDS_BY_ID.get(background.token)
    if (token) return { backgroundImage: 'none', backgroundColor: token.css, label: token.label }
  }
  if (background.type === 'image') {
    const asset = IMAGE_ASSETS_BY_ID.get(background.token as never)
    if (asset) return { backgroundImage: `url('${asset.path}'), ${asset.fallbackGradient}`, label: asset.label }
  }
  return { backgroundImage: DISPLAY_BACKGROUND_GRADIENTS[0].css, label: 'Default' }
}
