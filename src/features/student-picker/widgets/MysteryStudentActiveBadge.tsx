import type { ScreenId } from '../../../data/types'
import { usePickerStore } from '../pickerStore'

interface MysteryStudentActiveBadgeProps {
  screenId: ScreenId
}

/** Student-safe indicator — no identity, notes, or roster details. */
export function MysteryStudentActiveBadge({ screenId }: MysteryStudentActiveBadgeProps) {
  const classId = ['homeroom', 'math', 'reading'].includes(screenId)
    ? (screenId as 'homeroom' | 'math' | 'reading')
    : null

  const session = usePickerStore((s) =>
    classId ? s.activeMysterySessions[classId] : null,
  )

  if (!session || session.status !== 'active') {
    return null
  }

  return (
    <div
      className="pointer-events-none absolute right-[var(--board-safe-x)] top-[calc(var(--board-header-top-md)+0.25rem)] z-25 rounded-2xl border border-amber-300/45 bg-amber-950/55 px-4 py-2 shadow-lg backdrop-blur-sm md:top-[calc(var(--board-header-top-md)+0.5rem)]"
      role="status"
      aria-live="polite"
      aria-label="Mystery Student active"
    >
      <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-amber-200/85">
        Mystery Student
      </p>
      <p className="mt-0.5 text-sm font-bold uppercase tracking-wide text-amber-50 md:text-base">
        Active
      </p>
    </div>
  )
}
