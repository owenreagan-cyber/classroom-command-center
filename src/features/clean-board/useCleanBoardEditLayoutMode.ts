import { useEffect, useState } from 'react'
import {
  CLEAN_BOARD_EDIT_BREAKPOINT,
  getCleanBoardEditLayoutMode,
} from './editLayout'
import type { CleanBoardEditLayoutMode } from './editLayout'

/**
 * Tracks viewport width to select the edit-mode layout. Reads innerWidth on
 * mount and re-evaluates on resize/orientation change so the board switches
 * between desktop side panels and the narrow-screen drawer as the device
 * rotates or the window resizes. SSR-safe guard for non-browser environments.
 */
export function useCleanBoardEditLayoutMode(): CleanBoardEditLayoutMode {
  const [width, setWidth] = useState<number>(() =>
    typeof window === 'undefined' ? CLEAN_BOARD_EDIT_BREAKPOINT : window.innerWidth,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const update = () => setWidth(window.innerWidth)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return getCleanBoardEditLayoutMode(width)
}
