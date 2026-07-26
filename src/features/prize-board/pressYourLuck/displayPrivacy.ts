import type { PressYourLuckState } from './types'

/** Fields that must never appear on /display snapshots or DOM. */
const PRIVATE_FIELD_PATTERNS = [
  'studentId',
  'prizeId',
  'prizeOverrides',
  'whammyConfig',
  'SecretStop',
  'testCelebration',
] as const

export function displaySnapshotIsPrivateFree(snapshot: unknown): boolean {
  const json = JSON.stringify(snapshot)
  return PRIVATE_FIELD_PATTERNS.every((field) => !json.includes(field))
}

/** Safe game status label for projector display — no student ids. */
export function getDisplayGameStatus(state: Pick<PressYourLuckState, 'phase' | 'remainingSpins' | 'currentSpinCount'>): string {
  switch (state.phase) {
    case 'idle':
      return 'Prize Board Ready'
    case 'ready':
      return 'Get Ready!'
    case 'spinning':
      return 'Spinning…'
    case 'stopping':
      return 'Slowing down…'
    case 'revealing':
      return 'Reveal!'
    case 'celebrating':
      return 'Winner!'
    case 'miss':
      return 'No prize this time'
    default:
      return ''
  }
}

/** Teacher-only control labels — must not render on display route. */
export const TEACHER_ONLY_CONTROL_IDS = [
  'start-spin',
  'reset-spin',
  'skip-reveal',
  'test-celebration',
  'sound-toggle',
  'secret-stop',
  'prize-settings',
] as const

export function isTeacherOnlyControl(controlId: string): boolean {
  return (TEACHER_ONLY_CONTROL_IDS as readonly string[]).includes(controlId)
}
