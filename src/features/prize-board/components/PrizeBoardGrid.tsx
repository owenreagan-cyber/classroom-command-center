import { getPrizeById } from '../prizeBank'
import type { Prize, PrizeBoardTile, PrizeSettingsOverride } from '../types'
import { RarityBadge } from './RarityBadge'

interface PrizeBoardGridProps {
  tiles: PrizeBoardTile[]
  prizeBank: Prize[]
  prizeOverrides: Record<string, PrizeSettingsOverride>
  selectedTile: number | null
  onSelectTile: (index: number) => void
  highlightedTile?: number | null
  spinMode?: boolean
}

const KIND_STYLES: Record<PrizeBoardTile['kind'], string> = {
  empty: 'border-slate-700/60 bg-slate-900/40 text-slate-600',
  student: 'border-cyan-600/40 bg-cyan-950/30 text-cyan-200',
  prize: 'border-amber-500/40 bg-amber-950/25 text-amber-200',
  revealed: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200',
}

export function PrizeBoardGrid({
  tiles,
  prizeBank,
  prizeOverrides,
  selectedTile,
  onSelectTile,
  highlightedTile = null,
  spinMode = false,
}: PrizeBoardGridProps) {
  return (
    <div
      className="grid grid-cols-10 gap-0.5 rounded-xl border border-slate-700 bg-slate-950/50 p-1.5"
      role="grid"
      aria-label="Prize board tiles"
    >
      {tiles.map((tile) => {
        const prize = tile.prizeId
          ? getPrizeById(tile.prizeId, prizeBank, prizeOverrides)
          : undefined
        const isSelected = selectedTile === tile.index
        const isHighlighted = highlightedTile === tile.index
        const label = tileLabel(tile, prize)

        return (
          <button
            key={tile.index}
            type="button"
            role="gridcell"
            onClick={() => !spinMode && onSelectTile(tile.index)}
            title={label}
            disabled={spinMode}
            className={`relative flex aspect-square items-center justify-center rounded border p-0.5 text-[8px] font-bold leading-tight transition-[transform,box-shadow,filter] duration-75 hover:brightness-125 ${
              KIND_STYLES[tile.kind]
            } ${isSelected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : ''} ${
              isHighlighted ? 'z-10 scale-110 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]' : ''
            }`}
            style={isHighlighted ? { willChange: 'transform, box-shadow' } : undefined}
          >
            <span className="line-clamp-3 text-center">{shortLabel(label, tile.kind)}</span>
            {prize && tile.kind !== 'revealed' && (
              <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-amber-400/80" aria-hidden />
            )}
            {tile.kind === 'revealed' && prize && (
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 scale-75">
                <RarityBadge rarity={prize.rarity} compact />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function tileLabel(tile: PrizeBoardTile, prize?: ReturnType<typeof getPrizeById>): string {
  if (tile.kind === 'revealed') {
    if (tile.studentDisplayName) return tile.studentDisplayName
    if (tile.revealedPrizeId && prize) return `${prize.label}?`
    return prize?.label ?? 'Revealed'
  }
  if (tile.kind === 'student') return tile.studentDisplayName ?? 'Student'
  if (tile.kind === 'prize') return prize?.label ?? 'Prize'
  return `${tile.index + 1}`
}

function shortLabel(label: string, kind: PrizeBoardTile['kind']): string {
  if (kind === 'empty') return '·'
  if (label.length <= 8) return label
  return `${label.slice(0, 6)}…`
}
