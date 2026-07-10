import type { AppMode, ScreenId } from '../data/types'

/** Shared spacing and card shell tokens for projector-readable display mode. */
export const BOARD_GAP = {
  display: 'gap-5 md:gap-6',
  edit: 'gap-4 md:gap-5',
} as const

export function boardGap(mode: AppMode): string {
  return mode === 'display' ? BOARD_GAP.display : BOARD_GAP.edit
}

/** High-contrast card shell — slightly larger padding in display mode. */
export function boardCardShell(mode: AppMode): string {
  const base =
    'relative flex min-h-0 flex-col overflow-hidden rounded-3xl border shadow-lg backdrop-blur-sm'
  if (mode === 'display') {
    return `${base} border-white/65 bg-white/94 p-5 md:p-6`
  }
  return `${base} border-white/55 bg-white/92 p-4 md:p-5`
}

/** Screen grid shells aligned to background safe zones (left-main, center-card, right-utility). */
export function screenGridClass(screenId: ScreenId, mode: AppMode): string {
  const gap = boardGap(mode)
  const base = `board-screen-grid board-screen-grid--${screenId} h-full min-h-0 ${gap}`

  switch (screenId) {
    case 'homeroom':
      return `${base} board-screen-grid--homeroom`
    case 'math':
      return `${base} board-screen-grid--math`
    case 'reading':
      return `${base} board-screen-grid--reading`
    case 'snack-lunch':
      return `${base} board-screen-grid--snack-lunch`
    case 'ready-position':
      return `${base} board-screen-grid--ready-position`
    case 'writing':
    case 'science':
    case 'social-studies':
    case 'intervention':
    case 'assessment':
    case 'flexible-groups':
    case 'centers':
    case 'homework-packup':
      return `${base} board-screen-grid--subject`
    default:
      return `${base} board-screen-grid--subject`
  }
}

export function noiseCardOverlayClass(mode: AppMode): string {
  if (mode === 'display') {
    return 'absolute bottom-4 right-4 z-20 h-[22rem] w-[min(35rem,38vw)] md:h-[23.5rem]'
  }

  return 'absolute bottom-4 right-4 z-20 h-[20rem] w-[min(31rem,35vw)] md:h-[21.5rem]'
}

/** Area placement helpers for screen-specific grid cells. */
export const gridArea = {
  homeroom: {
    doNow: 'board-area-homeroom-do-now',
    reminders: 'board-area-homeroom-reminders',
    materials: 'board-area-homeroom-materials',
    ready: 'board-area-homeroom-ready',
    timer: 'board-area-homeroom-timer',
  },
  math: {
    lesson: 'board-area-math-lesson',
    materials: 'board-area-math-materials',
    timer: 'board-area-math-timer',
  },
  reading: {
    lesson: 'board-area-reading-lesson',
    materials: 'board-area-reading-materials',
    ready: 'board-area-reading-ready',
    timer: 'board-area-reading-timer',
  },
  snackLunch: {
    cleanup: 'board-area-snack-cleanup',
    routine: 'board-area-snack-routine',
    timer: 'board-area-snack-timer',
  },
  readyPosition: {
    main: 'board-area-ready-main',
    cue: 'board-area-ready-cue',
  },
} as const

/** Bump autofit ceilings in display mode for back-of-room readability. */
export function displayFontRange(
  mode: AppMode,
  min: number,
  max: number,
): { minFontSize: number; maxFontSize: number } {
  if (mode !== 'display') {
    return { minFontSize: min, maxFontSize: max }
  }
  return {
    minFontSize: Math.max(min, 16),
    maxFontSize: Math.max(max, Math.round(max * 1.15)),
  }
}
