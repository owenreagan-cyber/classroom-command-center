/**
 * Pure domain logic for the digital stamp tracker — kept side-effect-free so
 * it can be unit tested directly (mirrors the split used by
 * `timerRecovery.ts`/`timerFormat.ts` for `timerStore.ts`). `stampStore.ts` is
 * the only place this touches Zustand/persistence.
 */

export type StampMilestoneTier = 25 | 50 | 75 | 100
export type StampAddAmount = 1 | 5 | 10

export const STAMP_MILESTONE_TIERS: readonly StampMilestoneTier[] = [25, 50, 75, 100]

export const STAMP_BALANCE_MAX = 100

export interface StudentStampRecord {
  studentId: string
  balance: number
  redeemedMilestones: StampMilestoneTier[]
}

export function createEmptyStampRecord(studentId: string): StudentStampRecord {
  return { studentId, balance: 0, redeemedMilestones: [] }
}

/** Adds stamps to a student's balance, clamped to the 0–100 range. */
export function applyAddStamps(
  record: StudentStampRecord,
  amount: StampAddAmount,
): StudentStampRecord {
  return {
    ...record,
    balance: Math.min(STAMP_BALANCE_MAX, record.balance + amount),
  }
}

export type RedeemMilestoneResult =
  | { ok: true; record: StudentStampRecord }
  | { ok: false; error: 'insufficient-balance' | 'already-redeemed' }

/** Marks a milestone tier redeemed once the student's balance has reached it. */
export function applyRedeemMilestone(
  record: StudentStampRecord,
  tier: StampMilestoneTier,
): RedeemMilestoneResult {
  if (record.redeemedMilestones.includes(tier)) {
    return { ok: false, error: 'already-redeemed' }
  }
  if (record.balance < tier) {
    return { ok: false, error: 'insufficient-balance' }
  }
  return {
    ok: true,
    record: {
      ...record,
      redeemedMilestones: [...record.redeemedMilestones, tier].sort((a, b) => a - b),
    },
  }
}
