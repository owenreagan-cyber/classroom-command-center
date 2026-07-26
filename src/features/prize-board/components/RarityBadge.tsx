import type { PrizeRarity } from '../types'
import { RARITY_LABELS, RARITY_STYLES } from '../rarityStyles'

interface RarityBadgeProps {
  rarity: PrizeRarity
  compact?: boolean
}

export function RarityBadge({ rarity, compact }: RarityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border font-bold uppercase tracking-wider ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      } ${RARITY_STYLES[rarity]}`}
    >
      {RARITY_LABELS[rarity]}
    </span>
  )
}
