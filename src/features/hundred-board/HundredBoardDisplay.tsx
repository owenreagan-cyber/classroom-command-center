import type { DisplaySafeBoard } from './types'
import type { PrizeRarity } from '../prize-board/types'

interface Props {
  board: DisplaySafeBoard
}

function rarityRg(rarity?: PrizeRarity): string {
  switch (rarity) {
    case 'premiumUltraRare': return 'ring-rose-400'
    case 'veryRare': return 'ring-purple-400'
    case 'rare': return 'ring-blue-400'
    default: return 'ring-slate-500'
  }
}

export function HundredBoardDisplay({ board }: Props) {
  return (
    <div className="grid grid-cols-10 gap-1 max-w-xl mx-auto">
      {board.tiles.map((tile) => {
        const isRevealed = tile.state === 'revealed' || tile.state === 'claimed'
        const isActive = tile.tileNumber === board.activeTileNumber

        let bg = 'bg-slate-800/70'
        let ring = ''
        let content: string = String(tile.tileNumber)
        let textClass = 'text-slate-500'

        if (isActive) {
          bg = 'bg-cyan-800/70'
          ring = 'ring-2 ring-cyan-400/70'
          textClass = 'text-cyan-200'
        }
        if (isRevealed && tile.displayEmoji) {
          bg = 'bg-slate-700/70'
          content = tile.displayEmoji
          textClass = 'text-white'
          if (tile.rarity) {
            ring = `ring-1 ${rarityRg(tile.rarity)}`
          }
        }
        if (tile.state === 'claimed') {
          bg = 'bg-slate-900/50'
          textClass = 'text-slate-600'
        }

        return (
          <div
            key={tile.tileNumber}
            className={`flex aspect-square items-center justify-center rounded-md ${bg} ${ring} ${textClass} text-[9px] font-bold`}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}
