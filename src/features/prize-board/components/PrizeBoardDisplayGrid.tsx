import { memo } from 'react'
import type { PrizeBoardTile } from '../types'

interface DisplayTileProps {
  tile: PrizeBoardTile
  isHighlighted: boolean
  isFinal: boolean
  showNumbers?: boolean
}

const DisplayTile = memo(function DisplayTile({
  tile,
  isHighlighted,
  isFinal,
  showNumbers = true,
}: DisplayTileProps) {
  const revealed = tile.kind === 'revealed'
  const hasContent = tile.kind !== 'empty' || revealed

  return (
    <div
      className={`relative flex aspect-square items-center justify-center rounded-sm border transition-[transform,opacity,box-shadow] duration-75 ${
        isHighlighted
          ? 'z-10 scale-110 border-amber-300 bg-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.7)]'
          : isFinal
            ? 'scale-105 border-emerald-400/80 bg-emerald-500/20 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
            : hasContent
              ? 'border-slate-600/50 bg-slate-800/60'
              : 'border-slate-700/40 bg-slate-900/50'
      } ${revealed ? 'border-emerald-500/60 bg-emerald-950/40' : ''}`}
      style={{ willChange: isHighlighted ? 'transform, box-shadow' : undefined }}
    >
      {showNumbers && !revealed && (
        <span className={`text-[7px] font-bold md:text-[9px] ${
          isHighlighted ? 'text-amber-100' : 'text-slate-600'
        }`}
        >
          {tile.index + 1}
        </span>
      )}
      {revealed && tile.studentDisplayName && (
        <span className="line-clamp-2 px-0.5 text-center text-[6px] font-bold text-cyan-200 md:text-[8px]">
          {tile.studentDisplayName}
        </span>
      )}
      {isHighlighted && (
        <span
          className="pointer-events-none absolute inset-0 rounded-sm ring-2 ring-amber-300/80"
          aria-hidden
        />
      )}
    </div>
  )
})

interface PrizeBoardDisplayGridProps {
  tiles: PrizeBoardTile[]
  highlightedTileId: number | null
  finalTileId?: number | null
  compact?: boolean
}

export const PrizeBoardDisplayGrid = memo(function PrizeBoardDisplayGrid({
  tiles,
  highlightedTileId,
  finalTileId = null,
  compact = false,
}: PrizeBoardDisplayGridProps) {
  return (
    <div
      className={`grid grid-cols-10 gap-0.5 rounded-2xl border border-slate-700/80 bg-slate-950/80 p-1.5 md:gap-1 md:p-2 ${
        compact ? 'max-w-md' : 'w-full max-w-4xl'
      }`}
      role="grid"
      aria-label="Prize board"
    >
      {tiles.map((tile) => (
        <DisplayTile
          key={tile.index}
          tile={tile}
          isHighlighted={highlightedTileId === tile.index}
          isFinal={finalTileId === tile.index && highlightedTileId === tile.index}
        />
      ))}
    </div>
  )
})
