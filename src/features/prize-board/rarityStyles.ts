import type { PrizeRarity } from './types'

export const RARITY_STYLES: Record<PrizeRarity, string> = {
  common: 'bg-slate-600/80 text-slate-100 border-slate-500/50',
  uncommon: 'bg-emerald-900/60 text-emerald-200 border-emerald-500/40',
  rare: 'bg-blue-900/60 text-blue-200 border-blue-400/40',
  veryRare: 'bg-purple-900/60 text-purple-200 border-purple-400/40',
  legendary: 'bg-amber-900/70 text-amber-200 border-amber-400/50',
  premiumUltraRare: 'bg-rose-900/80 text-rose-100 border-rose-400/50 ring-2 ring-rose-400/60',
}

export const RARITY_LABELS: Record<PrizeRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  veryRare: 'Very Rare',
  legendary: 'Legendary',
  premiumUltraRare: 'Premium Ultra Rare',
}

export function titleRarityBadgeClass(rarity: string): string {
  if (rarity === 'legendary') return RARITY_STYLES.legendary
  if (rarity === 'rare') return RARITY_STYLES.rare
  if (rarity === 'uncommon') return RARITY_STYLES.uncommon
  return RARITY_STYLES.common
}
