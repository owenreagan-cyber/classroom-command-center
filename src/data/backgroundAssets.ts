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
  {
    id: 'writing-workshop',
    screenId: 'writing',
    label: 'Writing Workshop',
    path: '/assets/backgrounds/reading-sky-book-world.png',
    fallbackGradient:
      'linear-gradient(135deg, #312e81 0%, #7c3aed 45%, #f5d0fe 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'calm writing workshop',
    notes: 'Phase 4A lightweight alias. Replace with custom background later.',
  },
  {
    id: 'science-lab',
    screenId: 'science',
    label: 'Science Lab',
    path: '/assets/backgrounds/math-training-lab.png',
    fallbackGradient:
      'linear-gradient(135deg, #064e3b 0%, #0f766e 45%, #a7f3d0 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'science investigation lab',
    notes: 'Phase 4A lightweight alias. Replace with custom background later.',
  },
  {
    id: 'social-studies-map',
    screenId: 'social-studies',
    label: 'Social Studies Map',
    path: '/assets/backgrounds/reading-sky-book-world.png',
    fallbackGradient:
      'linear-gradient(135deg, #78350f 0%, #b45309 45%, #fde68a 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'history and map study',
    notes: 'Phase 4A lightweight alias. Replace with custom background later.',
  },
  {
    id: 'intervention-focus',
    screenId: 'intervention',
    label: 'Intervention Focus',
    path: '/assets/backgrounds/ready-position-expectations.png',
    fallbackGradient:
      'linear-gradient(135deg, #1e1b4b 0%, #4338ca 45%, #bfdbfe 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'small group focus',
    notes: 'Phase 4A lightweight alias. Replace with custom background later.',
  },
  {
    id: 'assessment-mode',
    screenId: 'assessment',
    label: 'Assessment Mode',
    path: '/assets/backgrounds/ready-position-expectations.png',
    fallbackGradient:
      'linear-gradient(135deg, #111827 0%, #374151 45%, #d1d5db 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'quiet assessment mode',
    notes: 'Phase 4A lightweight alias. Replace with custom background later.',
  },
  {
    id: 'flexible-groups',
    screenId: 'flexible-groups',
    label: 'Flexible Groups',
    path: '/assets/backgrounds/homeroom-morning-briefing.png',
    fallbackGradient:
      'linear-gradient(135deg, #164e63 0%, #0891b2 45%, #cffafe 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'collaborative group work',
    notes: 'Phase 4A lightweight alias. Replace with custom background later.',
  },
  {
    id: 'centers-rotations',
    screenId: 'centers',
    label: 'Centers / Rotations',
    path: '/assets/backgrounds/snack-lunch-flow-control.png',
    fallbackGradient:
      'linear-gradient(135deg, #14532d 0%, #16a34a 45%, #bbf7d0 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'centers and rotation flow',
    notes: 'Phase 4A lightweight alias. Replace with custom background later.',
  },
  {
    id: 'homework-packup',
    screenId: 'homework-packup',
    label: 'Homework / Pack-Up',
    path: '/assets/backgrounds/homeroom-morning-briefing.png',
    fallbackGradient:
      'linear-gradient(135deg, #0f172a 0%, #475569 45%, #e2e8f0 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'end of day pack-up',
    notes: 'Phase 4A lightweight alias. Replace with custom background later.',
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
