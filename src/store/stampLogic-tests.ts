import {
  applyAddStamps,
  applyRedeemMilestone,
  createEmptyStampRecord,
  STAMP_BALANCE_MAX,
  STAMP_MILESTONE_TIERS,
} from './stampLogic'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

// --- createEmptyStampRecord ---

const fresh = createEmptyStampRecord('student-1')
assert(fresh.balance === 0, 'a fresh record starts at 0 stamps')
assert(fresh.redeemedMilestones.length === 0, 'a fresh record has no redeemed milestones')

// --- applyAddStamps ---

let record = createEmptyStampRecord('student-1')
record = applyAddStamps(record, 5)
assert(record.balance === 5, 'adding 5 stamps to 0 gives 5')
record = applyAddStamps(record, 10)
assert(record.balance === 15, 'adding 10 more gives 15')
record = applyAddStamps(record, 1)
assert(record.balance === 16, 'adding 1 more gives 16')

let nearCap = { ...createEmptyStampRecord('student-2'), balance: 95 }
nearCap = applyAddStamps(nearCap, 10)
assert(nearCap.balance === STAMP_BALANCE_MAX, 'balance clamps at 100 rather than overflowing')

// --- applyRedeemMilestone ---

const below25 = { ...createEmptyStampRecord('student-3'), balance: 24 }
const belowResult = applyRedeemMilestone(below25, 25)
assert(!belowResult.ok, 'redeeming tier 25 below 25 stamps fails')
assert(!belowResult.ok && belowResult.error === 'insufficient-balance', 'failure reason is insufficient-balance')

const at25 = { ...createEmptyStampRecord('student-4'), balance: 25 }
const redeemedAt25 = applyRedeemMilestone(at25, 25)
assert(redeemedAt25.ok, 'redeeming tier 25 at exactly 25 stamps succeeds')
assert(
  redeemedAt25.ok && redeemedAt25.record.redeemedMilestones.includes(25),
  'tier 25 is recorded as redeemed',
)
assert(
  redeemedAt25.ok && redeemedAt25.record.balance === 25,
  'redeeming a milestone does not reduce the running balance',
)

if (redeemedAt25.ok) {
  const doubleRedeem = applyRedeemMilestone(redeemedAt25.record, 25)
  assert(!doubleRedeem.ok, 'redeeming the same tier twice fails')
  assert(!doubleRedeem.ok && doubleRedeem.error === 'already-redeemed', 'failure reason is already-redeemed')
}

let at100 = { ...createEmptyStampRecord('student-5'), balance: 100 }
for (const tier of STAMP_MILESTONE_TIERS) {
  const result = applyRedeemMilestone(at100, tier)
  assert(result.ok, `tier ${tier} redeems successfully at a full 100-stamp balance`)
  if (result.ok) at100 = result.record
}
assert(at100.redeemedMilestones.length === STAMP_MILESTONE_TIERS.length, 'all four tiers can be redeemed in sequence')
assert(
  at100.redeemedMilestones.join(',') === [...STAMP_MILESTONE_TIERS].sort((a, b) => a - b).join(','),
  'redeemed milestones stay sorted ascending',
)

console.log('Stamp tracker logic tests passed.')
