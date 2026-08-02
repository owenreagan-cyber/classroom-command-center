import type { AppMode } from '../../../data/types'
import { boardCardShell } from '../../../lib/displayLayout'
import type { MaterialsCard } from '../types'

const SECTION_COLOR_CLASSES: Record<string, string> = {
  sky: 'border-sky-300/70 bg-sky-50/90 text-sky-950',
  amber: 'border-amber-300/70 bg-amber-50/90 text-amber-950',
  emerald: 'border-emerald-300/70 bg-emerald-50/90 text-emerald-950',
  violet: 'border-violet-300/70 bg-violet-50/90 text-violet-950',
}

const DEFAULT_SECTION_COLOR = 'border-slate-300/70 bg-slate-50/90 text-slate-950'

interface MaterialsCardViewProps {
  card: MaterialsCard
  mode: AppMode
  className?: string
}

export function MaterialsCardView({ card, mode, className = '' }: MaterialsCardViewProps) {
  const titleSize = mode === 'display' ? 'text-2xl md:text-3xl' : 'text-lg'
  const itemSize = mode === 'display' ? 'text-xl md:text-2xl' : 'text-sm'

  return (
    <div className={`${boardCardShell(mode)} ${className}`}>
      <h3 className={`${titleSize} font-black tracking-tight text-slate-900`}>{card.heading}</h3>
      <div className="mt-3 flex flex-1 flex-col gap-3 overflow-auto">
        {card.sections.map((section) => (
          <div
            key={section.id}
            className={`rounded-2xl border px-4 py-3 ${
              section.colorToken ? SECTION_COLOR_CLASSES[section.colorToken] ?? DEFAULT_SECTION_COLOR : DEFAULT_SECTION_COLOR
            }`}
          >
            {section.label && (
              <p className={`font-bold uppercase tracking-wide ${mode === 'display' ? 'text-sm md:text-base' : 'text-xs'}`}>
                {section.label}
              </p>
            )}
            <ul className="mt-1 flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item} className={`${itemSize} font-semibold leading-snug`}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
