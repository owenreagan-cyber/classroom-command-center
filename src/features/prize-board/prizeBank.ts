import { DEFAULT_PRIZE_BANK, MYSTERY_BOX_PRIZE_ID } from './defaultPrizes'
import type { Prize, PrizeRarity, PrizeSettingsOverride } from './types'
import { VALID_PRIZE_RARITIES } from './types'

export function isValidPrizeRarity(rarity: string): rarity is PrizeRarity {
  return (VALID_PRIZE_RARITIES as readonly string[]).includes(rarity)
}

export function mergePrizeWithOverrides(
  prize: Prize,
  overrides: Record<string, PrizeSettingsOverride>,
): Prize {
  const override = overrides[prize.id]
  if (!override) return prize
  return {
    ...prize,
    active: override.active ?? prize.active,
    stock: override.stock !== undefined ? override.stock : prize.stock,
  }
}

export function getEffectivePrizeBank(
  bank: Prize[],
  overrides: Record<string, PrizeSettingsOverride>,
): Prize[] {
  return bank.map((p) => mergePrizeWithOverrides(p, overrides))
}

export function getActivePrizes(
  bank: Prize[],
  overrides: Record<string, PrizeSettingsOverride>,
): Prize[] {
  return getEffectivePrizeBank(bank, overrides).filter((p) => p.active)
}

export function getPrizeById(
  prizeId: string,
  bank: Prize[] = DEFAULT_PRIZE_BANK,
  overrides: Record<string, PrizeSettingsOverride> = {},
): Prize | undefined {
  const merged = getEffectivePrizeBank(bank, overrides)
  return merged.find((p) => p.id === prizeId)
}

export function isMysteryBoxPrize(prizeId: string): boolean {
  return prizeId === MYSTERY_BOX_PRIZE_ID
}

/** Mystery-eligible pool excludes the Mystery Box container itself. */
export function getMysteryEligiblePrizes(
  bank: Prize[],
  overrides: Record<string, PrizeSettingsOverride>,
): Prize[] {
  return getActivePrizes(bank, overrides).filter(
    (p) => p.mysteryBoxEligible && p.id !== MYSTERY_BOX_PRIZE_ID,
  )
}

export function pickRandomMysteryContents(
  bank: Prize[],
  overrides: Record<string, PrizeSettingsOverride>,
  rng: () => number = Math.random,
): Prize | null {
  const eligible = getMysteryEligiblePrizes(bank, overrides)
  if (eligible.length === 0) return null
  return eligible[Math.floor(rng() * eligible.length)] ?? null
}

export const RARITY_WEIGHTS: Record<PrizeRarity, number> = {
  common: 40,
  uncommon: 30,
  rare: 15,
  veryRare: 8,
  legendary: 2,
}

export function weightedRandomPrize(
  prizes: Prize[],
  rng: () => number = Math.random,
): Prize | null {
  if (prizes.length === 0) return null
  const weights = prizes.map((p) => RARITY_WEIGHTS[p.rarity] ?? 1)
  const total = weights.reduce((sum, w) => sum + w, 0)
  let roll = rng() * total
  for (let i = 0; i < prizes.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return prizes[i]
  }
  return prizes[prizes.length - 1] ?? null
}
