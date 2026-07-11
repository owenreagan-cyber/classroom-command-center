import { CARD_VISIBILITY_OPTIONS } from '../data/defaults'
import type { CardId, ScreenCardVisibility, ScreenId } from '../data/types'

interface CardVisibilityPanelProps {
  activeScreen: ScreenId
  cardVisibility: ScreenCardVisibility
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
}

export function CardVisibilityPanel({
  activeScreen,
  cardVisibility,
  onCardVisibleChange,
}: CardVisibilityPanelProps) {
  const options = CARD_VISIBILITY_OPTIONS[activeScreen] ?? []

  if (options.length === 0) {
    return null
  }

  const visibleCount = options.filter(
    (opt) => cardVisibility[activeScreen]?.[opt.id] ?? true,
  ).length
  const totalCount = options.length

  const handleShowAll = () => {
    options.forEach((opt) => onCardVisibleChange(activeScreen, opt.id, true))
  }

  const handleHideOptional = () => {
    options.forEach((opt) => {
      if (opt.isOptional) {
        onCardVisibleChange(activeScreen, opt.id, false)
      }
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Student Board Cards
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            {visibleCount} of {totalCount} cards showing on the student display.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShowAll}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          Show All
        </button>
        <button
          type="button"
          onClick={handleHideOptional}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          Hide Optional
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const visible = cardVisibility[activeScreen]?.[option.id] ?? true

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                visible
                  ? 'border-cyan-400/50 bg-cyan-950/30 text-cyan-50 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                  : 'border-slate-800 bg-slate-900/40 text-slate-500 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={visible}
                onChange={(event) =>
                  onCardVisibleChange(activeScreen, option.id, event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="block font-semibold">{option.label}</span>
                  {option.isOptional && !visible && (
                    <span className="rounded bg-slate-800 px-1 py-0.5 text-[9px] font-bold uppercase tracking-tighter text-slate-400">
                      Optional
                    </span>
                  )}
                </span>
                {option.helperText && (
                  <span className="block text-[11px] leading-tight text-slate-500">
                    {option.helperText}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
      <p className="px-1 text-[10px] italic text-slate-600">
        Changes to visibility affect the projected board locally in real-time.
      </p>
    </section>
  )
}
