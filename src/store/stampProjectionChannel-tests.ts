import { deriveActiveStampProjectionView } from './stampProjectionChannel'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

// --- no active projection ---

assert(
  deriveActiveStampProjectionView(null, undefined) === null,
  'no active projection resolves to null regardless of any student record',
)

// --- active projection, no matching student record yet ---

const freshView = deriveActiveStampProjectionView({ studentId: 's1', displayName: 'Jordan' }, undefined)
assert(freshView !== null, 'a projected student with no record yet still resolves (not null)')
assert(freshView?.balance === 0, 'missing record defaults to a 0 balance')
assert(freshView?.redeemedMilestones.length === 0, 'missing record defaults to no redeemed milestones')
assert(freshView?.nextTier === 25, 'missing record defaults to tier 25 as the next milestone')

// --- active projection with a real record, mid-progress ---

const midView = deriveActiveStampProjectionView(
  { studentId: 's2', displayName: 'Alex' },
  { balance: 45, redeemedMilestones: [25] },
)
assert(midView?.balance === 45, 'balance passes through from the student record')
assert(midView?.nextTier === 50, 'next tier is the smallest not-yet-redeemed tier (50, since 25 is done)')
assert(midView?.displayName === 'Alex', 'displayName comes from the projection, not the record')

// --- fully redeemed (all four tiers) ---

const completeView = deriveActiveStampProjectionView(
  { studentId: 's3', displayName: 'Sam' },
  { balance: 100, redeemedMilestones: [25, 50, 75, 100] },
)
assert(completeView?.nextTier === null, 'a fully redeemed card has no next tier')

console.log('stampProjectionChannel tests passed.')
