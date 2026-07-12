import { usePickerStore } from '../pickerStore'
import { ALL_DEFAULT_LOOK_FORS } from '../defaults'
import type { ScreenId } from '../../../data/types'

interface CoachingCardProps {
  screenId: ScreenId
}

export function CoachingCard({ screenId }: CoachingCardProps) {
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

  return (
    <div className="rounded-3xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-xl shadow-cyan-900/20 backdrop-blur">
      <h3 className="mb-4 text-xl font-black uppercase tracking-widest text-cyan-400">
        I am looking for students who...
      </h3>
      <ul className="space-y-3">
        {visibleLabels.map((label, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
              ✓
            </span>
            <span className="text-xl font-bold leading-tight text-slate-100">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
