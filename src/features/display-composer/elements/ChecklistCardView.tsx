import type { AppMode } from '../../../data/types'
import { boardCardShell } from '../../../lib/displayLayout'
import type { ChecklistCard } from '../types'

interface ChecklistCardViewProps {
  card: ChecklistCard
  mode: AppMode
  className?: string
}

/** Static, student-facing checklist card — icons/checkmarks only, no interactive controls. */
export function ChecklistCardView({ card, mode, className = '' }: ChecklistCardViewProps) {
  const titleSize = mode === 'display' ? 'text-2xl md:text-3xl' : 'text-lg'
  const itemSize = mode === 'display' ? 'text-xl md:text-2xl' : 'text-sm'

  return (
    <div className={`${boardCardShell(mode)} ${className}`}>
      <h3 className={`${titleSize} font-black tracking-tight text-slate-900`}>{card.heading}</h3>
      <ul className="mt-4 flex flex-1 flex-col justify-start gap-3 overflow-auto">
        {card.items.map((item) => (
          <li key={item.id} className={`flex items-center gap-3 ${itemSize} font-semibold leading-snug text-slate-900`}>
            <span aria-hidden="true" className="text-2xl md:text-3xl">
              {item.icon}
            </span>
            <span className="flex-1">{item.text}</span>
            <span
              aria-hidden="true"
              className={`text-2xl md:text-3xl ${item.checked ? 'text-emerald-600' : 'text-slate-300'}`}
            >
              {item.checked ? '✔' : '▢'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
