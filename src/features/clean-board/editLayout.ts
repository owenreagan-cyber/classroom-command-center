/**
 * DB-4C follow-up — responsive edit-layout mode selection.
 *
 * Pure helpers so the responsive behavior is unit-testable without DOM. The
 * board shell uses these to decide whether teacher panels render as desktop
 * side panels or as a tabbed drawer below the board on narrow screens.
 */

export type CleanBoardEditLayoutMode = 'sidePanels' | 'responsivePanels'

/**
 * Width below which edit mode switches from side panels to a tabbed drawer.
 * Matches Tailwind's `xl` breakpoint so iPad landscape (1180px) also gets a
 * full-width board instead of a cramped ~350px side-panel layout.
 */
export const CLEAN_BOARD_EDIT_BREAKPOINT = 1280

export type EditDrawerTab = 'saved' | 'look' | 'spotify' | 'messageCard' | 'timer'

export const EDIT_DRAWER_TAB_LABELS: Record<EditDrawerTab, string> = {
  saved: 'Saved Boards',
  look: 'Board Look',
  spotify: 'Spotify',
  messageCard: 'Message Card',
  timer: 'Timer',
}

export function getCleanBoardEditLayoutMode(width: number): CleanBoardEditLayoutMode {
  return width < CLEAN_BOARD_EDIT_BREAKPOINT ? 'responsivePanels' : 'sidePanels'
}

/** Ordered tabs available in the narrow-screen drawer for the current edit state. */
export function getCleanBoardEditTabs(opts: {
  showSpotify: boolean
  showMessageCard: boolean
  showTimer: boolean
}): EditDrawerTab[] {
  const tabs: EditDrawerTab[] = ['saved', 'look']
  if (opts.showSpotify) tabs.push('spotify')
  if (opts.showMessageCard) tabs.push('messageCard')
  if (opts.showTimer) tabs.push('timer')
  return tabs
}
