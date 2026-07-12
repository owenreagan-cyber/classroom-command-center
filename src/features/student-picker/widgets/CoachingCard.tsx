import { usePickerStore } from '../pickerStore'
import { ALL_DEFAULT_LOOK_FORS } from '../defaults'
import type { ScreenId } from '../../../data/types'

interface CoachingCardProps {
  screenId: ScreenId
  presentation?: 'hidden' | 'compact' | 'expanded'
}

export function CoachingCard({ screenId, presentation = 'expanded' }: CoachingCardProps) {
  const config = usePickerStore((s) => s.coachingConfig)

  if (!config.enabled || !config.showOnScreens.includes(screenId)) {
    return null
  }

  const visibleLabels = config.visibleBehaviors
    .map((id) => ALL_DEFAULT_LOOK_FORS.find((b) => b.id === id)?.label)
    .filter(Boolean)

  if (visibleLabels.length === 0) {
    return null
  }

  if (presentation === 'hidden') {
    return null
  }

  return (
    <div
      className={`rounded-3xl border border-cyan-500/28 bg-slate-950/70 shadow-xl shadow-cyan-900/15 backdrop-blur ${
        presentation === 'compact' ? 'px-4 py-3' : 'p-6'
      }`}
    >
      <h3
        className={`font-black uppercase tracking-widest text-cyan-300 ${
          presentation === 'compact' ? 'mb-2 text-[11px]' : 'mb-4 text-lg'
        }`}
      >
        Looking for...
      </h3>
      <ul className={`${presentation === 'compact' ? 'grid gap-2' : 'space-y-3'}`}>
        {visibleLabels.map((label, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className={`mt-1 flex shrink-0 items-center justify-center rounded-full bg-cyan-500/18 font-bold text-cyan-300 ${presentation === 'compact' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-sm'}`}>
              ✓
            </span>
            <span className={`font-bold leading-tight text-slate-100 ${presentation === 'compact' ? 'text-sm' : 'text-lg'}`}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
