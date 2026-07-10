import type { BackgroundAsset, BackgroundAssetId, ScreenId } from './types'

export const BACKGROUND_ASSETS: BackgroundAsset[] = [
  {
    id: 'homeroom-morning-briefing',
    screenId: 'homeroom',
    label: 'Homeroom Morning Briefing',
    path: '/assets/backgrounds/homeroom-morning-briefing.png',
    fallbackGradient:
      'linear-gradient(135deg, #0c4a6e 0%, #0369a1 42%, #7dd3fc 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'calm sunrise classroom briefing',
    notes:
      'Canva page 2 export. Local PNG present. Refine safe zones in Canva if cards feel crowded.',
  },
  {
    id: 'math-training-lab',
    screenId: 'math',
    label: 'Math Training Lab',
    path: '/assets/backgrounds/math-training-lab.png',
    fallbackGradient:
      'linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #7c2d12 100%)',
    safeZones: ['left-main', 'center-card', 'right-timer'],
    mood: 'hero-academy training lab',
    notes: 'Canva page 3 export. Local PNG present.',
  },
  {
    id: 'reading-sky-book-world',
    screenId: 'reading',
    label: 'Reading Sky Book World',
    path: '/assets/backgrounds/reading-sky-book-world.png',
    fallbackGradient:
      'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 40%, #fde68a 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'cozy library / sky book world',
    notes:
      'Canva page 4 export. Keep center open for materials and ready-position cards.',
  },
  {
    id: 'snack-lunch-flow-control',
    screenId: 'snack-lunch',
    label: 'Snack-Lunch Flow Control',
    path: '/assets/backgrounds/snack-lunch-flow-control.png',
    fallbackGradient:
      'linear-gradient(135deg, #134e4a 0%, #0f766e 45%, #fbbf24 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'cafeteria flow control board',
    notes:
      'Canva page 5 export. Do not bake schedule times into artwork. Times stay editable in React only.',
  },
  {
    id: 'ready-position-expectations',
    screenId: 'ready-position',
    label: 'Ready Position Expectations',
    path: '/assets/backgrounds/ready-position-expectations.png',
    fallbackGradient:
      'linear-gradient(135deg, #111827 0%, #334155 50%, #ca8a04 100%)',
    safeZones: ['left-main', 'center-main', 'right-utility'],
    mood: 'focused classroom expectations',
    notes:
      'Canva page 6 export. Large center area for ReadyPositionCard. Decorative art only at edges.',
  },
]

export const DEFAULT_BACKGROUND_ID: BackgroundAssetId =
  'homeroom-morning-briefing'

export function getBackgroundAsset(
  backgroundId: BackgroundAssetId | string,
): BackgroundAsset {
  return (
    BACKGROUND_ASSETS.find((asset) => asset.id === backgroundId) ??
    BACKGROUND_ASSETS[0]
  )
}

export function getBackgroundForScreen(screenId: ScreenId): BackgroundAsset {
  return (
    BACKGROUND_ASSETS.find((asset) => asset.screenId === screenId) ??
    BACKGROUND_ASSETS[0]
  )
}
