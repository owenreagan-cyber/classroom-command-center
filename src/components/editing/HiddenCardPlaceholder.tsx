import type { CardId, ScreenId } from '../../data/types'

interface HiddenCardPlaceholderProps {
  screenId: ScreenId
  cardId: CardId
  label: string
  onToggle: (screenId: ScreenId, cardId: CardId, visible: boolean) => void
  className?: string
}

export function HiddenCardPlaceholder({
  screenId,
  cardId,
  label,
  onToggle,
  className = '',
}: HiddenCardPlaceholderProps) {
  return (
    <div
      className={`group relative flex items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/20 p-4 text-center transition-all hover:bg-slate-900/40 ${className}`}
    >
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Hidden Card
        </span>
        <p className="text-sm font-semibold text-slate-400">{label}</p>
        <button
          type="button"
          onClick={() => onToggle(screenId, cardId, true)}
          className="mt-1 rounded-lg bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition hover:bg-cyan-900/50 hover:text-cyan-200"
        >
          Show Card
        </button>
      </div>
    </div>
  )
}
