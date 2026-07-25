import type { MysterySession, MysterySlotStatus } from '../student-picker/types'

/** Generic student-safe status for projector display. Never includes hidden identities. */
export interface MysteryDisplayStatus {
  isActive: boolean
  hasHiddenDraw: boolean
  revealInProgress: boolean
  celebratingWin: boolean
  statusLabel: string
}

export function getMysteryDisplayStatus(session: MysterySession | null | undefined): MysteryDisplayStatus {
  if (!session) {
    return {
      isActive: false,
      hasHiddenDraw: false,
      revealInProgress: false,
      celebratingWin: false,
      statusLabel: '',
    }
  }

  if (session.status === 'active') {
    return {
      isActive: true,
      hasHiddenDraw: true,
      revealInProgress: false,
      celebratingWin: false,
      statusLabel: 'Mystery Star is active',
    }
  }

  if (session.status.startsWith('revealed-')) {
    const celebratingWin = session.status === 'revealed-3'
      && session.slots.star?.status === 'earned'

    return {
      isActive: true,
      hasHiddenDraw: false,
      revealInProgress: true,
      celebratingWin,
      statusLabel: celebratingWin ? 'Celebrating a class win' : 'High Fliers ready',
    }
  }

  return {
    isActive: false,
    hasHiddenDraw: false,
    revealInProgress: false,
    celebratingWin: false,
    statusLabel: '',
  }
}

/** Returns true when a slot outcome is finalized (teacher-only data). */
export function isFinalizedOutcome(status: MysterySlotStatus | undefined): boolean {
  return status === 'earned' || status === 'did-not-earn'
}

/** Strip any private session fields for display-safe logging or snapshots. */
export function toDisplaySafeMysterySnapshot(session: MysterySession | null | undefined) {
  if (!session) return null
  return {
    status: session.status,
    date: session.date,
    hasActiveDraw: session.status === 'active',
  }
}
