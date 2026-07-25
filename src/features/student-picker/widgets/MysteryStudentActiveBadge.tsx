import type { ScreenId } from '../../../data/types'
import type { PickerPoolKey } from '../../roster/types'
import { getMysteryDisplayStatus } from '../../roster/displaySafe'
import { usePickerStore } from '../pickerStore'

interface MysteryStudentActiveBadgeProps {
  screenId: ScreenId
}

function poolKeysForScreen(screenId: ScreenId): PickerPoolKey[] {
  if (screenId === 'homeroom') return ['homeroom']
  if (screenId === 'math') return ['math']
  if (screenId === 'reading') return ['reading:RM4', 'reading:SM5', 'reading']
  return []
}

/** Student-safe indicator — no identity, notes, or roster details. */
export function MysteryStudentActiveBadge({ screenId }: MysteryStudentActiveBadgeProps) {
  const sessions = usePickerStore((s) => s.activeMysterySessions)

  const activeSession = poolKeysForScreen(screenId)
    .map((key) => sessions[key])
    .find((session) => session && session.status === 'active')

  const displayStatus = getMysteryDisplayStatus(activeSession)

  if (!displayStatus.isActive) {
    return null
  }

  return (
    <div
      className="pointer-events-none absolute right-[var(--board-safe-x)] top-[calc(var(--board-header-top-md)+0.25rem)] z-25 rounded-2xl border border-amber-300/45 bg-amber-950/55 px-4 py-2 shadow-lg backdrop-blur-sm md:top-[calc(var(--board-header-top-md)+0.5rem)]"
      role="status"
      aria-live="polite"
      aria-label={displayStatus.statusLabel || 'Mystery Star is active'}
    >
      <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-amber-200/85">
        Mystery Star
      </p>
      <p className="mt-0.5 text-sm font-bold uppercase tracking-wide text-amber-50 md:text-base">
        {displayStatus.hasHiddenDraw ? 'Active' : displayStatus.revealInProgress ? 'Reveal' : 'Active'}
      </p>
    </div>
  )
}
