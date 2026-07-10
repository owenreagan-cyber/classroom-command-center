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

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Student Board Cards
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Toggle what appears on this screen. Hidden cards stay off the student
          display.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const visible = cardVisibility[activeScreen]?.[option.id] ?? true

          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                visible
                  ? 'border-cyan-400/50 bg-cyan-950/30 text-cyan-50'
                  : 'border-slate-700 bg-slate-900/70 text-slate-400'
              }`}
            >
              <input
                type="checkbox"
                checked={visible}
                onChange={(event) =>
                  onCardVisibleChange(activeScreen, option.id, event.target.checked)
                }
                className="mt-1 h-4 w-4 accent-cyan-400"
              />
              <span>
                <span className="block font-semibold">{option.label}</span>
                {option.helperText && (
                  <span className="block text-xs text-slate-500">
                    {option.helperText}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
