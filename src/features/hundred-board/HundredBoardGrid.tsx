import { useMemo } from 'react'
import { useHundredBoardStore } from './hundredBoardStore'
import type { PrizeRarity } from '../prize-board/types'

export function HundredBoardGrid() {
  const tiles = useHundredBoardStore((s) => s.tiles)
  const outcomes = useHundredBoardStore((s) => s.outcomes)
  const activeTileNumber = useHundredBoardStore((s) => s.activeTileNumber)
  const revealState = useHundredBoardStore((s) => s.revealState)
  const selectTile = useHundredBoardStore((s) => s.selectTile)
  const revealSelectedTile = useHundredBoardStore((s) => s.revealSelectedTile)

  const revealedTile = useMemo(() => {
    if (revealState !== 'showing' || !activeTileNumber) return null
    const tile = tiles[activeTileNumber - 1]
    if (!tile || tile.outcomeIndex === null) return null
    return outcomes[tile.outcomeIndex] ?? null
  }, [revealState, activeTileNumber, tiles, outcomes])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-10 gap-1.5">
        {tiles.map((tile) => {
          const isActive = tile.tileNumber === activeTileNumber && revealState !== 'showing'
          const isRevealed = tile.state === 'revealed' || tile.state === 'claimed'
          const outcome = tile.outcomeIndex !== null ? outcomes[tile.outcomeIndex] : null

          let bg = 'bg-slate-800/80 hover:bg-slate-700/80'
          let border = 'border-slate-600'
          let text = 'text-slate-400'

          if (isActive) {
            bg = 'bg-cyan-900/80'
            border = 'border-cyan-400 ring-2 ring-cyan-400/60'
            text = 'text-cyan-200'
          }
          if (isRevealed && outcome) {
            bg = 'bg-slate-700/80'
            if (outcome.rarity === 'premiumUltraRare') {
              bg = 'bg-rose-900/60'
              border = 'border-rose-400 ring-2 ring-rose-400/50'
            } else if (outcome.rarity === 'veryRare') {
              bg = 'bg-purple-900/40'
              border = 'border-purple-400/60'
            } else if (outcome.rarity === 'rare') {
              bg = 'bg-blue-900/30'
              border = 'border-blue-400/40'
            }
            text = 'text-white'
          }
          if (tile.state === 'claimed') {
            bg = 'bg-slate-900/60'
            border = 'border-slate-700'
            text = 'text-slate-500'
          }

          return (
            <button
              key={tile.tileNumber}
              onClick={() => selectTile(tile.tileNumber)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-[11px] font-bold transition-all ${bg} ${border} ${text} cursor-pointer`}
              disabled={tile.state === 'claimed'}
            >
              {isRevealed && outcome
                ? (outcome.displayEmoji ?? outcome.label.charAt(0))
                : tile.tileNumber}
            </button>
          )
        })}
      </div>

      {activeTileNumber && revealState === 'idle' && (
        <button
          onClick={revealSelectedTile}
          className="rounded-lg bg-cyan-700 px-6 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-600"
        >
          Reveal Tile #{activeTileNumber}
        </button>
      )}

      {revealedTile && revealState === 'showing' && (
        <HundredBoardReveal outcome={revealedTile} />
      )}
    </div>
  )
}

function rarityLabel(rarity?: PrizeRarity): string | undefined {
  if (!rarity) return undefined
  const map: Record<string, string> = {
    common: 'Common', uncommon: 'Uncommon', rare: 'Rare',
    veryRare: 'Very Rare', legendary: 'Legendary', premiumUltraRare: 'Premium Ultra Rare',
  }
  return map[rarity]
}

export function HundredBoardReveal({ outcome }: { outcome: import('./types').BoardOutcome }) {
  const isPremium = outcome.rarity === 'premiumUltraRare'
  const isVeryRare = outcome.rarity === 'veryRare'
  const isRare = outcome.rarity === 'rare'

  const bgClass = outcome.kind === 'whammy'
    ? 'from-slate-800/95 to-slate-900/95'
    : isPremium
      ? 'from-rose-950/95 to-slate-950/95'
      : isVeryRare
        ? 'from-purple-950/90 to-slate-950/95'
        : isRare
          ? 'from-blue-950/90 to-slate-950/95'
          : 'from-slate-900/90 to-slate-950/95'

  const rLabel = rarityLabel(outcome.rarity)

  return (
    <div className={`rounded-2xl bg-gradient-to-b ${bgClass} p-6 text-center border ${
      isPremium ? 'border-rose-400 ring-2 ring-rose-400/50' :
      isVeryRare ? 'border-purple-400' :
      isRare ? 'border-blue-400/60' :
      'border-slate-600'
    }`}>
      <span className="text-5xl">{outcome.displayEmoji ?? '🎉'}</span>

      {rLabel && (
        <p className={`mt-2 text-xs font-bold uppercase tracking-widest ${
          isPremium ? 'text-rose-300' : isVeryRare ? 'text-purple-300' : 'text-blue-300'
        }`}>
          {rLabel}
        </p>
      )}

      <p className={`mt-2 font-black ${
        isPremium ? 'text-3xl text-rose-100' :
        isVeryRare ? 'text-2xl text-purple-100' :
        'text-xl text-white'
      }`}>
        {outcome.label}
      </p>

      {outcome.kind === 'tryAgain' && (
        <p className="mt-2 text-sm text-slate-400">Better luck next tile!</p>
      )}
      {outcome.kind === 'whammy' && (
        <p className="mt-2 text-sm text-slate-400">No worries — pick another!</p>
      )}
    </div>
  )
}
