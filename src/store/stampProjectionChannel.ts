import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useStampStore, STAMP_REDEMPTION_CHANNEL_NAME } from './stampStore'
import type { StampRedemptionEvent } from './stampStore'
import { STAMP_MILESTONE_TIERS } from './stampLogic'
import type { StampMilestoneTier } from './stampLogic'

/**
 * The ONLY sanctioned way for `/display` code to read stamp-tracker state.
 * Every export here resolves to just the one student a teacher has
 * explicitly cast (`activeProjection`) — never the full per-student
 * `students` map, never another student's balance or history. `/display`
 * code must import from this module, never from `stampStore.ts`/
 * `stampLogic.ts` directly (enforced by `test:stamps`'s isolation guard).
 */

export interface ActiveStampProjectionView {
  studentId: string
  displayName: string
  balance: number
  redeemedMilestones: StampMilestoneTier[]
  /** The smallest not-yet-redeemed tier, or `null` once all four are
   * redeemed (a "complete card"). */
  nextTier: StampMilestoneTier | null
}

/** Pure — kept separate from the hook below purely so it's unit-testable
 * without React/Zustand. */
export function deriveActiveStampProjectionView(
  projection: { studentId: string; displayName: string } | null,
  studentRecord: { balance: number; redeemedMilestones: StampMilestoneTier[] } | undefined,
): ActiveStampProjectionView | null {
  if (!projection) return null
  const balance = studentRecord?.balance ?? 0
  const redeemedMilestones = studentRecord?.redeemedMilestones ?? []
  const nextTier = STAMP_MILESTONE_TIERS.find((t) => !redeemedMilestones.includes(t)) ?? null
  return {
    studentId: projection.studentId,
    displayName: projection.displayName,
    balance,
    redeemedMilestones,
    nextTier,
  }
}

/**
 * Live view of whichever single student is currently cast to `/display`.
 * Uses `useShallow` because `deriveActiveStampProjectionView` builds a new
 * object every call — without it, `useSyncExternalStore` (which Zustand v5
 * uses internally) treats every store update as a changed snapshot and
 * loops, since a fresh reference is never `Object.is`-equal to the last one
 * even when nothing relevant actually changed.
 */
export function useActiveStampProjection(): ActiveStampProjectionView | null {
  return useStampStore(
    useShallow((s) =>
      deriveActiveStampProjectionView(s.activeProjection, s.students[s.activeProjection?.studentId ?? '']),
    ),
  )
}

/**
 * Subscribes to same-tab-group redemption broadcasts and invokes `onRedeem`
 * for every event — filtering to "is this relevant to what's currently cast"
 * is the caller's job (a redemption for a student who isn't the active
 * projection should usually be ignored). Deliberately broadcast-based, not
 * persisted store state: a `/display` tab that reloads or opens after the
 * fact should never replay a stale celebration, which a plain persisted
 * "last redemption" field would risk.
 */
export function useStampRedemptionBroadcast(onRedeem: (event: StampRedemptionEvent) => void): void {
  const handlerRef = useRef(onRedeem)

  // Keep the ref current after every commit rather than mutating it during
  // render — React's ref rules disallow writing `.current` while rendering.
  useEffect(() => {
    handlerRef.current = onRedeem
  })

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(STAMP_REDEMPTION_CHANNEL_NAME)
    const listener = (event: MessageEvent<StampRedemptionEvent>) => handlerRef.current(event.data)
    channel.addEventListener('message', listener)
    return () => {
      channel.removeEventListener('message', listener)
      channel.close()
    }
  }, [])
}
