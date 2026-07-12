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
    id: 'snack-flow-control',
    screenId: 'snack',
    label: 'Snack Flow Control',
    path: '/assets/backgrounds/snack-lunch-flow-control.png',
    fallbackGradient:
      'linear-gradient(135deg, #134e4a 0%, #0f766e 45%, #fbbf24 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'snack flow control board',
    notes:
      'Phase 4D replacement. Keep times editable in React only.',
  },
  {
    id: 'lunch-flow-control',
    screenId: 'lunch',
    label: 'Lunch Flow Control',
    path: '/assets/backgrounds/snack-lunch-flow-control.png',
    fallbackGradient:
      'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 40%, #fde68a 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'lunch flow control board',
    notes:
      'Phase 4D replacement. Keep times editable in React only.',
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
    id: 'centers-rotations',
    screenId: 'centers',
    label: 'Group Work',
    path: '/assets/backgrounds/snack-lunch-flow-control.png',
    fallbackGradient:
      'linear-gradient(135deg, #14532d 0%, #16a34a 45%, #bbf7d0 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'group work and rotation flow',
    notes: 'Primary runtime background for Group Work.',
  },
  {
    id: 'recess-play',
    screenId: 'recess',
    label: 'Recess Play',
    path: '/assets/backgrounds/homeroom-morning-briefing.png',
    fallbackGradient:
      'linear-gradient(135deg, #0f172a 0%, #0f766e 42%, #fbbf24 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'safe recess transition',
    notes: 'Display destination for recess transitions.',
  },
  {
    id: 'homework-station',
    screenId: 'homework',
    label: 'Homework Station',
    path: '/assets/backgrounds/homeroom-morning-briefing.png',
    fallbackGradient:
      'linear-gradient(135deg, #0f172a 0%, #475569 45%, #e2e8f0 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'homework and planner station',
    notes: 'Phase 4D replacement. Replace with custom background later.',
  },
  {
    id: 'pack-up-station',
    screenId: 'pack-up',
    label: 'Pack Up Station',
    path: '/assets/backgrounds/homeroom-morning-briefing.png',
    fallbackGradient:
      'linear-gradient(135deg, #0f172a 0%, #475569 45%, #fbbf24 100%)',
    safeZones: ['left-main', 'center-card', 'right-utility'],
    mood: 'end of day pack-up',
    notes: 'Phase 4D replacement. Replace with custom background later.',
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

/** Map legacy background IDs to new ones. */
export function normalizeBackgroundId(
  backgroundId: string | undefined,
): BackgroundAssetId {
  switch (backgroundId) {
    case 'homeroom-morning-briefing':
    case 'math-training-lab':
    case 'reading-sky-book-world':
    case 'snack-flow-control':
    case 'lunch-flow-control':
    case 'ready-position-expectations':
    case 'writing-workshop':
    case 'science-lab':
    case 'social-studies-map':
    case 'assessment-mode':
    case 'centers-rotations':
    case 'recess-play':
    case 'homework-station':
    case 'pack-up-station':
      return backgroundId
    case 'snack-lunch-flow-control':
    case 'homework-packup':
      return backgroundId === 'snack-lunch-flow-control' ? 'snack-flow-control' : 'homework-station'
    default:
      return DEFAULT_BACKGROUND_ID
  }
}
